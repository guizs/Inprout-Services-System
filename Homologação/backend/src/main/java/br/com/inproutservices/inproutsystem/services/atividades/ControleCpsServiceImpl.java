package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ControleCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.DashboardCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Comentario;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusPagamento;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.ComentarioRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
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
        List<Lancamento> lancamentosParaInicializar = lancamentoRepository.findBySituacaoAprovacaoAndStatusPagamentoIsNull(SituacaoAprovacao.APROVADO);

        if (!lancamentosParaInicializar.isEmpty()) {

            // --- NOVA LÓGICA DE DATA DE CORTE (DIA 6) ---
            LocalDate hoje = LocalDate.now();
            LocalDate competenciaPadrao;

            // Se hoje for dia 6 ou mais, a competência já vira para o próximo mês
            if (hoje.getDayOfMonth() >= 6) {
                competenciaPadrao = hoje.plusMonths(1).withDayOfMonth(1);
            } else {
                // Se for dia 1, 2, 3, 4 ou 5, mantém a competência no mês atual
                competenciaPadrao = hoje.withDayOfMonth(1);
            }
            // ---------------------------------------------

            for (Lancamento lancamento : lancamentosParaInicializar) {
                lancamento.setStatusPagamento(StatusPagamento.EM_ABERTO);
                lancamento.setValorPagamento(lancamento.getValor());

                BigDecimal valorBase = lancamento.getValor() != null ? lancamento.getValor() : BigDecimal.ZERO;
                lancamento.setValorPagamento(valorBase);

                // Preenche Competência Automaticamente com a regra do dia 6
                if (lancamento.getDataCompetencia() == null) {
                    lancamento.setDataCompetencia(competenciaPadrao);
                }
            }
            lancamentoRepository.saveAll(lancamentosParaInicializar);
        }
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

        lancamento.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_COORDENADOR);
        lancamento.setUltUpdate(LocalDateTime.now());

        criarComentario(lancamento, coordenador, "Pagamento RECUSADO no CPS. Motivo: " + dto.justificativa());

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public List<Lancamento> recusarPagamentoLote(ControleCpsDTO.AcaoRecusaCoordenadorLoteDTO dto) {
        Usuario coordenador = getUsuario(dto.coordenadorId());

        if (coordenador.getRole() != Role.COORDINATOR && coordenador.getRole() != Role.ADMIN) {
            throw new BusinessException("Apenas Coordenadores ou Admins podem realizar esta ação.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(dto.lancamentoIds());
        List<Lancamento> processados = new ArrayList<>();

        for (Lancamento l : lancamentos) {
            if (l.getStatusPagamento() == StatusPagamento.EM_ABERTO) {
                l.setStatusPagamento(StatusPagamento.RECUSADO);
                l.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_COORDENADOR);
                l.setUltUpdate(LocalDateTime.now());

                criarComentario(l, coordenador, "Pagamento RECUSADO em lote no CPS. Motivo: " + dto.justificativa());
                processados.add(l);
            }
        }
        return lancamentoRepository.saveAll(processados);
    }

    @Override
    @Transactional
    public List<Lancamento> recusarPeloControllerLote(ControleCpsDTO.AcaoRecusaControllerLoteDTO dto) {
        Usuario controller = getUsuario(dto.controllerId());

        if (controller.getRole() != Role.CONTROLLER && controller.getRole() != Role.ADMIN) {
            throw new BusinessException("Apenas Controllers ou Admins podem realizar esta ação.");
        }

        List<Lancamento> lancamentos = lancamentoRepository.findAllById(dto.lancamentoIds());
        List<Lancamento> processados = new ArrayList<>();

        for (Lancamento l : lancamentos) {
            // Controller só devolve itens que estão na fila dele
            if (l.getStatusPagamento() == StatusPagamento.FECHADO || l.getStatusPagamento() == StatusPagamento.ALTERACAO_SOLICITADA) {

                // --- ALTERAÇÃO PRINCIPAL ---
                l.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_CONTROLLER);
                l.setStatusPagamento(null); // Remove do fluxo CPS
                // ---------------------------

                l.setUltUpdate(LocalDateTime.now());

                criarComentario(l, controller, "Pagamento recusado em lote pelo Controller (Devolvido ao Gestor). Motivo: " + dto.motivo());
                processados.add(l);
            }
        }
        return lancamentoRepository.saveAll(processados);
    }

    @Override
    @Transactional
    public Lancamento solicitarAdiantamento(Long lancamentoId, BigDecimal valor, Long usuarioId) {
        Lancamento lancamento = lancamentoRepository.findById(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado"));

        // Validação: Só pode pedir adiantamento se estiver EM_ABERTO (na mão do Coordenador)
        if (lancamento.getStatusPagamento() != StatusPagamento.EM_ABERTO) {
            throw new BusinessException("Apenas lançamentos com status de pagamento 'EM ABERTO' podem receber solicitação de adiantamento.");
        }

        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("O valor do adiantamento deve ser maior que zero.");
        }

        // Opcional: Validar se o valor solicitado não ultrapassa o valor total do item
        // if (valor.compareTo(lancamento.getValor()) > 0) { ... }

        lancamento.setValorSolicitadoAdiantamento(valor);

        // --- ALTERAÇÃO 2: Muda apenas o StatusPagamento ---
        // A SituacaoAprovacao continua 'APROVADO', então não some dos relatórios.
        lancamento.setStatusPagamento(StatusPagamento.SOLICITACAO_ADIANTAMENTO);

        lancamento.setUltUpdate(LocalDateTime.now());

        // Log
        Usuario solicitante = getUsuario(usuarioId);
        criarComentario(lancamento, solicitante, "Solicitou adiantamento de R$ " + String.format("%.2f", valor));

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento aprovarAdiantamento(Long lancamentoId, Long controllerId) {
        Lancamento lancamento = lancamentoRepository.findById(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado"));
        Usuario controller = getUsuario(controllerId);

        // Validação
        if (lancamento.getStatusPagamento() != StatusPagamento.SOLICITACAO_ADIANTAMENTO) {
            throw new BusinessException("Este item não está aguardando pagamento de adiantamento.");
        }

        BigDecimal valorSolicitado = lancamento.getValorSolicitadoAdiantamento();
        BigDecimal adiantadoAtual = lancamento.getValorAdiantamento() != null ? lancamento.getValorAdiantamento() : BigDecimal.ZERO;

        // 1. Consolida o valor
        lancamento.setValorAdiantamento(adiantadoAtual.add(valorSolicitado));

        // 2. Limpa a solicitação
        lancamento.setValorSolicitadoAdiantamento(null);

        // 3. Retorna o status para EM_ABERTO (volta para o Coordenador fechar o restante depois)
        lancamento.setStatusPagamento(StatusPagamento.EM_ABERTO);
        lancamento.setUltUpdate(LocalDateTime.now());

        // Log
        criarComentario(lancamento, controller, "Adiantamento de R$ " + String.format("%.2f", valorSolicitado) + " PAGO.");

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public Lancamento recusarAdiantamento(Long lancamentoId, Long controllerId, String motivo) {
        Lancamento lancamento = lancamentoRepository.findById(lancamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado"));
        Usuario controller = getUsuario(controllerId);

        if (lancamento.getStatusPagamento() != StatusPagamento.SOLICITACAO_ADIANTAMENTO) {
            throw new BusinessException("Este item não está aguardando adiantamento.");
        }

        // 1. Limpa a solicitação
        lancamento.setValorSolicitadoAdiantamento(null);

        // 2. Retorna para EM_ABERTO (volta para o Coordenador)
        lancamento.setStatusPagamento(StatusPagamento.EM_ABERTO);
        lancamento.setUltUpdate(LocalDateTime.now());

        // Log
        criarComentario(lancamento, controller, "Solicitação de adiantamento RECUSADA. Motivo: " + motivo);

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public List<Lancamento> fecharParaPagamentoLote(ControleCpsDTO.AcaoCoordenadorLoteDTO dto) {
        Usuario coordenador = getUsuario(dto.coordenadorId());
        List<Lancamento> lancamentos = lancamentoRepository.findAllById(dto.lancamentoIds());
        List<Lancamento> processados = new ArrayList<>();

        for (Lancamento l : lancamentos) {
            if (l.getStatusPagamento() == StatusPagamento.EM_ABERTO) {
                if (l.getValorPagamento() == null) {
                    l.setValorPagamento(l.getValor());
                }

                // Salva a competência
                if (dto.competencia() != null) {
                    l.setDataCompetencia(dto.competencia());
                }

                l.setStatusPagamento(StatusPagamento.FECHADO);
                l.setUltUpdate(LocalDateTime.now());

                String valorFormatado = String.format("R$ %.2f", l.getValorPagamento());
                criarComentario(l, coordenador, "Pagamento Fechado em Lote. Valor: " + valorFormatado);
                processados.add(l);
            }
        }
        return lancamentoRepository.saveAll(processados);
    }

    @Override
    @Transactional
    public List<Lancamento> getFilaControleCps(Long usuarioId) {
        inicializarStatusPagamento(); // Garante inicialização e competência

        List<StatusPagamento> statusFila = List.of(
                StatusPagamento.EM_ABERTO,
                StatusPagamento.FECHADO,
                StatusPagamento.ALTERACAO_SOLICITADA,
                StatusPagamento.SOLICITACAO_ADIANTAMENTO
        );

        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();

        // --- NOVA REGRA: Data de Corte (Depois de 11/2025 -> > 30/11/2025) ---
        LocalDate dataCorte = LocalDate.of(2025, 11, 30);

        if (role == Role.ADMIN || role == Role.CONTROLLER) {
            // Usa o novo método com filtros de data e valor
            return lancamentoRepository.findFilaCpsAdmin(statusFila, dataCorte);
        }

        if (role == Role.COORDINATOR || role == Role.MANAGER) {
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) {
                return List.of();
            }
            // Usa o novo método com filtros de data, valor e segmento
            return lancamentoRepository.findFilaCpsCoordinator(statusFila, dataCorte, segmentos);
        }

        return List.of();
    }

    @Override
    public List<Lancamento> getHistoricoControleCps(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId) {
        return filtrarLancamentos(usuarioId, inicio, fim, segmentoId, gestorId, prestadorId);
    }

    @Override
    @Transactional
    public Lancamento fecharParaPagamento(ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Usuario coordenador = getUsuario(dto.coordenadorId());
        Lancamento lancamento = getLancamento(dto.lancamentoId());

        if (lancamento.getStatusPagamento() != StatusPagamento.EM_ABERTO) {
            throw new BusinessException("Apenas lançamentos 'EM ABERTO' podem ser fechados.");
        }

        // Salva a competência se enviada
        if (dto.competencia() != null) {
            lancamento.setDataCompetencia(dto.competencia());
        }

        String justificativa = registrarAlteracaoValor(lancamento, dto.valorPagamento(), dto.justificativa(), coordenador);
        lancamento.setStatusPagamento(StatusPagamento.FECHADO);
        lancamento.setUltUpdate(LocalDateTime.now());

        criarComentario(lancamento, coordenador, "Pagamento Fechado. Competência: " + (dto.competencia() != null ? dto.competencia() : "N/A") + ". " + justificativa);

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

        // --- ALTERAÇÃO PRINCIPAL ---
        // Antes: lancamento.setStatusPagamento(StatusPagamento.EM_ABERTO); (Voltava pro Coordenador)

        // Agora: Volta para o Gestor
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.RECUSADO_CONTROLLER);
        lancamento.setStatusPagamento(null); // Remove do fluxo CPS
        // ---------------------------

        lancamento.setUltUpdate(LocalDateTime.now());

        criarComentario(lancamento, controller, "Pagamento recusado pelo Controller (Devolvido ao Gestor). Motivo: " + dto.motivo());

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
        // 1. Reutiliza a lógica de filtragem que já existe no método filtrarLancamentos (ou similar)
        // Isso garante que os KPIs batam exatamente com o que aparece na lista
        List<Lancamento> lancamentosFiltrados = filtrarLancamentosParaDashboard(usuarioId, inicio, fim, segmentoId, gestorId, prestadorId);

        // 2. Cálculos
        BigDecimal totalCps = BigDecimal.ZERO;
        BigDecimal totalPago = BigDecimal.ZERO;
        BigDecimal totalAdiantado = BigDecimal.ZERO;

        for (Lancamento l : lancamentosFiltrados) {
            // Valor Base do Item (Total CPS)
            BigDecimal valorItem = l.getValor() != null ? l.getValor() : BigDecimal.ZERO;
            totalCps = totalCps.add(valorItem);

            // Valor Adiantado
            BigDecimal adiantadoItem = l.getValorAdiantamento() != null ? l.getValorAdiantamento() : BigDecimal.ZERO;
            totalAdiantado = totalAdiantado.add(adiantadoItem);

            // Valor Pago (Considera o valorPagamento se o status for PAGO, senão é 0)
            if (l.getStatusPagamento() == StatusPagamento.PAGO) {
                // Se já foi pago, usamos o valor final pago (que pode ser diferente do valor original)
                BigDecimal pagoItem = l.getValorPagamento() != null ? l.getValorPagamento() : valorItem;
                totalPago = totalPago.add(pagoItem);
            }
        }

        // 3. Cálculo do Pendente
        // Fórmula: Pendente = Total CPS - (O que já foi pago + O que foi adiantado)
        // Nota: Se o item foi totalmente pago, ele contribui para TotalCPS e TotalPago, logo Pendente tende a 0.
        BigDecimal totalPendente = totalCps.subtract(totalPago).subtract(totalAdiantado);

        // Evitar números negativos por arredondamento ou inconsistência de dados legados
        if (totalPendente.compareTo(BigDecimal.ZERO) < 0) {
            totalPendente = BigDecimal.ZERO;
        }

        // 4. Quantidade
        Long quantidadeItens = (long) lancamentosFiltrados.size();

        // 5. Agrupamento por Segmento (Mantido do original)
        Map<String, BigDecimal> porSegmento = lancamentosFiltrados.stream()
                .filter(l -> l.getOs() != null && l.getOs().getSegmento() != null)
                .collect(Collectors.groupingBy(
                        l -> l.getOs().getSegmento().getNome(),
                        Collectors.mapping(
                                l -> l.getValor() != null ? l.getValor() : BigDecimal.ZERO,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        List<ValoresPorSegmentoDTO> listaSegmentos = porSegmento.entrySet().stream()
                .map(e -> new ValoresPorSegmentoDTO(e.getKey(), e.getValue()))
                .sorted(java.util.Comparator.comparing(ValoresPorSegmentoDTO::segmentoNome))
                .collect(Collectors.toList());

        return new DashboardCpsDTO(totalCps, totalPago, totalAdiantado, totalPendente, quantidadeItens, listaSegmentos);
    }

    private List<Lancamento> filtrarLancamentos(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId) {
        Usuario usuario = getUsuario(usuarioId);
        List<Lancamento> base;

        // Regra de visibilidade baseada no perfil
        if (usuario.getRole() == Role.CONTROLLER || usuario.getRole() == Role.ADMIN) {
            base = lancamentoRepository.findAll();
        } else if (usuario.getRole() == Role.COORDINATOR || usuario.getRole() == Role.MANAGER) {
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) {
                return List.of();
            }
            base = lancamentoRepository.findByOsSegmentoIn(segmentos);
        } else {
            return List.of();
        }

        return base.stream()
                // O Histórico mostra apenas itens PAGOS ou RECUSADOS pelo Controller
                .filter(l -> l.getStatusPagamento() == StatusPagamento.PAGO || l.getStatusPagamento() == StatusPagamento.RECUSADO)
                .filter(l -> {
                    // Filtro de Data
                    LocalDate dataRef = null;
                    if (l.getDataPagamento() != null) {
                        dataRef = l.getDataPagamento().toLocalDate();
                    } else if (l.getDataAtividade() != null) {
                        dataRef = l.getDataAtividade();
                    }

                    if (dataRef == null) return false;

                    boolean afterInicio = (inicio == null) || !dataRef.isBefore(inicio);
                    boolean beforeFim = (fim == null) || !dataRef.isAfter(fim);
                    return afterInicio && beforeFim;
                })
                // Filtros opcionais (Segmento, Gestor, Prestador)
                .filter(l -> segmentoId == null || (l.getOs().getSegmento() != null && l.getOs().getSegmento().getId().equals(segmentoId)))
                .filter(l -> gestorId == null || (l.getManager() != null && l.getManager().getId().equals(gestorId)))
                .filter(l -> prestadorId == null || (l.getPrestador() != null && l.getPrestador().getId().equals(prestadorId)))
                .collect(Collectors.toList());
    }

    @Override
    public byte[] exportarRelatorioExcel(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId) {
        // 1. Reutiliza o filtro existente para pegar os dados
        List<Lancamento> dados = filtrarLancamentos(usuarioId, inicio, fim, segmentoId, gestorId, prestadorId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Histórico CPS");

            // Cabeçalho
            Row headerRow = sheet.createRow(0);
            String[] colunas = {"Data Atividade", "Status Pagamento", "OS", "Site", "Projeto", "Segmento", "Prestador", "Gestor", "Valor Total (R$)", "Valor Pago (R$)", "Competência"};

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < colunas.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(colunas[i]);
                cell.setCellStyle(headerStyle);
            }

            // Dados
            int rowIdx = 1;
            for (Lancamento l : dados) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(l.getDataAtividade() != null ? l.getDataAtividade().toString() : "");
                row.createCell(1).setCellValue(l.getStatusPagamento() != null ? l.getStatusPagamento().name() : "");
                row.createCell(2).setCellValue(l.getOs() != null ? l.getOs().getOs() : "");
                row.createCell(3).setCellValue(l.getOsLpuDetalhe() != null ? l.getOsLpuDetalhe().getSite() : "");
                row.createCell(4).setCellValue(l.getOs() != null ? l.getOs().getProjeto() : "");
                row.createCell(5).setCellValue(l.getOs() != null && l.getOs().getSegmento() != null ? l.getOs().getSegmento().getNome() : "");
                row.createCell(6).setCellValue(l.getPrestador() != null ? l.getPrestador().getPrestador() : "");
                row.createCell(7).setCellValue(l.getManager() != null ? l.getManager().getNome() : "");

                // Valores numéricos
                double valTotal = l.getValor() != null ? l.getValor().doubleValue() : 0.0;
                double valPago = l.getValorPagamento() != null ? l.getValorPagamento().doubleValue() : valTotal;

                row.createCell(8).setCellValue(valTotal);
                row.createCell(9).setCellValue(valPago);
                row.createCell(10).setCellValue(l.getDataCompetencia() != null ? l.getDataCompetencia().toString() : "");
            }

            // Auto-size columns
            for(int i=0; i<colunas.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new BusinessException("Erro ao gerar arquivo Excel: " + e.getMessage());
        }
    }

    // MANTENHA TAMBÉM O MÉTODO NOVO DO DASHBOARD (RESPONSÁVEL PELOS KPIs)
    private List<Lancamento> filtrarLancamentosParaDashboard(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId) {
        Usuario usuario = getUsuario(usuarioId);
        List<Lancamento> base;

        if (usuario.getRole() == Role.CONTROLLER || usuario.getRole() == Role.ADMIN) {
            base = lancamentoRepository.findAll();
        } else if (usuario.getRole() == Role.COORDINATOR || usuario.getRole() == Role.MANAGER) {
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) {
                return List.of();
            }
            base = lancamentoRepository.findByOsSegmentoIn(segmentos);
        } else {
            return List.of();
        }

        return base.stream()
                // Regra base do CPS: Deve estar aprovado operacionalmente
                .filter(l -> l.getSituacaoAprovacao() == SituacaoAprovacao.APROVADO ||
                        l.getSituacaoAprovacao() == SituacaoAprovacao.APROVADO_CPS_LEGADO)
                .filter(l -> {
                    LocalDate dataRef = l.getDataAtividade();
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
}