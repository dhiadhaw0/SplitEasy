package com.spliteasy.repository;

import com.spliteasy.entity.Expense;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.ExpenseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {

    Optional<Expense> findByIdAndGroupId(Long id, Long groupId);

    boolean existsByPaidById(Long participantId);

    boolean existsByGroupId(Long groupId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.group.id = :groupId AND e.type = :type")
    BigDecimal sumAmountByGroupIdAndType(@Param("groupId") Long groupId, @Param("type") ExpenseType type);

    /** Spend total backing a {@link com.spliteasy.entity.Budget}'s progress; {@code category} null means every category. */
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.group.id = :groupId
            AND e.type = com.spliteasy.entity.enums.ExpenseType.EXPENSE
            AND (:category IS NULL OR e.category = :category)
            AND e.date BETWEEN :startDate AND :endDate
            """)
    BigDecimal sumAmountForBudget(
            @Param("groupId") Long groupId,
            @Param("category") Category category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Loads every expense of a group together with its shares and their participants,
     * fetched eagerly to avoid N+1 queries when computing balances/stats.
     */
    @Query("""
            SELECT DISTINCT e FROM Expense e
            LEFT JOIN FETCH e.paidBy
            LEFT JOIN FETCH e.shares s
            LEFT JOIN FETCH s.participant
            WHERE e.group.id = :groupId
            """)
    List<Expense> findAllByGroupIdWithShares(@Param("groupId") Long groupId);

    /** Recurring expense templates whose next occurrence is due, for {@link com.spliteasy.service.RecurringExpenseScheduler}. */
    List<Expense> findByRecurringTrueAndNextOccurrenceDateLessThanEqual(LocalDate date);
}
