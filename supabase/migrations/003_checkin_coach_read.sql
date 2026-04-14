-- Add coach_read_at to checkins so the sidebar can track unread check-ins
ALTER TABLE checkins ADD COLUMN coach_read_at timestamptz;

-- Allow coaches to mark check-ins as read
CREATE POLICY "Coaches can mark checkins read"
  ON checkins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = checkins.program_id
        AND programs.coach_id = auth.uid()
    )
  );
