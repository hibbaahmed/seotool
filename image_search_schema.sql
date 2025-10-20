-- Create table for AI Image Search outputs
CREATE TABLE IF NOT EXISTS image_search_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  style TEXT NOT NULL, -- e.g., 'photographic', 'illustration', 'artistic'
  count INTEGER NOT NULL, -- number of images requested
  size TEXT, -- e.g., '1024x1024', '1024x1792', '1792x1024'
  additional_context TEXT,
  search_results TEXT NOT NULL, -- AI analysis text
  image_urls TEXT[] NOT NULL DEFAULT '{}', -- array of Supabase Storage URLs
  original_image_urls TEXT[] NOT NULL DEFAULT '{}', -- array of original external URLs for reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE image_search_outputs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own image search outputs
CREATE POLICY "Users can view their own image search outputs." ON image_search_outputs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own image search outputs
CREATE POLICY "Users can insert their own image search outputs." ON image_search_outputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own image search outputs
CREATE POLICY "Users can update their own image search outputs." ON image_search_outputs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own image search outputs
CREATE POLICY "Users can delete their own image search outputs." ON image_search_outputs
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column_image_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on each row update
CREATE TRIGGER update_image_search_outputs_updated_at
BEFORE UPDATE ON image_search_outputs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_image_search();
