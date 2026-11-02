CREATE TABLE IF NOT EXISTS welcome_offers (
 email text PRIMARY KEY,
 clerk_id text UNIQUE NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS welcome_redemptions (
 email text NOT NULL REFERENCES welcome_offers(email),
 is_test boolean NOT NULL,
 order_id uuid UNIQUE NOT NULL REFERENCES orders(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(email,is_test)
);
-- statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_minor integer;
-- statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_minor integer NOT NULL DEFAULT 0 CHECK(discount_minor>=0);
-- statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code text;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION create_welcome_order(payload jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb; offer_email text:=payload->>'offerEmail'; test_mode boolean:=(payload->>'isTest')::boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(payload->>'idempotencyKey',0));
 IF EXISTS(SELECT 1 FROM orders WHERE idempotency_key=(payload->>'idempotencyKey')::uuid) THEN RETURN create_store_order(payload); END IF;
 IF coalesce((payload->>'discountMinor')::integer,0)>0 THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('welcome:'||offer_email||':'||test_mode::text,0));
  IF NOT EXISTS(SELECT 1 FROM welcome_offers WHERE email=offer_email AND clerk_id=payload->>'clerkId')
   OR EXISTS(SELECT 1 FROM welcome_redemptions WHERE email=offer_email AND is_test=test_mode)
   OR EXISTS(SELECT 1 FROM orders WHERE is_test=test_mode AND (clerk_id=payload->>'clerkId' OR lower(customer->>'email')=offer_email) AND status IN('paid','paid_review','test_paid','refunded'))
   THEN RAISE EXCEPTION 'WELCOME_UNAVAILABLE'; END IF;
 END IF;
 result:=create_store_order(payload);
 UPDATE orders SET subtotal_minor=(payload->>'subtotalMinor')::integer,discount_minor=coalesce((payload->>'discountMinor')::integer,0),discount_code=payload->>'discountCode' WHERE id=(result->>'id')::uuid;
 IF coalesce((payload->>'discountMinor')::integer,0)>0 THEN
  INSERT INTO welcome_redemptions(email,is_test,order_id) VALUES(offer_email,test_mode,(result->>'id')::uuid);
 END IF;
 SELECT to_jsonb(o) INTO result FROM orders o WHERE id=(result->>'id')::uuid;
 RETURN result;
END;
$$;
