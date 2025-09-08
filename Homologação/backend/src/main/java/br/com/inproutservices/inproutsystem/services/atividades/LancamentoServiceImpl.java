package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.*;
import br.com.inproutservices.inproutsystem.entities.atividades.Comentario;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
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
import br.com.inproutservices.inproutsystem.repositories.atividades.OsLpuDetalheRepository;
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

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
    private final OsLpuDetalheRepository osLpuDetalheRepository;

    public LancamentoServiceImpl(LancamentoRepository lancamentoRepository, OsRepository osRepository,
                                 UsuarioRepository usuarioRepository, PrazoService prazoService,
                                 ComentarioRepository comentarioRepository, PrestadorRepository prestadorRepository,
                                 EtapaDetalhadaRepository etapaDetalhadaRepository, LpuRepository lpuRepository,
                                 OsLpuDetalheRepository osLpuDetalheRepository) {
        this.lancamentoRepository = lancamentoRepository;
        this.osRepository = osRepository;
        this.usuarioRepository = usuarioRepository;
        this.prazoService = prazoService;
        this.comentarioRepository = comentarioRepository;
        this.prestadorRepository = prestadorRepository;
        this.etapaDetalhadaRepository = etapaDetalhadaRepository;
        this.lpuRepository = lpuRepository;
        this.osLpuDetalheRepository = osLpuDetalheRepository;
    }

    // ... (todos os outros métodos do service permanecem iguais)
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

    //@Scheduled(cron = "0 0 0 * * ?") // Roda todo dia à meia-noite
    @Transactional
    public void criarLancamentosParaProjetosEmAndamento() {
        // 1. Busca todas as linhas de detalhe, que são as verdadeiras unidades de projeto agora.
        List<OsLpuDetalhe> todosOsDetalhes = osLpuDetalheRepository.findAll();

        for (OsLpuDetalhe detalhe : todosOsDetalhes) {
            // 2. Para cada linha de detalhe, busca o seu lançamento mais recente
            Lancamento ultimoLancamento = lancamentoRepository
                    .findFirstByOsLpuDetalheIdOrderByIdDesc(detalhe.getId())
                    .orElse(null);

            if (ultimoLancamento != null && ultimoLancamento.getSituacao() == SituacaoOperacional.EM_ANDAMENTO) {
                // 3. Se a situação do último lançamento for "Em andamento", cria uma cópia
                Lancamento novoLancamento = new Lancamento();

                // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
                // O novo lançamento pertence à mesma linha de detalhe do anterior.
                novoLancamento.setOsLpuDetalhe(ultimoLancamento.getOsLpuDetalhe());

                // Copia os campos que não mudam de um dia para o outro
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

        // 1. Validação de Projeto Finalizado (lógica existente, permanece igual)
        boolean projetoFinalizado = lancamentoRepository.existsByOsLpuDetalheIdAndSituacao(
                dto.osLpuDetalheId(),
                SituacaoOperacional.FINALIZADO
        );
        if (projetoFinalizado) {
            throw new BusinessException("Não é possível criar um novo lançamento para um projeto que já foi finalizado.");
        }

        // --- INÍCIO DA CORREÇÃO ---
        // 2. Validação da Data da Atividade (adicionada aqui)
        LocalDate hoje = LocalDate.now();
        LocalDate dataMinimaPermitida = (hoje.getDayOfWeek() == DayOfWeek.MONDAY)
                ? hoje.minusDays(3)
                : prazoService.getDiaUtilAnterior(hoje);

        if (dto.dataAtividade().isBefore(dataMinimaPermitida)) {
            throw new BusinessException(
                    "Não é permitido criar lançamentos para datas anteriores a " +
                            dataMinimaPermitida.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            );
        }
        // --- FIM DA CORREÇÃO ---

        // 3. Busca das entidades relacionadas
        Usuario manager = usuarioRepository.findById(managerId)
                .orElseThrow(() -> new EntityNotFoundException("Manager não encontrado com o ID: " + managerId));
        Prestador prestador = prestadorRepository.findById(dto.prestadorId())
                .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado com o ID: " + dto.prestadorId()));
        EtapaDetalhada etapaDetalhada = etapaDetalhadaRepository.findById(dto.etapaDetalhadaId())
                .orElseThrow(() -> new EntityNotFoundException("Etapa Detalhada não encontrada com o ID: " + dto.etapaDetalhadaId()));
        OsLpuDetalhe osLpuDetalhe = osLpuDetalheRepository.findById(dto.osLpuDetalheId())
                .orElseThrow(() -> new EntityNotFoundException("Linha de detalhe (OsLpuDetalhe) não encontrada com o ID: " + dto.osLpuDetalheId()));

        OS os = osRepository.findById(dto.osId())
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + dto.osId()));

        // 4. Criação e Mapeamento da nova entidade Lancamento
        Lancamento lancamento = new Lancamento();

        lancamento.setOs(os);
        lancamento.setOsLpuDetalhe(osLpuDetalhe);
        lancamento.setManager(manager);
        lancamento.setPrestador(prestador);
        lancamento.setEtapaDetalhada(etapaDetalhada);
        lancamento.setDataAtividade(dto.dataAtividade());
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.RASCUNHO);
        lancamento.setUltUpdate(LocalDateTime.now());
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

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public void aprovarPrazoLotePeloController(List<Long> lancamentoIds, Long controllerId) {
        Usuario controller = usuarioRepository.findById(controllerId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário Controller não encontrado."));
        if (controller.getRole() != Role.CONTROLLER && controller.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário não tem permissão para esta ação.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(lancamentoIds);
        for (Lancamento lancamento : lancamentos) {
            if (lancamento.getSituacaoAprovacao() == SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO) {
                lancamento.setDataPrazo(lancamento.getDataPrazoProposta());
                lancamento.setDataPrazoProposta(null);
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_COORDENADOR);
                lancamento.setUltUpdate(LocalDateTime.now());
            }
        }
        lancamentoRepository.saveAll(lancamentos);
    }

    @Override
    @Transactional
    public void rejeitarPrazoLotePeloController(List<Long> lancamentoIds, Long controllerId, String motivo, LocalDate novaData) {
        Usuario controller = usuarioRepository.findById(controllerId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário Controller não encontrado."));
        if (controller.getRole() != Role.CONTROLLER && controller.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário não tem permissão para esta ação.");
        }
        if (motivo == null || motivo.isBlank() || novaData == null) {
            throw new BusinessException("Motivo e nova data são obrigatórios.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(lancamentoIds);
        for (Lancamento lancamento : lancamentos) {
            if (lancamento.getSituacaoAprovacao() == SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO || lancamento.getSituacaoAprovacao() == SituacaoAprovacao.PRAZO_VENCIDO) {
                lancamento.setDataPrazoProposta(null);
                lancamento.setDataPrazo(novaData);
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_COORDENADOR);
                lancamento.setUltUpdate(LocalDateTime.now());

                Comentario comentario = new Comentario();
                comentario.setLancamento(lancamento);
                comentario.setAutor(controller);
                comentario.setTexto("Solicitação de novo prazo rejeitada. Motivo: " + motivo);
                lancamento.getComentarios().add(comentario);
            }
        }
        lancamentoRepository.saveAll(lancamentos);
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

        // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
        // 1. Pega o ID da linha de detalhe (OsLpuDetalhe) à qual o lançamento pertence.
        Long osLpuDetalheId = lancamento.getOsLpuDetalhe().getId();

        // 2. Usa o novo método do repositório para buscar o lançamento mais antigo
        //    DENTRO DA MESMA LINHA DE DETALHE.
        Lancamento maisAntigo = lancamentoRepository
                .findFirstByOsLpuDetalheIdAndSituacaoAprovacaoOrderByDataCriacaoAsc(
                        osLpuDetalheId,
                        SituacaoAprovacao.PENDENTE_COORDENADOR)
                .orElse(null);

        // 3. A lógica de verificação continua a mesma, garantindo a aprovação em sequência.
        if (maisAntigo == null || !maisAntigo.getId().equals(lancamento.getId())) {
            throw new BusinessException("Existe um lançamento mais antigo para este projeto (OS/LPU) que precisa ser resolvido primeiro.");
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

        // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
        // 1. Acessa a linha de detalhe (OsLpuDetalhe) do lançamento.
        OsLpuDetalhe detalhe = lancamento.getOsLpuDetalhe();

        // 2. A partir do detalhe, pega a LPU correta.
        if (detalhe != null && detalhe.getLpu() != null) {
            Lpu lpuDoDetalhe = detalhe.getLpu();

            // 3. Atualiza o campo 'situacaoProjeto' da LPU com a situação do lançamento aprovado.
            lpuDoDetalhe.setSituacaoProjeto(lancamento.getSituacao());

            // 4. Salva a entidade LPU atualizada.
            lpuRepository.save(lpuDoDetalhe);
        }

        // Salva o lançamento já com o status APROVADO.
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

        // --- INÍCIO DA CORREÇÃO ---
        // 3. ADICIONA A VALIDAÇÃO DE DATA NA EDIÇÃO
        LocalDate hoje = LocalDate.now();
        LocalDate dataMinimaPermitida = (hoje.getDayOfWeek() == DayOfWeek.MONDAY)
                ? hoje.minusDays(3)
                : prazoService.getDiaUtilAnterior(hoje);

        if (dto.dataAtividade().isBefore(dataMinimaPermitida)) {
            throw new BusinessException(
                    "Não é permitido alterar a data de um lançamento para antes de " +
                            dataMinimaPermitida.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            );
        }
        // --- FIM DA CORREÇÃO ---

        // 4. Busca as entidades relacionadas (Prestador e Etapa) para garantir que os novos IDs são válidos
        Prestador prestador = prestadorRepository.findById(dto.prestadorId())
                .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado com o ID: " + dto.prestadorId()));

        EtapaDetalhada etapaDetalhada = etapaDetalhadaRepository.findById(dto.etapaDetalhadaId())
                .orElseThrow(() -> new EntityNotFoundException("Etapa Detalhada não encontrada com o ID: " + dto.etapaDetalhadaId()));

        // 5. Atualiza os campos do lançamento com os dados do DTO
        lancamento.setPrestador(prestador);
        lancamento.setEtapaDetalhada(etapaDetalhada);
        lancamento.setDataAtividade(dto.dataAtividade()); // Atualiza a data da atividade
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
            // Presumindo que findAllWithDetails() faz um fetch join.
            // Se a performance ficar lenta, precisaremos otimizar esta query.
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
                return List.of(); // Retorna lista vazia se o usuário não tem segmentos
            }

            // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
            return todosLancamentos.stream()
                    .filter(lancamento -> {
                        // 1. Navega pela hierarquia de objetos com segurança, verificando nulos
                        return Optional.ofNullable(lancamento.getOsLpuDetalhe())
                                .map(OsLpuDetalhe::getOs)
                                .map(OS::getSegmento)
                                .map(Segmento::getId)
                                // 2. Compara o ID do segmento com a lista de segmentos do usuário
                                .map(segmentosDoUsuario::contains)
                                // 3. Se qualquer parte do caminho for nula, o filtro retorna false
                                .orElse(false);
                    })
                    .collect(Collectors.toList());
        }

        // Retorna uma lista vazia para qualquer outro Role não especificado
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

        // --- A CORREÇÃO PRINCIPAL COMEÇA AQUI ---
        // Busca a nova linha de detalhe que o usuário selecionou no formulário
        OsLpuDetalhe osLpuDetalhe = osLpuDetalheRepository.findById(dto.osLpuDetalheId())
                .orElseThrow(() -> new EntityNotFoundException("Linha de detalhe (OsLpuDetalhe) não encontrada com o ID: " + dto.osLpuDetalheId()));

        Prestador prestador = prestadorRepository.findById(dto.prestadorId())
                .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado com o ID: " + dto.prestadorId()));

        EtapaDetalhada etapaDetalhada = etapaDetalhadaRepository.findById(dto.etapaDetalhadaId())
                .orElseThrow(() -> new EntityNotFoundException("Etapa Detalhada não encontrada com o ID: " + dto.etapaDetalhadaId()));

        // 4. Atualiza a entidade Lancamento com os novos dados

        // Associa a nova linha de detalhe e as outras entidades
        lancamento.setOsLpuDetalhe(osLpuDetalhe);
        lancamento.setPrestador(prestador);
        lancamento.setEtapaDetalhada(etapaDetalhada);

        // O resto do mapeamento permanece igual
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

        // Atualiza a data da última modificação
        lancamento.setUltUpdate(LocalDateTime.now());

        // 5. Salva as alterações no banco de dados
        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional(readOnly = true)
    public CpsResponseDTO getRelatorioCps(LocalDate dataInicio, LocalDate dataFim) {
        SituacaoAprovacao status = SituacaoAprovacao.APROVADO;

        // 1. Busca os lançamentos já com todos os dados necessários
        List<Lancamento> lancamentosAprovados = lancamentoRepository.findLancamentosAprovadosPorPeriodo(status, dataInicio, dataFim);

        // 2. Converte para o novo DTO detalhado
        List<CpsResponseDTO.LancamentoCpsDetalheDTO> detalhesDTO = lancamentosAprovados.stream()
                .map(CpsResponseDTO.LancamentoCpsDetalheDTO::new)
                .collect(Collectors.toList());

        // 3. As consultas agregadas continuam as mesmas
        List<ValoresPorSegmentoDTO> valoresPorSegmento = lancamentoRepository.sumValorBySegmento(status, dataInicio, dataFim);
        List<ConsolidadoPorPrestadorDTO> consolidadoPorPrestador = lancamentoRepository.sumValorByPrestador(status, dataInicio, dataFim);

        // 4. O cálculo do total geral também continua igual
        BigDecimal valorTotalGeral = valoresPorSegmento.stream()
                .map(ValoresPorSegmentoDTO::valorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Monta o DTO de resposta final
        CpsResponseDTO relatorio = new CpsResponseDTO();
        relatorio.setValorTotalGeral(valorTotalGeral);
        relatorio.setValoresPorSegmento(valoresPorSegmento);
        relatorio.setConsolidadoPorPrestador(consolidadoPorPrestador);
        relatorio.setLancamentosDetalhados(detalhesDTO);

        return relatorio;
    }

    @Transactional
    public Lancamento alterarValorPago(Long lancamentoId, BigDecimal novoValor) {
        // 1. Busca o lançamento que será alterado
        Lancamento lancamento = lancamentoRepository.findById(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com o ID: " + lancamentoId));

        // 2. Atualiza o valor no lançamento específico
        lancamento.setValor(novoValor);
        lancamentoRepository.save(lancamento); // Salva a alteração do valor individual

        // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
        // 3. Pega a linha de detalhe (pai) deste lançamento
        OsLpuDetalhe detalhe = lancamento.getOsLpuDetalhe();

        if (detalhe != null) {
            // 4. Usa o novo método do repositório para buscar TODOS os lançamentos desta linha de detalhe
            List<Lancamento> todosLancamentosDoDetalhe = lancamentoRepository.findAllByOsLpuDetalheId(detalhe.getId());

            // 5. Recalcula a soma dos valores de TODOS os lançamentos associados
            BigDecimal novoTotalDetalhe = todosLancamentosDoDetalhe.stream()
                    .map(Lancamento::getValor)
                    .filter(java.util.Objects::nonNull) // Garante que valores nulos não quebrem a soma
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // 6. Atualiza o campo 'valorTotal' na entidade OsLpuDetalhe
            detalhe.setValorTotal(novoTotalDetalhe);

            // 7. Salva a entidade OsLpuDetalhe atualizada
            osLpuDetalheRepository.save(detalhe);
        }

        return lancamento;
    }

    @Transactional
    public List<Lancamento> criarLancamentosEmLote(List<LancamentoRequestDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            throw new BusinessException("A lista de lançamentos para criação não pode ser vazia.");
        }

        Long managerId = dtos.get(0).managerId();
        Usuario manager = usuarioRepository.findById(managerId)
                .orElseThrow(() -> new EntityNotFoundException("Manager não encontrado com o ID: " + managerId));

        List<Lancamento> novosLancamentos = new ArrayList<>();

        // --- INÍCIO DA CORREÇÃO ---
        // 1. Trazemos a lógica de validação de data para este método
        LocalDate hoje = LocalDate.now();
        LocalDate dataMinimaPermitida = (hoje.getDayOfWeek() == DayOfWeek.MONDAY)
                ? hoje.minusDays(3) // Se for segunda, permite lançar de sexta, sábado e domingo
                : prazoService.getDiaUtilAnterior(hoje); // Para outros dias, permite o dia útil anterior
        // --- FIM DA CORREÇÃO ---

        for (LancamentoRequestDTO dto : dtos) {
            // --- INÍCIO DA CORREÇÃO ---
            // 2. Verificamos a data de CADA lançamento do lote
            if (dto.dataAtividade().isBefore(dataMinimaPermitida)) {
                throw new BusinessException(
                        "Não é permitido criar lançamentos para datas anteriores a " +
                                dataMinimaPermitida.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                );
            }
            // --- FIM DA CORREÇÃO ---

            OS os = osRepository.findById(dto.osId())
                    .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + dto.osId()));
            OsLpuDetalhe osLpuDetalhe = osLpuDetalheRepository.findById(dto.osLpuDetalheId())
                    .orElseThrow(() -> new EntityNotFoundException("Linha de detalhe (OsLpuDetalhe) não encontrada com o ID: " + dto.osLpuDetalheId()));

            osLpuDetalhe.setOs(os);

            Prestador prestador = prestadorRepository.findById(dto.prestadorId())
                    .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado com o ID: " + dto.prestadorId()));
            EtapaDetalhada etapaDetalhada = etapaDetalhadaRepository.findById(dto.etapaDetalhadaId())
                    .orElseThrow(() -> new EntityNotFoundException("Etapa Detalhada não encontrada com o ID: " + dto.etapaDetalhadaId()));

            Lancamento lancamento = new Lancamento();

            lancamento.setOs(os);
            lancamento.setManager(manager);
            lancamento.setOsLpuDetalhe(osLpuDetalhe);
            lancamento.setDataAtividade(dto.dataAtividade());
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
            lancamento.setSituacaoAprovacao(SituacaoAprovacao.RASCUNHO);

            novosLancamentos.add(lancamento);
        }

        return lancamentoRepository.saveAll(novosLancamentos);
    }

    @Override
    @Transactional
    public void aprovarLotePeloCoordenador(List<Long> lancamentoIds, Long aprovadorId) {
        Usuario aprovador = usuarioRepository.findById(aprovadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        if (aprovador.getRole() != Role.COORDINATOR && aprovador.getRole() != Role.MANAGER && aprovador.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário não tem permissão para esta ação.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(lancamentoIds);
        for (Lancamento lancamento : lancamentos) {
            if (lancamento.getSituacaoAprovacao() == SituacaoAprovacao.PENDENTE_COORDENADOR) {
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.PENDENTE_CONTROLLER);
                lancamento.setUltUpdate(LocalDateTime.now());
                // Opcional: registrar quem aprovou, se tiver o campo.
            }
            // Lançamentos com status diferente são simplesmente ignorados
        }
        lancamentoRepository.saveAll(lancamentos);
    }

    @Override
    @Transactional
    public void aprovarLotePeloController(List<Long> lancamentoIds, Long aprovadorId) {
        Usuario aprovador = usuarioRepository.findById(aprovadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        if (aprovador.getRole() != Role.CONTROLLER && aprovador.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário não tem permissão para esta ação.");
        }

        List<Lancamento> lancamentosParaAprovar = lancamentoRepository.findAllById(lancamentoIds);
        // Lista para salvar as LPUs atualizadas, evitando saves múltiplos para a mesma LPU no loop
        List<Lpu> lpusParaSalvar = new ArrayList<>();

        for (Lancamento lancamento : lancamentosParaAprovar) {
            if (lancamento.getSituacaoAprovacao() == SituacaoAprovacao.PENDENTE_CONTROLLER) {
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.APROVADO);
                lancamento.setUltUpdate(LocalDateTime.now());

                // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
                // 1. Acessa a linha de detalhe (OsLpuDetalhe) do lançamento.
                OsLpuDetalhe detalhe = lancamento.getOsLpuDetalhe();

                // 2. A partir do detalhe, pega a LPU correta.
                if (detalhe != null && detalhe.getLpu() != null) {
                    Lpu lpuDoDetalhe = detalhe.getLpu();

                    // 3. Atualiza o campo 'situacaoProjeto' da LPU com a situação do lançamento aprovado.
                    lpuDoDetalhe.setSituacaoProjeto(lancamento.getSituacao());

                    // 4. Adiciona a LPU à lista para ser salva depois (mais eficiente).
                    if (!lpusParaSalvar.contains(lpuDoDetalhe)) {
                        lpusParaSalvar.add(lpuDoDetalhe);
                    }
                }
            }
        }

        // Salva todas as LPUs modificadas de uma só vez
        if (!lpusParaSalvar.isEmpty()) {
            lpuRepository.saveAll(lpusParaSalvar);
        }

        // Salva todos os lançamentos modificados de uma só vez
        lancamentoRepository.saveAll(lancamentosParaAprovar);
    }

    @Override
    @Transactional
    public void rejeitarLotePeloCoordenador(List<Long> lancamentoIds, Long aprovadorId, String motivo) {
        Usuario aprovador = usuarioRepository.findById(aprovadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        if (aprovador.getRole() != Role.COORDINATOR && aprovador.getRole() != Role.MANAGER && aprovador.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário não tem permissão para esta ação.");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new BusinessException("O motivo da rejeição é obrigatório.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(lancamentoIds);
        for (Lancamento lancamento : lancamentos) {
            if (lancamento.getSituacaoAprovacao() == SituacaoAprovacao.PENDENTE_COORDENADOR) {
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_COORDENADOR);
                lancamento.setUltUpdate(LocalDateTime.now());

                Comentario comentarioRejeicao = new Comentario();
                comentarioRejeicao.setLancamento(lancamento);
                comentarioRejeicao.setAutor(aprovador);
                comentarioRejeicao.setTexto("Rejeitado pelo Coordenador. Motivo: " + motivo);
                lancamento.getComentarios().add(comentarioRejeicao);
            }
        }
        lancamentoRepository.saveAll(lancamentos);
    }

    @Override
    @Transactional
    public void rejeitarLotePeloController(List<Long> lancamentoIds, Long controllerId, String motivo) {
        Usuario aprovador = usuarioRepository.findById(controllerId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário aprovador não encontrado."));

        if (aprovador.getRole() != Role.CONTROLLER && aprovador.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário não tem permissão para esta ação.");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new BusinessException("O motivo da rejeição é obrigatório.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(lancamentoIds);
        for (Lancamento lancamento : lancamentos) {
            if (lancamento.getSituacaoAprovacao() == SituacaoAprovacao.PENDENTE_CONTROLLER) {
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_CONTROLLER);
                lancamento.setUltUpdate(LocalDateTime.now());

                Comentario comentarioRejeicao = new Comentario();
                comentarioRejeicao.setLancamento(lancamento);
                comentarioRejeicao.setAutor(aprovador);
                comentarioRejeicao.setTexto("Rejeitado pelo Controller. Motivo: " + motivo);
                lancamento.getComentarios().add(comentarioRejeicao);
            }
        }
        lancamentoRepository.saveAll(lancamentos);
    }

    @Override
    @Transactional
    public void solicitarPrazoLote(List<Long> lancamentoIds, Long coordenadorId, String comentario, LocalDate novaData) {
        Usuario coordenador = usuarioRepository.findById(coordenadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário Coordenador não encontrado."));

        if (coordenador.getRole() != Role.COORDINATOR && coordenador.getRole() != Role.MANAGER && coordenador.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário não tem permissão para esta ação.");
        }
        if (novaData == null) {
            throw new BusinessException("Uma nova data para o prazo deve ser sugerida.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(lancamentoIds);
        for (Lancamento lancamento : lancamentos) {
            if (lancamento.getSituacaoAprovacao() == SituacaoAprovacao.PENDENTE_COORDENADOR) {
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.AGUARDANDO_EXTENSAO_PRAZO);
                lancamento.setDataPrazoProposta(novaData);
                lancamento.setUltUpdate(LocalDateTime.now());

                Comentario novoComentario = new Comentario();
                novoComentario.setLancamento(lancamento);
                novoComentario.setAutor(coordenador);
                novoComentario.setTexto(comentario);
                lancamento.getComentarios().add(novoComentario);
            }
        }
        lancamentoRepository.saveAll(lancamentos);
    }

    @Override
    @Transactional
    public Lancamento registrarAdiantamento(Long lancamentoId, BigDecimal valorAdiantamento) {
        // AQUI: O serviço usa o REPOSITÓRIO
        Lancamento lancamento = lancamentoRepository.findById(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com o ID: " + lancamentoId));

        if (valorAdiantamento.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("O valor do adiantamento não pode ser negativo.");
        }

        lancamento.setValorAdiantamento(valorAdiantamento);
        lancamento.setUltUpdate(LocalDateTime.now());

        // AQUI: O serviço usa o REPOSITÓRIO
        return lancamentoRepository.save(lancamento);
    }

}