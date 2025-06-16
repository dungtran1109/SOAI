package com.example.authentication.model.mapper;

import org.springframework.stereotype.Component;

import com.example.authentication.entity.UserEntity;
import com.example.authentication.model.Users;

import org.modelmapper.ModelMapper;

@Component
public class UserMapper {
    private final ModelMapper modelMapper = new ModelMapper();

    public Users toDTO(UserEntity user) {
        return modelMapper.map(user, Users.class);
    }

    public UserEntity toEntity(Users userDTO) {
        return modelMapper.map(userDTO, UserEntity.class);
    }
}