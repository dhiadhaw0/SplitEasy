-- SplitEasy initial schema.
-- Written to be portable between MySQL 8 / MariaDB (XAMPP, production) and H2 in MODE=MySQL (tests):
-- no ENGINE=/CHARSET= clauses, no backtick-quoted reserved words.

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    display_name  VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NOT NULL,
    password      VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

-- ============================================================
-- expense_groups ("group" is a reserved word in SQL)
-- ============================================================
CREATE TABLE expense_groups (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(80)  NOT NULL,
    description  VARCHAR(255),
    currency     VARCHAR(3)   NOT NULL,
    invite_code  VARCHAR(10)  NOT NULL,
    created_by   BIGINT       NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_expense_groups_invite_code UNIQUE (invite_code),
    CONSTRAINT fk_expense_groups_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);

-- ============================================================
-- participants
-- ============================================================
CREATE TABLE participants (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    group_id    BIGINT      NOT NULL,
    user_id     BIGINT,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_participants_group_name UNIQUE (group_id, name),
    CONSTRAINT uk_participants_group_user UNIQUE (group_id, user_id),
    CONSTRAINT fk_participants_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_participants_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_participants_group_id ON participants (group_id);
CREATE INDEX idx_participants_user_id ON participants (user_id);

-- ============================================================
-- expenses
-- ============================================================
CREATE TABLE expenses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(100)   NOT NULL,
    amount      DECIMAL(12, 2) NOT NULL,
    date        DATE           NOT NULL,
    category    VARCHAR(20)    NOT NULL DEFAULT 'OTHER',
    type        VARCHAR(10)    NOT NULL DEFAULT 'EXPENSE',
    split_type  VARCHAR(20)    NOT NULL,
    group_id    BIGINT         NOT NULL,
    paid_by     BIGINT         NOT NULL,
    created_by  BIGINT         NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT fk_expenses_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by) REFERENCES participants (id),
    CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE INDEX idx_expenses_group_id ON expenses (group_id);
CREATE INDEX idx_expenses_date ON expenses (date);
CREATE INDEX idx_expenses_paid_by ON expenses (paid_by);

-- ============================================================
-- expense_shares
-- ============================================================
CREATE TABLE expense_shares (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_id     BIGINT         NOT NULL,
    participant_id BIGINT         NOT NULL,
    share_value    DECIMAL(12, 4),
    amount         DECIMAL(12, 2) NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_expense_shares_expense_participant UNIQUE (expense_id, participant_id),
    CONSTRAINT fk_expense_shares_expense FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_shares_participant FOREIGN KEY (participant_id) REFERENCES participants (id)
);

CREATE INDEX idx_expense_shares_expense_id ON expense_shares (expense_id);
CREATE INDEX idx_expense_shares_participant_id ON expense_shares (participant_id);
