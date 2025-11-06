package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.SolicitacaoAtividadeComplementarDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoAtividadeComplementar;
import br.com.inproutservices.inproutsystem.services.atividades.SolicitacaoAtividadeComplementarService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/solicitacoes-complementares")
@CrossOrigin(origins = "*")
public class SolicitacaoAtividadeComplementarController {

    private final SolicitacaoAtividadeComplementarService service;

    public SolicitacaoAtividadeComplementarController(SolicitacaoAtividadeComplementarService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SolicitacaoAtividadeComplementarDTO.Response> criar(@RequestBody SolicitacaoAtividadeComplementarDTO.Request dto) {
        SolicitacaoAtividadeComplementar novaSolicitacao = service.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SolicitacaoAtividadeComplementarDTO.Response(novaSolicitacao));
    }

    @GetMapping("/pendentes")
    public ResponseEntity<List<SolicitacaoAtividadeComplementarDTO.Response>> listarPendentes(@RequestHeader("X-User-Role") String role, @RequestHeader("X-User-ID") Long usuarioId) {
        List<SolicitacaoAtividadeComplementar> pendentes = service.listarPendentes(role, usuarioId);
        List<SolicitacaoAtividadeComplementarDTO.Response> dtos = pendentes.stream().map(SolicitacaoAtividadeComplementarDTO.Response::new).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/historico/{usuarioId}")
    public ResponseEntity<List<SolicitacaoAtividadeComplementarDTO.Response>> listarHistorico(@PathVariable Long usuarioId) {
        List<SolicitacaoAtividadeComplementar> historico = service.listarHistorico(usuarioId);
        List<SolicitacaoAtividadeComplementarDTO.Response> dtos = historico.stream().map(SolicitacaoAtividadeComplementarDTO.Response::new).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/coordenador/aprovar")
    public ResponseEntity<SolicitacaoAtividadeComplementarDTO.Response> aprovarPeloCoordenador(@PathVariable Long id, @RequestBody SolicitacaoAtividadeComplementarDTO.AcaoDTO dto) {
        SolicitacaoAtividadeComplementar s = service.aprovarPeloCoordenador(id, dto.aprovadorId());
        return ResponseEntity.ok(new SolicitacaoAtividadeComplementarDTO.Response(s));
    }

    @PostMapping("/{id}/coordenador/rejeitar")
    public ResponseEntity<SolicitacaoAtividadeComplementarDTO.Response> rejeitarPeloCoordenador(@PathVariable Long id, @RequestBody SolicitacaoAtividadeComplementarDTO.AcaoDTO dto) {
        SolicitacaoAtividadeComplementar s = service.rejeitar(id, dto.aprovadorId(), dto.motivo());
        return ResponseEntity.ok(new SolicitacaoAtividadeComplementarDTO.Response(s));
    }

    @PostMapping("/{id}/controller/aprovar")
    public ResponseEntity<SolicitacaoAtividadeComplementarDTO.Response> aprovarPeloController(@PathVariable Long id, @RequestBody SolicitacaoAtividadeComplementarDTO.AcaoDTO dto) {
        SolicitacaoAtividadeComplementar s = service.aprovarPeloController(id, dto.aprovadorId());
        return ResponseEntity.ok(new SolicitacaoAtividadeComplementarDTO.Response(s));
    }

    @PostMapping("/{id}/controller/rejeitar")
    public ResponseEntity<SolicitacaoAtividadeComplementarDTO.Response> rejeitarPeloController(@PathVariable Long id, @RequestBody SolicitacaoAtividadeComplementarDTO.AcaoDTO dto) {
        SolicitacaoAtividadeComplementar s = service.rejeitar(id, dto.aprovadorId(), dto.motivo());
        return ResponseEntity.ok(new SolicitacaoAtividadeComplementarDTO.Response(s));
    }

    // NOVOS ENDPOINTS DE LOTE
    @PostMapping("/lote/coordenador/aprovar")
    public ResponseEntity<Void> aprovarLotePeloCoordenador(@RequestBody AprovacaoLoteRequest request) {
        service.aprovarLotePeloCoordenador(request.solicitacaoIds(), request.aprovadorId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lote/coordenador/rejeitar")
    public ResponseEntity<Void> rejeitarLotePeloCoordenador(@RequestBody RejeicaoLoteRequest request) {
        service.rejeitarLote(request.solicitacaoIds(), request.aprovadorId(), request.motivo());
        return ResponseEntity.ok().build();
    }

    // DTOs auxiliares para as requisições em lote
    record AprovacaoLoteRequest(List<Long> solicitacaoIds, Long aprovadorId) {}
    record RejeicaoLoteRequest(List<Long> solicitacaoIds, Long aprovadorId, String motivo) {}
}