package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.*;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.services.atividades.LancamentoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/lancamentos")
@CrossOrigin(origins = "*")
public class LancamentoController {

    private final LancamentoService lancamentoService;

    public LancamentoController(LancamentoService lancamentoService) {
        this.lancamentoService = lancamentoService;
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
        // Converte para DTO antes de retornar
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
        // No futuro, o ID do manager virá do usuário autenticado
        Long managerId = 1L;
        Lancamento lancamentoSubmetido = lancamentoService.submeterLancamentoManualmente(id, managerId);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamentoSubmetido));
    }

    @GetMapping
    public ResponseEntity<List<LancamentoResponseDTO>> getAllLancamentos() {
        // 1. Busca a lista de entidades no serviço
        List<Lancamento> lancamentos = lancamentoService.getAllLancamentos();

        // 2. Converte a lista de entidades para uma lista de DTOs
        List<LancamentoResponseDTO> responseList = lancamentos.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/{id}/coordenador-rejeitar")
    public ResponseEntity<LancamentoResponseDTO> rejeitarPeloCoordenador(@PathVariable Long id, @RequestBody AcaoCoordenadorDTO dto) {
        Lancamento lancamento = lancamentoService.rejeitarPeloCoordenador(id, dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    // Endpoint para Controller Rejeitar (já existe, mas agora usará a nova lógica)
    @PostMapping("/{id}/controller-rejeitar")
    public ResponseEntity<LancamentoResponseDTO> rejeitarPeloController(@PathVariable Long id, @RequestBody AcaoControllerDTO dto) {
        Lancamento lancamento = lancamentoService.rejeitarPeloController(id, dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    // Endpoint para Gestor Reenviar
    @PostMapping("/{id}/reenviar")
    public ResponseEntity<LancamentoResponseDTO> reenviarParaAprovacao(@PathVariable Long id) {
        // Id do manager pode ser pego do token de autenticação no futuro
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

    @GetMapping("/pendentes/{usuarioId}")
    public ResponseEntity<List<LancamentoResponseDTO>> getPendentesPorUsuario(@PathVariable Long usuarioId) {
        List<Lancamento> pendentes = lancamentoService.listarPendentesPorUsuario(usuarioId);
        List<LancamentoResponseDTO> responseList = pendentes.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/historico/{usuarioId}")
    public ResponseEntity<List<LancamentoResponseDTO>> getHistoricoPorUsuario(@PathVariable Long usuarioId) {
        List<Lancamento> historico = lancamentoService.getHistoricoPorUsuario(usuarioId);
        List<LancamentoResponseDTO> responseList = historico.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/cps/relatorio")
    public ResponseEntity<CpsResponseDTO> getRelatorioCps(
            @RequestParam("dataInicio") String dataInicioStr,
            @RequestParam("dataFim") String dataFimStr) {

        // 1. Converte as Strings para LocalDate manualmente
        LocalDate dataInicio = LocalDate.parse(dataInicioStr, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate dataFim = LocalDate.parse(dataFimStr, DateTimeFormatter.ISO_LOCAL_DATE);

        // 2. Chama o serviço com as datas já convertidas
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
}