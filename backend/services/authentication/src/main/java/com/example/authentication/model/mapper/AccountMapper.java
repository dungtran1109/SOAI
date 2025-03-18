package com.example.authentication.model.mapper;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import com.example.authentication.entity.AccountEntity;
import com.example.authentication.model.Accounts;

@Component
public class AccountMapper {
    private final ModelMapper modelMapper = new ModelMapper();

    public Accounts toDTO(AccountEntity account) {
        return modelMapper.map(account, Accounts.class);
    }

    public AccountEntity toEntity(Accounts accountDTO) {
        return modelMapper.map(accountDTO, AccountEntity.class);
    }
}
