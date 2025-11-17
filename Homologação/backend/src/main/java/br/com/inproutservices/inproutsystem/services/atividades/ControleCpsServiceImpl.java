package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ControleCpsDTO;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ControleCpsServiceImpl implements ControleCpsService {

    private final LancamentoRepository lancamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComentarioRepository comentarioRepository; // Para auditoria

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
        return lancamentoRepository.findByIdWithDetails(lancamentoId) // Usamos o "WithDetails" para já trazer a OS e o Segmento
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado com ID: " + lancamentoId));
    }

    /**
     * Atualiza o status de pagamento de todos os lançamentos APROVADOS que ainda estão nulos.
     * Esta é a "fonte" da fila do Coordenador.
     */
    @Transactional
    public void inicializarStatusPagamento() {
        List<Lancamento> lancamentosParaInicializar = lancamentoRepository.findBySituacaoAprovacaoAndStatusPagamentoIsNull(SituacaoAprovacao.APROVADO);
        if (!lancamentosParaInicializar.isEmpty()) {
            for (Lancamento lancamento : lancamentosParaInicializar) {
                lancamento.setStatusPagamento(StatusPagamento.EM_ABERTO);
                // Define o valor de pagamento inicial como o valor operacional
                lancamento.setValorPagamento(lancamento.getValor());
            }
            lancamentoRepository.saveAll(lancamentosParaInicializar);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lancamento> getFilaControleCps(Long usuarioId) {
        // 1. Atualiza a fila com base nos lançamentos recém-aprovados
        inicializarStatusPagamento();

        // 2. Define os status da fila de pendências
        List<StatusPagamento> statusFila = List.of(
                StatusPagamento.EM_ABERTO,
                StatusPagamento.FECHADO,
                StatusPagamento.ALTERACAO_SOLICITADA
        );

        // 3. Busca e filtra por permissão
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

        return List.of(); // Outros perfis não veem nada
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lancamento> getHistoricoControleCps(Long usuarioId) {
        List<StatusPagamento> statusHistorico = List.of(
                StatusPagamento.PAGO,
                StatusPagamento.RECUSADO
        );

        Usuario usuario = getUsuario(usuarioId);
        Role role = usuario.getRole();

        if (role == Role.ADMIN || role == Role.CONTROLLER) {
            return lancamentoRepository.findByStatusPagamentoIn(statusHistorico);
        }

        if (role == Role.COORDINATOR || role == Role.MANAGER) {
            Set<Segmento> segmentos = usuario.getSegmentos();
            if (segmentos.isEmpty()) {
                return List.of();
            }
            return lancamentoRepository.findByStatusPagamentoInAndOsSegmentoIn(statusHistorico, segmentos);
        }

        return List.of();
    }

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

    /**
     * Compara o valor antigo com o novo. Se houver mudança, atualiza o valor
     * e retorna uma string de justificativa para o comentário de auditoria.
     */
    private String registrarAlteracaoValor(Lancamento lancamento, BigDecimal novoValor, String justificativa, Usuario usuario) {
        BigDecimal valorAntigo = lancamento.getValorPagamento();

        // Compara os valores (escala 2 para comparação monetária)
        if (valorAntigo.setScale(2, BigDecimal.ROUND_HALF_UP).compareTo(novoValor.setScale(2, BigDecimal.ROUND_HALF_UP)) != 0) {
            if (justificativa == null || justificativa.isBlank()) {
                throw new BusinessException("A justificativa é obrigatória ao alterar o valor de pagamento.");
            }

            String valorAntigoStr = String.format("R$ %.2f", valorAntigo);
            String novoValorStr = String.format("R$ %.2f", novoValor);
            lancamento.setValorPagamento(novoValor);

            return "Valor alterado de " + valorAntigoStr + " para " + novoValorStr + ". Motivo: " + justificativa;
        }

        // Se os valores forem iguais, apenas atualiza (caso seja o primeiro "Fechar")
        lancamento.setValorPagamento(novoValor);
        return "Valor de pagamento (" + String.format("R$ %.2f", novoValor) + ") confirmado.";
    }

    /**
     * Cria e salva um comentário de auditoria.
     */
    private void criarComentario(Lancamento lancamento, Usuario autor, String texto) {
        Comentario comentario = new Comentario();
        comentario.setLancamento(lancamento);
        comentario.setAutor(autor);
        comentario.setTexto(texto);
        // O @PrePersist em Comentario cuida da data/hora
        comentarioRepository.save(comentario);
    }
}