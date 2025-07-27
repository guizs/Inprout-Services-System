package br.com.inproutservices.inproutsystem.controllers.index;

import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.services.index.ContratoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contrato")
@CrossOrigin(origins = "*")
public class ContratoController {

    private final ContratoService contratoService;
    public ContratoController(ContratoService contratoService) {
        this.contratoService = contratoService;
    }

    /**
     * Endpoint para listar todos os Contratos ATIVOS.
     */
    @GetMapping
    public ResponseEntity<List<Contrato>> listarContratosAtivos() {
        List<Contrato> contratos = contratoService.listarContratosAtivos();
        return ResponseEntity.ok(contratos);
    }

    /**
     * Endpoint para buscar um Contrato específico pelo seu ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Contrato> buscarContratoPorId(@PathVariable Long id) {
        Contrato contrato = contratoService.buscarPorId(id);
        return ResponseEntity.ok(contrato);
    }

    /**
     * Endpoint para criar um novo Contrato.
     */
    @PostMapping
    public ResponseEntity<Contrato> criarContrato(@RequestBody Contrato contrato) {
        Contrato novoContrato = contratoService.criarContrato(contrato);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(novoContrato.getId()).toUri();

        return ResponseEntity.created(location).body(novoContrato);
    }

    /**
     * Endpoint para desativar um Contrato (soft delete).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativarContrato(@PathVariable Long id) {
        contratoService.desativarContrato(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint para atualizações parciais (ex: reativar/desativar).
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Contrato> atualizarParcialmenteContrato(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Contrato contratoAtualizado = contratoService.atualizarParcialmente(id, updates);
        return ResponseEntity.ok(contratoAtualizado);
    }
}