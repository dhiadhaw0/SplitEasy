package com.spliteasy.controller;

import com.spliteasy.dto.request.SettlementRequest;
import com.spliteasy.dto.response.BalanceResponse;
import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.SettlementResponse;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.BalanceService;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.SettlementService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Soldes et remboursements")
@RestController
@RequestMapping("/api/groups/{groupId}")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;
    private final SettlementService settlementService;
    private final GroupAccessService groupAccessService;

    @GetMapping("/balances")
    public List<BalanceResponse> getBalances(@PathVariable Long groupId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return balanceService.computeBalances(groupId);
    }

    @GetMapping("/settlements")
    public List<SettlementResponse> getSettlements(@PathVariable Long groupId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return settlementService.suggest(groupId);
    }

    @PostMapping("/settlements")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse recordSettlement(@PathVariable Long groupId, @Valid @RequestBody SettlementRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        groupAccessService.checkMember(groupId, userId);
        return settlementService.recordSettlement(groupId, request, userId);
    }
}
