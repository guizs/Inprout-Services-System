package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoFaturamento;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.TipoFaturamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface SolicitacaoFaturamentoRepository extends JpaRepository<SolicitacaoFaturamento, Long> {

    /**
     * Verifica se já existe uma solicitação (de qualquer tipo) para um item de OS.
     * Isso impede que o Coordenador solicite faturamento para o mesmo item duas vezes.
     */
    boolean existsByOsLpuDetalheId(Long osLpuDetalheId);

    /**
     * Busca a fila de trabalho do Assistant (e visão do Admin/Controller).
     */
    @Query("SELECT sf FROM SolicitacaoFaturamento sf " +
            "LEFT JOIN FETCH sf.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH o.segmento " +
            "LEFT JOIN FETCH sf.solicitante " +
            "WHERE sf.status IN :statuses")
    List<SolicitacaoFaturamento> findByStatusInWithDetails(@Param("statuses") List<StatusFaturamento> statuses);

    @Query("SELECT sf FROM SolicitacaoFaturamento sf " +
            "LEFT JOIN FETCH sf.osLpuDetalhe d " +
            "LEFT JOIN FETCH d.os o " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH o.segmento " +
            "LEFT JOIN FETCH sf.solicitante " +
            "WHERE sf.tipo = :tipo")
    List<SolicitacaoFaturamento> findByTipoWithDetails(@Param("tipo") TipoFaturamento tipo);

    /**
     * Busca solicitações por TIPO, filtradas por segmento.
     */
    @Query("SELECT sf FROM SolicitacaoFaturamento sf " +
            "JOIN sf.osLpuDetalhe d JOIN d.os o " +
            "LEFT JOIN FETCH sf.solicitante " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH o.segmento " +
            "WHERE sf.tipo = :tipo AND o.segmento IN :segmentos")
    List<SolicitacaoFaturamento> findByTipoAndSegmentoIn(@Param("tipo") TipoFaturamento tipo, @Param("segmentos") Set<Segmento> segmentos);

    /**
     * Busca solicitações por STATUS, filtradas por segmento.
     */
    @Query("SELECT sf FROM SolicitacaoFaturamento sf " +
            "JOIN sf.osLpuDetalhe d JOIN d.os o " +
            "LEFT JOIN FETCH sf.solicitante " +
            "LEFT JOIN FETCH sf.responsavel " + // Adicionado para o histórico
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH o.segmento " +
            "WHERE sf.status IN :statuses AND o.segmento IN :segmentos")
    List<SolicitacaoFaturamento> findByStatusInAndSegmentoIn(@Param("statuses") List<StatusFaturamento> statuses, @Param("segmentos") Set<Segmento> segmentos);
}