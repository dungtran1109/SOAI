package com.example.authentication.model;

import java.time.LocalDateTime;

import com.example.authentication.entity.Role;
import com.example.authentication.entity.UserEntity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Accounts {
    public Accounts(String userName, String password, Role role) {
        this.userName = userName;
        this.password = password;
        this.role = role;
    }
    private Long accId;
    private String userName;
    private String password;
    private Long phoneNumber;
    private UserEntity users;
    private Role role = Role.USER;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
}
