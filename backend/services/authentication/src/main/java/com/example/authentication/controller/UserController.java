package com.example.authentication.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.example.authentication.model.Users;
import com.example.authentication.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;

@RestController 
@RequestMapping("/api/v1/authentications/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Get all users
    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Get User by Id
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, String>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // Get User by Name (search)
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> getUserByName(@RequestParam String userName) {
        return ResponseEntity.ok(userService.getUserByName(userName));
    }

    // Get User ID by User Name
    @GetMapping("/find")
    public ResponseEntity<Map<String, Long>> getUserIdByUserName(@RequestParam String userName) {
        return ResponseEntity.ok(userService.getUserIdByUserName(userName));
    }

    // Create new User
    @PostMapping
    public ResponseEntity<Users> createUser(@RequestBody Users user) {
        return ResponseEntity.ok(userService.createUsers(user));
    }

    // Update User
    @PatchMapping("/{id}")
    public ResponseEntity<Users> updateUser(@PathVariable Long id, @RequestBody Users user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    // Delete User By Id
    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }
}