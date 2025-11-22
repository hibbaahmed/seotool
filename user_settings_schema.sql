-- User Settings Schema
-- Stores user preferences for content generation and other settings

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  content_length TEXT NOT NULL DEFAULT 'long' CHECK (content_length IN ('short', 'medium', 'long')),
  auto_promote_business BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_user_settings();

-- Create a function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_user_settings(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content_length TEXT,
  auto_promote_business BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Try to get existing settings
  RETURN QUERY
  SELECT us.id, us.user_id, us.content_length, us.auto_promote_business, us.created_at, us.updated_at
  FROM user_settings us
  WHERE us.user_id = p_user_id;

  -- If no settings found, create default ones
  IF NOT FOUND THEN
    INSERT INTO user_settings (user_id, content_length, auto_promote_business)
    VALUES (p_user_id, 'long', false)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_settings.id, user_settings.user_id, user_settings.content_length, user_settings.auto_promote_business, user_settings.created_at, user_settings.updated_at;
    
    -- Return the newly created settings
    RETURN QUERY
    SELECT us.id, us.user_id, us.content_length, us.auto_promote_business, us.created_at, us.updated_at
    FROM user_settings us
    WHERE us.user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

