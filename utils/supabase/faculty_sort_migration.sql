-- SQL migration to add sort_order column to faculty table
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
