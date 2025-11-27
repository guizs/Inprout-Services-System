package br.com.inproutservices.inproutsystem.controllers.usuario;

import br.com.inproutservices.inproutsystem.dtos.login.LoginRequest;
import br.com.inproutservices.inproutsystem.dtos.usuario.UsuarioRequestDTO;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import br.com.inproutservices.inproutsystem.services.TokenService;
import br.com.inproutservices.inproutsystem.services.usuarios.PasswordService;
import br.com.inproutservices.inproutsystem.services.usuarios.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepo;
    private final PasswordService passwordService;
    private final UsuarioService usuarioService;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public UsuarioController(UsuarioRepository usuarioRepo, PasswordService passwordService, UsuarioService usuarioService, AuthenticationManager authenticationManager, TokenService tokenService) {
        this.usuarioRepo = usuarioRepo;
        this.passwordService = passwordService;
        this.usuarioService = usuarioService;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    // --- ENDPOINT DE LOGIN COM LÓGICA DE MIGRAÇÃO DE SENHA ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getSenha());

        try {
            // 1. Tenta autenticar com o método novo (padrão)
            Authentication auth = this.authenticationManager.authenticate(usernamePassword);
            Usuario usuario = (Usuario) auth.getPrincipal();
            return gerarRespostaDeSucesso(usuario);

        } catch (AuthenticationException e) {
            // 2. Se a autenticação padrão falhar, inicia o "Plano B"
            Optional<Usuario> usuarioOpt = usuarioRepo.findByEmail(loginRequest.getEmail());

            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                String senhaDoBanco = usuario.getSenha();
                String senhaDigitada = loginRequest.getSenha();

                // 3. Verifica a senha com o método ANTIGO
                BCryptPasswordEncoder encoderAntigo = new BCryptPasswordEncoder();
                if (encoderAntigo.matches(senhaDigitada, senhaDoBanco)) {

                    // 4. Se a senha bateu, a migração acontece aqui!
                    // Criptografa a senha digitada com o NOVO codificador e salva no banco
                    usuario.setSenha(passwordService.encode(senhaDigitada));
                    usuarioRepo.save(usuario);

                    // 5. Gera a resposta de sucesso, pois o usuário é válido
                    return gerarRespostaDeSucesso(usuario);
                }
            }

            // 6. Se mesmo o Plano B falhar, a senha está realmente incorreta.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário ou senha inválidos");
        }
    }

    @GetMapping("/gestores")
    public ResponseEntity<List<Usuario>> listarGestores() {
        List<Usuario> gestores = usuarioRepo.findAll().stream()
                .filter(u -> (u.getRole() == Role.MANAGER || u.getRole() == Role.COORDINATOR) && Boolean.TRUE.equals(u.getAtivo()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(gestores);
    }

    // Método auxiliar para não repetir código
    private ResponseEntity<Map<String, Object>> gerarRespostaDeSucesso(Usuario usuario) {
        String token = tokenService.generateToken(usuario);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("id", usuario.getId());
        response.put("usuario", usuario.getNome());
        response.put("email", usuario.getEmail());
        response.put("role", usuario.getRole());
        List<Long> segmentoIds = usuario.getSegmentos().stream().map(Segmento::getId).collect(Collectors.toList());
        response.put("segmentos", segmentoIds);
        return ResponseEntity.ok(response);
    }

    // O restante dos seus métodos continua igual...

    @PostMapping
    public Usuario criar(@RequestBody UsuarioRequestDTO usuarioDTO) {
        return usuarioService.criarUsuario(usuarioDTO);
    }

    @GetMapping
    public List<Usuario> listar() {
        return usuarioRepo.findAll().stream()
                .filter(usuario -> Boolean.TRUE.equals(usuario.getAtivo()))
                .toList();
    }

    // ... (demais endpoints: /senha, /desativar, /ativar, etc.)
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

    @PutMapping("/email")
    public ResponseEntity<String> alterarEmail(@RequestParam String emailAtual, @RequestParam String novoEmail) {
        Optional<Usuario> usuarioOpt = usuarioRepo.findByEmail(emailAtual);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

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