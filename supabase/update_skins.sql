-- Migration to support image-based pet animations
ALTER TABLE skins 
ADD COLUMN IF NOT EXISTS display_type text DEFAULT 'svg' CHECK (display_type IN ('svg', 'image')),
ADD COLUMN IF NOT EXISTS assets jsonb DEFAULT '{}';

-- Optional: Update description to clarify display type
COMMENT ON COLUMN skins.display_type IS 'Either "svg" for code-based pets or "image" for PNG/GIF assets';
COMMENT ON COLUMN skins.assets IS 'Stores URLs for different pet states: { "idle": "...", "thinking": "...", "done": "...", "error": "..." }';
