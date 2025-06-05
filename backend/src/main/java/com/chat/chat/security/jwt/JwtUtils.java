package com.chat.chat.security.jwt;

import com.chat.chat.security.service.UserDetailsImpl;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);
    @Value("${spring.jwt.secret}")
    private String jwtSecret;
    @Value("${spring.jwt.expire}")
    private int jwtExpirationMs;
    public String generateJwtToken(Authentication authentication){
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return Jwts.builder()
                .setId(String.valueOf(userDetails.getId()))
                .setSubject(userDetails.getEmail())
                .setExpiration(new Date(new Date().getTime() + jwtExpirationMs))
                .signWith(jwtKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    private Key jwtKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
    public String getEmailFromJwt(String token) {
        return Jwts.parser().setSigningKey(jwtKey()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }
    public String getJwtFromHeader(HttpServletRequest request) {
        String ContentType = request.getContentType();
        System.out.println(ContentType);
        String header = request.getHeader("Authorization");
        if (header != null)
        {
            System.out.println(header);
            return header.split(" ")[1].trim();
        }
        return null;
    }
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }

}