-- Add status column to flashcard_requests table to track whether a request is pending, created, or dismissed.
ALTER TABLE public.flashcard_requests 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' NOT NULL;

-- Filter index for performance when loading pending requests
CREATE INDEX IF NOT EXISTS idx_flashcard_requests_status ON public.flashcard_requests(status);
