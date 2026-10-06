package com.spliteasy.dto.response;

/** Backs the "getting started" checklist — every field is derived from existing data, nothing is tracked separately. */
public record OnboardingResponse(
        boolean hasGroup,
        boolean hasExpense,
        boolean hasInvitedSomeone,
        boolean hasBudgetOrGoal
) {
}
