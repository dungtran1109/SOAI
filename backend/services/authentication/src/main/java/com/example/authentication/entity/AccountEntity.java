package com.example.authentication.entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.*;

import lombok.*;

@Entity
@Builder
@Data
@Table(name = "ACCOUNTS")
@NoArgsConstructor
@AllArgsConstructor
@Transactional(rollbackOn = Exception.class)
public class AccountEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ACC_ID", nullable = false, unique = true)
    private Long accId;

    @Column(name = "USER_NAME", nullable = false, length = 255, unique = true) // Ensure username is unique
    @NotBlank(message = "Username must not be blank")
    @Size(min = 3, message = "Username must be at least 3 characters")
    private String userName;

    @Column(name = "HASH_PASS", nullable = false, length = 255) // Increase length for bcrypt hash storage
    @NotBlank(message = "Password must not be blank")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @JsonIgnore
    private String password;

    @Column(name = "PHONE_NUM", unique = true)
    private Long phoneNumber;

    @OneToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "USER_ID")
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false)
    @Builder.Default
    private Role role = Role.USER; // Default role set explicitly

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "CREATE_AT", updatable = false) // Marked as updatable=false to prevent accidental updates
    private LocalDateTime createAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "UPDATE_AT")
    private LocalDateTime updateAt;

    @PrePersist
    protected void onCreate() {
        this.createAt = LocalDateTime.now();
        this.updateAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updateAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return userName;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}