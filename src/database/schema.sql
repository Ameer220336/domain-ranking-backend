-- Create rankings table for raw PostgreSQL implementation

CREATE TABLE IF NOT EXISTS rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL,
    rank INTEGER NOT NULL,
    date DATE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rankings_domain ON rankings(domain);
CREATE INDEX IF NOT EXISTS idx_rankings_domain_date ON rankings(domain, date);
CREATE INDEX IF NOT EXISTS idx_rankings_updated_at ON rankings("updatedAt");

-- Add a trigger to automatically update the updatedAt field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rankings_updated_at
    BEFORE UPDATE ON rankings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();