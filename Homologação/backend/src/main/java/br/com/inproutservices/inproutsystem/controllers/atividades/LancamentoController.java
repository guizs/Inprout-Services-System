package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.*;
import br.com.inproutservices.inproutsystem.dtos.index.PrestadorSimpleDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.services.atividades.LancamentoService;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsLpuDetalheRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

// Records para requisições em lote
record AprovacaoLoteRequest(List<Long> lancamentoIds, Long aprovadorId) {}
record RejeicaoLoteCoordenadorRequest(List<Long> lancamentoIds, Long aprovadorId, String comentario) {}
record SolicitarPrazoLoteRequest(List<Long> lancamentoIds, Long coordenadorId, String comentario, LocalDate novaDataSugerida) {}
record RejeicaoLoteControllerRequest(List<Long> lancamentoIds, Long controllerId, String motivoRejeicao) {}
record AcaoPrazoLoteControllerRequest(List<Long> lancamentoIds, Long controllerId, String motivoRejeicao, LocalDate novaDataPrazo) {}

@RestController
@RequestMapping("/lancamentos")
@CrossOrigin(origins = "*")
public class LancamentoController {

    private final LancamentoService lancamentoService;
    private final OsLpuDetalheRepository osLpuDetalheRepository;
    private final LancamentoRepository lancamentoRepository;

    public LancamentoController(LancamentoService lancamentoService, OsLpuDetalheRepository osLpuDetalheRepository, LancamentoRepository lancamentoRepository) {
        this.lancamentoService = lancamentoService;
        this.osLpuDetalheRepository = osLpuDetalheRepository;
        this.lancamentoRepository = lancamentoRepository;
    }

    /**
     * Método centralizado e otimizado para enriquecer listas de lançamentos com valores calculados.
     */
    private List<LancamentoResponseDTO> enriquecerLancamentosComValores(List<Lancamento> lancamentos) {
        if (lancamentos == null || lancamentos.isEmpty()) {
            return new ArrayList<>();
        }

        List<LancamentoResponseDTO> dtos = lancamentos.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());

        Set<Long> osIds = dtos.stream()
                .filter(dto -> dto.os() != null && dto.os().id() != null)
                .map(dto -> dto.os().id())
                .collect(Collectors.toSet());

        if (osIds.isEmpty()) {
            return dtos;
        }

        Map<Long, List<OsLpuDetalhe>> detalhesPorOsId = osLpuDetalheRepository.findAllByOsIdIn(new ArrayList<>(osIds)).stream()
                .collect(Collectors.groupingBy(d -> d.getOs().getId()));

        List<SituacaoAprovacao> statusAprovado = List.of(SituacaoAprovacao.APROVADO);
        Map<Long, List<Lancamento>> lancamentosAprovadosPorOsId = lancamentoRepository.findBySituacaoAprovacaoInAndOsIdIn(statusAprovado, new ArrayList<>(osIds)).stream()
                .collect(Collectors.groupingBy(l -> l.getOsLpuDetalhe().getOs().getId()));

        List<SituacaoAprovacao> statusPendentes = List.of(SituacaoAprovacao.PENDENTE_COORDENADOR, SituacaoAprovacao.PENDENTE_CONTROLLER, SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO, SituacaoAprovacao.PRAZO_VENCIDO);
        Map<Long, List<Lancamento>> lancamentosPendentesPorOsId = lancamentoRepository.findPendentesBySituacaoAprovacaoInAndOsIdIn(statusPendentes, new ArrayList<>(osIds)).stream()
                .collect(Collectors.groupingBy(l -> l.getOsLpuDetalhe().getOs().getId()));


        Map<Long, BigDecimal> totalOsMap = detalhesPorOsId.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(OsLpuDetalhe::getValorTotal)
                                .filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                ));

        Map<Long, BigDecimal> valorCpsMap = lancamentosAprovadosPorOsId.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(Lancamento::getValor)
                                .filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                ));

        Map<Long, BigDecimal> valorPendenteMap = lancamentosPendentesPorOsId.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(Lancamento::getValor)
                                .filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                ));

        return dtos.stream().map(dto -> {
            Long osId = (dto.os() != null) ? dto.os().id() : null;
            BigDecimal totalOs = totalOsMap.getOrDefault(osId, BigDecimal.ZERO);
            BigDecimal valorCps = valorCpsMap.getOrDefault(osId, BigDecimal.ZERO);
            BigDecimal valorPendente = valorPendenteMap.getOrDefault(osId, BigDecimal.ZERO);

            return new LancamentoResponseDTO(
                    dto.id(), dto.os(), dto.detalhe(), dto.prestador(), dto.etapa(), dto.manager(),
                    dto.valor(), dto.situacaoAprovacao(), dto.dataAtividade(), dto.detalheDiario(),
                    dto.dataCriacao(), dto.dataPrazo(), dto.dataPrazoProposta(), dto.comentarios(), dto.equipe(), dto.vistoria(),
                    dto.planoVistoria(), dto.desmobilizacao(), dto.planoDesmobilizacao(), dto.instalacao(),
                    dto.planoInstalacao(), dto.ativacao(), dto.planoAtivacao(), dto.documentacao(),
                    dto.planoDocumentacao(), dto.status(), dto.situacao(),
                    totalOs,
                    valorCps,
                    valorPendente,
                    null, // totalPago
                    dto.valorPagamento(),
                    dto.statusPagamento(),
                    dto.controllerPagador(),
                    dto.dataPagamento(),
                    dto.dataCompetencia() // <--- CAMPO ADICIONADO (Correção do erro)
            );
        }).collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarLancamento(@PathVariable Long id) {
        lancamentoService.deletarLancamento(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pendencias-por-coordenador")
    public ResponseEntity<List<PendenciasPorCoordenadorDTO>> getPendenciasPorCoordenador() {
        List<PendenciasPorCoordenadorDTO> pendencias = lancamentoService.getPendenciasPorCoordenador();
        return ResponseEntity.ok(pendencias);
    }

    @PostMapping("/importar-legado-cps")
    public ResponseEntity<Map<String, Object>> importarLegadoCps(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Por favor, envie um arquivo."));
        }

        List<String> warnings = lancamentoService.importarLegadoCps(file);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Importação concluída!");
        response.put("warnings", warnings);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cps/programacao-diaria")
    public ResponseEntity<List<ProgramacaoDiariaDTO>> getProgramacaoDiaria(
            @RequestParam("dataInicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam("dataFim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        List<ProgramacaoDiariaDTO> relatorio = lancamentoService.getProgramacaoDiaria(dataInicio, dataFim);
        return ResponseEntity.ok(relatorio);
    }

    // ==========================================================
    // ENDPOINTS PRINCIPAIS (OTIMIZADOS)
    // ==========================================================

    @GetMapping
    public ResponseEntity<List<LancamentoResponseDTO>> getAllLancamentos() {
        List<Lancamento> lancamentos = lancamentoService.getAllLancamentos();
        List<LancamentoResponseDTO> dtosAtualizados = enriquecerLancamentosComValores(lancamentos);
        return ResponseEntity.ok(dtosAtualizados);
    }

    @GetMapping("/pendentes/{usuarioId}")
    public ResponseEntity<List<LancamentoResponseDTO>> getPendentesPorUsuario(@PathVariable Long usuarioId) {
        List<Lancamento> pendentes = lancamentoService.listarPendentesPorUsuario(usuarioId);
        List<LancamentoResponseDTO> dtosAtualizados = enriquecerLancamentosComValores(pendentes);
        return ResponseEntity.ok(dtosAtualizados);
    }

    @GetMapping("/historico/{usuarioId}")
    public ResponseEntity<List<LancamentoResponseDTO>> getHistoricoPorUsuario(@PathVariable Long usuarioId) {
        List<Lancamento> historico = lancamentoService.getHistoricoPorUsuario(usuarioId);
        List<LancamentoResponseDTO> dtosAtualizados = enriquecerLancamentosComValores(historico);
        return ResponseEntity.ok(dtosAtualizados);
    }

    // ==========================================================
    // DEMAIS ENDPOINTS (MANTIDOS)
    // ==========================================================

    @PostMapping("/lote/prazo/aprovar")
    public ResponseEntity<Void> aprovarPrazoLotePeloController(@RequestBody AprovacaoLoteRequest request) {
        lancamentoService.aprovarPrazoLotePeloController(request.lancamentoIds(), request.aprovadorId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lote/prazo/rejeitar")
    public ResponseEntity<Void> rejeitarPrazoLotePeloController(@RequestBody AcaoPrazoLoteControllerRequest request) {
        lancamentoService.rejeitarPrazoLotePeloController(request.lancamentoIds(), request.controllerId(), request.motivoRejeicao(), request.novaDataPrazo());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<LancamentoResponseDTO> criarLancamento(@RequestBody LancamentoRequestDTO dto) {
        Lancamento lancamentoSalvo = lancamentoService.criarLancamento(dto, dto.managerId());
        LancamentoResponseDTO responseDTO = new LancamentoResponseDTO(lancamentoSalvo);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(lancamentoSalvo.getId()).toUri();
        return ResponseEntity.created(location).body(responseDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LancamentoResponseDTO> getLancamentoById(@PathVariable Long id) {
        Lancamento lancamento = lancamentoService.getLancamentoById(id);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PostMapping("/{id}/coordenador-aprovar")
    public ResponseEntity<LancamentoResponseDTO> aprovarPeloCoordenador(@PathVariable Long id, @RequestBody AcaoCoordenadorDTO dto) {
        Lancamento lancamento = lancamentoService.aprovarPeloCoordenador(id, dto.coordenadorId());
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PostMapping("/{id}/coordenador-solicitar-prazo")
    public ResponseEntity<LancamentoResponseDTO> solicitarNovoPrazo(@PathVariable Long id, @RequestBody AcaoCoordenadorDTO dto) {
        Lancamento lancamento = lancamentoService.solicitarNovoPrazo(id, dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PostMapping("/{id}/controller-aprovar")
    public ResponseEntity<LancamentoResponseDTO> aprovarPeloController(@PathVariable Long id, @RequestBody AcaoControllerDTO dto) {
        Lancamento lancamento = lancamentoService.aprovarPeloController(id, dto.controllerId());
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @GetMapping("/debug/submeter")
    public ResponseEntity<String> submeterManualmente() {
        lancamentoService.submeterLancamentosDiarios();
        return ResponseEntity.ok("Tarefa de submissão diária executada manualmente com sucesso.");
    }

    @PostMapping("/{id}/prazo/aprovar")
    public ResponseEntity<LancamentoResponseDTO> aprovarExtensaoPrazo(@PathVariable Long id, @RequestBody AcaoControllerDTO dto) {
        Lancamento lancamento = lancamentoService.aprovarExtensaoPrazo(id, dto.controllerId());
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LancamentoResponseDTO> atualizarLancamento(@PathVariable Long id, @RequestBody LancamentoRequestDTO dto) {
        Lancamento lancamentoAtualizado = lancamentoService.atualizarLancamento(id, dto);
        LancamentoResponseDTO responseDTO = new LancamentoResponseDTO(lancamentoAtualizado);
        return ResponseEntity.ok(responseDTO);
    }

    @PostMapping("/{id}/prazo/rejeitar")
    public ResponseEntity<LancamentoResponseDTO> rejeitarExtensaoPrazo(@PathVariable Long id, @RequestBody AcaoControllerDTO dto) {
        Lancamento lancamento = lancamentoService.rejeitarExtensaoPrazo(id, dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PostMapping("/{id}/submeter")
    public ResponseEntity<LancamentoResponseDTO> submeterManualmente(@PathVariable Long id) {
        Long managerId = 1L;
        Lancamento lancamentoSubmetido = lancamentoService.submeterLancamentoManualmente(id, managerId);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamentoSubmetido));
    }

    @PostMapping("/{id}/coordenador-rejeitar")
    public ResponseEntity<LancamentoResponseDTO> rejeitarPeloCoordenador(@PathVariable Long id, @RequestBody AcaoCoordenadorDTO dto) {
        Lancamento lancamento = lancamentoService.rejeitarPeloCoordenador(id, dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PostMapping("/{id}/controller-rejeitar")
    public ResponseEntity<LancamentoResponseDTO> rejeitarPeloController(@PathVariable Long id, @RequestBody AcaoControllerDTO dto) {
        Lancamento lancamento = lancamentoService.rejeitarPeloController(id, dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PostMapping("/{id}/reenviar")
    public ResponseEntity<LancamentoResponseDTO> reenviarParaAprovacao(@PathVariable Long id) {
        Long managerId = 1L;
        Lancamento lancamento = lancamentoService.reenviarParaAprovacao(id, managerId);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    @PutMapping("/{id}/rascunho")
    public ResponseEntity<LancamentoResponseDTO> salvarRascunho(@PathVariable Long id, @RequestBody LancamentoRequestDTO dto) {
        Lancamento lancamentoSalvo = lancamentoService.salvarComoRascunho(id, dto);
        LancamentoResponseDTO responseDTO = new LancamentoResponseDTO(lancamentoSalvo);
        return ResponseEntity.ok(responseDTO);
    }

    @GetMapping("/cps/relatorio")
    public ResponseEntity<CpsResponseDTO> getRelatorioCps(
            @RequestParam("dataInicio") String dataInicioStr,
            @RequestParam("dataFim") String dataFimStr) {
        LocalDate dataInicio = LocalDate.parse(dataInicioStr, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate dataFim = LocalDate.parse(dataFimStr, DateTimeFormatter.ISO_LOCAL_DATE);
        CpsResponseDTO relatorio = lancamentoService.getRelatorioCps(dataInicio, dataFim);
        return ResponseEntity.ok(relatorio);
    }

    @PutMapping("/{id}/valor")
    public ResponseEntity<LancamentoResponseDTO> alterarValorPago(@PathVariable Long id, @RequestBody Map<String, BigDecimal> payload) {
        BigDecimal novoValor = payload.get("valor");
        if (novoValor == null) {
            return ResponseEntity.badRequest().build();
        }
        Lancamento lancamentoAtualizado = lancamentoService.alterarValorPago(id, novoValor);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamentoAtualizado));
    }

    @PostMapping("/lote")
    public ResponseEntity<List<LancamentoResponseDTO>> criarLancamentosEmLote(@RequestBody @Valid List<LancamentoRequestDTO> lancamentosDTO) {
        if (lancamentosDTO == null || lancamentosDTO.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<Lancamento> lancamentosSalvos = lancamentoService.criarLancamentosEmLote(lancamentosDTO);
        List<LancamentoResponseDTO> responseDTOs = lancamentosSalvos.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTOs);
    }

    @PostMapping("/lote/coordenador-aprovar")
    public ResponseEntity<Void> aprovarLotePeloCoordenador(@RequestBody AprovacaoLoteRequest request) {
        lancamentoService.aprovarLotePeloCoordenador(request.lancamentoIds(), request.aprovadorId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lote/controller-aprovar")
    public ResponseEntity<Void> aprovarLotePeloController(@RequestBody AprovacaoLoteRequest request) {
        lancamentoService.aprovarLotePeloController(request.lancamentoIds(), request.aprovadorId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lote/coordenador-rejeitar")
    public ResponseEntity<Void> rejeitarLotePeloCoordenador(@RequestBody RejeicaoLoteCoordenadorRequest request) {
        lancamentoService.rejeitarLotePeloCoordenador(request.lancamentoIds(), request.aprovadorId(), request.comentario());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lote/controller-rejeitar")
    public ResponseEntity<Void> rejeitarLotePeloController(@RequestBody RejeicaoLoteControllerRequest request) {
        lancamentoService.rejeitarLotePeloController(request.lancamentoIds(), request.controllerId(), request.motivoRejeicao());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lote/coordenador-solicitar-prazo")
    public ResponseEntity<Void> solicitarPrazoLote(@RequestBody SolicitarPrazoLoteRequest request) {
        lancamentoService.solicitarPrazoLote(request.lancamentoIds(), request.coordenadorId(), request.comentario(), request.novaDataSugerida());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/adiantamento")
    public ResponseEntity<LancamentoResponseDTO> registrarAdiantamento(@PathVariable Long id, @RequestBody Map<String, BigDecimal> payload) {
        BigDecimal valorAdiantamento = payload.get("valor");
        if (valorAdiantamento == null) {
            return ResponseEntity.badRequest().build();
        }
        Lancamento lancamentoAtualizado = lancamentoService.registrarAdiantamento(id, valorAdiantamento);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamentoAtualizado));
    }
}