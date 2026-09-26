package com.spliteasy.controller;

import com.spliteasy.dto.response.GroupStatsResponse;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.StatsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Statistiques")
@RestController
@RequestMapping("/api/groups/{groupId}/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final GroupAccessService groupAccessService;

    @GetMapping
    public GroupStatsResponse getStats(@PathVariable Long groupId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return statsService.getStats(groupId);
    }
}
