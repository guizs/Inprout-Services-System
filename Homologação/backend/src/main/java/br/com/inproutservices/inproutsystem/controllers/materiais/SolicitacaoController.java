package br.com.inproutservices.inproutsystem.controllers.materiais;

import br.com.inproutservices.inproutsystem.dtos.materiais.AprovacaoRejeicaoDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.SolicitacaoRequestDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.SolicitacaoResponseDTO;
import br.com.inproutservices.inproutsystem.entities.materiais.Solicitacao;
import br.com.inproutservices.inproutsystem.services.materiais.SolicitacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/solicitacoes")
@CrossOrigin(origins = "*")
public class SolicitacaoController {

    private final SolicitacaoService solicitacaoService;

    public SolicitacaoController(SolicitacaoService solicitacaoService) {
        this.solicitacaoService = solicitacaoService;
    }

    @PostMapping
    public ResponseEntity<List<SolicitacaoResponseDTO>> criarSolicitacao(@RequestBody SolicitacaoRequestDTO dto) {
        // 1. O service agora retorna uma LISTA de solicitações salvas
        List<Solicitacao> solicitacoesSalvas = solicitacaoService.criarSolicitacao(dto);

        // 2. Convertemos a lista de entidades para uma lista de DTOs
        List<SolicitacaoResponseDTO> responseDTOs = solicitacoesSalvas.stream()
                .map(SolicitacaoResponseDTO::new)
                .collect(Collectors.toList());

        // 3. Retornamos a lista de DTOs com o status 201 (Created)
        // A URI de location não faz mais sentido para múltiplos recursos, então a removemos.
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTOs);
    }

    @GetMapping("/pendentes")
    public ResponseEntity<List<SolicitacaoResponseDTO>> listarSolicitacoesPendentes(@RequestHeader("X-User-Role") String role) {
        List<SolicitacaoResponseDTO> list = solicitacaoService.listarPendentes(role)
                .stream()
                .map(SolicitacaoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/historico")
    public ResponseEntity<List<SolicitacaoResponseDTO>> listarHistoricoDeSolicitacoes() {
        List<SolicitacaoResponseDTO> list = solicitacaoService.listarHistorico()
                .stream()
                .map(SolicitacaoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // --- NOVOS ENDPOINTS ---

    @PostMapping("/{id}/coordenador/aprovar")
    public ResponseEntity<SolicitacaoResponseDTO> aprovarPeloCoordenador(@PathVariable Long id, @RequestBody AprovacaoRejeicaoDTO dto) {
        Solicitacao solicitacao = solicitacaoService.aprovarPeloCoordenador(id, dto.aprovadorId());
        return ResponseEntity.ok(new SolicitacaoResponseDTO(solicitacao));
    }

    @PostMapping("/{id}/coordenador/rejeitar")
    public ResponseEntity<SolicitacaoResponseDTO> rejeitarPeloCoordenador(@PathVariable Long id, @RequestBody AprovacaoRejeicaoDTO dto) {
        Solicitacao solicitacao = solicitacaoService.rejeitarPeloCoordenador(id, dto.aprovadorId(), dto.observacao());
        return ResponseEntity.ok(new SolicitacaoResponseDTO(solicitacao));
    }

    @PostMapping("/{id}/controller/aprovar")
    public ResponseEntity<SolicitacaoResponseDTO> aprovarPeloController(@PathVariable Long id, @RequestBody AprovacaoRejeicaoDTO dto) {
        Solicitacao solicitacao = solicitacaoService.aprovarPeloController(id, dto.aprovadorId());
        return ResponseEntity.ok(new SolicitacaoResponseDTO(solicitacao));
    }

    @PostMapping("/{id}/controller/rejeitar")
    public ResponseEntity<SolicitacaoResponseDTO> rejeitarPeloController(@PathVariable Long id, @RequestBody AprovacaoRejeicaoDTO dto) {
        Solicitacao solicitacao = solicitacaoService.rejeitarPeloController(id, dto.aprovadorId(), dto.observacao());
        return ResponseEntity.ok(new SolicitacaoResponseDTO(solicitacao));
    }
}