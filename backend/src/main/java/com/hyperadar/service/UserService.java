package com.hyperadar.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hyperadar.config.JwtUtil;
import com.hyperadar.dto.AuthRequestDto;
import com.hyperadar.dto.AuthResponseDto;
import com.hyperadar.repository.UserRepository;
import com.hyperadar.model.User;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserService implements UserDetailsService {
    
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    JwtUtil jwtUtil;

    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        

    }

    public AuthResponseDto registerUser(AuthRequestDto authRequest) throws RuntimeException {
        //1. Check if its exsits
        //2.Hash the password 
        //3. Save the user
        //4. Generate token
        String email = authRequest.getEmail();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("User already exists with email: " + email);
        }
        String hashedPassword = passwordEncoder.encode(authRequest.getPassword());
        User user = User.builder()
                .email(email)
                .passwordHash(hashedPassword)
                .fullName(authRequest.getFullName())
                .build();
        userRepository.save(user);

        String token = jwtUtil.generateToken(user);
        return new AuthResponseDto(token);
    }






}
