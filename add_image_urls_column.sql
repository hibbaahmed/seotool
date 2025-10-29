-- Add image_urls column to existing content_writer_outputs table
ALTER TABLE content_writer_outputs 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add comment to document the column purpose
COMMENT ON COLUMN content_writer_outputs.image_urls IS 'Array of image URLs for in-article images generated with content';


