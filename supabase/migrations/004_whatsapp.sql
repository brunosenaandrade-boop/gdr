CREATE TABLE whatsapp_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone_number)
);

CREATE TABLE whatsapp_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  raw_message TEXT NOT NULL,
  parsed_type TEXT,
  parsed_description TEXT,
  parsed_amount BIGINT,
  parsed_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  confirmed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ DEFAULT now()
);
