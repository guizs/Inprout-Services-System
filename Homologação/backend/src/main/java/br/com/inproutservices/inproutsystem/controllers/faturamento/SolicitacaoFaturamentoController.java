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

    // --- NOVO ENDPOINT ---
    /**
     * Endpoint para os KPIs (indicadores) do dashboard.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardFaturamentoDTO> getDashboard(@RequestHeader("X-User-ID") Long usuarioId) {
        DashboardFaturamentoDTO dto = faturamentoService.getDashboardFaturamento(usuarioId);
        return ResponseEntity.ok(dto);
    }

    /**
     * Endpoint para a fila de trabalho do ASSISTANT. (REFATORADO)
     */
    @GetMapping("/fila-assistant")
    public ResponseEntity<List<SolicitacaoFaturamentoDTO>> getFilaAssistant(@RequestHeader("X-User-ID") Long usuarioId) {
        List<SolicitacaoFaturamentoDTO> fila = faturamentoService.getFilaAssistant(usuarioId);
        return ResponseEntity.ok(fila);
    }

    /**
     * Endpoint para a fila de trabalho do COORDINATOR. (REFATORADO)
     */
    @GetMapping("/fila-coordenador")
    public ResponseEntity<List<FilaCoordenadorDTO>> getFilaCoordenador(@RequestHeader("X-User-ID") Long usuarioId) {
        List<FilaCoordenadorDTO> fila = faturamentoService.getFilaCoordinator(usuarioId);
        return ResponseEntity.ok(fila);
    }

    /**
     * Endpoint para a fila de Adiantamento do COORDINATOR. (REFATORADO)
     */
    @GetMapping("/fila-adiantamento-coordenador")
    public ResponseEntity<List<FilaAdiantamentoDTO>> getFilaAdiantamentoCoordenador(@RequestHeader("X-User-ID") Long usuarioId) {
        List<FilaAdiantamentoDTO> fila = faturamentoService.getFilaAdiantamentoCoordinator(usuarioId);
        return ResponseEntity.ok(fila);
    }

    // --- Endpoints de Ação (POST) ---
    // (Não precisam de X-User-ID no header pois o ID já vem no payload)

    /**
     * Endpoint para a ação do COORDINATOR de "Solicitar ID".
     */
    @PostMapping("/solicitar-id")
    public ResponseEntity<SolicitacaoFaturamentoDTO> solicitarIdFaturamento(@RequestBody SolicitacaoRequest payload) {
        SolicitacaoFaturamento novaSolicitacao = faturamentoService.solicitarIdFaturamento(payload.osLpuDetalheId(), payload.coordinatorId());
        return ResponseEntity.ok(new SolicitacaoFaturamentoDTO(novaSolicitacao));
    }

    @PostMapping("/solicitar-adiantamento")
    public ResponseEntity<SolicitacaoFaturamentoDTO> solicitarAdiantamento(@RequestBody SolicitacaoRequest payload) {
        SolicitacaoFaturamento novaSolicitacao = faturamentoService.solicitarAdiantamento(payload.osLpuDetalheId(), payload.coordinatorId());
        return ResponseEntity.ok(new SolicitacaoFaturamentoDTO(novaSolicitacao));
    }

    // DTO aninhado simples para receber o payload da solicitação
    record SolicitacaoRequest(Long osLpuDetalheId, Long coordinatorId) {}


    // --- Endpoints de Ação (Assistant) ---

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

    // --- Endpoints de Visualização (Histórico) ---
    // (Estes já estavam corretos)

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