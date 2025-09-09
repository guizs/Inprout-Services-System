package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ConsolidadoPorPrestadorDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
            "WHERE l.id = :id")
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
            "LEFT JOIN FETCH c.autor")
    List<Lancamento> findAllWithDetails();

    Optional<Lancamento> findFirstByOsLpuDetalheIdOrderByIdDesc(Long osLpuDetalheId);

    @Query("SELECT l FROM Lancamento l WHERE l.situacaoAprovacao IN :statuses")
    List<Lancamento> findBySituacaoAprovacaoIn(@Param("statuses") List<SituacaoAprovacao> statuses);

    // ================== CORREÇÃO 2 ==================
    @Query("SELECT l FROM Lancamento l JOIN l.osLpuDetalhe d JOIN d.os o " +
            "WHERE l.situacaoAprovacao IN :statuses AND o.segmento IN :segmentos")
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
            "AND (l.manager.id = :usuarioId OR c.autor.id = :usuarioId)")
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
            "WHERE l.situacaoAprovacao = :status AND l.dataAtividade BETWEEN :dataInicio AND :dataFim")
    List<Lancamento> findLancamentosAprovadosPorPeriodo(
            @Param("status") SituacaoAprovacao status,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    // ================== CORREÇÃO 5 ==================
    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO(s.nome, SUM(l.valor)) " +
            "FROM Lancamento l JOIN l.osLpuDetalhe d JOIN d.os o JOIN o.segmento s " +
            "WHERE l.situacaoAprovacao = :status AND l.dataAtividade BETWEEN :dataInicio AND :dataFim " +
            "GROUP BY s.nome ORDER BY s.nome")
    List<ValoresPorSegmentoDTO> sumValorBySegmento(@Param("status") SituacaoAprovacao status, @Param("dataInicio") LocalDate dataInicio, @Param("dataFim") LocalDate dataFim);

    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.ConsolidadoPorPrestadorDTO(p.codigoPrestador, p.prestador, SUM(l.valor), COUNT(l.id)) " +
            "FROM Lancamento l JOIN l.prestador p " +
            "WHERE l.situacaoAprovacao = :status AND l.dataAtividade BETWEEN :dataInicio AND :dataFim " +
            "GROUP BY p.codigoPrestador, p.prestador ORDER BY SUM(l.valor) DESC")
    List<ConsolidadoPorPrestadorDTO> sumValorByPrestador(@Param("status") SituacaoAprovacao status, @Param("dataInicio") LocalDate dataInicio, @Param("dataFim") LocalDate dataFim);

    boolean existsByOsLpuDetalheIdAndSituacao(Long osLpuDetalheId, SituacaoOperacional situacao);

    List<Lancamento> findBySituacaoAprovacaoAndOsLpuDetalhe_Os_Id(SituacaoAprovacao situacao, Long osId);

    List<Lancamento> findBySituacaoAprovacaoAndOsLpuDetalhe_Os_IdIn(SituacaoAprovacao situacao, List<Long> osIds);

}