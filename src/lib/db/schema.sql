-- Processing jobs table for audio transcription pipeline
-- Stores YouTube download, audio processing, and transcription status

CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT NOT NULL,
  video_id TEXT,
  title TEXT,
  duration INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'downloading', 'converting', 'transcribing', 'processing', 'completed', 'failed')),
  transcription TEXT,
  language VARCHAR(10),
  confidence NUMERIC(5,4),
  provider_used VARCHAR(50),
  error_message TEXT,
  error_log TEXT,
  download_path TEXT,
  audio_path TEXT,
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by status and creation time
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at DESC);
CREATE INDEX idx_processing_jobs_video_id ON processing_jobs(video_id);

-- Trigger to update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  return NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
