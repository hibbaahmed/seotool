-- Create storage bucket for image search results
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'image-search-results',
  'image-search-results', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policies for the image-search-results bucket
-- Policy for authenticated users to upload images
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'image-search-results' 
  AND auth.role() = 'authenticated'
);

-- Policy for authenticated users to view images
CREATE POLICY "Users can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'image-search-results');

-- Policy for authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'image-search-results' 
  AND auth.role() = 'authenticated'
);
