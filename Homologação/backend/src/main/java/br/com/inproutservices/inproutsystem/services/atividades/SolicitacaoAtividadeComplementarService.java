package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.SolicitacaoAtividadeComplementarDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoAtividadeComplementar;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusSolicitacaoComplementar;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.SolicitacaoAtividadeComplementarRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class SolicitacaoAtividadeComplementarService {

    private final SolicitacaoAtividadeComplementarRepository solicitacaoRepository;
    private final OsRepository osRepository;
    private final LpuRepository lpuRepository;
    private final UsuarioRepository usuarioRepository;
    private final OsService osService; // Precisamos dele para criar a linha de registro no final

    public SolicitacaoAtividadeComplementarService(SolicitacaoAtividadeComplementarRepository solicitacaoRepository, OsRepository osRepository, LpuRepository lpuRepository, UsuarioRepository usuarioRepository, OsService osService) {
        this.solicitacaoRepository = solicitacaoRepository;
        this.osRepository = osRepository;
        this.lpuRepository = lpuRepository;
        this.usuarioRepository = usuarioRepository;
        this.osService = osService;
    }

    @Transactional
    public SolicitacaoAtividadeComplementar criar(SolicitacaoAtividadeComplementarDTO.Request dto) {
        OS os = osRepository.findById(dto.osId()).orElseThrow(() -> new EntityNotFoundException("OS não encontrada."));
        Lpu lpu = lpuRepository.findById(dto.lpuId()).orElseThrow(() -> new EntityNotFoundException("LPU não encontrada."));
        Usuario solicitante = usuarioRepository.findById(dto.solicitanteId()).orElseThrow(() -> new EntityNotFoundException("Usuário solicitante não encontrado."));

        SolicitacaoAtividadeComplementar novaSolicitacao = new SolicitacaoAtividadeComplementar();
        novaSolicitacao.setOs(os);
        novaSolicitacao.setLpu(lpu);
        novaSolicitacao.setQuantidade(dto.quantidade());
        novaSolicitacao.setSolicitante(solicitante);
        novaSolicitacao.setJustificativa(dto.justificativa());

        return solicitacaoRepository.save(novaSolicitacao);
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoAtividadeComplementar> listarPendentes(String role, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        Set<Segmento> segmentos = usuario.getSegmentos();

        if (Role.COORDINATOR.name().equalsIgnoreCase(role)) {
            return solicitacaoRepository.findByStatusInAndOsSegmentoIn(List.of(StatusSolicitacaoComplementar.PENDENTE_COORDENADOR), segmentos);
        } else if (Role.CONTROLLER.name().equalsIgnoreCase(role) || Role.ADMIN.name().equalsIgnoreCase(role)) {
            // Controller e Admin veem ambas as filas pendentes, de todos os segmentos
            return solicitacaoRepository.findByStatusIn(List.of(StatusSolicitacaoComplementar.PENDENTE_COORDENADOR, StatusSolicitacaoComplementar.PENDENTE_CONTROLLER));
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoAtividadeComplementar> listarHistorico(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        Role role = usuario.getRole();
        List<StatusSolicitacaoComplementar> statuses = List.of(StatusSolicitacaoComplementar.APROVADO, StatusSolicitacaoComplementar.REJEITADO);

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            return solicitacaoRepository.findByStatusIn(statuses);
        }

        Set<Segmento> segmentos = usuario.getSegmentos();
        return solicitacaoRepository.findHistoricoBySegmentoIn(statuses, segmentos);
    }

    @Transactional
    public SolicitacaoAtividadeComplementar aprovarPeloCoordenador(Long solicitacaoId, Long aprovadorId) {
        SolicitacaoAtividadeComplementar solicitacao = solicitacaoRepository.findById(solicitacaoId).orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada."));
        Usuario aprovador = usuarioRepository.findById(aprovadorId).orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        if (solicitacao.getStatus() != StatusSolicitacaoComplementar.PENDENTE_COORDENADOR) {
            throw new BusinessException("Esta solicitação não está pendente para o Coordenador.");
        }

        solicitacao.setStatus(StatusSolicitacaoComplementar.PENDENTE_CONTROLLER);
        solicitacao.setAprovadorCoordenador(aprovador);
        solicitacao.setDataAcaoCoordenador(LocalDateTime.now());
        return solicitacaoRepository.save(solicitacao);
    }

    @Transactional
    public SolicitacaoAtividadeComplementar rejeitar(Long solicitacaoId, Long aprovadorId, String motivo) {
        SolicitacaoAtividadeComplementar solicitacao = solicitacaoRepository.findById(solicitacaoId).orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada."));
        Usuario aprovador = usuarioRepository.findById(aprovadorId).orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        if (motivo == null || motivo.isBlank()) {
            throw new BusinessException("O motivo da recusa é obrigatório.");
        }

        if (aprovador.getRole() == Role.COORDINATOR && solicitacao.getStatus() == StatusSolicitacaoComplementar.PENDENTE_COORDENADOR) {
            solicitacao.setAprovadorCoordenador(aprovador);
            solicitacao.setDataAcaoCoordenador(LocalDateTime.now());
        } else if (aprovador.getRole() == Role.CONTROLLER && solicitacao.getStatus() == StatusSolicitacaoComplementar.PENDENTE_CONTROLLER) {
            solicitacao.setAprovadorController(aprovador);
            solicitacao.setDataAcaoController(LocalDateTime.now());
        } else {
            throw new BusinessException("Ação não permitida para o status atual ou perfil do usuário.");
        }

        solicitacao.setStatus(StatusSolicitacaoComplementar.REJEITADO);
        solicitacao.setMotivoRecusa(motivo);
        return solicitacaoRepository.save(solicitacao);
    }

    @Transactional
    public SolicitacaoAtividadeComplementar aprovarPeloController(Long solicitacaoId, Long aprovadorId) {
        SolicitacaoAtividadeComplementar solicitacao = solicitacaoRepository.findById(solicitacaoId).orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada."));
        Usuario aprovador = usuarioRepository.findById(aprovadorId).orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        if (solicitacao.getStatus() != StatusSolicitacaoComplementar.PENDENTE_CONTROLLER) {
            throw new BusinessException("Esta solicitação não está pendente para o Controller.");
        }

        // A MÁGICA ACONTECE AQUI!
        // Chamamos o serviço de OS para efetivamente criar a nova linha de registro
        osService.criarOsLpuDetalheComplementar(
                solicitacao.getOs().getId(),
                solicitacao.getLpu().getId(),
                solicitacao.getQuantidade()
        );

        solicitacao.setStatus(StatusSolicitacaoComplementar.APROVADO);
        solicitacao.setAprovadorController(aprovador);
        solicitacao.setDataAcaoController(LocalDateTime.now());
        return solicitacaoRepository.save(solicitacao);
    }

    // NOVOS MÉTODOS DE LOTE
    @Transactional
    public void aprovarLotePeloCoordenador(List<Long> solicitacaoIds, Long aprovadorId) {
        List<SolicitacaoAtividadeComplementar> solicitacoes = solicitacaoRepository.findAllById(solicitacaoIds);
        Usuario aprovador = usuarioRepository.findById(aprovadorId).orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        for (SolicitacaoAtividadeComplementar s : solicitacoes) {
            if (s.getStatus() == StatusSolicitacaoComplementar.PENDENTE_COORDENADOR) {
                s.setStatus(StatusSolicitacaoComplementar.PENDENTE_CONTROLLER);
                s.setAprovadorCoordenador(aprovador);
                s.setDataAcaoCoordenador(LocalDateTime.now());
            }
        }
        solicitacaoRepository.saveAll(solicitacoes);
    }

    @Transactional
    public void aprovarLotePeloController(List<Long> solicitacaoIds, Long aprovadorId) {
        List<SolicitacaoAtividadeComplementar> solicitacoes = solicitacaoRepository.findAllById(solicitacaoIds);
        Usuario aprovador = usuarioRepository.findById(aprovadorId).orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        for (SolicitacaoAtividadeComplementar s : solicitacoes) {
            if (s.getStatus() == StatusSolicitacaoComplementar.PENDENTE_CONTROLLER) {
                osService.criarOsLpuDetalheComplementar(s.getOs().getId(), s.getLpu().getId(), s.getQuantidade());
                s.setStatus(StatusSolicitacaoComplementar.APROVADO);
                s.setAprovadorController(aprovador);
                s.setDataAcaoController(LocalDateTime.now());
            }
        }
        solicitacaoRepository.saveAll(solicitacoes);
    }

    @Transactional
    public void rejeitarLote(List<Long> solicitacaoIds, Long aprovadorId, String motivo) {
        List<SolicitacaoAtividadeComplementar> solicitacoes = solicitacaoRepository.findAllById(solicitacaoIds);
        Usuario aprovador = usuarioRepository.findById(aprovadorId).orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));
        if (motivo == null || motivo.isBlank()) {
            throw new BusinessException("O motivo da recusa é obrigatório.");
        }

        for (SolicitacaoAtividadeComplementar s : solicitacoes) {
            boolean podeRejeitar = (aprovador.getRole() == Role.COORDINATOR && s.getStatus() == StatusSolicitacaoComplementar.PENDENTE_COORDENADOR) ||
                    (aprovador.getRole() == Role.CONTROLLER && s.getStatus() == StatusSolicitacaoComplementar.PENDENTE_CONTROLLER);

            if (podeRejeitar) {
                if (aprovador.getRole() == Role.COORDINATOR) {
                    s.setAprovadorCoordenador(aprovador);
                    s.setDataAcaoCoordenador(LocalDateTime.now());
                } else {
                    s.setAprovadorController(aprovador);
                    s.setDataAcaoController(LocalDateTime.now());
                }
                s.setStatus(StatusSolicitacaoComplementar.REJEITADO);
                s.setMotivoRecusa(motivo);
            }
        }
        solicitacaoRepository.saveAll(solicitacoes);
    }
}