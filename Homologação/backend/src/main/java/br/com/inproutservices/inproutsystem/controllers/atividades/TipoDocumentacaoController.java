package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.TipoDocumentacaoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.PrecoDocumentacao;
import br.com.inproutservices.inproutsystem.entities.atividades.TipoDocumentacao;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.repositories.atividades.PrecoDocumentacaoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.TipoDocumentacaoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tipos-documentacao")
@CrossOrigin(origins = "*")
public class TipoDocumentacaoController {

    @Autowired
    private TipoDocumentacaoRepository repository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PrecoDocumentacaoRepository precoRepository;

    @GetMapping
    public List<TipoDocumentacaoDTO> listar() {
        List<TipoDocumentacao> tipos = repository.findAll();

        return tipos.stream().map(tipo -> {
            List<TipoDocumentacaoDTO.ConfigPrecoDTO> configs = new ArrayList<>();
            // Itera apenas sobre os documentistas vinculados para montar o DTO
            if (tipo.getDocumentistas() != null) {
                for (Usuario doc : tipo.getDocumentistas()) {
                    Optional<PrecoDocumentacao> preco = precoRepository.findByDocumentistaIdAndTipoDocumentacaoId(doc.getId(), tipo.getId());
                    configs.add(new TipoDocumentacaoDTO.ConfigPrecoDTO(doc.getId(), preco.map(PrecoDocumentacao::getValor).orElse(null)));
                }
            }
            return new TipoDocumentacaoDTO(tipo.getId(), tipo.getNome(), tipo.getValor(), configs);
        }).collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> criarOuAtualizar(@RequestBody TipoDocumentacaoDTO dto) {
        try {
            TipoDocumentacao tipo;
            if (dto.id() != null) {
                tipo = repository.findById(dto.id()).orElse(new TipoDocumentacao());
            } else {
                tipo = new TipoDocumentacao();
            }

            tipo.setNome(dto.nome());
            tipo.setValor(dto.valorPadrao());

            // Atualiza vinculos (Checkboxes)
            if (dto.configuracoes() != null) {
                Set<Long> idsRecebidos = dto.configuracoes().stream()
                        .map(TipoDocumentacaoDTO.ConfigPrecoDTO::documentistaId)
                        .collect(Collectors.toSet());

                if (!idsRecebidos.isEmpty()) {
                    List<Usuario> novosDocumentistas = usuarioRepository.findAllById(idsRecebidos);
                    tipo.setDocumentistas(new HashSet<>(novosDocumentistas));
                } else {
                    tipo.getDocumentistas().clear();
                }
            }

            TipoDocumentacao salvo = repository.save(tipo);

            // Atualiza Preços Específicos
            if (dto.configuracoes() != null) {
                for (TipoDocumentacaoDTO.ConfigPrecoDTO config : dto.configuracoes()) {
                    Optional<PrecoDocumentacao> precoExistente = precoRepository.findByDocumentistaIdAndTipoDocumentacaoId(config.documentistaId(), salvo.getId());

                    if (config.valor() != null) {
                        PrecoDocumentacao preco = precoExistente.orElse(new PrecoDocumentacao());
                        preco.setTipoDocumentacao(salvo);
                        // Usa findById para evitar LazyInitializationException se o ID for inválido
                        Usuario doc = usuarioRepository.findById(config.documentistaId()).orElseThrow(() -> new RuntimeException("Documentista não encontrado"));
                        preco.setDocumentista(doc);
                        preco.setValor(config.valor());
                        precoRepository.save(preco);
                    } else {
                        // Se valor veio nulo, deleta a exceção de preço se existir
                        precoExistente.ifPresent(precoRepository::delete);
                    }
                }
            }

            return ResponseEntity.ok(salvo);

        } catch (Exception e) {
            e.printStackTrace(); // Isso vai mostrar o erro real no console do backend
            return ResponseEntity.internalServerError().body("Erro ao salvar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (repository.existsById(id)) {
            // Limpa preços antes de deletar o tipo para evitar erro de Foreign Key
            // Nota: O ideal seria Cascade no banco, mas via código garante.
            // Aqui assumimos que o banco fará o cascade ou lançará erro se houver uso.
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}