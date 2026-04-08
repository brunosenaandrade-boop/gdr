CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pf', 'pj')),
  name TEXT NOT NULL,
  document TEXT NOT NULL,
  trade_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
