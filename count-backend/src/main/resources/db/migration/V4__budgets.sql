CREATE TABLE budgets (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id     BIGINT         NOT NULL,
    category     VARCHAR(20)    NULL,
    amount_limit DECIMAL(12, 2) NOT NULL,
    period       VARCHAR(20)    NOT NULL DEFAULT 'MONTHLY',
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_budgets_amount_positive CHECK (amount_limit > 0),
    CONSTRAINT fk_budgets_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE
);

CREATE INDEX idx_budgets_group_id ON budgets (group_id);
