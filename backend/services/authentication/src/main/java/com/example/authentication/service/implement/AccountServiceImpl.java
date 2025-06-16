package com.example.authentication.service.implement;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.authentication.config.JwtService;
import com.example.authentication.entity.AccountEntity;
import com.example.authentication.entity.AuthenticationResponse;
import com.example.authentication.entity.Role;
import com.example.authentication.entity.UserEntity;
import com.example.authentication.model.Accounts;
import com.example.authentication.model.mapper.AccountMapper;
import com.example.authentication.repository.AccountRepository;
import com.example.authentication.repository.UserRepository;
import com.example.authentication.service.interfaces.AccountService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional(rollbackOn = Exception.class)
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private static final Logger logger = LoggerFactory.getLogger(AccountServiceImpl.class);
    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final AccountMapper accountMapper; // Inject AccountMapper

    @Override
    public AuthenticationResponse authenticate(Accounts accounts) {
        logger.info("Authenticating user: {}", accounts.getUserName());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(accounts.getUserName(), accounts.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        AccountEntity account = accountRepository.findByUserName(accounts.getUserName())
                .orElseThrow(() -> {
                    logger.error("Account not found for username: {}", accounts.getUserName());
                    return new RuntimeException("Account not found");
                });

        String jwtToken = jwtService.generateToken(account);
        logger.info("Authentication successful for user: {}", accounts.getUserName());
        return AuthenticationResponse.builder()
            .token(jwtToken)
            .expiresAt(jwtService.getTokenExpirationTime())
            .tokenType("Bearer")
            .build();
    }

    @Override
    public AuthenticationResponse createAccount(Accounts accounts) {
        logger.info("Creating account for user: {}", accounts.getUserName());
    
        if (accountRepository.findByUserName(accounts.getUserName()).isPresent()) {
            logger.error("User already exists: {}", accounts.getUserName());
            throw new RuntimeException("User already exists");
        }

        if (accounts.getRole() == null || (accounts.getRole() != Role.ADMIN && accounts.getRole() != Role.USER)) {
            logger.warn("Invalid role [ADMIN, USER] provided for user {}. Defaulting to USER.", accounts.getUserName());
            accounts.setRole(Role.USER);
        }
    
        // Encrypt password
        String encodedPassword = passwordEncoder.encode(accounts.getPassword());
        accounts.setPassword(encodedPassword);
        accounts.setCreateAt(LocalDateTime.now());
        accounts.setUpdateAt(LocalDateTime.now());
    
        // 1. Create and Save `UserEntity` First
        UserEntity user = new UserEntity();
        user.setUserName(accounts.getUserName());
        user.setAddress("UNKNOWN");
        user.setGender("UNKNOWN");
        user = userRepository.save(user); // Save the user and assign it back
    
        // 2. Set the saved `UserEntity` in `Accounts`
        accounts.setUsers(user);
    
        // 3. Convert DTO to Entity & Save AccountEntity
        AccountEntity accountEntity = accountMapper.toEntity(accounts);
        accountEntity = accountRepository.save(accountEntity);
    
        // 4. Generate JWT Token
        String jwtToken = jwtService.generateToken(accountEntity);
        logger.info("Account created successfully for user: {}", accounts.getUserName());
    
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .expiresAt(jwtService.getTokenExpirationTime())
                .tokenType("Bearer")
                .build();
    }

    @Override
    public boolean deleteAccount(Long id) {
        logger.info("Deleting account with ID: {}", id);
        AccountEntity accountEntity = accountRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Could not find any account with ID: {}", id);
                    return new RuntimeException("Could not find any account with ID: " + id);
                });

        accountRepository.delete(accountEntity);
        logger.info("Account deleted successfully with ID: {}", id);
        return true;
    }

    @Override
    public Accounts getAccountsById(Long id) {
        logger.info("Fetching account with ID: {}", id);
        AccountEntity accountEntity = accountRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Could not find any account with ID: {}", id);
                    return new RuntimeException("Could not find any account with ID: " + id);
                });

        // Convert Entity to DTO
        Accounts accountDto = accountMapper.toDTO(accountEntity);
        logger.info("Account fetched successfully: {}", accountDto);
        return accountDto;
    }

    @Override
    public List<Accounts> getAllAccounts() {
        logger.info("Fetching all accounts");
        List<Accounts> accountsList = accountRepository.findAll().stream()
                .map(accountMapper::toDTO)
                .collect(Collectors.toList());
        logger.info("Retrieved {} accounts", accountsList.size());
        return accountsList;
    }

    @Override
    public Long getAccIdByUserName(String userName) {
        logger.info("Fetching account ID by username: {}", userName);
        AccountEntity accountEntity = accountRepository.findByUserName(userName)
                .orElseThrow(() -> {
                    logger.error("Account not found for username: {}", userName);
                    return new RuntimeException("Account not found");
                });

        logger.info("Account ID found for username {}: {}", userName, accountEntity.getAccId());
        return accountEntity.getAccId();
    }

    @Override
    public Accounts updatePasswordAccount(Long id, Accounts accounts) {
        logger.info("Updating password for account ID: {}", id);
        AccountEntity accountEntity = accountRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Could not find any account with ID: {}", id);
                    return new RuntimeException("Could not find any account with ID: " + id);
                });

        if (accounts.getPassword() == null || accounts.getPassword().isBlank()) {
            logger.error("Password update failed: Password cannot be null or empty");
            throw new RuntimeException("Password cannot be null or empty");
        }

        accountEntity.setPassword(passwordEncoder.encode(accounts.getPassword()));
        accountEntity.setUpdateAt(LocalDateTime.now());
        accountRepository.save(accountEntity);

        // Convert Entity to DTO for return
        Accounts updatedAccount = accountMapper.toDTO(accountEntity);
        logger.info("Password updated successfully for account ID: {}", id);
        return updatedAccount;
    }
}