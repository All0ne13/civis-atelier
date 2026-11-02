ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'processing' CHECK(fulfillment_status IN ('processing','confirmed','shipped','delivered'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_version integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
CREATE TABLE IF NOT EXISTS order_fulfillment_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 actor_id text NOT NULL,
 previous_status text NOT NULL,
 status text NOT NULL,
 tracking_number text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_fulfillment_events_order ON order_fulfillment_events(order_id,created_at,id);
CREATE INDEX IF NOT EXISTS orders_fulfillment_created ON orders(fulfillment_status,created_at DESC);
