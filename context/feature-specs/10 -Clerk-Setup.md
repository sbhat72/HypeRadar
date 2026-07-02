Read `AGENTS.md` before starting.

# Feature: Clerk Backend Integration

## What To Build

Replace the custom JWT authentication layer with Clerk's JWT verification. The Spring Boot backend currently uses a custom `JwtUtil`, `JwtAuthenticationFilter`, and a `UserService` that stores users in PostgreSQL. None of that is needed anymore — Clerk owns the user database and issues JWTs. The backend only needs to verify those JWTs are valid using Clerk's public JWKS endpoint.

---

## What To Remove

Delete or archive the following files — they are no longer needed:

- `config/JwtUtil.java`
- `config/JwtAuthenticationFilter.java`
- `model/User.java`
- `repository/UserRepository.java`
- `service/UserService.java`
- `controller/AuthController.java`
- `dto/AuthRequestDto.java`
- `dto/AuthResponseDto.java`

Do not remove `SecurityConfig.java` — it needs to be rewritten, not deleted.

---

## application.properties

Add the Clerk JWKS endpoint. Replace `{YOUR_CLERK_FRONTEND_API}` with the actual Clerk frontend API URL from the Clerk dashboard (format: `https://{app-slug}.clerk.accounts.dev`):

```properties
# Clerk
clerk.jwks-uri=${CLERK_JWKS_URI}
```

Add to `.env`:
```
CLERK_JWKS_URI=https://{your-app-slug}.clerk.accounts.dev/.well-known/jwks.json
```

The JWKS URI can be found in the Clerk dashboard under API Keys → Advanced → JWKS URL.

---

## Clerk JWT Filter

Create a new filter at `config/ClerkAuthenticationFilter.java` that replaces `JwtAuthenticationFilter`.

This filter:
1. Reads the `Authorization` header
2. If missing or not starting with `Bearer ` — passes the request through (public routes are handled by `SecurityConfig`)
3. Extracts the token
4. Validates it against Clerk's JWKS endpoint using Spring Security's `JwtDecoder`
5. If valid — extracts the `sub` claim (this is the Clerk user ID, e.g. `user_2abc123`) and sets it as the authenticated principal in `SecurityContextHolder`
6. If invalid — clears the security context and passes through (Spring Security will reject the request at the filter chain level)

```java
package com.hyperadar.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;
import java.io.IOException;
import java.util.List;

@Component
public class ClerkAuthenticationFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtDecoder;

    public ClerkAuthenticationFilter(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            Jwt jwt = jwtDecoder.decode(token);
            String clerkUserId = jwt.getSubject(); // e.g. user_2abc123

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(clerkUserId, null, List.of());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
```

---

## Updated SecurityConfig

Rewrite `SecurityConfig.java` completely. Remove all references to the old custom auth components:

```java
package com.hyperadar.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${clerk.jwks-uri}")
    private String jwksUri;

    private final ClerkAuthenticationFilter clerkAuthenticationFilter;

    public SecurityConfig(ClerkAuthenticationFilter clerkAuthenticationFilter) {
        this.clerkAuthenticationFilter = clerkAuthenticationFilter;
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withJwkSetUri(jwksUri).build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/ws/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(clerkAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

Key changes from the original `SecurityConfig`:
- Removed `PasswordEncoder`, `AuthenticationProvider`, `AuthenticationManager` beans — not needed without custom auth
- Removed `/api/auth/**` from permitted routes — `AuthController` is deleted
- Added `JwtDecoder` bean pointed at Clerk's JWKS URI
- Replaced `JwtAuthenticationFilter` with `ClerkAuthenticationFilter`

---

## Required Maven Dependency

Add the Spring Security OAuth2 resource server dependency to `pom.xml` — this provides `JwtDecoder` and `NimbusJwtDecoder`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

---

## Alert Model Update

The `Alert` model already uses `clerkUserId` as a String field instead of a `User` FK — no changes needed there.

The `AlertRepository` already has `findByIsActiveTrue()` which is what the scheduler uses. The controller uses `findByClerkUserIdAndIsActiveTrue()` — verify this method exists on `AlertRepository`. Add it if missing:

```java
List<Alert> findByClerkUserIdAndIsActiveTrue(String clerkUserId);
Optional<Alert> findByClerkUserIdAndTickerAndIsActiveTrue(String clerkUserId, Ticker ticker);
```

---

## How Controllers Extract the Clerk User ID

All controllers that are user-scoped (`AlertController`, `WatchlistController`) already use:

```java
private String getClerkUserId() {
    return SecurityContextHolder.getContext()
        .getAuthentication()
        .getName();
}
```

This returns the `sub` claim from the Clerk JWT — the Clerk user ID string. This is set by `ClerkAuthenticationFilter` on every authenticated request. No changes needed to the controllers themselves.

---

## Frontend — Sending the Clerk Token

On the Next.js side, every API call to the Spring Boot backend must include the Clerk JWT in the `Authorization` header. Use Clerk's `useAuth()` hook to get the token:

```ts
import { useAuth } from '@clerk/nextjs'

const { getToken } = useAuth()
const token = await getToken()

const response = await fetch('http://localhost:8080/api/tickers/trending', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

For Server Components, use `auth()` from `@clerk/nextjs/server`:

```ts
import { auth } from '@clerk/nextjs/server'

const { getToken } = await auth()
const token = await getToken()
```

Create a shared API client utility at `src/lib/api.ts` that wraps `fetch` and automatically attaches the Clerk token to every request:

```ts
import { auth } from '@clerk/nextjs/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function apiFetch(path: string, options?: RequestInit) {
  const { getToken } = await auth()
  const token = await getToken()

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  })
}
```

Add to `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Check When Done

- [ ] `spring-boot-starter-oauth2-resource-server` added to `pom.xml`
- [ ] `CLERK_JWKS_URI` added to `.env` and `application.properties`
- [ ] `JwtUtil`, `JwtAuthenticationFilter`, `User`, `UserRepository`, `UserService`, `AuthController`, `AuthRequestDto`, `AuthResponseDto` removed
- [ ] `ClerkAuthenticationFilter` created and verifies Clerk JWTs via `JwtDecoder`
- [ ] `SecurityConfig` rewritten with `JwtDecoder` bean and `ClerkAuthenticationFilter`
- [ ] No remaining references to deleted classes anywhere in the codebase
- [ ] `AlertRepository` has `findByClerkUserIdAndIsActiveTrue` and `findByClerkUserIdAndTickerAndIsActiveTrue`
- [ ] `src/lib/api.ts` created with `apiFetch` helper that attaches Clerk token automatically
- [ ] `NEXT_PUBLIC_API_URL` added to `frontend/.env.local`
- [ ] Backend starts without errors after removing old auth classes
- [ ] A request to `GET /api/tickers/trending` without a token returns 401
- [ ] A request to `GET /api/tickers/trending` with a valid Clerk token returns 200