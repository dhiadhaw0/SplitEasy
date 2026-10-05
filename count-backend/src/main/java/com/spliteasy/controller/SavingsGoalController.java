package com.spliteasy.controller;

import com.spliteasy.dto.request.SavingsContributionRequest;
import com.spliteasy.dto.request.SavingsGoalRequest;
import com.spliteasy.dto.response.SavingsGoalResponse;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.SavingsGoalService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Cagnottes")
@RestController
@RequestMapping("/api/groups/{groupId}/savings-goals")
@RequiredArgsConstructor
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;
    private final GroupAccessService groupAccessService;

    @GetMapping
    public List<SavingsGoalResponse> list(@PathVariable Long groupId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return savingsGoalService.list(groupId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavingsGoalResponse create(@PathVariable Long groupId, @Valid @RequestBody SavingsGoalRequest request) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return savingsGoalService.create(groupId, request);
    }

    @PutMapping("/{goalId}")
    public SavingsGoalResponse update(
            @PathVariable Long groupId, @PathVariable Long goalId, @Valid @RequestBody SavingsGoalRequest request) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return savingsGoalService.update(groupId, goalId, request);
    }

    @DeleteMapping("/{goalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long groupId, @PathVariable Long goalId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        savingsGoalService.delete(groupId, goalId);
    }

    @PostMapping("/{goalId}/contributions")
    @ResponseStatus(HttpStatus.CREATED)
    public SavingsGoalResponse addContribution(
            @PathVariable Long groupId, @PathVariable Long goalId, @Valid @RequestBody SavingsContributionRequest request) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return savingsGoalService.addContribution(groupId, goalId, request);
    }

    @DeleteMapping("/{goalId}/contributions/{contributionId}")
    public SavingsGoalResponse deleteContribution(
            @PathVariable Long groupId, @PathVariable Long goalId, @PathVariable Long contributionId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return savingsGoalService.deleteContribution(groupId, goalId, contributionId);
    }
}
