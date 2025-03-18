package com.example.authentication.service.interfaces;

import com.example.authentication.model.Users;

import java.util.List;
import java.util.Map;

public interface UserService {
    Users createUsers(Users user);
    List<Users> getAllUsers();
    Users getUserById(Long id);
    List<Users> getUserByName(String userName);
    Map<String, Long> getUserIdByUserName(String userName);
    Users updateUser(Long id, Users user);
    boolean deleteUser(Long id);
}
