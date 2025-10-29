-- Unified Integrations and Publishing Jobs
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'wordpress'|'webflow'|'notion'|'wix'|'shopify'|'wpcom'|'framer'|'webhook'
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}', -- site/collection/db ids, domains, etc.
  access_token TEXT, -- encrypted at rest (store as is here; encrypt in app layer)
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publishing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  payload JSONB NOT NULL, -- conforms to PublishInput
  status TEXT NOT NULL DEFAULT 'queued', -- queued|running|succeeded|failed
  attempts INTEGER NOT NULL DEFAULT 0,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_error TEXT,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own jobs" ON publishing_jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column_integrations()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_integrations_updated_at
BEFORE UPDATE ON integrations FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_integrations();

CREATE OR REPLACE FUNCTION update_updated_at_column_jobs()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_publishing_jobs_updated_at
BEFORE UPDATE ON publishing_jobs FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_jobs();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON publishing_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_run_at ON publishing_jobs(run_at);






