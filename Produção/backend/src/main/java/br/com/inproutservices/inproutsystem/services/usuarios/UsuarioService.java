package br.com.inproutservices.inproutsystem.services.usuarios;

import br.com.inproutservices.inproutsystem.dtos.usuario.UsuarioRequestDTO;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.repositories.index.SegmentoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SegmentoRepository segmentoRepository;
    private final PasswordService passwordService;

    public UsuarioService(UsuarioRepository usuarioRepository, SegmentoRepository segmentoRepository, PasswordService passwordService) {
        this.usuarioRepository = usuarioRepository;
        this.segmentoRepository = segmentoRepository;
        this.passwordService = passwordService;
    }

    @Transactional
    public Usuario criarUsuario(UsuarioRequestDTO dto) {
        Usuario novoUsuario = new Usuario();
        novoUsuario.setNome(dto.nome());
        novoUsuario.setEmail(dto.email());
        novoUsuario.setSenha(passwordService.encode(dto.senha()));
        novoUsuario.setRole(dto.role());

        if (dto.segmentoIds() != null && !dto.segmentoIds().isEmpty()) {
            List<Segmento> segmentos = segmentoRepository.findAllById(dto.segmentoIds());
            if (segmentos.size() != dto.segmentoIds().size()) {
                throw new EntityNotFoundException("Um ou mais Segmentos não foram encontrados.");
            }
            novoUsuario.setSegmentos(new HashSet<>(segmentos));
        }

        return usuarioRepository.save(novoUsuario);
    }
}