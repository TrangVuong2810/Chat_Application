package com.chat.chat.payload.request;

import com.chat.chat.enums.Role;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    @NotNull(message = "Full name is required")
    private String fullName;

    @NotEmpty(message = "Username is required")
    private String username;

    @NotEmpty(message = "Password is required")
    @Min(value = 8, message = "Password must have at least 8 characters")
    private String password;
    private String profilePicture;
    @NotEmpty(message = "Email is required")
    private String email;
    @NotEmpty(message = "Role is required")
    private List<Role> roles;
}
