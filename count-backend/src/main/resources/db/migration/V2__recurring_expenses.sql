ALTER TABLE expenses ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN recurrence_interval VARCHAR(20) NULL;
ALTER TABLE expenses ADD COLUMN next_occurrence_date DATE NULL;

CREATE INDEX idx_expenses_recurring_next_occurrence ON expenses (is_recurring, next_occurrence_date);
