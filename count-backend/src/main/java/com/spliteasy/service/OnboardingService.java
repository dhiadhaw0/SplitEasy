package com.spliteasy.service;

import com.spliteasy.dto.response.OnboardingResponse;

public interface OnboardingService {

    /** Computes the "getting started" checklist status for this user, purely from existing data. */
    OnboardingResponse getStatus(Long userId);
}
