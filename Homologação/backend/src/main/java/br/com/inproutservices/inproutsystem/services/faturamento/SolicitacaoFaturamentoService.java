package br.com.inproutservices.inproutsystem.services.faturamento;

import br.com.inproutservices.inproutsystem.dtos.faturamento.*;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoFaturamento;
import br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.TipoFaturamento;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsLpuDetalheRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.SolicitacaoFaturamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.index.EtapaDetalhadaRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SolicitacaoFaturamentoService {

    private final SolicitacaoFaturamentoRepository faturamentoRepo;
    private final LancamentoRepository lancamentoRepo;
    private final OsLpuDetalheRepository osLpuDetalheRepo;
    private final UsuarioRepository usuarioRepo;
    private final EtapaDetalhadaRepository etapaDetalhadaRepo;

    public SolicitacaoFaturamentoService(SolicitacaoFaturamentoRepository faturamentoRepo, LancamentoRepository lancamentoRepo, OsLpuDetalheRepository osLpuDetalheRepo, UsuarioRepository usuarioRepo, EtapaDetalhadaRepository etapaDetalhadaRepo) {
        this.faturamentoRepo = faturamentoRepo;
        this.lancamentoRepo = lancamentoRepo;
        this.osLpuDetalheRepo = osLpuDetalheRepo;
        this.usuarioRepo = usuarioRepo;
        this.etapaDetalhadaRepo = etapaDetalhadaRepo;
    }

    // Método auxiliar
    private Usuario getUsuario(Long usuarioId) {
        return usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
    }

    /**
     * FLUXO 1 e 2: Busca a fila de trabalho principal do Assistant (REFATORADO)
     */
    @Transactional(readOnly = true)
    public List<SolicitacaoFaturamentoDTO> getFilaAssistant(Long usuarioId) {
        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();

        List<StatusFaturamento> statuses = List.of(
                StatusFaturamento.PENDENTE_ASSISTANT,
                StatusFaturamento.ID_RECEBIDO,
                StatusFaturamento.ID_RECUSADO
        );

        List<SolicitacaoFaturamento> fila;

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            fila = faturamentoRepo.findByStatusInWithDetails(statuses);
        } else if (role == Role.COORDINATOR) {
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) return List.of();
            // --- CORREÇÃO AQUI --- (Removido "Os" do nome do método)
            fila = faturamentoRepo.findByStatusInAndSegmentoIn(statuses, segmentos);
        } else {
            return List.of(); // Manager não vê esta fila
        }

        return fila.stream()
                .map(SolicitacaoFaturamentoDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * FLUXO 1: Busca a fila "matéria-prima" do Coordenador (REFATORADO)
     */
    @Transactional(readOnly = true)
    public List<FilaCoordenadorDTO> getFilaCoordinator(Long usuarioId) {
        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();

        if (role == Role.ASSISTANT || role == Role.MANAGER) {
            return List.of(); // Assistant e Manager não veem esta fila
        }

        EtapaDetalhada etapaSolicitacao = etapaDetalhadaRepo.findByNome("Solicitar ID").stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Etapa 'Solicitar ID' não foi cadastrada no sistema."));

        List<Lancamento> lancamentosNaEtapa = lancamentoRepo.findAllByEtapaDetalhadaId(etapaSolicitacao.getId());

        Set<Segmento> segmentos = usuario.getSegmentos();

        return lancamentosNaEtapa.stream()
                .filter(lancamento -> {
                    OsLpuDetalhe detalhe = lancamento.getOsLpuDetalhe();
                    if (detalhe == null || detalhe.getOs() == null) return false;

                    // Filtra por segmento se for Coordenador
                    if (role == Role.COORDINATOR) {
                        if (segmentos.isEmpty() || !segmentos.contains(detalhe.getOs().getSegmento())) {
                            return false;
                        }
                    }

                    // Regra A: O campo de data de faturamento DEVE estar vazio
                    if (detalhe.getDataFatInprout() != null) return false;

                    // Regra B: Não pode já existir uma solicitação de faturamento em andamento
                    return !faturamentoRepo.existsByOsLpuDetalheId(detalhe.getId());
                })
                .map(FilaCoordenadorDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * FLUXO 2: Busca a fila de "matéria-prima" do Coordenador para ADIANTAMENTO (REFATORADO)
     */
    @Transactional(readOnly = true)
    public List<FilaAdiantamentoDTO> getFilaAdiantamentoCoordinator(Long usuarioId) {
        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();

        if (role == Role.ASSISTANT || role == Role.MANAGER) {
            return List.of();
        }

        EtapaDetalhada etapaSolicitacao = etapaDetalhadaRepo.findByNome("Solicitar ID").stream().findFirst().orElse(null);
        Long etapaSolicitacaoId = (etapaSolicitacao != null) ? etapaSolicitacao.getId() : -1L;

        List<OsLpuDetalhe> todosOsDetalhes = osLpuDetalheRepo.findAll();
        Set<Segmento> segmentos = usuario.getSegmentos();

        return todosOsDetalhes.stream()
                .filter(detalhe -> {
                    if (detalhe.getOs() == null) return false;

                    // Filtra por segmento se for Coordenador
                    if (role == Role.COORDINATOR) {
                        if (segmentos.isEmpty() || !segmentos.contains(detalhe.getOs().getSegmento())) {
                            return false;
                        }
                    }

                    if (detalhe.getDataFatInprout() != null) return false;
                    if (faturamentoRepo.existsByOsLpuDetalheId(detalhe.getId())) return false;

                    Optional<Lancamento> ultimoLancamentoOpt = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(detalhe.getId());
                    if (ultimoLancamentoOpt.isEmpty()) return false;

                    Lancamento ultimoLancamento = ultimoLancamentoOpt.get();
                    if (ultimoLancamento.getEtapaDetalhada() != null && ultimoLancamento.getEtapaDetalhada().getId().equals(etapaSolicitacaoId)) return false;
                    if (ultimoLancamento.getSituacao() == SituacaoOperacional.FINALIZADO) return false;

                    return true;
                })
                .map(detalhe -> {
                    SituacaoOperacional status = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(detalhe.getId())
                            .map(Lancamento::getSituacao)
                            .orElse(SituacaoOperacional.NAO_INICIADO);
                    return new FilaAdiantamentoDTO(detalhe, status);
                })
                .collect(Collectors.toList());
    }

    /**
     * NOVO MÉTODO: Busca os KPIs para o Dashboard
     */
    @Transactional(readOnly = true)
    public DashboardFaturamentoDTO getDashboardFaturamento(Long usuarioId) {
        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();
        Set<Segmento> segmentos = usuario.getSegmentos();

        // 1. Fila do Coordenador (Etapa "Solicitar ID")
        long pendenteSolicitacao = (role == Role.ASSISTANT || role == Role.MANAGER) ? 0 : getFilaCoordinator(usuarioId).size();

        // 2, 3, 4, 5. Busca as solicitações para os outros cálculos
        List<SolicitacaoFaturamento> pendentes;
        List<SolicitacaoFaturamento> faturados;
        List<SolicitacaoFaturamento> adiantamentos;

        List<StatusFaturamento> statusPendentes = List.of(StatusFaturamento.PENDENTE_ASSISTANT, StatusFaturamento.ID_RECEBIDO, StatusFaturamento.ID_RECUSADO);
        List<StatusFaturamento> statusFaturado = List.of(StatusFaturamento.FATURADO);

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            pendentes = faturamentoRepo.findByStatusInWithDetails(statusPendentes);
            faturados = faturamentoRepo.findByStatusInWithDetails(statusFaturado);
            adiantamentos = faturamentoRepo.findByTipoWithDetails(TipoFaturamento.ADIANTAMENTO);
        } else { // Coordenador
            if (segmentos.isEmpty()) {
                pendentes = List.of();
                faturados = List.of();
                adiantamentos = List.of();
            } else {
                // --- CORREÇÃO AQUI --- (Removido "Os" do nome do método)
                pendentes = faturamentoRepo.findByStatusInAndSegmentoIn(statusPendentes, segmentos);
                faturados = faturamentoRepo.findByStatusInAndSegmentoIn(statusFaturado, segmentos);
                adiantamentos = faturamentoRepo.findByTipoAndSegmentoIn(TipoFaturamento.ADIANTAMENTO, segmentos);
            }
        }

        // 2. Fila do Assistant (Pendente)
        long pendenteFila = pendentes.stream()
                .filter(s -> s.getStatus() == StatusFaturamento.PENDENTE_ASSISTANT)
                .count();

        // 3. IDs Recusados
        long idsRecusados = pendentes.stream()
                .filter(s -> s.getStatus() == StatusFaturamento.ID_RECUSADO)
                .count();

        // 4. Adiantamentos Pendentes (Tipo Adiantamento que NÃO esteja Faturado)
        long adiantamentosPendentes = adiantamentos.stream()
                .filter(s -> s.getStatus() != StatusFaturamento.FATURADO)
                .count();

        // 5. Faturado no Mês
        LocalDateTime trintaDiasAtras = LocalDateTime.now().minusDays(30);
        long faturadoMes = faturados.stream()
                .filter(s -> s.getDataUltimaAcao().isAfter(trintaDiasAtras))
                .count();

        return new DashboardFaturamentoDTO(pendenteSolicitacao, pendenteFila, idsRecusados, adiantamentosPendentes, faturadoMes);
    }

    // --- MÉTODOS DE AÇÃO (sem grandes mudanças) ---

    @Transactional
    public SolicitacaoFaturamento solicitarIdFaturamento(Long osLpuDetalheId, Long coordinatorId) {
        Usuario coordenador = getUsuario(coordinatorId);
        OsLpuDetalhe itemOS = osLpuDetalheRepo.findById(osLpuDetalheId)
                .orElseThrow(() -> new EntityNotFoundException("Item da OS (OsLpuDetalhe) não encontrado."));

        if (faturamentoRepo.existsByOsLpuDetalheId(osLpuDetalheId)) {
            throw new BusinessException("Já existe uma solicitação de faturamento para este item.");
        }

        EtapaDetalhada etapaSolicitacao = etapaDetalhadaRepo.findByNome("Solicitar ID").stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Etapa 'Solicitar ID' não encontrada no sistema."));

        boolean itemEstaNaEtapa = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(osLpuDetalheId)
                .map(Lancamento::getEtapaDetalhada)
                .map(etapa -> etapa.getId().equals(etapaSolicitacao.getId()))
                .orElse(false);

        if (!itemEstaNaEtapa) {
            throw new BusinessException("O último lançamento deste item não está na etapa 'Solicitar ID'.");
        }

        SolicitacaoFaturamento solicitacao = new SolicitacaoFaturamento();
        solicitacao.setOsLpuDetalhe(itemOS);
        solicitacao.setSolicitante(coordenador);
        solicitacao.setStatus(StatusFaturamento.PENDENTE_ASSISTANT);
        solicitacao.setTipo(TipoFaturamento.REGULAR);

        return faturamentoRepo.save(solicitacao);
    }

    @Transactional
    public SolicitacaoFaturamento solicitarAdiantamento(Long osLpuDetalheId, Long coordinatorId) {
        Usuario coordenador = getUsuario(coordinatorId);
        OsLpuDetalhe itemOS = osLpuDetalheRepo.findById(osLpuDetalheId)
                .orElseThrow(() -> new EntityNotFoundException("Item da OS (OsLpuDetalhe) não encontrado."));

        if (faturamentoRepo.existsByOsLpuDetalheId(osLpuDetalheId)) {
            throw new BusinessException("Já existe uma solicitação de faturamento para este item.");
        }

        SolicitacaoFaturamento solicitacao = new SolicitacaoFaturamento();
        solicitacao.setOsLpuDetalhe(itemOS);
        solicitacao.setSolicitante(coordenador);
        solicitacao.setStatus(StatusFaturamento.PENDENTE_ASSISTANT);
        solicitacao.setTipo(TipoFaturamento.ADIANTAMENTO);
        solicitacao.setObservacao("Solicitação de adiantamento de faturamento.");

        return faturamentoRepo.save(solicitacao);
    }

    @Transactional
    public SolicitacaoFaturamento alterarStatus(Long solicitacaoId, Long assistantId, StatusFaturamento novoStatus, String motivo) {
        SolicitacaoFaturamento solicitacao = faturamentoRepo.findById(solicitacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação de faturamento não encontrada."));
        Usuario assistant = getUsuario(assistantId);

        if (novoStatus == StatusFaturamento.ID_RECUSADO && (motivo == null || motivo.isBlank())) {
            throw new BusinessException("O motivo é obrigatório para recusar a solicitação.");
        }

        solicitacao.setStatus(novoStatus);
        solicitacao.setResponsavel(assistant);
        solicitacao.setDataUltimaAcao(LocalDateTime.now());

        if (novoStatus == StatusFaturamento.ID_RECUSADO) {
            solicitacao.setObservacao(motivo);
        }

        if (novoStatus == StatusFaturamento.FATURADO) {
            OsLpuDetalhe detalhe = solicitacao.getOsLpuDetalhe();
            if (detalhe != null) {
                detalhe.setDataFatInprout(LocalDate.now());
                osLpuDetalheRepo.save(detalhe);
            }
        }

        return faturamentoRepo.save(solicitacao);
    }

    // Métodos de listagem de histórico (Visão e Faturado)

    @Transactional(readOnly = true)
    public List<VisaoAdiantamentoDTO> getVisaoAdiantamentos(Long usuarioId) {
        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();
        Set<Segmento> segmentos = usuario.getSegmentos();

        List<SolicitacaoFaturamento> adiantamentos;

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            adiantamentos = faturamentoRepo.findByTipoWithDetails(TipoFaturamento.ADIANTAMENTO);
        } else { // Coordenador
            if (segmentos.isEmpty()) return List.of();
            adiantamentos = faturamentoRepo.findByTipoAndSegmentoIn(TipoFaturamento.ADIANTAMENTO, segmentos);
        }

        return adiantamentos.stream()
                .map(sf -> {
                    SituacaoOperacional statusOp = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(sf.getOsLpuDetalhe().getId())
                            .map(Lancamento::getSituacao)
                            .orElse(SituacaoOperacional.NAO_INICIADO);
                    boolean finalizado = (statusOp == SituacaoOperacional.FINALIZADO);
                    return new VisaoAdiantamentoDTO(sf, finalizado);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoFaturamentoDTO> getHistoricoFaturado(Long usuarioId) {
        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();
        Set<Segmento> segmentos = usuario.getSegmentos();

        List<StatusFaturamento> statusFaturado = List.of(StatusFaturamento.FATURADO);
        List<SolicitacaoFaturamento> historico;

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            historico = faturamentoRepo.findByStatusInWithDetails(statusFaturado);
        } else { // Coordenador
            if (segmentos.isEmpty()) return List.of();

            // ==========================================================
            // CORREÇÃO AQUI: Removido o "Os" extra do nome do método
            // ==========================================================
            historico = faturamentoRepo.findByStatusInAndSegmentoIn(statusFaturado, segmentos);
            // ==========================================================
        }

        return historico.stream()
                .map(SolicitacaoFaturamentoDTO::new)
                .collect(Collectors.toList());
    }
}