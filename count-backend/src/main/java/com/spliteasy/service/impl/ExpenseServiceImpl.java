package com.spliteasy.service.impl;

import com.spliteasy.dto.request.ExpenseRequest;
import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.PageResponse;
import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.exception.BadRequestException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.mapper.ExpenseMapper;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.repository.spec.ExpenseSpecifications;
import com.spliteasy.service.ExpenseService;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.SplitCalculator;
import com.spliteasy.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    private static final Sort DEFAULT_SORT =
            Sort.by(Sort.Direction.DESC, "date").and(Sort.by(Sort.Direction.DESC, "id"));

    private final ExpenseRepository expenseRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final GroupAccessService groupAccessService;
    private final SplitCalculator splitCalculator;
    private final ExpenseMapper expenseMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ExpenseResponse> list(Long groupId, Category category, Long participantId, Pageable pageable) {
        Specification<Expense> spec = Specification
                .where(ExpenseSpecifications.belongsToGroup(groupId))
                .and(ExpenseSpecifications.hasCategory(category))
                .and(ExpenseSpecifications.involvesParticipant(participantId));

        // Expenses are always returned by date descending (then id descending as a tiebreaker),
        // regardless of any sort the caller might otherwise request.
        Pageable effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), DEFAULT_SORT);

        Page<Expense> page = expenseRepository.findAll(spec, effectivePageable);
        return PageResponse.of(page.map(expenseMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse get(Long groupId, Long expenseId) {
        return expenseMapper.toResponse(getExpenseOrThrow(groupId, expenseId));
    }

    @Override
    public ExpenseResponse create(Long groupId, ExpenseRequest request, Long userId) {
        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);
        Map<Long, Participant> participantsById = loadGroupParticipantsById(groupId);
        Participant paidBy = requirePayer(participantsById, request.paidById());
        User createdBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        List<ExpenseShare> shares = splitCalculator.computeShares(
                MoneyUtils.scale(request.amount()), request.splitType(), request.shares(), participantsById);

        Expense expense = Expense.builder()
                .title(request.title())
                .amount(MoneyUtils.scale(request.amount()))
                .date(request.date())
                .category(request.category() != null ? request.category() : Category.OTHER)
                .type(ExpenseType.EXPENSE)
                .splitType(request.splitType())
                .paidBy(paidBy)
                .createdBy(createdBy)
                .build();
        group.addExpense(expense);
        shares.forEach(expense::addShare);

        expense = expenseRepository.save(expense);
        return expenseMapper.toResponse(expense);
    }

    @Override
    public ExpenseResponse update(Long groupId, Long expenseId, ExpenseRequest request, Long userId) {
        Expense expense = getExpenseOrThrow(groupId, expenseId);
        if (expense.isTransfer()) {
            throw new BadRequestException(
                    "Un remboursement ne peut pas être modifié comme une dépense classique.");
        }

        Map<Long, Participant> participantsById = loadGroupParticipantsById(groupId);
        Participant paidBy = requirePayer(participantsById, request.paidById());

        List<ExpenseShare> newShares = splitCalculator.computeShares(
                MoneyUtils.scale(request.amount()), request.splitType(), request.shares(), participantsById);

        expense.setTitle(request.title());
        expense.setAmount(MoneyUtils.scale(request.amount()));
        expense.setDate(request.date());
        expense.setCategory(request.category() != null ? request.category() : Category.OTHER);
        expense.setSplitType(request.splitType());
        expense.setPaidBy(paidBy);

        expense.clearShares();
        newShares.forEach(expense::addShare);

        expense = expenseRepository.save(expense);
        return expenseMapper.toResponse(expense);
    }

    @Override
    public void delete(Long groupId, Long expenseId) {
        Expense expense = getExpenseOrThrow(groupId, expenseId);
        expenseRepository.delete(expense);
    }

    private Expense getExpenseOrThrow(Long groupId, Long expenseId) {
        return expenseRepository.findByIdAndGroupId(expenseId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Dépense introuvable dans ce groupe."));
    }

    private Map<Long, Participant> loadGroupParticipantsById(Long groupId) {
        return participantRepository.findByGroupIdOrderByNameAsc(groupId).stream()
                .collect(Collectors.toMap(Participant::getId, Function.identity()));
    }

    private Participant requirePayer(Map<Long, Participant> participantsById, Long paidById) {
        Participant paidBy = participantsById.get(paidById);
        if (paidBy == null) {
            throw new BadRequestException("Le payeur n'appartient pas au groupe de la dépense.");
        }
        return paidBy;
    }
}
