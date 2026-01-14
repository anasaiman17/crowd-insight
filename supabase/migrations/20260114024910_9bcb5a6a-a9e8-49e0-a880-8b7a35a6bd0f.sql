-- Create storage bucket for gallery uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to gallery
CREATE POLICY "Users can upload to gallery" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'gallery');

-- Allow authenticated users to view their gallery files
CREATE POLICY "Users can view gallery files" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'gallery');

-- Allow authenticated users to delete their gallery files
CREATE POLICY "Users can delete gallery files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'gallery');

-- Create gallery_items table to track uploads and analysis
CREATE TABLE public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_name TEXT NOT NULL,
  thumbnail_url TEXT,
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  people_count INTEGER DEFAULT 0,
  density_level TEXT DEFAULT 'low' CHECK (density_level IN ('low', 'medium', 'high')),
  detected_persons JSONB DEFAULT '[]'::jsonb,
  confidence_avg NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own gallery items" 
ON public.gallery_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gallery items" 
ON public.gallery_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items" 
ON public.gallery_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items" 
ON public.gallery_items 
FOR DELETE 
USING (auth.uid() = user_id);