package br.com.inproutservices.inproutsystem.services.materiais;

import br.com.inproutservices.inproutsystem.dtos.materiais.SolicitacaoRequestDTO;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.materiais.ItemSolicitacao;
import br.com.inproutservices.inproutsystem.entities.materiais.Material;
import br.com.inproutservices.inproutsystem.entities.materiais.Solicitacao;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.materiais.StatusSolicitacao;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.exceptions.materiais.ResourceNotFoundException;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import br.com.inproutservices.inproutsystem.repositories.materiais.MaterialRepository;
import br.com.inproutservices.inproutsystem.repositories.materiais.SolicitacaoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Service
public class SolicitacaoService {

    private final SolicitacaoRepository solicitacaoRepository;
    private final MaterialRepository materialRepository;
    private final OsRepository osRepository;
    private final LpuRepository lpuRepository;
    private final UsuarioRepository usuarioRepository; // Repositório de Usuário injetado

    public SolicitacaoService(SolicitacaoRepository solicitacaoRepository,
                              MaterialRepository materialRepository,
                              OsRepository osRepository,
                              LpuRepository lpuRepository,
                              UsuarioRepository usuarioRepository) { // Adicionado ao construtor
        this.solicitacaoRepository = solicitacaoRepository;
        this.materialRepository = materialRepository;
        this.osRepository = osRepository;
        this.lpuRepository = lpuRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Solicitacao> listarHistorico(Long usuarioId) { // Agora recebe o ID do usuário
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + usuarioId));

        Role role = usuario.getRole();
        List<StatusSolicitacao> statuses = List.of(StatusSolicitacao.APROVADA, StatusSolicitacao.REJEITADA);

        // Se for Admin ou Controller, retorna tudo
        if (role == Role.ADMIN || role == Role.CONTROLLER) {
            return solicitacaoRepository.findByStatusIn(statuses);
        }

        // Se for Manager, filtra pelo segmento
        Set<Segmento> segmentosDoUsuario = usuario.getSegmentos();
        if (segmentosDoUsuario.isEmpty()) {
            return List.of();
        }
        return solicitacaoRepository.findByStatusInAndOsSegmentoIn(statuses, segmentosDoUsuario);
    }

    @Transactional
    public List<Solicitacao> criarSolicitacao(SolicitacaoRequestDTO dto) {
        if (dto.itens() == null || dto.itens().isEmpty()) {
            throw new BusinessException("A solicitação deve conter pelo menos um item.");
        }

        OS os = osRepository.findById(dto.osId())
                .orElseThrow(() -> new ResourceNotFoundException("OS não encontrada com o ID: " + dto.osId()));
        Lpu lpu = lpuRepository.findById(dto.lpuId())
                .orElseThrow(() -> new ResourceNotFoundException("LPU não encontrada com o ID: " + dto.lpuId()));
        Usuario solicitante = usuarioRepository.findById(dto.idSolicitante())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário solicitante não encontrado com o ID: " + dto.idSolicitante()));

        List<Solicitacao> novasSolicitacoes = new ArrayList<>();

        for (SolicitacaoRequestDTO.ItemDTO itemDto : dto.itens()) {
            Material material = materialRepository.findByCodigo(itemDto.codigoMaterial())
                    .orElseThrow(() -> new ResourceNotFoundException("Material não encontrado com o código: " + itemDto.codigoMaterial()));

            Solicitacao novaSolicitacao = new Solicitacao();
            novaSolicitacao.setOs(os);
            novaSolicitacao.setLpu(lpu);
            novaSolicitacao.setSolicitante(solicitante); // CORREÇÃO: Seta o objeto Usuario
            novaSolicitacao.setJustificativa(dto.justificativa());

            ItemSolicitacao item = new ItemSolicitacao();
            item.setMaterial(material);
            item.setQuantidadeSolicitada(itemDto.quantidade());
            item.setSolicitacao(novaSolicitacao);
            novaSolicitacao.getItens().add(item);
            novasSolicitacoes.add(novaSolicitacao);
        }

        return solicitacaoRepository.saveAll(novasSolicitacoes);
    }

    @Transactional(readOnly = true)
    public List<Solicitacao> listarPendentes(String role) {
        if ("COORDINATOR".equalsIgnoreCase(role)) {
            return solicitacaoRepository.findByStatus(StatusSolicitacao.PENDENTE_COORDENADOR);
        } else if ("CONTROLLER".equalsIgnoreCase(role)) {
            // Controller vê as pendências dele e as que estão com o Coordenador
            List<StatusSolicitacao> statuses = Arrays.asList(StatusSolicitacao.PENDENTE_CONTROLLER, StatusSolicitacao.PENDENTE_COORDENADOR);
            return solicitacaoRepository.findByStatusIn(statuses);
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public List<Solicitacao> listarHistorico() {
        List<StatusSolicitacao> statuses = Arrays.asList(StatusSolicitacao.APROVADA, StatusSolicitacao.REJEITADA);
        return solicitacaoRepository.findByStatusIn(statuses);
    }

    @Transactional
    public Solicitacao aprovarPeloCoordenador(Long solicitacaoId, Long aprovadorId) {
        Solicitacao solicitacao = solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação não encontrada..."));
        Usuario aprovador = usuarioRepository.findById(aprovadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário Coordenador não encontrado..."));

        if (aprovador.getRole() != Role.ADMIN && solicitacao.getStatus() != StatusSolicitacao.PENDENTE_COORDENADOR) {
            throw new BusinessException("Apenas solicitações com status PENDENTE_COORDENADOR podem ser aprovadas.");
        }

        solicitacao.setStatus(StatusSolicitacao.PENDENTE_CONTROLLER);
        solicitacao.setAprovadorCoordenador(aprovador);
        solicitacao.setDataAcaoCoordenador(LocalDateTime.now());

        return solicitacaoRepository.save(solicitacao);
    }

    @Transactional
    public Solicitacao rejeitarPeloCoordenador(Long solicitacaoId, Long coordenadorId, String motivo) {
        Solicitacao solicitacao = solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação não encontrada com o ID: " + solicitacaoId));
        Usuario coordenador = usuarioRepository.findById(coordenadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário Coordenador não encontrado com o ID: " + coordenadorId));

        if (solicitacao.getStatus() != StatusSolicitacao.PENDENTE_COORDENADOR) {
            throw new BusinessException("Apenas solicitações com status PENDENTE_COORDENADOR podem ser rejeitadas.");
        }

        solicitacao.setStatus(StatusSolicitacao.REJEITADA);
        solicitacao.setAprovadorCoordenador(coordenador); // CORREÇÃO: Seta o objeto Usuario
        solicitacao.setDataAcaoCoordenador(LocalDateTime.now());
        solicitacao.setMotivoRecusa(motivo);

        return solicitacaoRepository.save(solicitacao);
    }

    @Transactional
    public Solicitacao aprovarPeloController(Long solicitacaoId, Long controllerId) {
        Solicitacao solicitacao = solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação não encontrada com o ID: " + solicitacaoId));
        Usuario controller = usuarioRepository.findById(controllerId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário Controller não encontrado com o ID: " + controllerId));

        if (solicitacao.getStatus() != StatusSolicitacao.PENDENTE_CONTROLLER) {
            throw new BusinessException("Apenas solicitações com status PENDENTE_CONTROLLER podem ser aprovadas.");
        }

        BigDecimal custoDaSolicitacao = BigDecimal.ZERO;
        for (ItemSolicitacao item : solicitacao.getItens()) {
            Material material = item.getMaterial();
            if (material.getSaldoFisico().compareTo(item.getQuantidadeSolicitada()) < 0) {
                throw new BusinessException("Estoque insuficiente para o material: " + material.getDescricao());
            }

            BigDecimal novoSaldo = material.getSaldoFisico().subtract(item.getQuantidadeSolicitada());
            material.setSaldoFisico(novoSaldo);
            item.setSaldoNoMomentoDaAprovacao(novoSaldo);

            if (material.getCustoMedioPonderado() != null) {
                BigDecimal custoItem = item.getQuantidadeSolicitada().multiply(material.getCustoMedioPonderado());
                custoDaSolicitacao = custoDaSolicitacao.add(custoItem);
            }

            materialRepository.save(material);
        }

        solicitacao.setStatus(StatusSolicitacao.APROVADA);
        solicitacao.setAprovadorController(controller); // CORREÇÃO: Seta o objeto Usuario
        solicitacao.setDataAcaoController(LocalDateTime.now());

        OS os = solicitacao.getOs();
        BigDecimal custoAtual = os.getCustoTotalMateriais() != null ? os.getCustoTotalMateriais() : BigDecimal.ZERO;
        os.setCustoTotalMateriais(custoAtual.add(custoDaSolicitacao));
        osRepository.save(os);

        return solicitacaoRepository.save(solicitacao);
    }

    @Transactional
    public Solicitacao rejeitarPeloController(Long solicitacaoId, Long controllerId, String motivo) {
        Solicitacao solicitacao = solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação não encontrada com o ID: " + solicitacaoId));
        Usuario controller = usuarioRepository.findById(controllerId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário Controller não encontrado com o ID: " + controllerId));

        if (solicitacao.getStatus() != StatusSolicitacao.PENDENTE_CONTROLLER) {
            throw new BusinessException("Apenas solicitações com status PENDENTE_CONTROLLER podem ser rejeitadas.");
        }

        solicitacao.setStatus(StatusSolicitacao.REJEITADA);
        solicitacao.setAprovadorController(controller); // CORREÇÃO: Seta o objeto Usuario
        solicitacao.setDataAcaoController(LocalDateTime.now());
        solicitacao.setMotivoRecusa(motivo);

        return solicitacaoRepository.save(solicitacao);
    }
}