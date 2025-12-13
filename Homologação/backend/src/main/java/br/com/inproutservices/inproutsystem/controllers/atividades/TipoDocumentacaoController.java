package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.TipoDocumentacao;
import br.com.inproutservices.inproutsystem.repositories.atividades.TipoDocumentacaoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tipos-documentacao")
@CrossOrigin(origins = "*")
public class TipoDocumentacaoController {

    private final TipoDocumentacaoRepository tipoDocumentacaoRepository;

    public TipoDocumentacaoController(TipoDocumentacaoRepository tipoDocumentacaoRepository) {
        this.tipoDocumentacaoRepository = tipoDocumentacaoRepository;
    }

    @GetMapping
    public ResponseEntity<List<TipoDocumentacao>> listarTodos() {
        return ResponseEntity.ok(tipoDocumentacaoRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<TipoDocumentacao> criar(@RequestBody TipoDocumentacao tipo) {
        return ResponseEntity.ok(tipoDocumentacaoRepository.save(tipo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TipoDocumentacao> atualizar(@PathVariable Long id, @RequestBody TipoDocumentacao tipoAtualizado) {
        return tipoDocumentacaoRepository.findById(id)
                .map(tipo -> {
                    tipo.setNome(tipoAtualizado.getNome());
                    return ResponseEntity.ok(tipoDocumentacaoRepository.save(tipo));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deletar(@PathVariable Long id) {
        return tipoDocumentacaoRepository.findById(id)
                .map(tipo -> {
                    tipoDocumentacaoRepository.delete(tipo);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}