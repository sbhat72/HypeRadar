package com.hyperadar.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequestDto {
    // TODO: add username/password fields
    private String email;
    private String password;
    private String fullName;
}
