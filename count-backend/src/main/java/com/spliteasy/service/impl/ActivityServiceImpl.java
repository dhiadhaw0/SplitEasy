package com.spliteasy.service.impl;

import com.spliteasy.dto.response.ActivityResponse;
import com.spliteasy.dto.response.PageResponse;
import com.spliteasy.entity.Activity;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.ActivityType;
import com.spliteasy.repository.ActivityRepository;
import com.spliteasy.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityServiceImpl implements ActivityService {

    private final ActivityRepository activityRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ActivityResponse> list(Long groupId, Pageable pageable) {
        Page<Activity> page = activityRepository.findByGroupIdOrderByCreatedAtDesc(groupId, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Override
    public void log(ExpenseGroup group, User actor, ActivityType type, String message) {
        Activity activity = Activity.builder()
                .group(group)
                .actor(actor)
                .type(type)
                .message(message)
                .build();
        activityRepository.save(activity);
    }

    private ActivityResponse toResponse(Activity activity) {
        return new ActivityResponse(
                activity.getId(),
                activity.getType(),
                activity.getMessage(),
                activity.getActor().getId(),
                activity.getActor().getDisplayName(),
                activity.getCreatedAt());
    }
}
