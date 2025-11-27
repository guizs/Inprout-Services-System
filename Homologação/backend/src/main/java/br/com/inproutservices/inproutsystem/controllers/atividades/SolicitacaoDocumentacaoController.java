package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoResponseDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.SolicitacaoDocumentacaoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoDocumentacao;
import br.com.inproutservices.inproutsystem.services.atividades.SolicitacaoDocumentacaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/documentacao")
@CrossOrigin(origins = "*")
public class SolicitacaoDocumentacaoController {

    private final SolicitacaoDocumentacaoService service;

    public SolicitacaoDocumentacaoController(SolicitacaoDocumentacaoService service) {
        this.service = service;
    }

    // Endpoint para o Manager criar a solicitação
    @PostMapping("/solicitar")
    public ResponseEntity<SolicitacaoDocumentacaoDTO.Response> criar(@RequestBody SolicitacaoDocumentacaoDTO.Request dto) {
        SolicitacaoDocumentacao s = service.criarSolicitacao(dto);
        return ResponseEntity.ok(new SolicitacaoDocumentacaoDTO.Response(s));
    }

    // Endpoint para o Manager ver o que PODE solicitar (lançamentos com data preenchida mas sem solicitação)
    @GetMapping("/pendentes-solicitacao")
    public ResponseEntity<List<LancamentoResponseDTO>> listarPendentesSolicitacao() {
        List<Lancamento> lista = service.listarPendentesDeSolicitacao();
        List<LancamentoResponseDTO> dtos = lista.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Endpoint para o Documentador ver sua fila
    @GetMapping("/minha-fila")
    public ResponseEntity<List<SolicitacaoDocumentacaoDTO.Response>> listarMinhaFila(@RequestHeader("X-User-ID") Long userId) {
        List<SolicitacaoDocumentacao> lista = service.listarMinhaFila(userId);
        List<SolicitacaoDocumentacaoDTO.Response> dtos = lista.stream()
                .map(SolicitacaoDocumentacaoDTO.Response::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/concluir")
    public ResponseEntity<Void> concluir(@PathVariable Long id) {
        service.concluir(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reportar")
    public ResponseEntity<Void> reportar(@PathVariable Long id, @RequestBody SolicitacaoDocumentacaoDTO.Report dto) {
        service.reportar(id, dto.observacao());
        return ResponseEntity.ok().build();
    }
}