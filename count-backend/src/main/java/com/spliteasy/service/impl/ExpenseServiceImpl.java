package com.spliteasy.service.impl;

import com.spliteasy.dto.request.ExpenseRequest;
import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.PageResponse;
import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.ActivityType;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.Currency;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.exception.BadRequestException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.mapper.ExpenseMapper;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.repository.spec.ExpenseSpecifications;
import com.spliteasy.service.ActivityService;
import com.spliteasy.service.BudgetService;
import com.spliteasy.service.ExchangeRateService;
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

import java.math.BigDecimal;
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
    private final ExchangeRateService exchangeRateService;
    private final ActivityService activityService;
    private final BudgetService budgetService;

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

        ConvertedAmount converted = convert(request.amount(), request.currency(), group.getCurrency());

        List<ExpenseShare> shares = splitCalculator.computeShares(
                converted.amount(), request.splitType(), request.shares(), participantsById);

        validateRecurrence(request);

        Expense expense = Expense.builder()
                .title(request.title())
                .amount(converted.amount())
                .originalCurrency(converted.originalCurrency())
                .originalAmount(converted.originalAmount())
                .exchangeRate(converted.exchangeRate())
                .date(request.date())
                .category(request.category() != null ? request.category() : Category.OTHER)
                .type(ExpenseType.EXPENSE)
                .splitType(request.splitType())
                .paidBy(paidBy)
                .createdBy(createdBy)
                .recurring(request.isRecurring())
                .recurrenceInterval(request.isRecurring() ? request.recurrenceInterval() : null)
                .nextOccurrenceDate(request.isRecurring() ? request.recurrenceInterval().nextAfter(request.date()) : null)
                .build();
        group.addExpense(expense);
        shares.forEach(expense::addShare);

        expense = expenseRepository.save(expense);

        activityService.log(group, createdBy, ActivityType.EXPENSE_CREATED,
                createdBy.getDisplayName() + " a ajouté « " + expense.getTitle() + " » ("
                        + expense.getAmount() + " " + group.getCurrency() + ")");
        budgetService.checkExceededByExpense(group, expense.getCategory(), expense.getAmount(), createdBy);

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

        ConvertedAmount converted = convert(request.amount(), request.currency(), expense.getGroup().getCurrency());

        List<ExpenseShare> newShares = splitCalculator.computeShares(
                converted.amount(), request.splitType(), request.shares(), participantsById);

        validateRecurrence(request);

        expense.setTitle(request.title());
        expense.setAmount(converted.amount());
        expense.setOriginalCurrency(converted.originalCurrency());
        expense.setOriginalAmount(converted.originalAmount());
        expense.setExchangeRate(converted.exchangeRate());
        expense.setDate(request.date());
        expense.setCategory(request.category() != null ? request.category() : Category.OTHER);
        expense.setSplitType(request.splitType());
        expense.setPaidBy(paidBy);
        expense.setRecurring(request.isRecurring());
        expense.setRecurrenceInterval(request.isRecurring() ? request.recurrenceInterval() : null);
        expense.setNextOccurrenceDate(request.isRecurring() ? request.recurrenceInterval().nextAfter(request.date()) : null);

        expense.clearShares();
        newShares.forEach(expense::addShare);

        expense = expenseRepository.save(expense);

        User editor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        activityService.log(expense.getGroup(), editor, ActivityType.EXPENSE_UPDATED,
                editor.getDisplayName() + " a modifié « " + expense.getTitle() + " »");

        return expenseMapper.toResponse(expense);
    }

    @Override
    public void delete(Long groupId, Long expenseId, Long userId) {
        Expense expense = getExpenseOrThrow(groupId, expenseId);
        User deletedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        String title = expense.getTitle();
        ExpenseGroup group = expense.getGroup();

        expenseRepository.delete(expense);

        activityService.log(group, deletedBy, ActivityType.EXPENSE_DELETED,
                deletedBy.getDisplayName() + " a supprimé « " + title + " »");
    }

    private Expense getExpenseOrThrow(Long groupId, Long expenseId) {
        return expenseRepository.findByIdAndGroupId(expenseId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Dépense introuvable dans ce groupe."));
    }

    private Map<Long, Participant> loadGroupParticipantsById(Long groupId) {
        return participantRepository.findByGroupIdOrderByNameAsc(groupId).stream()
                .collect(Collectors.toMap(Participant::getId, Function.identity()));
    }

    private void validateRecurrence(ExpenseRequest request) {
        if (request.isRecurring() && request.recurrenceInterval() == null) {
            throw new BadRequestException("La fréquence de répétition est obligatoire pour une dépense récurrente.");
        }
    }

    private Participant requirePayer(Map<Long, Participant> participantsById, Long paidById) {
        Participant paidBy = participantsById.get(paidById);
        if (paidBy == null) {
            throw new BadRequestException("Le payeur n'appartient pas au groupe de la dépense.");
        }
        return paidBy;
    }

    /** {@code amount}, already scaled to 2 decimals and expressed in the group's currency. The other
     * three fields are null unless a conversion actually happened (request currency != group currency). */
    private record ConvertedAmount(BigDecimal amount, Currency originalCurrency, BigDecimal originalAmount, BigDecimal exchangeRate) {
    }

    private ConvertedAmount convert(BigDecimal requestAmount, Currency requestCurrency, Currency groupCurrency) {
        BigDecimal scaledRequestAmount = MoneyUtils.scale(requestAmount);
        if (requestCurrency == null || requestCurrency == groupCurrency) {
            return new ConvertedAmount(scaledRequestAmount, null, null, null);
        }

        BigDecimal rate = exchangeRateService.getRate(requestCurrency, groupCurrency);
        BigDecimal converted = MoneyUtils.scale(scaledRequestAmount.multiply(rate));
        return new ConvertedAmount(converted, requestCurrency, scaledRequestAmount, rate);
    }
}
