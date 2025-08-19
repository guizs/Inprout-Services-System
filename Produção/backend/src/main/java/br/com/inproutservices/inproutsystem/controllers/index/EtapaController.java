package br.com.inproutservices.inproutsystem.controllers.index;

import br.com.inproutservices.inproutsystem.dtos.index.EtapaDTO;
import br.com.inproutservices.inproutsystem.dtos.index.EtapaDetalhadaUpdateDTO;
import br.com.inproutservices.inproutsystem.entities.index.Etapa;
import br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import br.com.inproutservices.inproutsystem.services.index.EtapaDetalhadaService;
import br.com.inproutservices.inproutsystem.services.index.EtapaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/index/etapas")
public class EtapaController { // Agora este é o único controller para /etapas

    // Injeção de ambos os serviços via construtor (melhor prática)
    private final EtapaService etapaService;
    private final EtapaDetalhadaService etapaDetalhadaService;

    public EtapaController(EtapaService etapaService, EtapaDetalhadaService etapaDetalhadaService) {
        this.etapaService = etapaService;
        this.etapaDetalhadaService = etapaDetalhadaService;
    }

    // --- MÉTODOS RELACIONADOS À ETAPA (PAI) ---

    @PostMapping
    public ResponseEntity<Etapa> criarEtapa(@RequestBody Etapa etapa) {
        Etapa etapaSalva = etapaService.criarEtapa(etapa);
        return ResponseEntity.ok(etapaSalva);
    }

    @GetMapping
    public ResponseEntity<List<EtapaDTO>> listarEtapas() {
        List<EtapaDTO> etapas = etapaService.listarEtapasComDetalhes();
        return ResponseEntity.ok(etapas);
    }

    // --- MÉTODOS RELACIONADOS À ETAPA DETALHADA (FILHA) ---

    @PostMapping("/{codigo}/detalhadas")
    public ResponseEntity<EtapaDetalhada> criarDetalhada(
            @PathVariable String codigo,
            @RequestBody EtapaDetalhadaRequest request) {

        EtapaDetalhada detalhe = new EtapaDetalhada();
        detalhe.setNome(request.getNome());
        detalhe.setStatus(request.getStatus());
        EtapaDetalhada salva = etapaDetalhadaService.salvarEtapaDetalhadaPorCodigo(detalhe, codigo);

        return ResponseEntity.ok(salva);
    }

    @PutMapping("/{codigo}/detalhadas/lote")
    public ResponseEntity<List<EtapaDetalhada>> atualizarDetalhadas(
            @PathVariable String codigo,
            @RequestBody List<EtapaDetalhadaUpdateDTO> etapasDetalhadasAtualizadas) {

        List<EtapaDetalhada> atualizadas = etapaDetalhadaService.atualizarLote(codigo, etapasDetalhadasAtualizadas);
        return ResponseEntity.ok(atualizadas);
    }

    public static class EtapaDetalhadaRequest {
        private String nome;
        private List<StatusEtapa> status;

        // Getters e Setters
        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public List<StatusEtapa> getStatus() { return status; }
        public void setStatus(List<StatusEtapa> status) { this.status = status; }
    }
}