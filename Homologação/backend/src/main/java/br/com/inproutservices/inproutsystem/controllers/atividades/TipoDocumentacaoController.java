package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.TipoDocumentacao;
import br.com.inproutservices.inproutsystem.repositories.atividades.TipoDocumentacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tipos-documentacao")
@CrossOrigin(origins = "*")
public class TipoDocumentacaoController {

    @Autowired
    private TipoDocumentacaoRepository repository;

    @GetMapping
    public List<TipoDocumentacao> listar() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoDocumentacao> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TipoDocumentacao criar(@RequestBody TipoDocumentacao tipo) {
        return repository.save(tipo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TipoDocumentacao> atualizar(@PathVariable Long id, @RequestBody TipoDocumentacao tipoAtualizado) {
        return repository.findById(id)
                .map(tipoExistente -> {
                    // 1. Atualiza o nome
                    tipoExistente.setNome(tipoAtualizado.getNome());

                    // 2. CORREÇÃO CRÍTICA: Atualiza a lista de documentistas!
                    // Sem essa linha, o Hibernate mantém os usuários antigos.
                    // Como ajustamos o 'equals/hashCode' do Usuario no passo anterior,
                    // o Set vai gerenciar a troca automaticamente.
                    tipoExistente.setDocumentistas(tipoAtualizado.getDocumentistas());

                    // 3. Salva
                    TipoDocumentacao salvo = repository.save(tipoExistente);
                    return ResponseEntity.ok(salvo);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}