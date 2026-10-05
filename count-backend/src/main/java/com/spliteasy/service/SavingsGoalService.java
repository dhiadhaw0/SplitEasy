package com.spliteasy.service;

import com.spliteasy.dto.request.SavingsContributionRequest;
import com.spliteasy.dto.request.SavingsGoalRequest;
import com.spliteasy.dto.response.SavingsGoalResponse;

import java.util.List;

public interface SavingsGoalService {

    List<SavingsGoalResponse> list(Long groupId);

    SavingsGoalResponse create(Long groupId, SavingsGoalRequest request);

    SavingsGoalResponse update(Long groupId, Long goalId, SavingsGoalRequest request);

    void delete(Long groupId, Long goalId);

    SavingsGoalResponse addContribution(Long groupId, Long goalId, SavingsContributionRequest request);

    SavingsGoalResponse deleteContribution(Long groupId, Long goalId, Long contributionId);
}
