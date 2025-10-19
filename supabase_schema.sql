-- Competitive Analysis Table
CREATE TABLE competitive_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'comprehensive', 'quick', 'keyword_focused'
  analysis_output TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_competitive_analysis_user_id ON competitive_analysis(user_id);
CREATE INDEX idx_competitive_analysis_created_at ON competitive_analysis(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE competitive_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own competitive analysis" ON competitive_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitive analysis" ON competitive_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitive analysis" ON competitive_analysis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitive analysis" ON competitive_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_competitive_analysis_updated_at 
  BEFORE UPDATE ON competitive_analysis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
