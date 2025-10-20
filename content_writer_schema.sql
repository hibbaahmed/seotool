-- Create table for content writer outputs
CREATE TABLE IF NOT EXISTS content_writer_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  content_type TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  tone TEXT NOT NULL,
  length TEXT NOT NULL,
  additional_context TEXT,
  content_output TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE content_writer_outputs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own content outputs
CREATE POLICY "Users can view their own content outputs." ON content_writer_outputs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own content outputs
CREATE POLICY "Users can insert their own content outputs." ON content_writer_outputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own content outputs
CREATE POLICY "Users can update their own content outputs." ON content_writer_outputs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own content outputs
CREATE POLICY "Users can delete their own content outputs." ON content_writer_outputs
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on each row update
CREATE TRIGGER update_content_writer_outputs_updated_at
BEFORE UPDATE ON content_writer_outputs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
