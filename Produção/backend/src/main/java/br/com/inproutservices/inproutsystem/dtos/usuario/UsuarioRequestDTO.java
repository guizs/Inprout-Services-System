package br.com.inproutservices.inproutsystem.dtos.usuario;

import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import java.util.List;

public record UsuarioRequestDTO(
        String nome,
        String email,
        String senha,
        Role role,
        List<Long> segmentoIds // Recebe uma lista de IDs
) {}