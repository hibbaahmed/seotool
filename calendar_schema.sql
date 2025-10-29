-- Create table for scheduled blog posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content_writer_outputs(id) ON DELETE CASCADE, -- Link to generated content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME DEFAULT '09:00:00',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'cancelled')),
  platform TEXT DEFAULT 'blog' CHECK (platform IN ('blog', 'wordpress', 'medium', 'linkedin', 'twitter')),
  publish_url TEXT, -- URL where the post was published
  notes TEXT, -- Additional notes for the post
  image_urls TEXT[] DEFAULT '{}', -- array of image URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own scheduled posts
CREATE POLICY "Users can view their own scheduled posts." ON scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own scheduled posts
CREATE POLICY "Users can insert their own scheduled posts." ON scheduled_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own scheduled posts
CREATE POLICY "Users can update their own scheduled posts." ON scheduled_posts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own scheduled posts
CREATE POLICY "Users can delete their own scheduled posts." ON scheduled_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on each row update
CREATE TRIGGER update_scheduled_posts_updated_at
BEFORE UPDATE ON scheduled_posts
FOR EACH ROW
EXECUTE FUNCTION update_scheduled_posts_updated_at();

-- Index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_date ON scheduled_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_date ON scheduled_posts(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);



