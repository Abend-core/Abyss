-- Fix items with empty or whitespace-only titles
-- This addresses the issue where titles with only spaces passed validation

UPDATE dbo.items 
SET title = '[Sans titre]'
WHERE title IS NULL 
   OR title = ''
   OR title ~ '^\s+$';  -- Regex for strings with only whitespace
