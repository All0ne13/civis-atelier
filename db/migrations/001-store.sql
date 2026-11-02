CREATE TABLE IF NOT EXISTS categories (
  name text PRIMARY KEY,
  name_uk text NOT NULL,
  position integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  category text NOT NULL REFERENCES categories(name),
  data jsonb NOT NULL,
  published boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(data) = 'object'),
  CHECK ((data->>'price')::integer >= 0),
  CHECK ((data->>'stock')::integer >= 0)
);
CREATE TABLE IF NOT EXISTS store_settings (key text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS admin_users (clerk_id text PRIMARY KEY, email text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_id text NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
