package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ControleCpsDTO;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.math.BigDecimal;
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
     * Retorna o histórico de pagamentos (PAGO, RECUSADO).
     */
    @GetMapping("/historico")
    public ResponseEntity<List<LancamentoResponseDTO>> getHistoricoControleCps(@RequestHeader("X-User-ID") Long usuarioId) {
        List<Lancamento> historico = controleCpsService.getHistoricoControleCps(usuarioId);
        return ResponseEntity.ok(enriquecerComTotais(historico));
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
        if (lancamentos.isEmpty()) return List.of();

        Set<Long> osIds = lancamentos.stream()
                .map(l -> l.getOs().getId())
                .collect(Collectors.toSet());

        List<OsLpuDetalhe> detalhes = osLpuDetalheRepository.findAllByOsIdIn(new ArrayList<>(osIds));

        List<SituacaoAprovacao> statusAprovado = List.of(SituacaoAprovacao.APROVADO, SituacaoAprovacao.APROVADO_CPS_LEGADO);
        List<Lancamento> aprovados = lancamentoRepository.findBySituacaoAprovacaoInAndOsIdIn(statusAprovado, new ArrayList<>(osIds));

        Map<Long, BigDecimal> totalOsMap = detalhes.stream()
                .collect(Collectors.groupingBy(
                        d -> d.getOs().getId(),
                        Collectors.mapping(d -> d.getValorTotal() != null ? d.getValorTotal() : BigDecimal.ZERO,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        // Total CPS (Operacional Aprovado)
        Map<Long, BigDecimal> totalCpsMap = aprovados.stream()
                .collect(Collectors.groupingBy(
                        l -> l.getOs().getId(),
                        Collectors.mapping(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        // --- NOVO CÁLCULO: Total Já Pago ---
        Map<Long, BigDecimal> totalPagoMap = aprovados.stream()
                .filter(l -> l.getStatusPagamento() == StatusPagamento.PAGO)
                .collect(Collectors.groupingBy(
                        l -> l.getOs().getId(),
                        Collectors.mapping(l -> l.getValorPagamento() != null ? l.getValorPagamento() : BigDecimal.ZERO,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        return lancamentos.stream().map(l -> {
            Long osId = l.getOs().getId();
            BigDecimal totalOs = totalOsMap.getOrDefault(osId, BigDecimal.ZERO);
            BigDecimal valorCps = totalCpsMap.getOrDefault(osId, BigDecimal.ZERO);
            BigDecimal valorPendente = BigDecimal.ZERO;
            BigDecimal totalPago = totalPagoMap.getOrDefault(osId, BigDecimal.ZERO); // Pega o valor pago

            return new LancamentoResponseDTO(
                    l.getId(),
                    new LancamentoResponseDTO.OsSimpleDTO(l.getOs()),
                    new LancamentoResponseDTO.OsLpuDetalheSimpleDTO(l.getOsLpuDetalhe()),
                    (l.getPrestador() != null) ? new PrestadorSimpleDTO(l.getPrestador()) : null,
                    new LancamentoResponseDTO.EtapaInfoDTO(l.getEtapaDetalhada()),
                    new LancamentoResponseDTO.ManagerSimpleDTO(l.getManager()),
                    l.getValor(),
                    l.getSituacaoAprovacao(),
                    l.getDataAtividade(),
                    l.getDetalheDiario(),
                    l.getDataCriacao(),
                    l.getDataPrazo(),
                    l.getDataPrazoProposta(),
                    l.getComentarios().stream().map(LancamentoResponseDTO.ComentarioDTO::new).collect(Collectors.toList()),
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
                    l.getDataPagamento()
            );
        }).collect(Collectors.toList());
    }
}