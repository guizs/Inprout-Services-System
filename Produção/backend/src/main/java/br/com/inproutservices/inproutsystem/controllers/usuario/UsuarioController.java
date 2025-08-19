package br.com.inproutservices.inproutsystem.controllers.usuario;

import br.com.inproutservices.inproutsystem.dtos.login.LoginRequest;
import br.com.inproutservices.inproutsystem.dtos.usuario.UsuarioRequestDTO;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import br.com.inproutservices.inproutsystem.services.usuarios.PasswordService;
import br.com.inproutservices.inproutsystem.services.usuarios.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepo;
    private final PasswordService passwordService;
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioRepository usuarioRepo, PasswordService passwordService, UsuarioService usuarioService) {
        this.usuarioRepo = usuarioRepo;
        this.passwordService = passwordService;
        this.usuarioService = usuarioService;
    }

    // Criar usuário
    @PostMapping
    public Usuario criar(@RequestBody UsuarioRequestDTO usuarioDTO) {
        return usuarioService.criarUsuario(usuarioDTO);
    }

    // Listar usuários ativos
    @GetMapping
    public List<Usuario> listar() {
        return usuarioRepo.findAll().stream()
                .filter(usuario -> Boolean.TRUE.equals(usuario.getAtivo()))
                .toList();
    }

    // Alterar senha via email
    @PutMapping("/senha")
    public String alterarSenha(@RequestParam String email, @RequestParam String novaSenha) {
        Optional<Usuario> usuarioOpt = usuarioRepo.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            usuario.setSenha(passwordService.encode(novaSenha));
            usuarioRepo.save(usuario);
            return "Senha atualizada com sucesso.";
        } else {
            return "Usuário não encontrado.";
        }
    }

    // Desativar usuário (soft delete) via email
    @DeleteMapping
    public String desativarUsuario(@RequestParam String email) {
        Optional<Usuario> usuarioOpt = usuarioRepo.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (!usuario.getAtivo()) {
                return "Usuário já está desativado.";
            }
            usuario.setAtivo(false);
            usuarioRepo.save(usuario);
            return "Usuário desativado com sucesso.";
        } else {
            return "Usuário não encontrado.";
        }
    }

    // Ativar usuário via email
    @PutMapping("/ativar")
    public String ativarUsuario(@RequestParam String email) {
        Optional<Usuario> usuarioOpt = usuarioRepo.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (usuario.getAtivo()) {
                return "Usuário já está ativo.";
            }
            usuario.setAtivo(true);
            usuarioRepo.save(usuario);
            return "Usuário ativado com sucesso.";
        } else {
            return "Usuário não encontrado.";
        }
    }

    @Autowired
    private UsuarioRepository usuarioRepository;

    @CrossOrigin(origins = "*")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(loginRequest.getEmail());

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            if (encoder.matches(loginRequest.getSenha(), usuario.getSenha())) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", usuario.getId());
                response.put("token", UUID.randomUUID().toString());
                response.put("usuario", usuario.getNome());
                response.put("email", usuario.getEmail());
                response.put("role", usuario.getRole());
                List<Long> segmentoIds = usuario.getSegmentos().stream().map(Segmento::getId).collect(Collectors.toList());
                response.put("segmentos", segmentoIds);
                return ResponseEntity.ok(response);

            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário ou senha inválidos");
    }

    @PutMapping("/email")
    public ResponseEntity<String> alterarEmail(@RequestParam String emailAtual, @RequestParam String novoEmail) {
        Optional<Usuario> usuarioOpt = usuarioRepo.findByEmail(emailAtual);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            // Verifica se o novo email já está em uso
            Optional<Usuario> emailExistente = usuarioRepo.findByEmail(novoEmail);
            if (emailExistente.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Novo e-mail já está em uso.");
            }

            usuario.setEmail(novoEmail);
            usuarioRepo.save(usuario);
            return ResponseEntity.ok("E-mail atualizado com sucesso.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado.");
        }
    }

    @GetMapping("/{email}")
    public ResponseEntity<?> buscarUsuarioPorEmail(@PathVariable String email) {
        Optional<Usuario> usuarioOpt = usuarioRepo.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("nome", usuario.getNome());
            response.put("email", usuario.getEmail());
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado.");
    }


}