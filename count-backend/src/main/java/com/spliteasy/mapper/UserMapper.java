package com.spliteasy.mapper;

import com.spliteasy.dto.response.UserResponse;
import com.spliteasy.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);
}
