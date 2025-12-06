package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ConsolidadoPorPrestadorDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.PendenciasPorCoordenadorDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.ProgramacaoDiariaDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusPagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {

    List<Lancamento> findBySituacaoAprovacao(SituacaoAprovacao situacao);

    List<Lancamento> findBySituacaoAprovacaoAndDataAtividade(SituacaoAprovacao situacao, LocalDate data);

    Optional<Lancamento> findFirstByOsLpuDetalheIdAndSituacaoAprovacaoOrderByDataCriacaoAsc(
            Long osLpuDetalheId,
            SituacaoAprovacao situacaoAprovacao
    );

    List<Lancamento> findAllByOsLpuDetalheId(Long osLpuDetalheId);

    // ================== CORREÇÃO 1 ==================
    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH o.segmento " +
            "LEFT JOIN FETCH l.manager " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa " +
            "LEFT JOIN FETCH l.comentarios c " +
            "LEFT JOIN FETCH c.autor " +
            "WHERE l.id = :id ORDER BY l.id DESC")
    Optional<Lancamento> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH o.segmento " +
            "LEFT JOIN FETCH l.manager " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa " +
            "LEFT JOIN FETCH l.comentarios c " +
            "LEFT JOIN FETCH c.autor " +
            "ORDER BY l.id DESC")
    List<Lancamento> findAllWithDetails();

    Optional<Lancamento> findFirstByOsLpuDetalheIdOrderByIdDesc(Long osLpuDetalheId);

    @Query("SELECT l FROM Lancamento l WHERE l.situacaoAprovacao IN :statuses ORDER BY l.id DESC")
    List<Lancamento> findBySituacaoAprovacaoIn(@Param("statuses") List<SituacaoAprovacao> statuses);

    // ================== CORREÇÃO 2 ==================
    @Query("SELECT l FROM Lancamento l JOIN l.osLpuDetalhe d JOIN d.os o " +
            "WHERE l.situacaoAprovacao IN :statuses AND o.segmento IN :segmentos ORDER BY l.id DESC")
    List<Lancamento> findBySituacaoAprovacaoInAndOsSegmentoIn(@Param("statuses") List<SituacaoAprovacao> statuses, @Param("segmentos") Set<Segmento> segmentos);

    List<Lancamento> findBySituacaoAprovacaoAndDataPrazoBefore(SituacaoAprovacao situacao, LocalDate data);

    // ================== CORREÇÃO 3 ==================
    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH d.os " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa " +
            "LEFT JOIN FETCH l.manager " +
            "LEFT JOIN l.comentarios c " +
            "WHERE l.situacaoAprovacao NOT IN ('RASCUNHO', 'PENDENTE_COORDENADOR', 'PENDENTE_CONTROLLER', 'AGUARDANDO_EXTENSAO_PRAZO', 'PRAZO_VENCIDO') " +
            "AND (l.manager.id = :usuarioId OR c.autor.id = :usuarioId) " +
            "ORDER BY l.id DESC")
    List<Lancamento> findHistoricoByUsuarioId(@Param("usuarioId") Long usuarioId);

    // ================== CORREÇÃO 4 ==================
    @Query("SELECT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os os " +
            "LEFT JOIN FETCH os.segmento " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa e " +
            "LEFT JOIN FETCH l.manager " +
            "WHERE l.situacaoAprovacao IN :statuses AND l.dataAtividade BETWEEN :dataInicio AND :dataFim " + // Modificado de '=' para 'IN'
            "ORDER BY l.id DESC")
    List<Lancamento> findLancamentosAprovadosPorPeriodo(
            @Param("statuses") List<SituacaoAprovacao> statuses, // Modificado de SituacaoAprovacao para List<SituacaoAprovacao>
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    // ================== NOVO MÉTODO (GATE) ==================
    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH o.segmento s " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH d.solicitacoesFaturamento sf " +
            "WHERE l.dataAtividade BETWEEN :dataInicio AND :dataFim")
    List<Lancamento> findByDataAtividadeBetweenWithDetails(
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );
    // ================== FIM DO NOVO MÉTODO ==================


    // ================== CORREÇÃO 5 ==================
    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO(s.nome, SUM(l.valor)) " +
            "FROM Lancamento l JOIN l.osLpuDetalhe d JOIN d.os o JOIN o.segmento s " +
            "WHERE l.situacaoAprovacao IN :statuses AND l.dataAtividade BETWEEN :dataInicio AND :dataFim " + // Modificado aqui
            "GROUP BY s.nome ORDER BY s.nome")
    List<ValoresPorSegmentoDTO> sumValorBySegmento(@Param("statuses") List<SituacaoAprovacao> statuses, @Param("dataInicio") LocalDate dataInicio, @Param("dataFim") LocalDate dataFim);

    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.ConsolidadoPorPrestadorDTO(p.codigoPrestador, p.prestador, SUM(l.valor), COUNT(l.id)) " +
            "FROM Lancamento l JOIN l.prestador p " +
            "WHERE l.situacaoAprovacao IN :statuses AND l.dataAtividade BETWEEN :dataInicio AND :dataFim " + // Modificado aqui
            "GROUP BY p.codigoPrestador, p.prestador ORDER BY SUM(l.valor) DESC")
    List<ConsolidadoPorPrestadorDTO> sumValorByPrestador(@Param("statuses") List<SituacaoAprovacao> statuses, @Param("dataInicio") LocalDate dataInicio, @Param("dataFim") LocalDate dataFim);

    boolean existsByOsLpuDetalheIdAndSituacao(Long osLpuDetalheId, SituacaoOperacional situacao);

    List<Lancamento> findBySituacaoAprovacaoAndOsLpuDetalhe_Os_Id(SituacaoAprovacao situacao, Long osId);

    List<Lancamento> findBySituacaoAprovacaoAndOsLpuDetalhe_Os_IdIn(SituacaoAprovacao situacao, List<Long> osIds);

    @Query("SELECT l FROM Lancamento l WHERE l.situacaoAprovacao IN :situacoes AND l.osLpuDetalhe.os.id IN :osIds")
    List<Lancamento> findBySituacaoAprovacaoInAndOsIdIn(@Param("situacoes") List<SituacaoAprovacao> situacoes, @Param("osIds") List<Long> osIds);

    // NOVO MÉTODO PARA BUSCAR LANÇAMENTOS PENDENTES POR OS (para o cálculo da previsão)
    @Query("SELECT l FROM Lancamento l WHERE l.situacaoAprovacao IN :situacoes AND l.osLpuDetalhe.os.id IN :osIds")
    List<Lancamento> findPendentesBySituacaoAprovacaoInAndOsIdIn(@Param("situacoes") List<SituacaoAprovacao> situacoes, @Param("osIds") List<Long> osIds);

    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.ProgramacaoDiariaDTO(l.dataAtividade, m.nome, COUNT(l.id)) " +
            "FROM Lancamento l JOIN l.manager m " +
            "WHERE l.dataAtividade BETWEEN :dataInicio AND :dataFim " +
            "GROUP BY l.dataAtividade, m.nome " +
            "ORDER BY l.dataAtividade DESC, m.nome ASC")
    List<ProgramacaoDiariaDTO> countLancamentosPorDiaEGestor(
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.PendenciasPorCoordenadorDTO(u.id, u.nome, COUNT(l.id)) " +
            "FROM Usuario u " +
            "LEFT JOIN u.segmentos s " +
            "LEFT JOIN OS o ON o.segmento = s " +
            "LEFT JOIN OsLpuDetalhe d ON d.os = o " +
            "LEFT JOIN Lancamento l ON l.osLpuDetalhe = d " +
            "   AND l.situacaoAprovacao IN :situacoes " +
            "   AND l.dataAtividade < :dataLimite " +
            "WHERE u.role = :role " +
            "GROUP BY u.id, u.nome " +
            "ORDER BY u.nome")
    List<PendenciasPorCoordenadorDTO> countPendenciasByCoordenador(
            @Param("situacoes") List<SituacaoAprovacao> situacoes,
            @Param("role") br.com.inproutservices.inproutsystem.enums.usuarios.Role role,
            @Param("dataLimite") LocalDate dataLimite
    );

    /**
     * Encontra lançamentos que foram APROVADOS mas ainda não têm um StatusPagamento definido.
     * Usado para inicializar a fila do Coordenador.
     */
    List<Lancamento> findBySituacaoAprovacaoAndStatusPagamentoIsNull(SituacaoAprovacao situacaoAprovacao);

    @Query("SELECT l FROM Lancamento l " +
            "JOIN l.osLpuDetalhe d JOIN d.os o " +
            "WHERE o.segmento IN :segmentos")
    List<Lancamento> findByOsSegmentoIn(@Param("segmentos") Set<Segmento> segmentos);

    /**
     * Busca todos os lançamentos que estão em um dos status de pagamento da fila de pendências.
     */
    @Query("SELECT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH o.segmento " +
            "WHERE l.statusPagamento IN :statuses")
    List<Lancamento> findByStatusPagamentoIn(@Param("statuses") List<StatusPagamento> statuses);

    /**
     * Busca todos os lançamentos em status de pagamento específicos E que pertençam aos segmentos do usuário.
     */
    @Query("SELECT l FROM Lancamento l " +
            "JOIN l.osLpuDetalhe d JOIN d.os o " +
            "WHERE l.statusPagamento IN :statuses AND o.segmento IN :segmentos")
    List<Lancamento> findByStatusPagamentoInAndOsSegmentoIn(@Param("statuses") List<StatusPagamento> statuses, @Param("segmentos") Set<Segmento> segmentos);

    List<Lancamento> findAllByEtapaDetalhadaId(Long etapaDetalhadaId);

    @Query("SELECT l FROM Lancamento l JOIN l.osLpuDetalhe d JOIN d.os o WHERE o.id IN :osIds")
    List<Lancamento> findByOsIdIn(@Param("osIds") List<Long> osIds);

    @Query("SELECT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH o.segmento " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.manager " +
            "WHERE l.statusPagamento IN :statuses " +
            "AND l.dataAtividade > :dataCorte " +
            "AND (l.valor IS NOT NULL AND l.valor <> 0)")
    List<Lancamento> findFilaCpsAdmin(
            @Param("statuses") List<StatusPagamento> statuses,
            @Param("dataCorte") LocalDate dataCorte
    );

    @Query("SELECT l FROM Lancamento l " +
            "JOIN l.osLpuDetalhe d JOIN d.os o " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.manager " +
            "WHERE l.statusPagamento IN :statuses " +
            "AND l.dataAtividade > :dataCorte " +
            "AND (l.valor IS NOT NULL AND l.valor <> 0) " +
            "AND o.segmento IN :segmentos")
    List<Lancamento> findFilaCpsCoordinator(
            @Param("statuses") List<StatusPagamento> statuses,
            @Param("dataCorte") LocalDate dataCorte,
            @Param("segmentos") Set<Segmento> segmentos
    );

    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH d.os " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa " +
            "LEFT JOIN FETCH l.manager " +
            "LEFT JOIN l.comentarios c " +
            "WHERE l.situacaoAprovacao NOT IN ('RASCUNHO', 'PENDENTE_COORDENADOR', 'PENDENTE_CONTROLLER', 'AGUARDANDO_EXTENSAO_PRAZO', 'PRAZO_VENCIDO') " +
            "AND (l.manager.id = :usuarioId OR c.autor.id = :usuarioId) " +
            "AND l.dataAtividade BETWEEN :inicio AND :fim " + // <--- FILTRO DE DATA
            "ORDER BY l.dataAtividade DESC")
    List<Lancamento> findHistoricoByUsuarioIdAndPeriodo(@Param("usuarioId") Long usuarioId, @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // Query para a Listagem Geral (Index)
    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH o.segmento " +
            "LEFT JOIN FETCH l.manager " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa " +
            "LEFT JOIN FETCH l.comentarios c " +
            "LEFT JOIN FETCH c.autor " +
            "WHERE l.dataAtividade BETWEEN :inicio AND :fim " + // <--- FILTRO DE DATA
            "ORDER BY l.dataAtividade DESC")
    List<Lancamento> findAllWithDetailsByPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}