package com.spliteasy.controller;

import com.spliteasy.dto.request.GroupRequest;
import com.spliteasy.dto.request.JoinGroupRequest;
import com.spliteasy.dto.response.GroupDetailResponse;
import com.spliteasy.dto.response.GroupSummaryResponse;
import com.spliteasy.dto.response.InvitePreviewResponse;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.GroupService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Groupes")
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final GroupAccessService groupAccessService;

    @GetMapping
    public List<GroupSummaryResponse> getMyGroups() {
        return groupService.getMyGroups(SecurityUtils.getCurrentUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupDetailResponse createGroup(@Valid @RequestBody GroupRequest request) {
        return groupService.createGroup(request, SecurityUtils.getCurrentUserId());
    }

    @GetMapping("/{groupId}")
    public GroupDetailResponse getGroup(@PathVariable Long groupId) {
        Long userId = SecurityUtils.getCurrentUserId();
        groupAccessService.checkMember(groupId, userId);
        return groupService.getGroup(groupId, userId);
    }

    @PutMapping("/{groupId}")
    public GroupDetailResponse updateGroup(@PathVariable Long groupId, @Valid @RequestBody GroupRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        groupAccessService.checkMember(groupId, userId);
        return groupService.updateGroup(groupId, request, userId);
    }

    @DeleteMapping("/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@PathVariable Long groupId) {
        Long userId = SecurityUtils.getCurrentUserId();
        groupAccessService.checkMember(groupId, userId);
        groupService.deleteGroup(groupId, userId); // service also enforces "creator only"
    }

    @PostMapping("/{groupId}/invite-code")
    public GroupDetailResponse regenerateInviteCode(@PathVariable Long groupId) {
        Long userId = SecurityUtils.getCurrentUserId();
        groupAccessService.checkMember(groupId, userId);
        return groupService.regenerateInviteCode(groupId, userId);
    }

    // No membership check here on purpose: this is what lets a user preview a group
    // (its name and unlinked participants) before they have joined it.
    @GetMapping("/invite/{inviteCode}")
    public InvitePreviewResponse previewInvite(@PathVariable String inviteCode) {
        return groupService.previewInvite(inviteCode);
    }

    // No membership check here either: joining is precisely how a user becomes a member.
    @PostMapping("/join")
    public GroupDetailResponse joinGroup(@Valid @RequestBody JoinGroupRequest request) {
        return groupService.joinGroup(request, SecurityUtils.getCurrentUserId());
    }
}
