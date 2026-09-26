package com.spliteasy.mapper;

import com.spliteasy.dto.response.ParticipantResponse;
import com.spliteasy.entity.Participant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ParticipantMapper {

    @Mapping(target = "userId", expression = "java(participant.getUser() != null ? participant.getUser().getId() : null)")
    @Mapping(target = "linked", expression = "java(participant.isLinked())")
    ParticipantResponse toResponse(Participant participant);

    List<ParticipantResponse> toResponseList(List<Participant> participants);
}
