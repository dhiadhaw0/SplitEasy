CREATE TABLE activities (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id   BIGINT       NOT NULL,
    actor_id   BIGINT       NOT NULL,
    type       VARCHAR(30)  NOT NULL,
    message    VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activities_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_activities_actor FOREIGN KEY (actor_id) REFERENCES users (id)
);

-- Feed is always "latest activity for this group", so group_id + created_at DESC is the only
-- access pattern that matters.
CREATE INDEX idx_activities_group_created ON activities (group_id, created_at DESC);
