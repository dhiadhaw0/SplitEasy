package com.spliteasy.controller;

import com.spliteasy.dto.request.ExpenseRequest;
import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.PageResponse;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.ExpenseService;
import com.spliteasy.service.GroupAccessService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Dépenses")
@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final GroupAccessService groupAccessService;

    @GetMapping
    public PageResponse<ExpenseResponse> list(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) Long participantId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return expenseService.list(groupId, category, participantId, PageRequest.of(page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(@PathVariable Long groupId, @Valid @RequestBody ExpenseRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        groupAccessService.checkMember(groupId, userId);
        return expenseService.create(groupId, request, userId);
    }

    @GetMapping("/{expenseId}")
    public ExpenseResponse get(@PathVariable Long groupId, @PathVariable Long expenseId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return expenseService.get(groupId, expenseId);
    }

    @PutMapping("/{expenseId}")
    public ExpenseResponse update(
            @PathVariable Long groupId, @PathVariable Long expenseId, @Valid @RequestBody ExpenseRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        groupAccessService.checkMember(groupId, userId);
        return expenseService.update(groupId, expenseId, request, userId);
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long groupId, @PathVariable Long expenseId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        expenseService.delete(groupId, expenseId);
    }
}
