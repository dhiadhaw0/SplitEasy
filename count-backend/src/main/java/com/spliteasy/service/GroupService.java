package com.spliteasy.service;

import com.spliteasy.dto.request.GroupRequest;
import com.spliteasy.dto.request.JoinGroupRequest;
import com.spliteasy.dto.response.GroupDetailResponse;
import com.spliteasy.dto.response.GroupSummaryResponse;
import com.spliteasy.dto.response.InvitePreviewResponse;

import java.util.List;

public interface GroupService {

    List<GroupSummaryResponse> getMyGroups(Long userId);

    GroupDetailResponse getGroup(Long groupId, Long userId);

    GroupDetailResponse createGroup(GroupRequest request, Long userId);

    GroupDetailResponse updateGroup(Long groupId, GroupRequest request, Long userId);

    /** @throws com.spliteasy.exception.ForbiddenException if the caller is not the group's creator. */
    void deleteGroup(Long groupId, Long userId);

    GroupDetailResponse regenerateInviteCode(Long groupId, Long userId);

    InvitePreviewResponse previewInvite(String inviteCode);

    GroupDetailResponse joinGroup(JoinGroupRequest request, Long userId);
}
