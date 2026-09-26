package com.spliteasy.controller;

import com.spliteasy.dto.request.ParticipantRequest;
import com.spliteasy.dto.response.ParticipantResponse;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.ParticipantService;
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

@Tag(name = "Participants")
@RestController
@RequestMapping("/api/groups/{groupId}/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;
    private final GroupAccessService groupAccessService;

    @GetMapping
    public List<ParticipantResponse> list(@PathVariable Long groupId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return participantService.list(groupId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ParticipantResponse add(@PathVariable Long groupId, @Valid @RequestBody ParticipantRequest request) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return participantService.add(groupId, request);
    }

    @PutMapping("/{participantId}")
    public ParticipantResponse rename(
            @PathVariable Long groupId, @PathVariable Long participantId, @Valid @RequestBody ParticipantRequest request) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        return participantService.rename(groupId, participantId, request);
    }

    @DeleteMapping("/{participantId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long groupId, @PathVariable Long participantId) {
        groupAccessService.checkMember(groupId, SecurityUtils.getCurrentUserId());
        participantService.delete(groupId, participantId);
    }

    // No membership check here on purpose: claiming a participant is how a user who is not
    // yet a member links themselves to the group (same exception as join/invite preview).
    @PostMapping("/{participantId}/claim")
    public ParticipantResponse claim(@PathVariable Long groupId, @PathVariable Long participantId) {
        return participantService.claim(groupId, participantId, SecurityUtils.getCurrentUserId());
    }
}
