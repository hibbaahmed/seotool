-- Create table for AI SEO Research outputs
CREATE TABLE IF NOT EXISTS seo_research_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  research_type TEXT NOT NULL, -- e.g., 'keyword-research', 'competitor-analysis', 'content-gap-analysis'
  target_audience TEXT,
  industry TEXT,
  additional_context TEXT,
  research_output TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE seo_research_outputs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own SEO research outputs
CREATE POLICY "Users can view their own SEO research outputs." ON seo_research_outputs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own SEO research outputs
CREATE POLICY "Users can insert their own SEO research outputs." ON seo_research_outputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own SEO research outputs
CREATE POLICY "Users can update their own SEO research outputs." ON seo_research_outputs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own SEO research outputs
CREATE POLICY "Users can delete their own SEO research outputs." ON seo_research_outputs
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column_seo_research()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on each row update
CREATE TRIGGER update_seo_research_outputs_updated_at
BEFORE UPDATE ON seo_research_outputs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_seo_research();
