package com.example.authentication.service.interfaces;

import com.example.authentication.entity.AuthenticationResponse;
import com.example.authentication.model.Accounts;
import java.util.*;

import org.springframework.security.core.userdetails.UsernameNotFoundException;

public interface AccountService {
    AuthenticationResponse createAccount(Accounts accounts) throws Exception;
    AuthenticationResponse authenticate(Accounts accounts) throws UsernameNotFoundException;
    List<Accounts> getAllAccounts();
    boolean deleteAccount(Long id) throws UsernameNotFoundException;
    Accounts getAccountsById(Long id) throws UsernameNotFoundException;
    Long getAccIdByUserName (String userName) throws UsernameNotFoundException;
    Accounts updatePasswordAccount(Long id, Accounts accounts) throws UsernameNotFoundException;
}
