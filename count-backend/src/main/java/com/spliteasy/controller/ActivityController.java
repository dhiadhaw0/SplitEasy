package com.spliteasy.controller;

import com.spliteasy.dto.response.ActivityResponse;
import com.spliteasy.dto.response.PageResponse;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.ActivityService;
import com.spliteasy.service.GroupAccessService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Activité")
@RestController
@RequestMapping("/api/groups/{groupId}/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;
    private final GroupAccessService groupAccessService;

    @GetMapping
    public PageResponse<ActivityResponse> list(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return activityService.list(groupId, PageRequest.of(page, size));
    }
}
