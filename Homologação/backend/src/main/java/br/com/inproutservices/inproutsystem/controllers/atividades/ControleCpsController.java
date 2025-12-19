package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ControleCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.DashboardCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusPagamento;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsLpuDetalheRepository;
import br.com.inproutservices.inproutsystem.services.atividades.ControleCpsService;
import br.com.inproutservices.inproutsystem.dtos.index.PrestadorSimpleDTO;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/controle-cps")
@CrossOrigin(origins = "*")
public class ControleCpsController {

    private final ControleCpsService controleCpsService;
    private final OsLpuDetalheRepository osLpuDetalheRepository;
    private final LancamentoRepository lancamentoRepository;

    public ControleCpsController(ControleCpsService controleCpsService,
                                 OsLpuDetalheRepository osLpuDetalheRepository,
                                 LancamentoRepository lancamentoRepository) {
        this.controleCpsService = controleCpsService;
        this.osLpuDetalheRepository = osLpuDetalheRepository;
        this.lancamentoRepository = lancamentoRepository;
    }

    /**
     * Retorna a fila de pendências de pagamento (EM_ABERTO, FECHADO, ALTERACAO_SOLICITADA).
     */
    @GetMapping
    public ResponseEntity<List<LancamentoResponseDTO>> getFilaControleCps(@RequestHeader("X-User-ID") Long usuarioId) {
        List<Lancamento> fila = controleCpsService.getFilaControleCps(usuarioId);
        return ResponseEntity.ok(enriquecerComTotais(fila));
    }

    /**
     * Ação do Coordenador: Fecha um lançamento para pagamento.
     */
    @PostMapping("/fechar")
    public ResponseEntity<LancamentoResponseDTO> fecharParaPagamento(@Valid @RequestBody ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Lancamento lancamento = controleCpsService.fecharParaPagamento(dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    /**
     * Ação do Coordenador: Recusa um pagamento.
     */
    @PostMapping("/recusar")
    public ResponseEntity<LancamentoResponseDTO> recusarPagamento(@Valid @RequestBody ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Lancamento lancamento = controleCpsService.recusarPagamento(dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    /**
     * Ação do Coordenador: Solicita alteração em um item já FECHADO.
     */
    @PostMapping("/solicitar-alteracao")
    public ResponseEntity<LancamentoResponseDTO> solicitarAlteracao(@Valid @RequestBody ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Lancamento lancamento = controleCpsService.solicitarAlteracao(dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    /**
     * Ação do Controller: Marca um ou mais lançamentos como PAGOS.
     */
    @PostMapping("/pagar-lote")
    public ResponseEntity<List<LancamentoResponseDTO>> marcarComoPago(@Valid @RequestBody ControleCpsDTO.AcaoControllerDTO dto) {
        List<Lancamento> lancamentos = controleCpsService.marcarComoPago(dto);
        List<LancamentoResponseDTO> dtos = lancamentos.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/recusar-controller")
    public ResponseEntity<LancamentoResponseDTO> recusarPeloController(@Valid @RequestBody ControleCpsDTO.AcaoRecusaControllerDTO dto) {
        Lancamento lancamento = controleCpsService.recusarPeloController(dto);
        // Retorna simples (sem totais calculados) pois é uma resposta de ação
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    private List<LancamentoResponseDTO> enriquecerComTotais(List<Lancamento> lancamentos) {
        if (lancamentos == null || lancamentos.isEmpty()) return List.of();

        // 1. Coleta IDs de OS de forma segura (ignora se OS for nula)
        Set<Long> osIds = lancamentos.stream()
                .filter(l -> l.getOs() != null)
                .map(l -> l.getOs().getId())
                .collect(Collectors.toSet());

        if (osIds.isEmpty()) return List.of();

        // 2. Busca dados complementares
        List<OsLpuDetalhe> detalhes = osLpuDetalheRepository.findAllByOsIdIn(new ArrayList<>(osIds));
        List<Lancamento> todosLancamentosDaOs = lancamentoRepository.findByOsIdIn(new ArrayList<>(osIds));

        // 3. Mapas de Totais com filtragem de nulos (groupingBy não aceita chave null)
        Map<Long, BigDecimal> totalOsMap = detalhes.stream()
                .filter(d -> d.getOs() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getOs().getId(),
                        Collectors.mapping(d -> d.getValorTotal() != null ? d.getValorTotal() : BigDecimal.ZERO,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        List<SituacaoAprovacao> statusAprovado = List.of(SituacaoAprovacao.APROVADO, SituacaoAprovacao.APROVADO_CPS_LEGADO);

        Map<Long, BigDecimal> totalCpsMap = todosLancamentosDaOs.stream()
                .filter(l -> l.getOs() != null && statusAprovado.contains(l.getSituacaoAprovacao()))
                .collect(Collectors.groupingBy(
                        l -> l.getOs().getId(),
                        Collectors.mapping(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        Map<Long, BigDecimal> totalPagoMap = todosLancamentosDaOs.stream()
                .filter(l -> l.getOs() != null && l.getStatusPagamento() == StatusPagamento.PAGO)
                .collect(Collectors.groupingBy(
                        l -> l.getOs().getId(),
                        Collectors.mapping(l -> l.getValorPagamento() != null ? l.getValorPagamento() : (l.getValor() != null ? l.getValor() : BigDecimal.ZERO),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        // 4. Mapeamento final para DTO com verificações de segurança
        return lancamentos.stream().map(l -> {
            Long osId = (l.getOs() != null) ? l.getOs().getId() : null;
            BigDecimal totalOs = (osId != null) ? totalOsMap.getOrDefault(osId, BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal valorCps = (osId != null) ? totalCpsMap.getOrDefault(osId, BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal totalPago = (osId != null) ? totalPagoMap.getOrDefault(osId, BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal valorPendente = BigDecimal.ZERO; // Lógica a ser implementada se necessário

            return new LancamentoResponseDTO(
                    l.getId(),
                    (l.getOs() != null) ? new LancamentoResponseDTO.OsSimpleDTO(l.getOs()) : null,
                    (l.getOsLpuDetalhe() != null) ? new LancamentoResponseDTO.OsLpuDetalheSimpleDTO(l.getOsLpuDetalhe()) : null,
                    (l.getPrestador() != null) ? new br.com.inproutservices.inproutsystem.dtos.index.PrestadorSimpleDTO(l.getPrestador()) : null,
                    (l.getEtapaDetalhada() != null) ? new LancamentoResponseDTO.EtapaInfoDTO(l.getEtapaDetalhada()) : null,
                    (l.getManager() != null) ? new LancamentoResponseDTO.ManagerSimpleDTO(l.getManager()) : null,
                    l.getValor(),
                    l.getSituacaoAprovacao(),
                    l.getDataAtividade(),
                    l.getDetalheDiario(),
                    l.getDataCriacao(),
                    l.getDataPrazo(),
                    l.getDataPrazoProposta(),
                    (l.getComentarios() != null) ? l.getComentarios().stream().map(LancamentoResponseDTO.ComentarioDTO::new).collect(Collectors.toList()) : List.of(),
                    l.getEquipe(), l.getVistoria(), l.getPlanoVistoria(), l.getDesmobilizacao(),
                    l.getPlanoDesmobilizacao(), l.getInstalacao(), l.getPlanoInstalacao(),
                    l.getAtivacao(), l.getPlanoAtivacao(), l.getDocumentacao(), l.getPlanoDocumentacao(),
                    l.getStatus(), l.getSituacao(),
                    totalOs,
                    valorCps,
                    valorPendente,
                    totalPago,
                    l.getValorPagamento(),
                    l.getStatusPagamento(),
                    l.getControllerPagador() != null ? new LancamentoResponseDTO.AutorSimpleDTO(l.getControllerPagador()) : null,
                    l.getDataPagamento(),
                    l.getDataCompetencia(),
                    l.getValorAdiantamento(),
                    l.getValorSolicitadoAdiantamento(),
                    l.getValorDocumentista(), // <--- CAMPO ADICIONADO AQUI

                    // Campos de Documentação
                    l.getTipoDocumentacao() != null ? l.getTipoDocumentacao().getId() : null,
                    l.getTipoDocumentacao() != null ? l.getTipoDocumentacao().getNome() : null,
                    l.getDocumentista() != null ? l.getDocumentista().getId() : null,
                    l.getDocumentista() != null ? l.getDocumentista().getNome() : null,
                    l.getStatusDocumentacao(),
                    l.getDataSolicitacaoDoc(),
                    l.getDataRecebimentoDoc(),
                    l.getDataPrazoDoc(),
                    l.getDataFinalizacaoDoc()
            );
        }).collect(Collectors.toList());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardCpsDTO> getDashboard(
            @RequestHeader("X-User-ID") Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) Long segmentoId,
            @RequestParam(required = false) Long gestorId,
            @RequestParam(required = false) Long prestadorId
    ) {
        DashboardCpsDTO dashboard = controleCpsService.getDashboard(usuarioId, inicio, fim, segmentoId, gestorId, prestadorId);
        return ResponseEntity.ok(dashboard);
    }

    @PostMapping("/{id}/solicitar-adiantamento")
    public ResponseEntity<LancamentoResponseDTO> solicitarAdiantamento(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        BigDecimal valor = new BigDecimal(payload.get("valor").toString());
        Long usuarioId = Long.valueOf(payload.get("usuarioId").toString());
        Lancamento l = controleCpsService.solicitarAdiantamento(id, valor, usuarioId);
        return ResponseEntity.ok(new LancamentoResponseDTO(l));
    }

    @PostMapping("/{id}/pagar-adiantamento")
    public ResponseEntity<LancamentoResponseDTO> pagarAdiantamento(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long controllerId = Long.valueOf(payload.get("usuarioId").toString());
        Lancamento l = controleCpsService.aprovarAdiantamento(id, controllerId);
        return ResponseEntity.ok(new LancamentoResponseDTO(l));
    }

    @PostMapping("/{id}/recusar-adiantamento")
    public ResponseEntity<LancamentoResponseDTO> recusarAdiantamento(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long controllerId = Long.valueOf(payload.get("usuarioId").toString());
        String motivo = (String) payload.get("motivo");
        Lancamento l = controleCpsService.recusarAdiantamento(id, controllerId, motivo);
        return ResponseEntity.ok(new LancamentoResponseDTO(l));
    }

    @GetMapping("/exportar")
    public ResponseEntity<ByteArrayResource> exportarRelatorioCps(
            @RequestHeader("X-User-ID") Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) Long segmentoId,
            @RequestParam(required = false) Long gestorId,
            @RequestParam(required = false) Long prestadorId
    ) {
        byte[] dadosExcel = controleCpsService.exportarRelatorioExcel(usuarioId, inicio, fim, segmentoId, gestorId, prestadorId);

        ByteArrayResource resource = new ByteArrayResource(dadosExcel);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio_cps.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(dadosExcel.length)
                .body(resource);
    }

    @GetMapping("/historico")
    public ResponseEntity<List<LancamentoResponseDTO>> getHistoricoControleCps(
            @RequestHeader("X-User-ID") Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) Long segmentoId,
            @RequestParam(required = false) Long gestorId,
            @RequestParam(required = false) Long prestadorId
    ) {
        List<Lancamento> historico = controleCpsService.getHistoricoControleCps(usuarioId, inicio, fim, segmentoId, gestorId, prestadorId);
        return ResponseEntity.ok(enriquecerComTotais(historico));
    }

    @PostMapping("/fechar-lote")
    public ResponseEntity<List<LancamentoResponseDTO>> fecharParaPagamentoLote(@Valid @RequestBody ControleCpsDTO.AcaoCoordenadorLoteDTO dto) {
        List<Lancamento> lancamentos = controleCpsService.fecharParaPagamentoLote(dto);
        return ResponseEntity.ok(enriquecerComTotais(lancamentos));
    }

    @PostMapping("/recusar-lote")
    public ResponseEntity<List<LancamentoResponseDTO>> recusarPagamentoLote(@Valid @RequestBody ControleCpsDTO.AcaoRecusaCoordenadorLoteDTO dto) {
        List<Lancamento> lancamentos = controleCpsService.recusarPagamentoLote(dto);
        return ResponseEntity.ok(enriquecerComTotais(lancamentos));
    }

    @PostMapping("/recusar-controller-lote")
    public ResponseEntity<List<LancamentoResponseDTO>> recusarPeloControllerLote(@Valid @RequestBody ControleCpsDTO.AcaoRecusaControllerLoteDTO dto) {
        List<Lancamento> lancamentos = controleCpsService.recusarPeloControllerLote(dto);
        return ResponseEntity.ok(enriquecerComTotais(lancamentos));
    }
}