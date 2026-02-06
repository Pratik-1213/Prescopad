-- Add last_active_at column to track doctor online status
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Index for quick lookups by clinic
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(clinic_id, last_active_at);
