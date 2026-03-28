-- Add fixture_id to predictions for result resolution
-- fixture_id is the football-data.org / FPL match ID used to look up actual results.
ALTER TABLE predictions ADD COLUMN fixture_id INTEGER;
ALTER TABLE predictions ADD COLUMN competition_code TEXT;

CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON predictions(fixture_id);
