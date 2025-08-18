package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface OsRepository extends JpaRepository<OS, Long> {

    /**
     * Busca todas as OSs, trazendo junto (FETCH) a nova coleção de 'detalhes'
     * e, a partir dela, as LPUs associadas.
     */
    // ================== QUERY CORRIGIDA 1 ==================
    @Query("SELECT DISTINCT os FROM OS os LEFT JOIN FETCH os.detalhes d LEFT JOIN FETCH d.lpu")
    List<OS> findAllWithDetails();

    /**
     * Busca uma OS por ID, trazendo junto (FETCH) a nova coleção de 'detalhes'
     * e, a partir dela, as LPUs associadas.
     */
    // ================== QUERY CORRIGIDA 2 ==================
    @Query("SELECT os FROM OS os LEFT JOIN FETCH os.detalhes d LEFT JOIN FETCH d.lpu WHERE os.id = :id")
    Optional<OS> findByIdWithDetails(Long id);

    /**
     * Busca todas as OSs que pertencem a um conjunto de segmentos.
     */
    List<OS> findAllBySegmentoIn(Set<Segmento> segmentos);

    /**
     * Busca uma OS pelo seu código único.
     */
    Optional<OS> findByOs(String os);

    @Query("SELECT os FROM OS os WHERE os.segmento IN :segmentos")
    Page<OS> findBySegmentoIn(@Param("segmentos") Set<Segmento> segmentos, Pageable pageable);


    @Query("SELECT DISTINCT os FROM OS os LEFT JOIN FETCH os.detalhes d LEFT JOIN FETCH d.lpu WHERE os.id IN :ids")
    List<OS> findWithDetailsByIds(@Param("ids") List<Long> ids);

    @Query(value = "SELECT os FROM OS os", countQuery = "SELECT COUNT(os) FROM OS os")
    Page<OS> findAllSimple(Pageable pageable);
}