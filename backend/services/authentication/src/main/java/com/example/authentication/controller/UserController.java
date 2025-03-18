package com.example.authentication.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // Admin Only: Get all users
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Users>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Admin & User: Get User by Id (Users can access their own data)
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('ADMIN')")
    public ResponseEntity<Users> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // Admin Only: Search Users by Name
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Users>> getUserByName(@RequestParam String userName) {
        return ResponseEntity.ok(userService.getUserByName(userName));
    }

    // Admin Only: Get User ID by Username
    @GetMapping("/find")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Long>> getUserIdByUserName(@RequestParam String userName) {
        return ResponseEntity.ok(userService.getUserIdByUserName(userName));
    }

    // ✅ Public: Create New User (Anyone can register)
    @PostMapping
    public ResponseEntity<Users> createUser(@RequestBody Users user) {
        return ResponseEntity.ok(userService.createUsers(user));
    }

    // Users Can Update Their Own Profile, Admins Can Update Any
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('ADMIN')")
    public ResponseEntity<Users> updateUser(@PathVariable Long id, @RequestBody Users user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    // Admin Only: Delete User
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Boolean> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }
}