package br.com.inproutservices.inproutsystem.controllers.materiais;

import br.com.inproutservices.inproutsystem.dtos.materiais.AprovacaoRejeicaoDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.SolicitacaoRequestDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.SolicitacaoResponseDTO;
import br.com.inproutservices.inproutsystem.entities.materiais.Solicitacao;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.services.materiais.SolicitacaoService;
import br.com.inproutservices.inproutsystem.services.atividades.OsService;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import br.com.inproutservices.inproutsystem.repositories.materiais.SolicitacaoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/solicitacoes")
@CrossOrigin(origins = "*")
public class SolicitacaoController {

    private final SolicitacaoService solicitacaoService;
    private final OsService osService;
    private final UsuarioRepository usuarioRepository;
    private final SolicitacaoRepository solicitacaoRepository;

    public SolicitacaoController(SolicitacaoService solicitacaoService,
                                 OsService osService,
                                 UsuarioRepository usuarioRepository,
                                 SolicitacaoRepository solicitacaoRepository) {
        this.solicitacaoService = solicitacaoService;
        this.osService = osService;
        this.usuarioRepository = usuarioRepository;
        this.solicitacaoRepository = solicitacaoRepository;
    }

    @PostMapping
    public ResponseEntity<List<SolicitacaoResponseDTO>> criarSolicitacao(@RequestBody SolicitacaoRequestDTO dto) {
        // 1. Cria a solicitação normalmente (Status inicial: PENDENTE_COORDENADOR)
        List<Solicitacao> solicitacoesSalvas = solicitacaoService.criarSolicitacao(dto);

        // 2. Lógica de Transporte (Atualiza OS)
        BigDecimal valorTransporte = dto.valorTransporte() != null ? dto.valorTransporte() : BigDecimal.ZERO;
        if (valorTransporte.compareTo(BigDecimal.ZERO) > 0) {
            osService.atualizarValoresFinanceiros(dto.osId(), null, valorTransporte);
        }

        // 3. Lógica de Auto-Aprovação e Histórico (Admin/Controller)
        Usuario solicitante = usuarioRepository.findById(dto.idSolicitante())
                .orElseThrow(() -> new EntityNotFoundException("Solicitante não encontrado"));

        if (solicitante.getRole() == Role.ADMIN || solicitante.getRole() == Role.CONTROLLER) {
            List<Solicitacao> solicitacoesAprovadas = new ArrayList<>();

            for (Solicitacao solicitacao : solicitacoesSalvas) {
                // A. Calcula valor total dos materiais desta solicitação
                BigDecimal totalMateriais = solicitacao.getItens().stream()
                        .map(item -> {
                            BigDecimal custo = item.getMaterial().getCustoMedioPonderado();
                            if (custo == null) custo = BigDecimal.ZERO;
                            // CORREÇÃO AQUI: getQuantidadeSolicitada() em vez de getQuantidade()
                            return custo.multiply(item.getQuantidadeSolicitada());
                        })
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                // B. Monta o histórico financeiro
                String historicoFinanceiro = String.format(
                        "\n\n[AUTO APROVAÇÃO %s]\n >> Materiais: R$ %.2f\n >> Transporte: R$ %.2f\n >> Total da Operação: R$ %.2f",
                        solicitante.getRole(),
                        totalMateriais,
                        valorTransporte,
                        totalMateriais.add(valorTransporte)
                );

                // C. Atualiza a justificativa e Salva antes de aprovar
                String justificativaAtual = solicitacao.getJustificativa() != null ? solicitacao.getJustificativa() : "";
                solicitacao.setJustificativa(justificativaAtual + historicoFinanceiro);
                solicitacaoRepository.save(solicitacao);

                // D. Executa o fluxo de aprovação em cadeia
                // 1º Aprova como Coordenador
                solicitacaoService.aprovarPeloCoordenador(solicitacao.getId(), solicitante.getId());

                // 2º Aprova como Controller (Finaliza)
                Solicitacao finalizada = solicitacaoService.aprovarPeloController(solicitacao.getId(), solicitante.getId());

                solicitacoesAprovadas.add(finalizada);
            }
            // Atualiza a lista de retorno para refletir o status APROVADO
            solicitacoesSalvas = solicitacoesAprovadas;
        }

        // 4. Retorno
        List<SolicitacaoResponseDTO> responseDTOs = solicitacoesSalvas.stream()
                .map(SolicitacaoResponseDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTOs);
    }

    @GetMapping("/pendentes")
    public ResponseEntity<List<SolicitacaoResponseDTO>> listarSolicitacoesPendentes(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-ID") Long usuarioId) {
        List<SolicitacaoResponseDTO> list = solicitacaoService.listarPendentes(role, usuarioId)
                .stream()
                .map(SolicitacaoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/historico/{usuarioId}")
    public ResponseEntity<List<SolicitacaoResponseDTO>> listarHistoricoDeSolicitacoes(@PathVariable Long usuarioId) {
        List<SolicitacaoResponseDTO> list = solicitacaoService.listarHistorico(usuarioId)
                .stream()
                .map(SolicitacaoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

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