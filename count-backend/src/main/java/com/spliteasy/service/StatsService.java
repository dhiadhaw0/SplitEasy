package com.spliteasy.service;

import com.spliteasy.dto.response.GroupStatsResponse;

public interface StatsService {

    /** All figures EXCLUDE TRANSFER expenses (they are settlements, not spending). */
    GroupStatsResponse getStats(Long groupId);
}
