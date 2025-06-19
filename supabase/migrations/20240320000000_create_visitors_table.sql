-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen_at ON visitors(last_seen_at);

-- Create function to update last_seen_at
CREATE OR REPLACE FUNCTION update_visitor_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_seen_at
CREATE TRIGGER update_visitor_last_seen
    BEFORE UPDATE ON visitors
    FOR EACH ROW
    EXECUTE FUNCTION update_visitor_last_seen(); 