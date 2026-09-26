package com.spliteasy.service.impl;

import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.Participant;
import com.spliteasy.exception.ForbiddenException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.repository.ExpenseGroupRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.service.GroupAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupAccessServiceImpl implements GroupAccessService {

    private final ExpenseGroupRepository groupRepository;
    private final ParticipantRepository participantRepository;

    @Override
    public ExpenseGroup getGroupOrThrow(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe introuvable avec l'id " + groupId));
    }

    @Override
    public void checkMember(Long groupId, Long userId) {
        if (!participantRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new ForbiddenException("Vous n'êtes pas membre de ce groupe.");
        }
    }

    @Override
    public void checkCreator(Long groupId, Long userId) {
        ExpenseGroup group = getGroupOrThrow(groupId);
        if (!group.getCreatedBy().getId().equals(userId)) {
            throw new ForbiddenException("Seul le créateur du groupe peut effectuer cette action.");
        }
    }

    @Override
    public Optional<Participant> findMyParticipant(Long groupId, Long userId) {
        return participantRepository.findByGroupIdAndUserId(groupId, userId);
    }
}
