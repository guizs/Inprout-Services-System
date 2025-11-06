package br.com.inproutservices.inproutsystem.services.faturamento;

import br.com.inproutservices.inproutsystem.dtos.faturamento.FilaAdiantamentoDTO;
import br.com.inproutservices.inproutsystem.dtos.faturamento.FilaCoordenadorDTO;
import br.com.inproutservices.inproutsystem.dtos.faturamento.SolicitacaoFaturamentoDTO;
import br.com.inproutservices.inproutsystem.dtos.faturamento.VisaoAdiantamentoDTO;
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

    /**
     * FLUXO 1: Ação do Coordenador para solicitar o ID de faturamento.
     */
    @Transactional
    public SolicitacaoFaturamento solicitarIdFaturamento(Long osLpuDetalheId, Long coordinatorId) {
        Usuario coordenador = usuarioRepo.findById(coordinatorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário Coordenador não encontrado."));

        OsLpuDetalhe itemOS = osLpuDetalheRepo.findById(osLpuDetalheId)
                .orElseThrow(() -> new EntityNotFoundException("Item da OS (OsLpuDetalhe) não encontrado."));

        // Regra 1: Verifica se já existe uma solicitação
        if (faturamentoRepo.existsByOsLpuDetalheId(osLpuDetalheId)) {
            throw new BusinessException("Já existe uma solicitação de faturamento para este item.");
        }

        // Regra 2: (Opcional, mas recomendado) Verifica se o item está mesmo na etapa 06.05
        // Esta lógica pode ser ajustada, mas garante que o Coordenador só solicite
        // o que o sistema mandou.
        EtapaDetalhada etapaSolicitacao = etapaDetalhadaRepo.findByNome("06.05 - Solicitar ID").stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Etapa '06.05 - Solicitar ID' não encontrada no sistema."));

        boolean itemEstaNaEtapa = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(osLpuDetalheId)
                .map(Lancamento::getEtapaDetalhada)
                .map(etapa -> etapa.getId().equals(etapaSolicitacao.getId()))
                .orElse(false);

        if (!itemEstaNaEtapa) {
            throw new BusinessException("O último lançamento deste item não está na etapa '06.05 - Solicitar ID'.");
        }

        // Cria a nova solicitação
        SolicitacaoFaturamento solicitacao = new SolicitacaoFaturamento();
        solicitacao.setOsLpuDetalhe(itemOS);
        solicitacao.setSolicitante(coordenador);
        solicitacao.setStatus(StatusFaturamento.PENDENTE_ASSISTANT); // "ID SOLICITADO"
        solicitacao.setTipo(TipoFaturamento.REGULAR);

        return faturamentoRepo.save(solicitacao);
    }

    /**
     * FLUXO 1 e 2: Busca a fila de trabalho principal do Assistant.
     */
    @Transactional(readOnly = true)
    public List<SolicitacaoFaturamentoDTO> getFilaAssistant() {
        // Busca todos que não estão finalizados
        List<StatusFaturamento> statuses = List.of(
                StatusFaturamento.PENDENTE_ASSISTANT,
                StatusFaturamento.ID_RECEBIDO,
                StatusFaturamento.ID_RECUSADO
        );

        return faturamentoRepo.findByStatusInWithDetails(statuses).stream()
                .map(SolicitacaoFaturamentoDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FilaCoordenadorDTO> getFilaCoordinator() {
        // 1. Encontra a etapa "Solicitar ID"
        // (Certifique-se que o nome no banco é exatamente este)
        EtapaDetalhada etapaSolicitacao = etapaDetalhadaRepo.findByNome("06.05 - Solicitar ID").stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Etapa '06.05 - Solicitar ID' não foi cadastrada no sistema."));

        // 2. Busca todos os lançamentos que estão nessa etapa
        List<Lancamento> lancamentosNaEtapa = lancamentoRepo.findAllByEtapaDetalhadaId(etapaSolicitacao.getId());

        return lancamentosNaEtapa.stream()
                // 3. Filtra
                .filter(lancamento -> {
                    OsLpuDetalhe detalhe = lancamento.getOsLpuDetalhe();
                    if (detalhe == null) return false;

                    // Regra A: O campo de data de faturamento (dataFatInprout) DEVE estar vazio
                    boolean faturado = detalhe.getDataFatInprout() != null;
                    if (faturado) return false;

                    // Regra B: Não pode já existir uma solicitação de faturamento em andamento para este item
                    boolean solicitacaoEmAberto = faturamentoRepo.existsByOsLpuDetalheId(detalhe.getId());

                    return !solicitacaoEmAberto;
                })
                // 4. Converte para o DTO
                .map(FilaCoordenadorDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public SolicitacaoFaturamento alterarStatus(Long solicitacaoId, Long assistantId, StatusFaturamento novoStatus, String motivo) {
        SolicitacaoFaturamento solicitacao = faturamentoRepo.findById(solicitacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação de faturamento não encontrada."));

        Usuario assistant = usuarioRepo.findById(assistantId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário Assistant não encontrado."));

        // Validação de Ação
        if (novoStatus == StatusFaturamento.ID_RECUSADO && (motivo == null || motivo.isBlank())) {
            throw new BusinessException("O motivo é obrigatório para recusar a solicitação.");
        }

        // --- LÓGICA PRINCIPAL ---
        solicitacao.setStatus(novoStatus);
        solicitacao.setResponsavel(assistant); // Define quem executou a ação
        solicitacao.setDataUltimaAcao(LocalDateTime.now());

        if (novoStatus == StatusFaturamento.ID_RECUSADO) {
            solicitacao.setObservacao(motivo);
        }

        // Se a ação for "FATURADO", atualizamos a data na entidade OsLpuDetalhe
        if (novoStatus == StatusFaturamento.FATURADO) {
            OsLpuDetalhe detalhe = solicitacao.getOsLpuDetalhe();
            if (detalhe != null) {
                // Preenche o campo 'dataFatInprout' (ou outro campo que você defina como o "final")
                detalhe.setDataFatInprout(LocalDate.now());
                osLpuDetalheRepo.save(detalhe);
            }
        }

        return faturamentoRepo.save(solicitacao);
    }

    @Transactional(readOnly = true)
    public List<FilaAdiantamentoDTO> getFilaAdiantamentoCoordinator() {
        // 1. Encontra a etapa "Solicitar ID" para poder *excluí-la* da busca
        EtapaDetalhada etapaSolicitacao = etapaDetalhadaRepo.findByNome("06.05 - Solicitar ID").stream().findFirst()
                .orElse(null); // Não lança exceção, apenas será nulo se não existir

        Long etapaSolicitacaoId = (etapaSolicitacao != null) ? etapaSolicitacao.getId() : -1L; // ID inválido se não achar

        // 2. Busca todos os itens de OS (OsLpuDetalhe)
        return osLpuDetalheRepo.findAll().stream()
                .filter(detalhe -> {
                    // REGRA 1: Não pode já estar faturado (data final preenchida)
                    if (detalhe.getDataFatInprout() != null) {
                        return false;
                    }

                    // REGRA 2: Não pode já ter uma solicitação em andamento
                    if (faturamentoRepo.existsByOsLpuDetalheId(detalhe.getId())) {
                        return false;
                    }

                    // 3. Pega o último lançamento daquele item
                    Optional<Lancamento> ultimoLancamentoOpt = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(detalhe.getId());
                    if (ultimoLancamentoOpt.isEmpty()) {
                        return false; // Item sem lançamento não pode ser adiantado
                    }
                    Lancamento ultimoLancamento = ultimoLancamentoOpt.get();

                    // REGRA 3: Não pode estar na etapa "06.05" (pois já está na outra fila)
                    if (ultimoLancamento.getEtapaDetalhada() != null &&
                            ultimoLancamento.getEtapaDetalhada().getId().equals(etapaSolicitacaoId)) {
                        return false;
                    }

                    // REGRA 4: Não pode estar "Finalizado" (pois deveria ir para a fila 06.05)
                    if (ultimoLancamento.getSituacao() == SituacaoOperacional.FINALIZADO) {
                        return false;
                    }

                    // Se passou por todas as regras, é elegível para adiantamento
                    return true;
                })
                // 4. Mapeia para o DTO, incluindo o status operacional
                .map(detalhe -> {
                    // Pega o status do último lançamento (que já buscamos)
                    SituacaoOperacional status = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(detalhe.getId())
                            .map(Lancamento::getSituacao)
                            .orElse(SituacaoOperacional.NAO_INICIADO);
                    return new FilaAdiantamentoDTO(detalhe, status);
                })
                .collect(Collectors.toList());
    }

    /**
     * FLUXO 2: Ação do Coordenador para solicitar o ADIANTAMENTO.
     */
    @Transactional
    public SolicitacaoFaturamento solicitarAdiantamento(Long osLpuDetalheId, Long coordinatorId) {
        Usuario coordenador = usuarioRepo.findById(coordinatorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário Coordenador não encontrado."));

        OsLpuDetalhe itemOS = osLpuDetalheRepo.findById(osLpuDetalheId)
                .orElseThrow(() -> new EntityNotFoundException("Item da OS (OsLpuDetalhe) não encontrado."));

        // Regra: Verifica se já existe uma solicitação
        if (faturamentoRepo.existsByOsLpuDetalheId(osLpuDetalheId)) {
            throw new BusinessException("Já existe uma solicitação de faturamento para este item.");
        }

        // Cria a nova solicitação
        SolicitacaoFaturamento solicitacao = new SolicitacaoFaturamento();
        solicitacao.setOsLpuDetalhe(itemOS);
        solicitacao.setSolicitante(coordenador);
        solicitacao.setStatus(StatusFaturamento.PENDENTE_ASSISTANT); // "ID SOLICITADO"
        solicitacao.setTipo(TipoFaturamento.ADIANTAMENTO); // <-- AQUI ESTÁ A DIFERENÇA
        solicitacao.setObservacao("Solicitação de adiantamento de faturamento.");

        return faturamentoRepo.save(solicitacao);
    }

    @Transactional(readOnly = true)
    public List<VisaoAdiantamentoDTO> getVisaoAdiantamentos(Long usuarioId) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        List<SolicitacaoFaturamento> adiantamentos;

        if (usuario.getRole() == Role.ADMIN || usuario.getRole() == Role.CONTROLLER || usuario.getRole() == Role.ASSISTANT) {
            adiantamentos = faturamentoRepo.findByTipoWithDetails(TipoFaturamento.ADIANTAMENTO);
        } else {
            // Coordenador vê apenas seus segmentos
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) return List.of();
            adiantamentos = faturamentoRepo.findByTipoAndSegmentoIn(TipoFaturamento.ADIANTAMENTO, segmentos);
        }

        // Mapeia para o DTO, aplicando a regra de destaque
        return adiantamentos.stream()
                .map(sf -> {
                    // Pega o último status operacional do item
                    SituacaoOperacional statusOp = lancamentoRepo.findFirstByOsLpuDetalheIdOrderByIdDesc(sf.getOsLpuDetalhe().getId())
                            .map(Lancamento::getSituacao)
                            .orElse(SituacaoOperacional.NAO_INICIADO);

                    boolean finalizado = (statusOp == SituacaoOperacional.FINALIZADO);

                    return new VisaoAdiantamentoDTO(sf, finalizado);
                })
                .collect(Collectors.toList());
    }

    /**
     * FLUXO 3: Busca o "Histórico Faturado".
     */
    @Transactional(readOnly = true)
    public List<SolicitacaoFaturamentoDTO> getHistoricoFaturado(Long usuarioId) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        List<StatusFaturamento> statusFaturado = List.of(StatusFaturamento.FATURADO);
        List<SolicitacaoFaturamento> historico;

        if (usuario.getRole() == Role.ADMIN || usuario.getRole() == Role.CONTROLLER || usuario.getRole() == Role.ASSISTANT) {
            historico = faturamentoRepo.findByStatusInWithDetails(statusFaturado);
        } else {
            // Coordenador vê apenas seus segmentos
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) return List.of();
            historico = faturamentoRepo.findByStatusInAndSegmentoIn(statusFaturado, segmentos);
        }

        return historico.stream()
                .map(SolicitacaoFaturamentoDTO::new)
                .collect(Collectors.toList());
    }
}