package br.com.inproutservices.inproutsystem.controllers.faturamento;

import br.com.inproutservices.inproutsystem.dtos.faturamento.*;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusFaturamento;
import br.com.inproutservices.inproutsystem.services.faturamento.SolicitacaoFaturamentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/faturamento")
@CrossOrigin(origins = "*")
public class SolicitacaoFaturamentoController {

    private final SolicitacaoFaturamentoService faturamentoService;

    public SolicitacaoFaturamentoController(SolicitacaoFaturamentoService faturamentoService) {
        this.faturamentoService = faturamentoService;
    }

    /**
     * Endpoint para a fila de trabalho do ASSISTANT.
     * Lista todas as solicitações que não estão "FATURADO".
     */
    @GetMapping("/fila-assistant")
    public ResponseEntity<List<SolicitacaoFaturamentoDTO>> getFilaAssistant() {
        List<SolicitacaoFaturamentoDTO> fila = faturamentoService.getFilaAssistant();
        return ResponseEntity.ok(fila);
    }

    /**
     * Endpoint para a ação do COORDINATOR de "Solicitar ID".
     * Cria a solicitação no fluxo REGULAR.
     */
    @PostMapping("/solicitar-id")
    public ResponseEntity<SolicitacaoFaturamentoDTO> solicitarIdFaturamento(@RequestBody SolicitacaoRequest payload) {
        SolicitacaoFaturamento novaSolicitacao = faturamentoService.solicitarIdFaturamento(payload.osLpuDetalheId(), payload.coordinatorId());
        return ResponseEntity.ok(new SolicitacaoFaturamentoDTO(novaSolicitacao));
    }

    @PostMapping("/solicitar-adiantamento")
    public ResponseEntity<SolicitacaoFaturamentoDTO> solicitarAdiantamento(@RequestBody SolicitacaoRequest payload) {
        // Reutilizamos o mesmo DTO de request, pois ele só precisa do osLpuDetalheId e coordinatorId
        SolicitacaoFaturamento novaSolicitacao = faturamentoService.solicitarAdiantamento(payload.osLpuDetalheId(), payload.coordinatorId());
        return ResponseEntity.ok(new SolicitacaoFaturamentoDTO(novaSolicitacao));
    }

    // DTO aninhado simples para receber o payload da solicitação
    record SolicitacaoRequest(Long osLpuDetalheId, Long coordinatorId) {}

    @GetMapping("/fila-coordenador")
    public ResponseEntity<List<FilaCoordenadorDTO>> getFilaCoordenador() {
        List<FilaCoordenadorDTO> fila = faturamentoService.getFilaCoordinator();
        return ResponseEntity.ok(fila);
    }

    @PostMapping("/{id}/id-recebido")
    public ResponseEntity<SolicitacaoFaturamentoDTO> marcarIdRecebido(
            @PathVariable Long id,
            @RequestBody AcaoFaturamentoDTO payload) {

        SolicitacaoFaturamento s = faturamentoService.alterarStatus(
                id, payload.assistantId(), StatusFaturamento.ID_RECEBIDO, null
        );
        return ResponseEntity.ok(new SolicitacaoFaturamentoDTO(s));
    }

    @PostMapping("/{id}/id-recusado")
    public ResponseEntity<SolicitacaoFaturamentoDTO> marcarIdRecusado(
            @PathVariable Long id,
            @RequestBody AcaoFaturamentoDTO payload) {

        SolicitacaoFaturamento s = faturamentoService.alterarStatus(
                id, payload.assistantId(), StatusFaturamento.ID_RECUSADO, payload.motivo()
        );
        return ResponseEntity.ok(new SolicitacaoFaturamentoDTO(s));
    }

    @PostMapping("/{id}/faturado")
    public ResponseEntity<SolicitacaoFaturamentoDTO> marcarFaturado(
            @PathVariable Long id,
            @RequestBody AcaoFaturamentoDTO payload) {

        SolicitacaoFaturamento s = faturamentoService.alterarStatus(
                id, payload.assistantId(), StatusFaturamento.FATURADO, null
        );
        return ResponseEntity.ok(new SolicitacaoFaturamentoDTO(s));
    }

    @GetMapping("/fila-adiantamento-coordenador")
    public ResponseEntity<List<FilaAdiantamentoDTO>> getFilaAdiantamentoCoordenador() {
        List<FilaAdiantamentoDTO> fila = faturamentoService.getFilaAdiantamentoCoordinator();
        return ResponseEntity.ok(fila);
    }

    @GetMapping("/visao-adiantamentos")
    public ResponseEntity<List<VisaoAdiantamentoDTO>> getVisaoAdiantamentos(@RequestHeader("X-User-ID") Long usuarioId) {
        List<VisaoAdiantamentoDTO> lista = faturamentoService.getVisaoAdiantamentos(usuarioId);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/historico-faturado")
    public ResponseEntity<List<SolicitacaoFaturamentoDTO>> getHistoricoFaturado(@RequestHeader("X-User-ID") Long usuarioId) {
        List<SolicitacaoFaturamentoDTO> lista = faturamentoService.getHistoricoFaturado(usuarioId);
        return ResponseEntity.ok(lista);
    }
}