-- Add user_id column to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing resources to have a default user (optional - for existing data)
-- First, let's create a system user for existing resources
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Try to get an existing user, or create a system user
    SELECT id INTO system_user_id FROM auth.users LIMIT 1;
    
    IF system_user_id IS NULL THEN
        -- Create a system user for existing resources
        INSERT INTO auth.users (id, email, created_at, updated_at, raw_user_meta_data)
        VALUES (
            gen_random_uuid(),
            'system@devresourcehub.com',
            NOW(),
            NOW(),
            '{"username": "system", "full_name": "System User"}'::jsonb
        )
        RETURNING id INTO system_user_id;
    END IF;
    
    -- Update existing resources to use the system user
    UPDATE resources SET user_id = system_user_id WHERE user_id IS NULL;
END $$;

-- Make user_id required for new resources
ALTER TABLE resources ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies for resources
DROP POLICY IF EXISTS "Resources are viewable by everyone" ON resources;
DROP POLICY IF EXISTS "Users can insert resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;

-- New policies for user ownership
CREATE POLICY "Resources are viewable by everyone" ON resources
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources" ON resources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources" ON resources
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for file uploads
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all files" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
