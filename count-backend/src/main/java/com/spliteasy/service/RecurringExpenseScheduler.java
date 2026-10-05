package com.spliteasy.service;

import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * A recurring expense (e.g. rent, a shared subscription) is stored as a normal Expense with
 * {@code recurring = true} acting as a "template": it stays visible as the expense that created
 * the series, while this job generates a plain (non-recurring) copy of it each time its
 * {@code nextOccurrenceDate} is reached, then advances that date by one more interval.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseScheduler {

    private final ExpenseRepository expenseRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void generateDueOccurrences() {
        List<Expense> dueTemplates = expenseRepository.findByRecurringTrueAndNextOccurrenceDateLessThanEqual(LocalDate.now());

        for (Expense template : dueTemplates) {
            expenseRepository.save(cloneAsOccurrence(template));
            template.setNextOccurrenceDate(template.getRecurrenceInterval().nextAfter(template.getNextOccurrenceDate()));
        }

        if (!dueTemplates.isEmpty()) {
            log.info("Generated {} recurring expense occurrence(s)", dueTemplates.size());
        }
    }

    private Expense cloneAsOccurrence(Expense template) {
        Expense occurrence = Expense.builder()
                .title(template.getTitle())
                .amount(template.getAmount())
                .date(template.getNextOccurrenceDate())
                .category(template.getCategory())
                .type(template.getType())
                .splitType(template.getSplitType())
                .paidBy(template.getPaidBy())
                .createdBy(template.getCreatedBy())
                .recurring(false)
                .build();
        template.getGroup().addExpense(occurrence);

        for (ExpenseShare templateShare : template.getShares()) {
            occurrence.addShare(ExpenseShare.builder()
                    .participant(templateShare.getParticipant())
                    .shareValue(templateShare.getShareValue())
                    .amount(templateShare.getAmount())
                    .build());
        }

        return occurrence;
    }
}
