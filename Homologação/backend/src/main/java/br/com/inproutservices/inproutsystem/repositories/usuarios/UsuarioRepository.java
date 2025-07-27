package br.com.inproutservices.inproutsystem.repositories.usuarios;

import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
}