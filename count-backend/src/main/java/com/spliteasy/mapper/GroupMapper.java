package com.spliteasy.mapper;

import com.spliteasy.dto.response.GroupDetailResponse;
import com.spliteasy.dto.response.GroupSummaryResponse;
import com.spliteasy.dto.response.InvitePreviewResponse;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.Participant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring", uses = ParticipantMapper.class)
public interface GroupMapper {

    /**
     * @param myParticipantId id of the participant linked to the caller in this group, or null.
     */
    @Mapping(target = "createdById", source = "group.createdBy.id")
    GroupDetailResponse toDetailResponse(ExpenseGroup group, Long myParticipantId);

    /**
     * participantCount, totalSpent and myBalance are computed by the calling service
     * (balance/expense aggregation), not derivable from the entity alone.
     */
    GroupSummaryResponse toSummaryResponse(ExpenseGroup group, int participantCount, BigDecimal totalSpent, BigDecimal myBalance);

    @Mapping(target = "groupId", source = "group.id")
    @Mapping(target = "groupName", source = "group.name")
    InvitePreviewResponse toInvitePreviewResponse(ExpenseGroup group, List<Participant> unlinkedParticipants);
}
