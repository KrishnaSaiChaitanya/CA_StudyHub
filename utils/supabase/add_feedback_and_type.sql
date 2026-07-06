-- Migration: Add feedback ratings JSONB to profiles and type to contact_submissions

-- 1. Add type column to contact_submissions table with default 'general'
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'general';

-- 2. Drop the individual feedback columns if they were created previously, and add feedback JSONB column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS feedback_overall;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS feedback_flashcards;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS feedback_nav_ease;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS feedback_recommend;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS feedback_problem;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS feedback_submitted_at;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS feedback jsonb;
