-- ============================================
-- SUPABASE SCHEMA FOR SPEECH PITCH APP
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Create the speech_sessions table
CREATE TABLE IF NOT EXISTS public.speech_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audio_url TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    transcription JSONB,
    analysis JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    -- New columns for practice modes and AI feedback
    ai_feedback JSONB,
    practice_mode TEXT,
    template_id TEXT,
    challenge_type TEXT,
    target_duration INTEGER,
    challenge_score INTEGER
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_speech_sessions_user_id ON public.speech_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_speech_sessions_created_at ON public.speech_sessions(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.speech_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Policy: Allow anonymous users to insert (for now, before auth is implemented)
CREATE POLICY "Allow anonymous insert" ON public.speech_sessions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anonymous users to select their own sessions
CREATE POLICY "Allow anonymous select" ON public.speech_sessions
    FOR SELECT
    USING (true);

-- Policy: Allow anonymous users to update
CREATE POLICY "Allow anonymous update" ON public.speech_sessions
    FOR UPDATE
    USING (true);

-- Policy: Allow anonymous users to delete
CREATE POLICY "Allow anonymous delete" ON public.speech_sessions
    FOR DELETE
    USING (true);

-- ============================================
-- STORAGE BUCKET SETUP
-- Run this in SQL Editor or create via Dashboard
-- ============================================

-- 5. Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-recordings',
    'audio-recordings',
    true,
    52428800, -- 50MB max file size
    ARRAY['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for audio bucket
-- Policy: Allow public read access
CREATE POLICY "Public read access for audio" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'audio-recordings');

-- Policy: Allow authenticated and anonymous uploads
CREATE POLICY "Allow uploads to audio bucket" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'audio-recordings');

-- Policy: Allow updates
CREATE POLICY "Allow updates to audio bucket" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'audio-recordings');

-- Policy: Allow deletes
CREATE POLICY "Allow deletes from audio bucket" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'audio-recordings');

-- ============================================
-- OPTIONAL: Add comments for documentation
-- ============================================

COMMENT ON TABLE public.speech_sessions IS 'Stores speech recording sessions with transcriptions and analysis';
COMMENT ON COLUMN public.speech_sessions.id IS 'Unique session identifier (UUID)';
COMMENT ON COLUMN public.speech_sessions.audio_url IS 'URL to the audio file in Supabase storage';
COMMENT ON COLUMN public.speech_sessions.duration IS 'Recording duration in milliseconds';
COMMENT ON COLUMN public.speech_sessions.transcription IS 'JSON containing transcript text and word timestamps';
COMMENT ON COLUMN public.speech_sessions.analysis IS 'JSON containing speech analysis metrics';

-- New column comments
COMMENT ON COLUMN public.speech_sessions.ai_feedback IS 'JSON containing AI-generated feedback (clarity, pace, confidence, tips)';
COMMENT ON COLUMN public.speech_sessions.practice_mode IS 'Practice mode: free, structured, or challenge';
COMMENT ON COLUMN public.speech_sessions.template_id IS 'Template ID for structured practice (tech-pitch, investor-pitch, etc.)';
COMMENT ON COLUMN public.speech_sessions.challenge_type IS 'Challenge type: filler-elimination, pace-consistency, articulation';
COMMENT ON COLUMN public.speech_sessions.target_duration IS 'Target duration in seconds for structured practice';
COMMENT ON COLUMN public.speech_sessions.challenge_score IS 'Score achieved in challenge mode (0-100)';

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check if table was created
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'speech_sessions'
) AS table_exists;

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'audio-recordings';

-- ============================================
-- MIGRATION FOR EXISTING DATABASES
-- Run this if you already have the table created
-- ============================================

-- Add new columns to existing table (safe to run multiple times)
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS ai_feedback JSONB;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS practice_mode TEXT;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS challenge_type TEXT;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS target_duration INTEGER;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS challenge_score INTEGER;

-- Add index for practice mode queries
CREATE INDEX IF NOT EXISTS idx_speech_sessions_practice_mode ON public.speech_sessions(practice_mode);
CREATE INDEX IF NOT EXISTS idx_speech_sessions_challenge_type ON public.speech_sessions(challenge_type);
