package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.awt.print.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface OsRepository extends JpaRepository<OS, Long> {

    @Query("SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH os.segmento " +
            "LEFT JOIN FETCH d.lancamentos l")
    Page<OS> findAllWithDetails(Pageable pageable);

    @Query("SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH os.segmento " +
            "LEFT JOIN FETCH d.lancamentos l " +
            "WHERE o.segmento.id IN :segmentoIds")
    Page<OS> findBySegmentoIdIn(@Param("segmentoIds") Set<Long> segmentoIds, Pageable pageable);

    @Query("SELECT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH d.lancamentos l " +
            "LEFT JOIN FETCH os.segmento " +
            "WHERE os.id = :id")
    Optional<OS> findByIdWithDetails(@Param("id") Long id);

    List<OS> findAllBySegmentoIn(Set<Segmento> segmentos);

    Optional<OS> findByOs(String os);

    // --- CORREÇÃO APLICADA ---
    // Garante que a busca por projeto retorna no máximo um resultado, alinhado à regra de negócio.
    Optional<OS> findByProjeto(String projeto);

    @Query(value = "SELECT os.os FROM OS os WHERE os.os LIKE %:sufixo ORDER BY CAST(SUBSTRING(os.os FROM 1 FOR POSITION('-' IN os.os) - 1) AS INTEGER) DESC", nativeQuery = true)
    List<String> findLastOsByYearSuffix(@Param("sufixo") String sufixo);

    @Query("SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH d.lancamentos l " +
            "LEFT JOIN FETCH os.segmento " +
            "WHERE os.id IN :ids")
    List<OS> findAllWithDetailsByIds(@Param("ids") List<Long> ids);
}