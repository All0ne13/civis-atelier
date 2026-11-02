CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  clerk_id text NOT NULL,
  idempotency_key uuid UNIQUE NOT NULL,
  request_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','paid_review','declined','refunded','test_paid','test_declined')),
  is_test boolean NOT NULL,
  customer jsonb NOT NULL,
  items jsonb NOT NULL,
  total_minor integer NOT NULL CHECK(total_minor > 0),
  currency text NOT NULL DEFAULT 'UAH' CHECK(currency='UAH'),
  exchange_rate numeric NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '15 minutes',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  provider_status text
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS orders_customer_created ON orders(clerk_id,created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS orders_pending ON orders(expires_at) WHERE status='pending' AND is_test=false;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION create_store_order(payload jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE existing orders%ROWTYPE; product products%ROWTYPE; line record; reserved integer; result orders%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(payload->>'idempotencyKey',0));
  SELECT * INTO existing FROM orders WHERE idempotency_key=(payload->>'idempotencyKey')::uuid;
  IF FOUND THEN
    IF existing.clerk_id<>payload->>'clerkId' OR existing.request_hash<>payload->>'requestHash' THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
    IF existing.status<>'pending' OR existing.expires_at<=now() THEN RAISE EXCEPTION 'ORDER_EXPIRED'; END IF;
    RETURN to_jsonb(existing);
  END IF;
  IF (SELECT count(*) FROM orders WHERE clerk_id=payload->>'clerkId' AND status='pending' AND expires_at>now())>=3 THEN RAISE EXCEPTION 'TOO_MANY_PENDING'; END IF;
  FOR line IN SELECT item->>'id' AS id, sum((item->>'qty')::integer) AS qty, min((item->>'version')::integer) AS version FROM jsonb_array_elements(payload->'items') item GROUP BY item->>'id' ORDER BY item->>'id' LOOP
    SELECT * INTO product FROM products WHERE id=line.id FOR UPDATE;
    IF NOT FOUND OR NOT product.published OR product.version<>line.version THEN RAISE EXCEPTION 'PRODUCT_CHANGED'; END IF;
    SELECT coalesce(sum((item->>'qty')::integer),0) INTO reserved FROM orders o CROSS JOIN jsonb_array_elements(o.items) item WHERE o.is_test=false AND o.status='pending' AND o.expires_at>now() AND item->>'id'=line.id;
    IF (product.data->>'stock')::integer-reserved<line.qty THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK'; END IF;
  END LOOP;
  INSERT INTO orders(id,clerk_id,idempotency_key,request_hash,is_test,customer,items,total_minor,exchange_rate)
    VALUES((payload->>'id')::uuid,payload->>'clerkId',(payload->>'idempotencyKey')::uuid,payload->>'requestHash',(payload->>'isTest')::boolean,payload->'customer',payload->'items',(payload->>'totalMinor')::integer,(payload->>'exchangeRate')::numeric) RETURNING * INTO result;
  RETURN to_jsonb(result);
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION settle_store_order(order_id uuid, provider_state text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE target orders%ROWTYPE; line record; product products%ROWTYPE; reserved integer; insufficient boolean:=false;
BEGIN
  SELECT * INTO target FROM orders WHERE id=order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF target.status IN ('paid','paid_review','test_paid','refunded') THEN RETURN target.status; END IF;
  IF target.is_test THEN
    UPDATE orders SET status=CASE WHEN provider_state='Approved' THEN 'test_paid' ELSE 'test_declined' END, provider_status=provider_state,paid_at=CASE WHEN provider_state='Approved' THEN now() ELSE null END WHERE id=order_id;
    RETURN CASE WHEN provider_state='Approved' THEN 'test_paid' ELSE 'test_declined' END;
  END IF;
  IF provider_state<>'Approved' THEN UPDATE orders SET status='declined',provider_status=provider_state WHERE id=order_id; RETURN 'declined'; END IF;
  FOR line IN SELECT item->>'id' AS id,sum((item->>'qty')::integer) AS qty FROM jsonb_array_elements(target.items) item GROUP BY item->>'id' ORDER BY item->>'id' LOOP
    SELECT * INTO product FROM products WHERE id=line.id FOR UPDATE;
    IF NOT FOUND THEN insufficient:=true; CONTINUE; END IF;
    SELECT coalesce(sum((item->>'qty')::integer),0) INTO reserved FROM orders o CROSS JOIN jsonb_array_elements(o.items) item WHERE o.id<>order_id AND o.is_test=false AND o.status='pending' AND o.expires_at>now() AND item->>'id'=line.id;
    IF (product.data->>'stock')::integer-reserved<line.qty THEN insufficient:=true; END IF;
  END LOOP;
  IF insufficient THEN UPDATE orders SET status='paid_review',paid_at=now(),provider_status=provider_state WHERE id=order_id; RETURN 'paid_review'; END IF;
  FOR line IN SELECT item->>'id' AS id,sum((item->>'qty')::integer) AS qty FROM jsonb_array_elements(target.items) item GROUP BY item->>'id' LOOP
    UPDATE products SET data=jsonb_set(data,'{stock}',to_jsonb((data->>'stock')::integer-line.qty::integer)),version=version+1,updated_at=now() WHERE id=line.id;
  END LOOP;
  UPDATE orders SET status='paid',paid_at=now(),provider_status=provider_state WHERE id=order_id;
  RETURN 'paid';
END;
$$;
