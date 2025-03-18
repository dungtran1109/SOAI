package com.example.authentication.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // ✅ Public: Sign Up (Anyone can create an account)
    @PostMapping("/signup")
    public ResponseEntity<AuthenticationResponse> createAccount(@RequestBody Accounts account) throws Exception { 
        return ResponseEntity.ok(accountService.createAccount(account));
    }

    // ✅ Public: Sign In (Anyone can log in)
    @PostMapping("/signin")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody Accounts account) {
        return ResponseEntity.ok(accountService.authenticate(account));
    }

    // Admin Only: Get All Accounts
    @GetMapping("/accounts")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Accounts>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }

    // Admin Only: Get Account by ID
    @GetMapping("/accounts/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Accounts> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccountsById(id));
    }

    // Admin Only: Get Account ID by Username
    @GetMapping("/accounts/search")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Long> getAccIdByUserName(@RequestParam String userName) {
        return ResponseEntity.ok(accountService.getAccIdByUserName(userName));
    }

    // Users Can Update Their Own Password, Admins Can Update Any
    @PutMapping("/accounts/{id}")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('ADMIN')")
    public ResponseEntity<Accounts> updateAccountPassword(@PathVariable Long id, @RequestBody Accounts account) {
        return ResponseEntity.ok(accountService.updatePasswordAccount(id, account));
    }

    // Admin Only: Delete an Account
    @DeleteMapping("/accounts/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Boolean> deleteAccount(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.deleteAccount(id));
    }
}