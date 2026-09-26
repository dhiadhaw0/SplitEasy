package com.spliteasy.repository.spec;

import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.enums.Category;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

/**
 * Reusable JPA Specifications for filtering expenses.
 * A subquery is used for the participant filter (rather than a join on shares) so that
 * pagination counts stay correct, since an inner join on the shares collection would
 * multiply the number of result rows.
 */
public final class ExpenseSpecifications {

    private ExpenseSpecifications() {
    }

    public static Specification<Expense> belongsToGroup(Long groupId) {
        return (root, query, cb) -> cb.equal(root.get("group").get("id"), groupId);
    }

    public static Specification<Expense> hasCategory(Category category) {
        if (category == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    /**
     * Matches expenses where the given participant is either the payer or one of the beneficiaries.
     */
    public static Specification<Expense> involvesParticipant(Long participantId) {
        if (participantId == null) {
            return null;
        }
        return (root, query, cb) -> {
            Subquery<Long> shareSubquery = query.subquery(Long.class);
            var shareRoot = shareSubquery.from(ExpenseShare.class);
            shareSubquery.select(shareRoot.get("expense").get("id"))
                    .where(cb.equal(shareRoot.get("participant").get("id"), participantId));

            Predicate isPayer = cb.equal(root.get("paidBy").get("id"), participantId);
            Predicate isBeneficiary = root.get("id").in(shareSubquery);
            return cb.or(isPayer, isBeneficiary);
        };
    }
}
