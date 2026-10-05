package com.spliteasy.controller;

import com.spliteasy.dto.request.BudgetRequest;
import com.spliteasy.dto.response.BudgetResponse;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.BudgetService;
import com.spliteasy.service.GroupAccessService;
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

@Tag(name = "Budgets")
@RestController
@RequestMapping("/api/groups/{groupId}/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final GroupAccessService groupAccessService;

    @GetMapping
    public List<BudgetResponse> list(@PathVariable Long groupId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return budgetService.list(groupId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse create(@PathVariable Long groupId, @Valid @RequestBody BudgetRequest request) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return budgetService.create(groupId, request);
    }

    @PutMapping("/{budgetId}")
    public BudgetResponse update(
            @PathVariable Long groupId, @PathVariable Long budgetId, @Valid @RequestBody BudgetRequest request) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return budgetService.update(groupId, budgetId, request);
    }

    @DeleteMapping("/{budgetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long groupId, @PathVariable Long budgetId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        budgetService.delete(groupId, budgetId);
    }
}
