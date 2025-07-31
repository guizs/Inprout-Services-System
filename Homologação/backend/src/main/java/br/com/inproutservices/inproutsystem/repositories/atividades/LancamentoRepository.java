package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ConsolidadoPorPrestadorDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
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

    Optional<Lancamento> findFirstByOsIdAndSituacaoAprovacaoOrderByDataCriacaoAsc(Long osId, SituacaoAprovacao situacao);

    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.manager " +
            "LEFT JOIN FETCH l.os o " +
            "LEFT JOIN FETCH o.lpus " +
            "LEFT JOIN FETCH l.lpu " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.comentarios c " +
            "LEFT JOIN FETCH c.autor " +
            "WHERE l.id = :id")
    Optional<Lancamento> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.manager " +
            "LEFT JOIN FETCH l.os o " +
            "LEFT JOIN FETCH o.lpus " +
            "LEFT JOIN FETCH l.lpu " +
            "LEFT JOIN FETCH l.comentarios c " +
            "LEFT JOIN FETCH c.autor")
    List<Lancamento> findAllWithDetails();

    Optional<Lancamento> findFirstByOsIdOrderByIdDesc(Long osId);

    @Query("SELECT l FROM Lancamento l WHERE l.situacaoAprovacao IN :statuses")
    List<Lancamento> findBySituacaoAprovacaoIn(@Param("statuses") List<SituacaoAprovacao> statuses);

    @Query("SELECT l FROM Lancamento l WHERE l.situacaoAprovacao IN :statuses AND l.os.segmento IN :segmentos")
    List<Lancamento> findBySituacaoAprovacaoInAndOsSegmentoIn(@Param("statuses") List<SituacaoAprovacao> statuses, @Param("segmentos") Set<Segmento> segmentos);

    List<Lancamento> findBySituacaoAprovacaoAndDataPrazoBefore(SituacaoAprovacao situacao, LocalDate data);

    @Query("SELECT DISTINCT l FROM Lancamento l LEFT JOIN l.comentarios c " +
            "WHERE l.situacaoAprovacao NOT IN ('RASCUNHO', 'PENDENTE_COORDENADOR', 'PENDENTE_CONTROLLER', 'AGUARDANDO_EXTENSAO_PRAZO', 'PRAZO_VENCIDO') " +
            "AND (l.manager.id = :usuarioId OR c.autor.id = :usuarioId)")
    List<Lancamento> findHistoricoByUsuarioId(@Param("usuarioId") Long usuarioId);

    // ==================================================================
    // >>>>> QUERY ATUALIZADA PARA O RELATÓRIO CPS <<<<<
    // ==================================================================
    @Query("SELECT l FROM Lancamento l " +
            "LEFT JOIN FETCH l.os os " +
            "LEFT JOIN FETCH os.segmento " +
            "LEFT JOIN FETCH l.lpu " +
            "LEFT JOIN FETCH l.prestador " +
            "LEFT JOIN FETCH l.etapaDetalhada ed " +
            "LEFT JOIN FETCH ed.etapa e " +
            "LEFT JOIN FETCH l.manager " + // Adicionado para buscar o gestor
            "WHERE l.situacaoAprovacao = :status AND l.dataAtividade BETWEEN :dataInicio AND :dataFim")
    List<Lancamento> findLancamentosAprovadosPorPeriodo(
            @Param("status") SituacaoAprovacao status,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );


    //Agrega os valores por segmento
    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.ValoresPorSegmentoDTO(s.nome, SUM(l.valor)) " +
            "FROM Lancamento l JOIN l.os o JOIN o.segmento s " +
            "WHERE l.situacaoAprovacao = :status AND l.dataAtividade BETWEEN :dataInicio AND :dataFim " +
            "GROUP BY s.nome ORDER BY s.nome")
    List<ValoresPorSegmentoDTO> sumValorBySegmento(@Param("status") SituacaoAprovacao status, @Param("dataInicio") LocalDate dataInicio, @Param("dataFim") LocalDate dataFim);

    @Query("SELECT new br.com.inproutservices.inproutsystem.dtos.atividades.ConsolidadoPorPrestadorDTO(p.codigoPrestador, p.prestador, SUM(l.valor), COUNT(l.id)) " +
            "FROM Lancamento l JOIN l.prestador p " +
            "WHERE l.situacaoAprovacao = :status AND l.dataAtividade BETWEEN :dataInicio AND :dataFim " +
            "GROUP BY p.codigoPrestador, p.prestador ORDER BY SUM(l.valor) DESC")
    List<ConsolidadoPorPrestadorDTO> sumValorByPrestador(@Param("status") SituacaoAprovacao status, @Param("dataInicio") LocalDate dataInicio, @Param("dataFim") LocalDate dataFim);

    Optional<Lancamento> findFirstByOsIdAndLpuIdOrderByIdDesc(Long osId, Long lpuId);

}