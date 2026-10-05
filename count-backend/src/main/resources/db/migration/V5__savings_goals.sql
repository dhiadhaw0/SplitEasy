CREATE TABLE savings_goals (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id      BIGINT         NOT NULL,
    name          VARCHAR(80)    NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    deadline      DATE           NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_savings_goals_target_positive CHECK (target_amount > 0),
    CONSTRAINT fk_savings_goals_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE
);

CREATE INDEX idx_savings_goals_group_id ON savings_goals (group_id);

CREATE TABLE savings_contributions (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    goal_id        BIGINT         NOT NULL,
    participant_id BIGINT         NOT NULL,
    amount         DECIMAL(12, 2) NOT NULL,
    note           VARCHAR(255)   NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_savings_contributions_amount_positive CHECK (amount > 0),
    CONSTRAINT fk_savings_contributions_goal FOREIGN KEY (goal_id) REFERENCES savings_goals (id) ON DELETE CASCADE,
    CONSTRAINT fk_savings_contributions_participant FOREIGN KEY (participant_id) REFERENCES participants (id)
);

CREATE INDEX idx_savings_contributions_goal_id ON savings_contributions (goal_id);
