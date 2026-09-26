package com.spliteasy.service.impl;

import com.spliteasy.dto.request.ParticipantRequest;
import com.spliteasy.dto.response.ParticipantResponse;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.User;
import com.spliteasy.exception.ConflictException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.mapper.ParticipantMapper;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ExpenseShareRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.ParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ParticipantServiceImpl implements ParticipantService {

    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final GroupAccessService groupAccessService;
    private final ParticipantMapper participantMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ParticipantResponse> list(Long groupId) {
        return participantMapper.toResponseList(participantRepository.findByGroupIdOrderByNameAsc(groupId));
    }

    @Override
    public ParticipantResponse add(Long groupId, ParticipantRequest request) {
        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);
        if (participantRepository.existsByGroupIdAndNameIgnoreCase(groupId, request.name())) {
            throw new ConflictException("Un participant porte déjà ce nom dans ce groupe.");
        }

        Participant participant = Participant.builder().name(request.name()).build();
        group.addParticipant(participant);
        participant = participantRepository.save(participant);

        return participantMapper.toResponse(participant);
    }

    @Override
    public ParticipantResponse rename(Long groupId, Long participantId, ParticipantRequest request) {
        Participant participant = getParticipantOrThrow(groupId, participantId);

        boolean nameChanged = !participant.getName().equalsIgnoreCase(request.name());
        if (nameChanged && participantRepository.existsByGroupIdAndNameIgnoreCase(groupId, request.name())) {
            throw new ConflictException("Un participant porte déjà ce nom dans ce groupe.");
        }

        participant.setName(request.name());
        return participantMapper.toResponse(participant);
    }

    @Override
    public void delete(Long groupId, Long participantId) {
        Participant participant = getParticipantOrThrow(groupId, participantId);

        boolean involvedAsPayer = expenseRepository.existsByPaidById(participantId);
        boolean involvedAsBeneficiary = expenseShareRepository.existsByParticipantId(participantId);
        if (involvedAsPayer || involvedAsBeneficiary) {
            throw new ConflictException(
                    "Ce participant est impliqué dans au moins une dépense et ne peut pas être supprimé.");
        }

        participantRepository.delete(participant);
    }

    @Override
    public ParticipantResponse claim(Long groupId, Long participantId, Long userId) {
        Participant participant = getParticipantOrThrow(groupId, participantId);
        if (participant.isLinked()) {
            throw new ConflictException("Ce participant est déjà lié à un compte utilisateur.");
        }
        if (participantRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new ConflictException("Vous avez déjà un participant lié dans ce groupe.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        participant.setUser(user);

        return participantMapper.toResponse(participant);
    }

    private Participant getParticipantOrThrow(Long groupId, Long participantId) {
        return participantRepository.findByIdAndGroupId(participantId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant introuvable dans ce groupe."));
    }
}
