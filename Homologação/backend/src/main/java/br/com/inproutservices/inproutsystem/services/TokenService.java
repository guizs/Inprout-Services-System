package br.com.inproutservices.inproutsystem.services;

import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.spec.SecretKeySpec; // Importe esta classe
import java.security.Key; // Importe esta classe
import java.util.Base64; // Importe esta classe
import java.util.Date;

@Service
public class TokenService {

    @Value("${jwt.secret}")
    private String secret;

    public String generateToken(Usuario usuario) {
        // --- INÍCIO DA CORREÇÃO ---
        // Algoritmo que vamos usar
        SignatureAlgorithm algorithm = SignatureAlgorithm.HS256;

        // Converte nossa chave secreta (que está em Base64) para bytes
        byte[] apiKeySecretBytes = Base64.getDecoder().decode(secret);

        // Cria a chave de assinatura com base nos bytes e no algoritmo
        Key signingKey = new SecretKeySpec(apiKeySecretBytes, algorithm.getJcaName());
        // --- FIM DA CORREÇÃO ---

        return Jwts.builder()
                .setSubject(usuario.getEmail())
                .claim("id", usuario.getId())
                .claim("role", usuario.getRole().name())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 24 horas
                .signWith(signingKey, algorithm) // <<< USA A NOVA CHAVE E ALGORITMO
                .compact();
    }

    public String getSubject(String token) {
        try {
            // --- INÍCIO DA CORREÇÃO (PARA VALIDAÇÃO) ---
            SignatureAlgorithm algorithm = SignatureAlgorithm.HS256;
            byte[] apiKeySecretBytes = Base64.getDecoder().decode(secret);
            Key signingKey = new SecretKeySpec(apiKeySecretBytes, algorithm.getJcaName());
            // --- FIM DA CORREÇÃO ---

            return Jwts.parserBuilder()
                    .setSigningKey(signingKey) // <<< USA A NOVA CHAVE
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            // Adiciona um log do erro para facilitar a depuração no futuro
            System.err.println("Erro ao validar token JWT: " + e.getMessage());
            return null;
        }
    }
}