package com.example.authentication.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.authentication.entity.AuthenticationResponse;
import com.example.authentication.model.Accounts;
import com.example.authentication.service.interfaces.AccountService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/authentications")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    // Sign Up new account
    @PostMapping("/signup")
    public ResponseEntity<AuthenticationResponse> createAccount(@RequestBody Accounts account) throws Exception { 
        return ResponseEntity.ok(accountService.createAccount(account));
    }

    // Sign In account
    @PostMapping("/signin")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody Accounts account) {
        return ResponseEntity.ok(accountService.authenticate(account));
    }

    // Get all accounts
    @GetMapping("/accounts")
    public ResponseEntity<List<Accounts>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }

    // Get account by ID
    @GetMapping("/accounts/{id}")
    public ResponseEntity<Accounts> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccountsById(id));
    }

    // Get account ID by username
    @GetMapping("/accounts/search")
    public ResponseEntity<Long> getAccIdByUserName(@RequestParam String userName) {
        return ResponseEntity.ok(accountService.getAccIdByUserName(userName));
    }

    // Update account password
    @PutMapping("/accounts/{id}")
    public ResponseEntity<Accounts> updateAccountPassword(@PathVariable Long id, @RequestBody Accounts account) {
        return ResponseEntity.ok(accountService.updatePasswordAccount(id, account));
    }

    // Delete account
    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Boolean> deleteAccount(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.deleteAccount(id));
    }
}