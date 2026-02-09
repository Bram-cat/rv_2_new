-- ==================================================================
-- SPEECHI APP — COMPLETE SUPABASE SCHEMA (v2)
-- Covers: Sessions, Practice, AI Feedback, Coaching, Paywall, Auth
-- Run this SQL in your Supabase SQL Editor
-- ==================================================================


-- ==================================================================
-- 1. USERS TABLE (extends Clerk auth)
-- Clerk handles auth externally; this stores app-specific user data
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,                          -- Clerk user ID (e.g. user_2abc...)
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    is_pro BOOLEAN DEFAULT FALSE,                 -- RevenueCat pro subscription status
    free_analyses_used INTEGER DEFAULT 0,         -- Paywall: count of free analyses used
    total_sessions INTEGER DEFAULT 0,             -- Cached session count
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

COMMENT ON TABLE public.users IS 'App-specific user data linked to Clerk auth';
COMMENT ON COLUMN public.users.id IS 'Clerk user ID (text, not UUID)';
COMMENT ON COLUMN public.users.is_pro IS 'Whether user has active RevenueCat Pro subscription';
COMMENT ON COLUMN public.users.free_analyses_used IS 'Count of free AI analyses used (limit: 3)';


-- ==================================================================
-- 2. SPEECH SESSIONS TABLE (core recording data)
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.speech_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT,

    -- Audio
    audio_url TEXT,                                -- URL in Supabase storage bucket
    duration INTEGER NOT NULL DEFAULT 0,           -- Recording duration in milliseconds

    -- Transcription (AssemblyAI result)
    -- JSON: { text, words[], audioDuration, confidence, sentimentAnalysis[] }
    transcription JSONB,

    -- Local analysis (computed on device)
    -- JSON: { fillerWords[], pauses[], speakingRate{}, score{}, pauseStats{} }
    analysis JSONB,

    -- AI feedback (OpenAI GPT-4o-mini — full analysis mode)
    -- JSON: { overallScore, clarity, pace, confidence, fillerWordCount,
    --         fillerWords[], strengths[], improvements[], tips[], summary,
    --         sentenceSuggestions[], scoreBreakdown[], extendedTranscript,
    --         toneAnalysis, vocabularyBoost{} }
    ai_feedback JSONB,

    -- Practice observation (OpenAI GPT-4o-mini — practice mode)
    -- JSON: { fillerWords[], fillerWordCount, pace, confidence, clarity,
    --         vocabularyRichness, conversationType, quickTips[],
    --         vocabularyBoost{}, speakerInsight{} }
    practice_observation JSONB,

    -- Practice & Challenge metadata
    practice_mode TEXT CHECK (practice_mode IN ('free', 'structured', 'challenge')),
    template_id TEXT,                              -- e.g. 'tech-pitch', 'investor-pitch'
    challenge_type TEXT CHECK (challenge_type IN ('filler-elimination', 'pace-consistency', 'articulation')),
    target_duration INTEGER,                       -- Target duration in seconds
    challenge_score INTEGER CHECK (challenge_score >= 0 AND challenge_score <= 100),

    -- Speech context (optional metadata from record screen)
    speech_context JSONB
);

-- Migration: add columns that may not exist on v1 tables (safe to run multiple times)
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS ai_feedback JSONB;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS practice_observation JSONB;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS practice_mode TEXT;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS challenge_type TEXT;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS target_duration INTEGER;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS challenge_score INTEGER;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS speech_context JSONB;
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.speech_sessions ADD COLUMN IF NOT EXISTS title TEXT;

-- Indexes (safe to run after columns exist)
CREATE INDEX IF NOT EXISTS idx_speech_sessions_user_id ON public.speech_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_speech_sessions_created_at ON public.speech_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speech_sessions_practice_mode ON public.speech_sessions(practice_mode);
CREATE INDEX IF NOT EXISTS idx_speech_sessions_challenge_type ON public.speech_sessions(challenge_type);


-- ==================================================================
-- 3. COACHING KNOWLEDGE TABLE
-- Stores AI coaching context: practice observations, uploaded
-- knowledge, and training data entries
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.coaching_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,                         -- The coaching knowledge text
    source TEXT,                                   -- e.g. 'practice-observation', 'youtube', 'manual'
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_knowledge_user_id ON public.coaching_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_knowledge_source ON public.coaching_knowledge(source);

COMMENT ON TABLE public.coaching_knowledge IS 'Coaching knowledge entries injected into AI context per user';
COMMENT ON COLUMN public.coaching_knowledge.source IS 'Origin: practice-observation, youtube-transcript, manual, etc.';


-- ==================================================================
-- 4. USER PROGRESS TABLE
-- Aggregated stats built from past sessions for AI context injection
-- and the recurring mistakes / improvement tracking UI
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

    -- Overall stats
    total_sessions INTEGER DEFAULT 0,
    average_score NUMERIC(3,1) DEFAULT 0,          -- AI overall score avg (1-10)
    best_score INTEGER DEFAULT 0,
    worst_score INTEGER DEFAULT 0,
    average_pace INTEGER DEFAULT 0,                -- WPM average
    average_filler_count INTEGER DEFAULT 0,

    -- Recurring patterns (for "Your Patterns" UI card)
    -- JSON: [{ word: string, count: number }]
    top_filler_words JSONB DEFAULT '[]'::JSONB,

    -- JSON: [{ area: string, avgScore: number }]
    low_areas JSONB DEFAULT '[]'::JSONB,

    -- JSON: string[]
    recurring_strengths JSONB DEFAULT '[]'::JSONB,
    recurring_weaknesses JSONB DEFAULT '[]'::JSONB,

    -- Score history for trend chart
    -- JSON: [{ date: string, score: number }]
    score_history JSONB DEFAULT '[]'::JSONB,

    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);

COMMENT ON TABLE public.user_progress IS 'Aggregated user progress stats for AI coaching context and trend UI';
COMMENT ON COLUMN public.user_progress.top_filler_words IS 'Array of { word, count } — repeat offender fillers across sessions';
COMMENT ON COLUMN public.user_progress.low_areas IS 'Array of { area, avgScore } — consistently low scoring areas';
COMMENT ON COLUMN public.user_progress.score_history IS 'Array of { date, score } — last 10 session scores for trend';


-- ==================================================================
-- 5. ANALYSIS USAGE TABLE (Paywall tracking)
-- Tracks per-user free analysis count for RevenueCat paywall
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.analysis_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    analysis_count INTEGER DEFAULT 0,              -- How many AI analyses used
    free_limit INTEGER DEFAULT 3,                  -- Free tier limit
    is_pro BOOLEAN DEFAULT FALSE,                  -- Synced from RevenueCat
    last_analysis_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_usage_user_id ON public.analysis_usage(user_id);

COMMENT ON TABLE public.analysis_usage IS 'Tracks AI analysis usage per user for RevenueCat paywall (3 free, then Pro)';


-- ==================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- Note: ::text casts handle both UUID and TEXT user_id columns
-- DROP IF EXISTS allows safe re-runs
-- ==================================================================

-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Speech sessions
ALTER TABLE public.speech_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own sessions" ON public.speech_sessions;
CREATE POLICY "Users can read own sessions" ON public.speech_sessions
    FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.speech_sessions;
CREATE POLICY "Users can insert own sessions" ON public.speech_sessions
    FOR INSERT WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own sessions" ON public.speech_sessions;
CREATE POLICY "Users can update own sessions" ON public.speech_sessions
    FOR UPDATE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.speech_sessions;
CREATE POLICY "Users can delete own sessions" ON public.speech_sessions
    FOR DELETE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Coaching knowledge
ALTER TABLE public.coaching_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own coaching data" ON public.coaching_knowledge;
CREATE POLICY "Users can read own coaching data" ON public.coaching_knowledge
    FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert coaching data" ON public.coaching_knowledge;
CREATE POLICY "Users can insert coaching data" ON public.coaching_knowledge
    FOR INSERT WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own coaching data" ON public.coaching_knowledge;
CREATE POLICY "Users can delete own coaching data" ON public.coaching_knowledge
    FOR DELETE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- User progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own progress" ON public.user_progress;
CREATE POLICY "Users can read own progress" ON public.user_progress
    FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can upsert own progress" ON public.user_progress;
CREATE POLICY "Users can upsert own progress" ON public.user_progress
    FOR INSERT WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR UPDATE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Analysis usage
ALTER TABLE public.analysis_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own usage" ON public.analysis_usage;
CREATE POLICY "Users can read own usage" ON public.analysis_usage
    FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own usage" ON public.analysis_usage;
CREATE POLICY "Users can insert own usage" ON public.analysis_usage
    FOR INSERT WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own usage" ON public.analysis_usage;
CREATE POLICY "Users can update own usage" ON public.analysis_usage
    FOR UPDATE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');


-- ==================================================================
-- 7. STORAGE BUCKET (Audio recordings)
-- ==================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-recordings',
    'audio-recordings',
    true,
    52428800,  -- 50MB max file size
    ARRAY['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read access for audio" ON storage.objects;
CREATE POLICY "Public read access for audio" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio-recordings');

DROP POLICY IF EXISTS "Allow uploads to audio bucket" ON storage.objects;
CREATE POLICY "Allow uploads to audio bucket" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio-recordings');

DROP POLICY IF EXISTS "Allow updates to audio bucket" ON storage.objects;
CREATE POLICY "Allow updates to audio bucket" ON storage.objects
    FOR UPDATE USING (bucket_id = 'audio-recordings');

DROP POLICY IF EXISTS "Allow deletes from audio bucket" ON storage.objects;
CREATE POLICY "Allow deletes from audio bucket" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio-recordings');


-- ==================================================================
-- 8. HELPER FUNCTIONS
-- ==================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_sessions ON public.speech_sessions;
CREATE TRIGGER set_updated_at_sessions
    BEFORE UPDATE ON public.speech_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_usage ON public.analysis_usage;
CREATE TRIGGER set_updated_at_usage
    BEFORE UPDATE ON public.analysis_usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ==================================================================
-- 9. TABLE COMMENTS
-- ==================================================================

COMMENT ON COLUMN public.speech_sessions.id IS 'Unique session identifier (UUID)';
COMMENT ON COLUMN public.speech_sessions.user_id IS 'Clerk user ID linking to users table';
COMMENT ON COLUMN public.speech_sessions.audio_url IS 'URL to audio file in Supabase storage';
COMMENT ON COLUMN public.speech_sessions.duration IS 'Recording duration in milliseconds';
COMMENT ON COLUMN public.speech_sessions.transcription IS 'AssemblyAI result: { text, words[], audioDuration, confidence, sentimentAnalysis[] }';
COMMENT ON COLUMN public.speech_sessions.analysis IS 'Local analysis: { fillerWords[], pauses[], speakingRate{}, score{}, pauseStats{} }';
COMMENT ON COLUMN public.speech_sessions.ai_feedback IS 'Full AI feedback: { overallScore, clarity, pace, confidence, fillerWords[], strengths[], improvements[], tips[], summary, vocabularyBoost{}, scoreBreakdown[] }';
COMMENT ON COLUMN public.speech_sessions.practice_observation IS 'Practice AI observation: { pace, confidence, clarity, vocabularyRichness, conversationType, quickTips[], vocabularyBoost{}, speakerInsight{} }';
COMMENT ON COLUMN public.speech_sessions.practice_mode IS 'Practice mode: free | structured | challenge';
COMMENT ON COLUMN public.speech_sessions.template_id IS 'Structured practice template: tech-pitch, investor-pitch, academic, etc.';
COMMENT ON COLUMN public.speech_sessions.challenge_type IS 'Challenge type: filler-elimination, pace-consistency, articulation';
COMMENT ON COLUMN public.speech_sessions.target_duration IS 'Target duration in seconds for structured practice';
COMMENT ON COLUMN public.speech_sessions.challenge_score IS 'Score achieved in challenge mode (0-100)';
COMMENT ON COLUMN public.speech_sessions.speech_context IS 'Optional speech context metadata from record screen';


-- ==================================================================
-- 10. VERIFY SETUP
-- ==================================================================

SELECT 'users' AS table_name, EXISTS (
    SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'
) AS exists
UNION ALL
SELECT 'speech_sessions', EXISTS (
    SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'speech_sessions'
)
UNION ALL
SELECT 'coaching_knowledge', EXISTS (
    SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaching_knowledge'
)
UNION ALL
SELECT 'user_progress', EXISTS (
    SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress'
)
UNION ALL
SELECT 'analysis_usage', EXISTS (
    SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analysis_usage'
);

SELECT * FROM storage.buckets WHERE id = 'audio-recordings';
