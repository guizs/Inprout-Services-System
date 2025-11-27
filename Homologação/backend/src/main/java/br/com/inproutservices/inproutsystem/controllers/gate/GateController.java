package br.com.inproutservices.inproutsystem.controllers.gate;

import br.com.inproutservices.inproutsystem.dtos.gate.GateCreateDTO;
import br.com.inproutservices.inproutsystem.dtos.gate.GateReportResponseDTO;
import br.com.inproutservices.inproutsystem.entities.gate.Gate;
import br.com.inproutservices.inproutsystem.services.gate.GateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gates")
@CrossOrigin(origins = "*")
public class GateController {

    private final GateService gateService;

    public GateController(GateService gateService) {
        this.gateService = gateService;
    }

    // Endpoint para o ASSISTANT criar um novo GATE
    @PostMapping
    public ResponseEntity<Gate> createGate(@RequestBody GateCreateDTO dto) {
        Gate novoGate = gateService.createGate(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoGate);
    }

    // Endpoint para listar os GATEs (no select do relatório e na tela de Índices)
    @GetMapping
    public ResponseEntity<List<Gate>> listGates() {
        List<Gate> gates = gateService.listGates();
        return ResponseEntity.ok(gates);
    }

    // Endpoint para o ASSISTANT deletar um GATE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGate(@PathVariable Long id) {
        gateService.deleteGate(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoint principal do novo relatório
    @GetMapping("/{id}/report")
    public ResponseEntity<GateReportResponseDTO> getGateReport(@PathVariable Long id) {
        GateReportResponseDTO report = gateService.getGateReport(id);
        return ResponseEntity.ok(report);
    }
}