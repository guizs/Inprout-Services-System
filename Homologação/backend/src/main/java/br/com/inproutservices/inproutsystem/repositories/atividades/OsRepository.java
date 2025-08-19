package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface OsRepository extends JpaRepository<OS, Long> {

    /**
     * Busca uma página de OSs, trazendo junto (FETCH) a nova coleção de 'detalhes'
     * e, a partir dela, as LPUs associadas.
     */
    @Query(value = "SELECT DISTINCT os FROM OS os LEFT JOIN FETCH os.detalhes d LEFT JOIN FETCH d.lpu",
            countQuery = "SELECT count(os) FROM OS os")
    Page<OS> findAllWithDetails(Pageable pageable);

    /**
     * Busca uma página de OSs filtrando por um conjunto de segmentos.
     */
    @Query(value = "SELECT DISTINCT os FROM OS os LEFT JOIN FETCH os.detalhes d LEFT JOIN FETCH d.lpu WHERE os.segmento IN :segmentos",
            countQuery = "SELECT count(os) FROM OS os WHERE os.segmento IN :segmentos")
    Page<OS> findAllBySegmentoIn(Set<Segmento> segmentos, Pageable pageable);


    /**
     * Busca uma OS por ID, trazendo junto (FETCH) a nova coleção de 'detalhes'
     * e, a partir dela, as LPUs associadas.
     */
    @Query("SELECT os FROM OS os LEFT JOIN FETCH os.detalhes d LEFT JOIN FETCH d.lpu WHERE os.id = :id")
    Optional<OS> findByIdWithDetails(Long id);

    /**
     * Busca uma OS pelo seu código único.
     */
    Optional<OS> findByOs(String os);

    /**
     * NOVO MÉTODO ADICIONADO: Busca TODAS as OSs (não paginado) de um conjunto de segmentos.
     * Essencial para o endpoint /os/por-usuario/{usuarioId}.
     */
    @Query("SELECT DISTINCT os FROM OS os LEFT JOIN FETCH os.detalhes d LEFT JOIN FETCH d.lpu WHERE os.segmento IN :segmentos")
    List<OS> findAllBySegmentoInWithDetails(Set<Segmento> segmentos);
}