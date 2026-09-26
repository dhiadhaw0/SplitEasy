package com.spliteasy.service.impl;

import com.spliteasy.dto.response.GroupStatsResponse;
import com.spliteasy.dto.response.ParticipantStatResponse;
import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.service.StatsService;
import com.spliteasy.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsServiceImpl implements StatsService {

    private final ExpenseRepository expenseRepository;
    private final ParticipantRepository participantRepository;

    @Override
    public GroupStatsResponse getStats(Long groupId) {
        List<Participant> participants = participantRepository.findByGroupIdOrderByNameAsc(groupId);

        List<Expense> expenses = expenseRepository.findAllByGroupIdWithShares(groupId).stream()
                .filter(expense -> expense.getType() == ExpenseType.EXPENSE)
                .toList();

        BigDecimal totalSpent = MoneyUtils.sum(expenses.stream().map(Expense::getAmount).toList());

        Map<Category, BigDecimal> byCategory = new EnumMap<>(Category.class);
        for (Expense expense : expenses) {
            byCategory.merge(expense.getCategory(), expense.getAmount(), BigDecimal::add);
        }
        byCategory.replaceAll((category, amount) -> MoneyUtils.scale(amount));

        Map<Long, BigDecimal> paidByParticipant = new LinkedHashMap<>();
        Map<Long, BigDecimal> consumedByParticipant = new LinkedHashMap<>();
        for (Participant participant : participants) {
            paidByParticipant.put(participant.getId(), MoneyUtils.ZERO);
            consumedByParticipant.put(participant.getId(), MoneyUtils.ZERO);
        }
        for (Expense expense : expenses) {
            paidByParticipant.merge(expense.getPaidBy().getId(), expense.getAmount(), BigDecimal::add);
            for (ExpenseShare share : expense.getShares()) {
                consumedByParticipant.merge(share.getParticipant().getId(), share.getAmount(), BigDecimal::add);
            }
        }

        List<ParticipantStatResponse> byParticipant = participants.stream()
                .map(participant -> new ParticipantStatResponse(
                        participant.getId(),
                        participant.getName(),
                        MoneyUtils.scale(paidByParticipant.get(participant.getId())),
                        MoneyUtils.scale(consumedByParticipant.get(participant.getId()))))
                .toList();

        return new GroupStatsResponse(MoneyUtils.scale(totalSpent), expenses.size(), byCategory, byParticipant);
    }
}
