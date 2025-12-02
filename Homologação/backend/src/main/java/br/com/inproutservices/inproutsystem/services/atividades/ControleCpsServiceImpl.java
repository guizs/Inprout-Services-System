package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ControleCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.DashboardCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Comentario;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusPagamento;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.ComentarioRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ControleCpsServiceImpl implements ControleCpsService {

    private final LancamentoRepository lancamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComentarioRepository comentarioRepository;

    public ControleCpsServiceImpl(LancamentoRepository lancamentoRepository, UsuarioRepository usuarioRepository, ComentarioRepository comentarioRepository) {
        this.lancamentoRepository = lancamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.comentarioRepository = comentarioRepository;
    }

    private Usuario getUsuario(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado com ID: " + usuarioId));
    }

    private Lancamento getLancamento(Long lancamentoId) {
        return lancamentoRepository.findByIdWithDetails(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com ID: " + lancamentoId));
    }

    @Transactional
    public void inicializarStatusPagamento() {
        // (Mantém o código existente...)
        List<Lancamento> lancamentosParaInicializar = lancamentoRepository.findBySituacaoAprovacaoAndStatusPagamentoIsNull(br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao.APROVADO);
        if (!lancamentosParaInicializar.isEmpty()) {
            for (Lancamento lancamento : lancamentosParaInicializar) {
                lancamento.setStatusPagamento(StatusPagamento.EM_ABERTO);
                lancamento.setValorPagamento(lancamento.getValor());
            }
            lancamentoRepository.saveAll(lancamentosParaInicializar);
        }
    }

    @Override
    @Transactional
    public List<Lancamento> fecharParaPagamentoLote(ControleCpsDTO.AcaoCoordenadorLoteDTO dto) {
        Usuario coordenador = getUsuario(dto.coordenadorId());

        // Validação de Permissão (Opcional, mas recomendado)
        if (coordenador.getRole() != Role.COORDINATOR && coordenador.getRole() != Role.ADMIN) {
            throw new BusinessException("Usuário sem permissão para fechar pagamentos.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(dto.lancamentoIds());
        List<Lancamento> processados = new ArrayList<>();

        for (Lancamento l : lancamentos) {
            // Apenas itens EM_ABERTO podem ser fechados pelo coordenador
            if (l.getStatusPagamento() == StatusPagamento.EM_ABERTO) {

                // Garante que o valor de pagamento esteja preenchido (usa o valor operacional se estiver nulo)
                if (l.getValorPagamento() == null) {
                    l.setValorPagamento(l.getValor());
                }

                l.setStatusPagamento(StatusPagamento.FECHADO);
                l.setUltUpdate(LocalDateTime.now());

                // Adiciona comentário automático
                String valorFormatado = String.format("R$ %.2f", l.getValorPagamento());
                criarComentario(l, coordenador, "Pagamento Fechado em Lote. Valor confirmado: " + valorFormatado);

                processados.add(l);
            }
        }

        return lancamentoRepository.saveAll(processados);
    }

    @Override
    @Transactional
    public List<Lancamento> getFilaControleCps(Long usuarioId) {
        inicializarStatusPagamento();

        List<StatusPagamento> statusFila = List.of(
                StatusPagamento.EM_ABERTO,
                StatusPagamento.FECHADO,
                StatusPagamento.ALTERACAO_SOLICITADA
        );

        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();

        if (role == Role.ADMIN || role == Role.CONTROLLER) {
            return lancamentoRepository.findByStatusPagamentoIn(statusFila);
        }

        if (role == Role.COORDINATOR || role == Role.MANAGER) {
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) {
                return List.of();
            }
            return lancamentoRepository.findByStatusPagamentoInAndOsSegmentoIn(statusFila, segmentos);
        }

        return List.of();
    }

    // ... (Outros métodos mantidos iguais até o filtrarLancamentos) ...

    @Override
    public List<Lancamento> getHistoricoControleCps(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId) {
        return filtrarLancamentos(usuarioId, inicio, fim, segmentoId, gestorId, prestadorId);
    }

    // ... (Métodos de ação mantidos iguais: fecharParaPagamento, recusarPagamento, etc.) ...
    @Override
    @Transactional
    public Lancamento fecharParaPagamento(ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Usuario coordenador = getUsuario(dto.coordenadorId());
        Lancamento lancamento = getLancamento(dto.lancamentoId());

        if (lancamento.getStatusPagamento() != StatusPagamento.EM_ABERTO) {
            throw new BusinessException("Apenas lançamentos 'EM ABERTO' podem ser fechados para pagamento.");
        }

        String justificativa = registrarAlteracaoValor(lancamento, dto.valorPagamento(), dto.justificativa(), coordenador);
        lancamento.setStatusPagamento(StatusPagamento.FECHADO);
        lancamento.setUltUpdate(LocalDateTime.now());

        criarComentario(lancamento, coordenador, "Pagamento Fechado. " + justificativa);

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento recusarPagamento(ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Usuario coordenador = getUsuario(dto.coordenadorId());
        Lancamento lancamento = getLancamento(dto.lancamentoId());

        if (lancamento.getStatusPagamento() != StatusPagamento.EM_ABERTO) {
            throw new BusinessException("Apenas lançamentos 'EM ABERTO' podem ser recusados.");
        }
        if (dto.justificativa() == null || dto.justificativa().isBlank()) {
            throw new BusinessException("A justificativa é obrigatória para recusar um pagamento.");
        }

        lancamento.setStatusPagamento(StatusPagamento.RECUSADO);
        lancamento.setUltUpdate(LocalDateTime.now());

        criarComentario(lancamento, coordenador, "Pagamento RECUSADO. Motivo: " + dto.justificativa());

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento solicitarAlteracao(ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Usuario coordenador = getUsuario(dto.coordenadorId());
        Lancamento lancamento = getLancamento(dto.lancamentoId());

        if (lancamento.getStatusPagamento() != StatusPagamento.FECHADO) {
            throw new BusinessException("Apenas lançamentos 'FECHADO' podem ter alteração solicitada.");
        }

        String justificativa = registrarAlteracaoValor(lancamento, dto.valorPagamento(), dto.justificativa(), coordenador);
        lancamento.setStatusPagamento(StatusPagamento.ALTERACAO_SOLICITADA);
        lancamento.setUltUpdate(LocalDateTime.now());

        criarComentario(lancamento, coordenador, "Solicitação de Alteração. " + justificativa);

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public List<Lancamento> marcarComoPago(ControleCpsDTO.AcaoControllerDTO dto) {
        Usuario controller = getUsuario(dto.controllerId());
        if (controller.getRole() != Role.CONTROLLER && controller.getRole() != Role.ADMIN) {
            throw new BusinessException("Apenas Controllers ou Admins podem marcar como pago.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(dto.lancamentoIds());
        List<Lancamento> processados = new ArrayList<>();

        for (Lancamento lancamento : lancamentos) {
            if (lancamento.getStatusPagamento() == StatusPagamento.FECHADO || lancamento.getStatusPagamento() == StatusPagamento.ALTERACAO_SOLICITADA) {
                lancamento.setStatusPagamento(StatusPagamento.PAGO);
                lancamento.setControllerPagador(controller);
                lancamento.setDataPagamento(LocalDateTime.now());
                lancamento.setUltUpdate(LocalDateTime.now());

                String valorPago = String.format("R$ %.2f", lancamento.getValorPagamento());
                criarComentario(lancamento, controller, "Pagamento confirmado e marcado como PAGO no valor de " + valorPago + ".");

                processados.add(lancamento);
            } else {
                throw new BusinessException("O Lançamento ID " + lancamento.getId() + " não está no status 'FECHADO' ou 'ALTERACAO_SOLICITADA' e não pode ser pago.");
            }
        }

        return lancamentoRepository.saveAll(processados);
    }

    @Override
    @Transactional
    public Lancamento recusarPeloController(ControleCpsDTO.AcaoRecusaControllerDTO dto) {
        Usuario controller = getUsuario(dto.controllerId());
        if (controller.getRole() != Role.CONTROLLER && controller.getRole() != Role.ADMIN) {
            throw new BusinessException("Apenas Controllers ou Admins podem realizar esta ação.");
        }

        Lancamento lancamento = getLancamento(dto.lancamentoId());

        if (lancamento.getStatusPagamento() != StatusPagamento.FECHADO &&
                lancamento.getStatusPagamento() != StatusPagamento.ALTERACAO_SOLICITADA) {
            throw new BusinessException("Apenas lançamentos na fila do Controller podem ser devolvidos.");
        }

        lancamento.setStatusPagamento(StatusPagamento.EM_ABERTO);
        lancamento.setUltUpdate(LocalDateTime.now());

        criarComentario(lancamento, controller, "Pagamento devolvido. Motivo: " + dto.motivo());

        return lancamentoRepository.save(lancamento);
    }

    private String registrarAlteracaoValor(Lancamento lancamento, BigDecimal novoValor, String justificativa, Usuario usuario) {
        BigDecimal valorAntigo = lancamento.getValorPagamento();

        if (valorAntigo.setScale(2, BigDecimal.ROUND_HALF_UP).compareTo(novoValor.setScale(2, BigDecimal.ROUND_HALF_UP)) != 0) {
            if (justificativa == null || justificativa.isBlank()) {
                throw new BusinessException("A justificativa é obrigatória ao alterar o valor de pagamento.");
            }

            String valorAntigoStr = String.format("R$ %.2f", valorAntigo);
            String novoValorStr = String.format("R$ %.2f", novoValor);
            lancamento.setValorPagamento(novoValor);

            return "Valor alterado de " + valorAntigoStr + " para " + novoValorStr + ". Motivo: " + justificativa;
        }

        lancamento.setValorPagamento(novoValor);
        return "Valor de pagamento (" + String.format("R$ %.2f", novoValor) + ") confirmado.";
    }

    private void criarComentario(Lancamento lancamento, Usuario autor, String texto) {
        Comentario comentario = new Comentario();
        comentario.setLancamento(lancamento);
        comentario.setAutor(autor);
        comentario.setTexto(texto);
        comentarioRepository.save(comentario);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardCpsDTO getDashboard(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // 1. Buscar TODOS os lançamentos (a filtragem fina será feita no stream)
        List<Lancamento> base;

        // Se tiver regra de segmento por usuário no futuro, aplique aqui.
        // Por enquanto, pegamos tudo e filtramos abaixo.
        base = lancamentoRepository.findAll();

        // 2. Filtra para obter o escopo da CPS (Aprovados no período)
        List<Lancamento> lancamentosDaCps = base.stream()
                // Regra 1: Deve estar APROVADO operacionalmente
                .filter(l -> l.getSituacaoAprovacao() == br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao.APROVADO ||
                        l.getSituacaoAprovacao() == br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao.APROVADO_CPS_LEGADO)
                // Regra 2: Filtro de Data (Baseado na ATIVIDADE/COMPETÊNCIA)
                .filter(l -> {
                    if (l.getDataAtividade() == null) return false;
                    boolean afterInicio = (inicio == null) || !l.getDataAtividade().isBefore(inicio);
                    boolean beforeFim = (fim == null) || !l.getDataAtividade().isAfter(fim);
                    return afterInicio && beforeFim;
                })
                // Regra 3: Filtros opcionais (Segmento, Gestor, Prestador)
                .filter(l -> segmentoId == null || (l.getOs().getSegmento() != null && l.getOs().getSegmento().getId().equals(segmentoId)))
                .filter(l -> gestorId == null || (l.getManager() != null && l.getManager().getId().equals(gestorId)))
                .filter(l -> prestadorId == null || (l.getPrestador() != null && l.getPrestador().getId().equals(prestadorId)))
                .collect(Collectors.toList());

        // 3. Cálculo do Valor TOTAL DA CPS (Soma do campo 'valor' original)
        BigDecimal totalCps = lancamentosDaCps.stream()
                .map(l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Cálculo do Valor JÁ PAGO (Soma do campo 'valorPagamento' apenas onde statusPagamento == PAGO)
        BigDecimal totalPago = lancamentosDaCps.stream()
                .filter(l -> l.getStatusPagamento() == StatusPagamento.PAGO)
                .map(l -> l.getValorPagamento() != null ? l.getValorPagamento() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Agrupamento por Segmento (Baseado no Valor da CPS)
        Map<String, BigDecimal> porSegmento = lancamentosDaCps.stream()
                .filter(l -> l.getOs() != null && l.getOs().getSegmento() != null)
                .collect(Collectors.groupingBy(
                        l -> l.getOs().getSegmento().getNome(),
                        Collectors.mapping(
                                l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO, // Soma o valor da CPS
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        List<ValoresPorSegmentoDTO> listaSegmentos = porSegmento.entrySet().stream()
                .map(e -> new ValoresPorSegmentoDTO(e.getKey(), e.getValue()))
                .sorted(java.util.Comparator.comparing(ValoresPorSegmentoDTO::segmentoNome)) // Ordena alfabeticamente
                .collect(Collectors.toList());

        return new DashboardCpsDTO(totalCps, totalPago, listaSegmentos);
    }

    // --- CORREÇÃO APLICADA AQUI ---
    private List<Lancamento> filtrarLancamentos(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId) {
        Usuario usuario = getUsuario(usuarioId);
        List<Lancamento> base;

        if (usuario.getRole() == Role.CONTROLLER || usuario.getRole() == Role.ADMIN) {
            base = lancamentoRepository.findAll();
        } else {
            base = lancamentoRepository.findAll(); // Idealmente filtraria por segmento aqui no futuro
        }

        return base.stream()
                .filter(l -> l.getStatusPagamento() == StatusPagamento.PAGO || l.getStatusPagamento() == StatusPagamento.RECUSADO)
                .filter(l -> {
                    // --- FIX: PROTEÇÃO CONTRA DATA NULA ---
                    LocalDate dataRef = null;
                    if (l.getDataPagamento() != null) {
                        dataRef = l.getDataPagamento().toLocalDate();
                    } else if (l.getDataAtividade() != null) {
                        dataRef = l.getDataAtividade();
                    }

                    // Se não tiver nenhuma data, ignora este lançamento no filtro de data
                    if (dataRef == null) return false;

                    boolean afterInicio = (inicio == null) || !dataRef.isBefore(inicio);
                    boolean beforeFim = (fim == null) || !dataRef.isAfter(fim);
                    return afterInicio && beforeFim;
                })
                .filter(l -> segmentoId == null || (l.getOs().getSegmento() != null && l.getOs().getSegmento().getId().equals(segmentoId)))
                .filter(l -> gestorId == null || (l.getManager() != null && l.getManager().getId().equals(gestorId)))
                .filter(l -> prestadorId == null || (l.getPrestador() != null && l.getPrestador().getId().equals(prestadorId)))
                .collect(Collectors.toList());
    }
    // --- FIM DA CORREÇÃO ---
}