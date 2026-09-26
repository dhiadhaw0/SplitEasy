package com.spliteasy.mapper;

import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.ShareResponse;
import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseShare;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = ParticipantMapper.class)
public interface ExpenseMapper {

    ExpenseResponse toResponse(Expense expense);

    List<ExpenseResponse> toResponseList(List<Expense> expenses);

    @Mapping(target = "participantId", source = "participant.id")
    @Mapping(target = "participantName", source = "participant.name")
    @Mapping(target = "value", source = "shareValue")
    ShareResponse toShareResponse(ExpenseShare share);
}
