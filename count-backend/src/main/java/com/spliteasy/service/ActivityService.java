package com.spliteasy.service;

import com.spliteasy.dto.response.ActivityResponse;
import com.spliteasy.dto.response.PageResponse;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.ActivityType;
import org.springframework.data.domain.Pageable;

public interface ActivityService {

    PageResponse<ActivityResponse> list(Long groupId, Pageable pageable);

    /**
     * Records one activity-feed entry. {@code message} is the full, already-French, already
     * actor-prefixed sentence (e.g. "Sara a ajouté « Restaurant » (45,00 €)") — see
     * {@link com.spliteasy.entity.Activity} for why it's precomputed rather than derived later.
     */
    void log(ExpenseGroup group, User actor, ActivityType type, String message);
}
