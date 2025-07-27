package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.AcaoControllerDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.AcaoCoordenadorDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoRequestDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Comentario;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Prestador;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.ComentarioRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.index.EtapaDetalhadaRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import br.com.inproutservices.inproutsystem.repositories.index.PrestadorRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import br.com.inproutservices.inproutsystem.services.config.PrazoService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LancamentoServiceImpl implements LancamentoService {

    private final LancamentoRepository lancamentoRepository;
    private final OsRepository osRepository;
    private final UsuarioRepository usuarioRepository;
    private final PrazoService prazoService;
    private final ComentarioRepository comentarioRepository;
    private final PrestadorRepository prestadorRepository;
    private final EtapaDetalhadaRepository etapaDetalhadaRepository;
    private final LpuRepository lpuRepository;

    public LancamentoServiceImpl(LancamentoRepository lancamentoRepository, OsRepository osRepository,
                                 UsuarioRepository usuarioRepository, PrazoService prazoService,
                                 ComentarioRepository comentarioRepository, PrestadorRepository prestadorRepository,
                                 EtapaDetalhadaRepository etapaDetalhadaRepository, LpuRepository lpuRepository) {
        this.lancamentoRepository = lancamentoRepository;
        this.osRepository = osRepository;
        this.usuarioRepository = usuarioRepository;
        this.prazoService = prazoService;
        this.comentarioRepository = comentarioRepository;
        this.prestadorRepository = prestadorRepository;
        this.etapaDetalhadaRepository = etapaDetalhadaRepository;
        this.lpuRepository = lpuRepository;
    }

    @Override
    @Transactional
    public Lancamento submeterLancamentoManualmente(Long lancamentoId, Long managerId) {
        // Id do manager pode ser usado para validação de permissão no futuro
        Lancamento lancamento = getLancamentoById(lancamentoId);

        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.RASCUNHO) {
            throw new BusinessException("Apenas lançamentos em Rascunho podem ser submetidos.");
        }

        LocalDate novoPrazo = prazoService.calcularPrazoEmDiasUteis(LocalDate.now(), 3);
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_COORDENADOR);
        lancamento.setDataSubmissao(LocalDateTime.now());
        lancamento.setDataPrazo(novoPrazo);
        lancamento.setUltUpdate(LocalDateTime.now());

        return lancamentoRepository.save(lancamento);
    }

    @Scheduled(cron = "0 0 0 * * ?") // Roda todo dia à meia-noite
    @Transactional
    public void criarLancamentosParaProjetosEmAndamento() {
        // 1. Precisamos de uma forma de encontrar o último lançamento de cada projeto (OS/LPU)
        // Esta é uma query complexa. A lógica simplificada seria:
        List<OS> todasAsOs = osRepository.findAll(); // Busca todas as OS
        for (OS os : todasAsOs) {
            // Para cada OS, busca o lançamento mais recente
            // O ideal é criar um método específico no repositório para isso. Ex: findTopByOsIdOrderByIdDesc(os.getId())
            Lancamento ultimoLancamento = lancamentoRepository.findFirstByOsIdOrderByIdDesc(os.getId()).orElse(null);

            if (ultimoLancamento != null && ultimoLancamento.getSituacao() == SituacaoOperacional.EM_ANDAMENTO) {
                // 2. Se a situação for "Em andamento", cria uma cópia
                Lancamento novoLancamento = new Lancamento();

                novoLancamento.setOs(ultimoLancamento.getOs());
                novoLancamento.setManager(ultimoLancamento.getManager());
                novoLancamento.setPrestador(ultimoLancamento.getPrestador());
                novoLancamento.setEtapaDetalhada(ultimoLancamento.getEtapaDetalhada());
                novoLancamento.setEquipe(ultimoLancamento.getEquipe());
                novoLancamento.setVistoria(ultimoLancamento.getVistoria());
                novoLancamento.setPlanoVistoria(ultimoLancamento.getPlanoVistoria());
                novoLancamento.setDesmobilizacao(ultimoLancamento.getDesmobilizacao());
                novoLancamento.setPlanoDesmobilizacao(ultimoLancamento.getPlanoDesmobilizacao());
                novoLancamento.setInstalacao(ultimoLancamento.getInstalacao());
                novoLancamento.setPlanoInstalacao(ultimoLancamento.getPlanoInstalacao());
                novoLancamento.setAtivacao(ultimoLancamento.getAtivacao());
                novoLancamento.setPlanoAtivacao(ultimoLancamento.getPlanoAtivacao());
                novoLancamento.setDocumentacao(ultimoLancamento.getDocumentacao());
                novoLancamento.setPlanoDocumentacao(ultimoLancamento.getPlanoDocumentacao());
                novoLancamento.setStatus(ultimoLancamento.getStatus());
                novoLancamento.setValor(ultimoLancamento.getValor());

                // Define um detalhe diário padrão para a nova atividade
                novoLancamento.setDetalheDiario("Lançamento diário automático para atividade em andamento.");

                // Define os novos valores para o lançamento do dia atual
                novoLancamento.setDataAtividade(LocalDate.now()); // Data do dia atual
                novoLancamento.setSituacao(SituacaoOperacional.EM_ANDAMENTO);
                novoLancamento.setSituacaoAprovacao(SituacaoAprovacao.RASCUNHO);

                lancamentoRepository.save(novoLancamento);
            }
        }
    }

    @Override
    @Transactional
    public Lancamento criarLancamento(LancamentoRequestDTO dto, Long managerId) {
        // 1. Validação da Data da Atividade (lógica que já tínhamos)
        LocalDate hoje = LocalDate.now();
        LocalDate dataMinimaPermitida;

        if (hoje.getDayOfWeek() == DayOfWeek.MONDAY) {
            dataMinimaPermitida = hoje.minusDays(3);
        } else {
            dataMinimaPermitida = prazoService.getDiaUtilAnterior(hoje);
        }

        if (dto.dataAtividade().isBefore(dataMinimaPermitida)) {
            throw new BusinessException(
                    "Não é permitido criar lançamentos para datas anteriores a " +
                            dataMinimaPermitida.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            );
        }

        // 2. Busca de TODAS as entidades relacionadas pelos IDs recebidos no DTO
        OS os = osRepository.findById(dto.osId())
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + dto.osId()));

        Usuario manager = usuarioRepository.findById(managerId)
                .orElseThrow(() -> new EntityNotFoundException("Manager não encontrado com o ID: " + managerId));

        Lpu lpu = lpuRepository.findById(dto.lpuId())
                .orElseThrow(() -> new EntityNotFoundException("LPU não encontrada com o ID: " + dto.lpuId()));

        Prestador prestador = prestadorRepository.findById(dto.prestadorId())
                .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado com o ID: " + dto.prestadorId()));

        EtapaDetalhada etapaDetalhada = etapaDetalhadaRepository.findById(dto.etapaDetalhadaId())
                .orElseThrow(() -> new EntityNotFoundException("Etapa Detalhada não encontrada com o ID: " + dto.etapaDetalhadaId()));


        // 3. Criação e Mapeamento da nova entidade Lancamento
        Lancamento lancamento = new Lancamento();

        // Associa as entidades completas que buscamos
        lancamento.setOs(os);
        lancamento.setManager(manager);
        lancamento.setPrestador(prestador);
        lancamento.setEtapaDetalhada(etapaDetalhada);
        lancamento.setLpu(lpu);

        // Define os status e datas iniciais do fluxo
        lancamento.setDataAtividade(dto.dataAtividade());
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.RASCUNHO);
        lancamento.setUltUpdate(LocalDateTime.now());

        // Mapeia os outros dados do DTO que são campos simples
        lancamento.setEquipe(dto.equipe());
        lancamento.setVistoria(dto.vistoria());
        lancamento.setPlanoVistoria(dto.planoVistoria());
        lancamento.setDesmobilizacao(dto.desmobilizacao());
        lancamento.setPlanoDesmobilizacao(dto.planoDesmobilizacao());
        lancamento.setInstalacao(dto.instalacao());
        lancamento.setPlanoInstalacao(dto.planoInstalacao());
        lancamento.setAtivacao(dto.ativacao());
        lancamento.setPlanoAtivacao(dto.planoAtivacao());
        lancamento.setDocumentacao(dto.documentacao());
        lancamento.setPlanoDocumentacao(dto.planoDocumentacao());
        lancamento.setStatus(dto.status());
        lancamento.setDetalheDiario(dto.detalheDiario());
        lancamento.setValor(dto.valor());
        lancamento.setSituacao(dto.situacao());

        // 4. Salva o novo lançamento no banco de dados
        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public void submeterLancamentosDiarios() {
        // 1. Define a data que será usada no filtro (o dia anterior)
        LocalDate ontem = LocalDate.now().minusDays(1);

        // 2. Busca apenas os rascunhos com a data da atividade de ontem
        List<Lancamento> rascunhosDeOntem = lancamentoRepository.findBySituacaoAprovacaoAndDataAtividade(SituacaoAprovacao.RASCUNHO, ontem);

        // 3. O resto da lógica continua a mesma, mas agora iterando sobre a lista filtrada
        for (Lancamento lancamento : rascunhosDeOntem) {
            LocalDate novoPrazo = prazoService.calcularPrazoEmDiasUteis(LocalDate.now(), 3);
            lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_COORDENADOR);
            lancamento.setDataSubmissao(LocalDateTime.now());
            lancamento.setDataPrazo(novoPrazo);
            lancamentoRepository.save(lancamento);
        }
    }

    @Override
    @Transactional
    public Lancamento aprovarPeloCoordenador(Long lancamentoId, Long coordenadorId) {
        Lancamento lancamento = getLancamentoById(lancamentoId);

        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.PENDENTE_COORDENADOR) {
            throw new BusinessException("Este lançamento não está pendente de aprovação pelo Coordenador.");
        }

        // A lógica da sequência agora usa o método correto e mais simples do repositório
        Lancamento maisAntigo = lancamentoRepository
                .findFirstByOsIdAndSituacaoAprovacaoOrderByDataCriacaoAsc(
                        lancamento.getOs().getId(),
                        SituacaoAprovacao.PENDENTE_COORDENADOR)
                .orElse(null);

        if (maisAntigo == null || !maisAntigo.getId().equals(lancamento.getId())) {
            throw new BusinessException("Existe um lançamento mais antigo para esta OS que precisa ser resolvido primeiro.");
        }

        lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_CONTROLLER);
        lancamento.setUltUpdate(LocalDateTime.now());
        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento solicitarNovoPrazo(Long lancamentoId, AcaoCoordenadorDTO dto) {
        Lancamento lancamento = getLancamentoById(lancamentoId);
        Usuario coordenador = usuarioRepository.findById(dto.coordenadorId())
                .orElseThrow(() -> new EntityNotFoundException("Coordenador não encontrado com ID: " + dto.coordenadorId()));
        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.PENDENTE_COORDENADOR) {
            throw new BusinessException("A solicitação de prazo só pode ser feita para lançamentos pendentes do Coordenador.");
        }
        if (dto.novaDataSugerida() == null) {
            throw new BusinessException("Uma nova data para o prazo deve ser sugerida.");
        }

        Comentario novoComentario = new Comentario();
        novoComentario.setLancamento(lancamento);
        novoComentario.setAutor(coordenador);
        novoComentario.setTexto(dto.comentario());
        lancamento.getComentarios().add(novoComentario);

        lancamento.setSituacaoAprovacao(SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO);
        lancamento.setDataPrazoProposta(dto.novaDataSugerida()); // Salva a data que veio no DTO
        lancamento.setUltUpdate(LocalDateTime.now());

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento aprovarPeloController(Long lancamentoId, Long controllerId) {
        Lancamento lancamento = lancamentoRepository.findById(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com ID: " + lancamentoId));

        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.PENDENTE_CONTROLLER) {
            throw new BusinessException("Este lançamento não está pendente de aprovação pelo Controller.");
        }

        lancamento.setSituacaoAprovacao(SituacaoAprovacao.APROVADO);
        lancamento.setUltUpdate(LocalDateTime.now());

        // A LPU correta agora é pega diretamente do Lançamento, não mais através da OS.
        Lpu lpuDoLancamento = lancamento.getLpu();

        if (lpuDoLancamento != null) {
            // Atualiza o campo 'situacaoProjeto' da LPU com a situação do lançamento aprovado
            lpuDoLancamento.setSituacaoProjeto(lancamento.getSituacao());
            // Salva a entidade LPU atualizada no banco de dados.
            // Lembre-se de injetar o LpuRepository na sua classe LancamentoServiceImpl
            lpuRepository.save(lpuDoLancamento);
        }

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional(readOnly = true)
    public Lancamento getLancamentoById(Long id) {
        return lancamentoRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com o ID: " + id));
    }

    @Override
    @Transactional
    public Lancamento aprovarExtensaoPrazo(Long lancamentoId, Long controllerId) {
        Lancamento lancamento = lancamentoRepository.findById(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com ID: " + lancamentoId));

        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO) {
            throw new BusinessException("Este lançamento não está aguardando uma decisão sobre o prazo.");
        }

        lancamento.setDataPrazo(lancamento.getDataPrazoProposta());
        lancamento.setDataPrazoProposta(null);
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_COORDENADOR);
        lancamento.setUltUpdate(LocalDateTime.now());

        // TODO: Adicionar um comentário automático informando que o prazo foi aprovado pelo Controller.

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento atualizarLancamento(Long id, LancamentoRequestDTO dto) {
        // 1. Busca o lançamento existente no banco
        Lancamento lancamento = lancamentoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com o ID: " + id));

        // 2. Valida se o lançamento está em um status que permite edição
        SituacaoAprovacao statusAtual = lancamento.getSituacaoAprovacao();
        if (statusAtual != SituacaoAprovacao.RASCUNHO &&
                statusAtual != SituacaoAprovacao.RECUSADO_COORDENADOR &&
                statusAtual != SituacaoAprovacao.RECUSADO_CONTROLLER) {
            throw new BusinessException("Este lançamento não pode ser editado. Status atual: " + statusAtual);
        }

        // 3. Busca as entidades relacionadas (Prestador e Etapa) para garantir que os novos IDs são válidos
        Prestador prestador = prestadorRepository.findById(dto.prestadorId())
                .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado com o ID: " + dto.prestadorId()));

        EtapaDetalhada etapaDetalhada = etapaDetalhadaRepository.findById(dto.etapaDetalhadaId())
                .orElseThrow(() -> new EntityNotFoundException("Etapa Detalhada não encontrada com o ID: " + dto.etapaDetalhadaId()));

        // 4. Atualiza os campos do lançamento com os dados do DTO
        lancamento.setPrestador(prestador);
        lancamento.setEtapaDetalhada(etapaDetalhada);
        lancamento.setEquipe(dto.equipe());
        lancamento.setVistoria(dto.vistoria());
        lancamento.setPlanoVistoria(dto.planoVistoria());
        lancamento.setDesmobilizacao(dto.desmobilizacao());
        lancamento.setPlanoDesmobilizacao(dto.planoDesmobilizacao());
        lancamento.setInstalacao(dto.instalacao());
        lancamento.setPlanoInstalacao(dto.planoInstalacao());
        lancamento.setAtivacao(dto.ativacao());
        lancamento.setPlanoAtivacao(dto.planoAtivacao());
        lancamento.setDocumentacao(dto.documentacao());
        lancamento.setPlanoDocumentacao(dto.planoDocumentacao());
        lancamento.setStatus(dto.status());
        lancamento.setSituacao(dto.situacao());
        lancamento.setDetalheDiario(dto.detalheDiario());
        lancamento.setValor(dto.valor());

        lancamento.setSituacaoAprovacao(dto.situacaoAprovacao());

        if(dto.situacaoAprovacao() == SituacaoAprovacao.PENDENTE_COORDENADOR){
            lancamento.setDataSubmissao(LocalDateTime.now());
            lancamento.setDataPrazo(prazoService.calcularPrazoEmDiasUteis(LocalDate.now(), 3));
        }

        lancamento.setUltUpdate(LocalDateTime.now());

        // 6. Salva as alterações no banco de dados
        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento rejeitarExtensaoPrazo(Long lancamentoId, AcaoControllerDTO dto) {
        Lancamento lancamento = getLancamentoById(lancamentoId);
        Usuario controller = usuarioRepository.findById(dto.controllerId())
                .orElseThrow(() -> new EntityNotFoundException("Controller não encontrado com ID: " + dto.controllerId()));

        // Validações
        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO) {
            throw new BusinessException("Este lançamento não está aguardando uma decisão sobre o prazo.");
        }
        if (dto.motivoRejeicao() == null || dto.motivoRejeicao().isBlank()) {
            throw new BusinessException("O motivo da rejeição da extensão de prazo é obrigatório.");
        }
        if (dto.novaDataPrazo() == null) {
            throw new BusinessException("Uma nova data de prazo definida pelo Controller é obrigatória ao rejeitar a solicitação.");
        }

        // Limpa a data que o Coordenador havia proposto
        lancamento.setDataPrazoProposta(null);

        // ATUALIZA o prazo oficial com a data definida pelo Controller
        lancamento.setDataPrazo(dto.novaDataPrazo());

        // Devolve o lançamento para a fila do Coordenador
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_COORDENADOR);

        // Adiciona o comentário explicando a recusa da extensão
        Comentario comentarioRecusa = new Comentario();
        comentarioRecusa.setLancamento(lancamento);
        comentarioRecusa.setAutor(controller);
        comentarioRecusa.setTexto("Solicitação de novo prazo rejeitada. Motivo: " + dto.motivoRejeicao());
        lancamento.getComentarios().add(comentarioRecusa);

        lancamento.setUltUpdate(LocalDateTime.now());

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lancamento> getAllLancamentos() {

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        String userEmail;
        if (principal instanceof UserDetails) {
            userEmail = ((UserDetails) principal).getUsername();
        } else {
            userEmail = principal.toString();
        }

        if ("anonymousUser".equals(userEmail)) {
            return lancamentoRepository.findAllWithDetails();
        }

        Usuario usuarioLogado = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuário '" + userEmail + "' não encontrado no banco de dados."));

        List<Lancamento> todosLancamentos = lancamentoRepository.findAllWithDetails();

        Role role = usuarioLogado.getRole();
        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            return todosLancamentos;
        }

        if (role == Role.MANAGER || role == Role.COORDINATOR) {
            Set<Long> segmentosDoUsuario = usuarioLogado.getSegmentos().stream()
                    .map(Segmento::getId)
                    .collect(Collectors.toSet());

            if (segmentosDoUsuario.isEmpty()) {
                return List.of();
            }

            return todosLancamentos.stream()
                    .filter(lancamento -> lancamento.getOs() != null &&
                            lancamento.getOs().getSegmento() != null &&
                            segmentosDoUsuario.contains(lancamento.getOs().getSegmento().getId()))
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lancamento> getHistoricoPorUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado com o ID: " + usuarioId));

        Role role = usuario.getRole();
        List<SituacaoAprovacao> statusHistorico = List.of(SituacaoAprovacao.APROVADO, SituacaoAprovacao.RECUSADO_COORDENADOR, SituacaoAprovacao.RECUSADO_CONTROLLER);

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            return lancamentoRepository.findBySituacaoAprovacaoIn(statusHistorico);
        }

        if (role == Role.MANAGER || role == Role.COORDINATOR) {
            Set<Segmento> segmentosDoUsuario = usuario.getSegmentos();
            if (segmentosDoUsuario.isEmpty()) {
                return List.of();
            }
            return lancamentoRepository.findBySituacaoAprovacaoInAndOsSegmentoIn(statusHistorico, segmentosDoUsuario);
        }

        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lancamento> listarPendentesPorUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado com o ID: " + usuarioId));

        Role role = usuario.getRole();

        if (role == Role.COORDINATOR) {
            List<SituacaoAprovacao> statusPendentes = List.of(SituacaoAprovacao.PENDENTE_COORDENADOR);
            Set<Segmento> segmentosDoUsuario = usuario.getSegmentos();
            if (segmentosDoUsuario.isEmpty()) {
                return List.of();
            }
            return lancamentoRepository.findBySituacaoAprovacaoInAndOsSegmentoIn(statusPendentes, segmentosDoUsuario);
        } else if (role == Role.CONTROLLER || role == Role.ADMIN) {
            List<SituacaoAprovacao> statusPendentes = List.of(
                    SituacaoAprovacao.PENDENTE_CONTROLLER,
                    SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO,
                    SituacaoAprovacao.PRAZO_VENCIDO
            );
            return lancamentoRepository.findBySituacaoAprovacaoIn(statusPendentes);
        }

        return List.of(); // Retorna lista vazia para outras roles
    }

    @Override
    @Transactional
    public Lancamento rejeitarPeloCoordenador(Long lancamentoId, AcaoCoordenadorDTO dto) {
        Lancamento lancamento = getLancamentoById(lancamentoId);
        Usuario coordenador = usuarioRepository.findById(dto.coordenadorId())
                .orElseThrow(() -> new EntityNotFoundException("Coordenador não encontrado com ID: " + dto.coordenadorId()));

        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.PENDENTE_COORDENADOR) {
            throw new BusinessException("Este lançamento não pode ser rejeitado pelo Coordenador (Status atual: " + lancamento.getSituacaoAprovacao() + ").");
        }
        if (dto.comentario() == null || dto.comentario().isBlank()) {
            throw new BusinessException("O motivo da rejeição é obrigatório.");
        }

        // Adiciona o comentário de rejeição
        Comentario comentarioRejeicao = new Comentario();
        comentarioRejeicao.setLancamento(lancamento);
        comentarioRejeicao.setAutor(coordenador);
        comentarioRejeicao.setTexto("Rejeitado pelo Coordenador. Motivo: " + dto.comentario());
        lancamento.getComentarios().add(comentarioRejeicao);

        // Define o novo status
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_COORDENADOR);
        lancamento.setUltUpdate(LocalDateTime.now());

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento rejeitarPeloController(Long lancamentoId, AcaoControllerDTO dto) {
        Lancamento lancamento = getLancamentoById(lancamentoId);
        Usuario controller = usuarioRepository.findById(dto.controllerId())
                .orElseThrow(() -> new EntityNotFoundException("Controller não encontrado com ID: " + dto.controllerId()));

        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.PENDENTE_CONTROLLER) {
            throw new BusinessException("Este lançamento não pode ser rejeitado pelo Controller (Status atual: " + lancamento.getSituacaoAprovacao() + ").");
        }

        // A validação do motivo no seu código original estava para prazo, vamos ajustar
        if (dto.motivoRejeicao() == null || dto.motivoRejeicao().isBlank()) {
            throw new BusinessException("O motivo da rejeição é obrigatório.");
        }

        Comentario comentarioRejeicao = new Comentario();
        comentarioRejeicao.setLancamento(lancamento);
        comentarioRejeicao.setAutor(controller);
        comentarioRejeicao.setTexto("Rejeitado pelo Controller. Motivo: " + dto.motivoRejeicao());
        lancamento.getComentarios().add(comentarioRejeicao);

        // === MUDANÇA PRINCIPAL AQUI ===
        // Antes: PENDENTE_COORDENADOR
        // Agora: RECUSADO_CONTROLLER
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_CONTROLLER);
        lancamento.setUltUpdate(LocalDateTime.now());

        // Removemos a lógica de prazo que estava aqui, pois este é um fluxo de rejeição simples
        // lancamento.setDataPrazo(novoPrazo);

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento reenviarParaAprovacao(Long lancamentoId, Long managerId) {
        Lancamento lancamento = getLancamentoById(lancamentoId);
        Usuario manager = usuarioRepository.findById(managerId)
                .orElseThrow(() -> new EntityNotFoundException("Manager não encontrado com ID: " + managerId));

        // Valida se o lançamento está em um dos status de rejeição
        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.RECUSADO_COORDENADOR &&
                lancamento.getSituacaoAprovacao() != SituacaoAprovacao.RECUSADO_CONTROLLER) {
            throw new BusinessException("Este lançamento não está em status de rejeição e não pode ser reenviado.");
        }

        // Adiciona um comentário automático
        Comentario comentarioReenvio = new Comentario();
        comentarioReenvio.setLancamento(lancamento);
        comentarioReenvio.setAutor(manager);
        comentarioReenvio.setTexto("Lançamento corrigido e reenviado para aprovação.");
        lancamento.getComentarios().add(comentarioReenvio);

        // === MUDANÇA PRINCIPAL AQUI ===
        // Define o status diretamente para a fila do Coordenador, pulando o Rascunho.
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_COORDENADOR);
        lancamento.setUltUpdate(LocalDateTime.now());

        // Opcional: Recalcular o prazo para o coordenador
        LocalDate novoPrazo = prazoService.calcularPrazoEmDiasUteis(LocalDate.now(), 3);
        lancamento.setDataPrazo(novoPrazo);

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento salvarComoRascunho(Long id, LancamentoRequestDTO dto) {
        // 1. Busca o lançamento existente no banco
        Lancamento lancamento = lancamentoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com o ID: " + id));

        // 2. Validação CRÍTICA: Garante que o método só funcione para Rascunhos
        if (lancamento.getSituacaoAprovacao() != SituacaoAprovacao.RASCUNHO) {
            throw new BusinessException("Este lançamento não é um rascunho e não pode ser salvo desta forma. Status atual: " + lancamento.getSituacaoAprovacao());
        }

        // 3. Busca as entidades relacionadas para garantir que os novos IDs são válidos
        Prestador prestador = prestadorRepository.findById(dto.prestadorId())
                .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado com o ID: " + dto.prestadorId()));

        EtapaDetalhada etapaDetalhada = etapaDetalhadaRepository.findById(dto.etapaDetalhadaId())
                .orElseThrow(() -> new EntityNotFoundException("Etapa Detalhada não encontrada com o ID: " + dto.etapaDetalhadaId()));

        Lpu lpu = lpuRepository.findById(dto.lpuId())
                .orElseThrow(() -> new EntityNotFoundException("LPU não encontrada com o ID: " + dto.lpuId()));


        lancamento.setPrestador(prestador);
        lancamento.setEtapaDetalhada(etapaDetalhada);
        lancamento.setLpu(lpu);
        lancamento.setEquipe(dto.equipe());
        lancamento.setVistoria(dto.vistoria());
        lancamento.setPlanoVistoria(dto.planoVistoria());
        lancamento.setDesmobilizacao(dto.desmobilizacao());
        lancamento.setPlanoDesmobilizacao(dto.planoDesmobilizacao());
        lancamento.setInstalacao(dto.instalacao());
        lancamento.setPlanoInstalacao(dto.planoInstalacao());
        lancamento.setAtivacao(dto.ativacao());
        lancamento.setPlanoAtivacao(dto.planoAtivacao());
        lancamento.setDocumentacao(dto.documentacao());
        lancamento.setPlanoDocumentacao(dto.planoDocumentacao());
        lancamento.setStatus(dto.status());
        lancamento.setSituacao(dto.situacao());
        lancamento.setDetalheDiario(dto.detalheDiario());
        lancamento.setValor(dto.valor());

        lancamento.setUltUpdate(LocalDateTime.now());

        return lancamentoRepository.save(lancamento);
    }
}