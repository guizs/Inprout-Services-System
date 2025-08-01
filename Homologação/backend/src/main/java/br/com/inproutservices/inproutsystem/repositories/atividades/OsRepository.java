package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface OsRepository extends JpaRepository<OS, Long> {

    /**
     * Busca todas as OSs, trazendo junto (FETCH) a coleção de LPUs e seus respectivos lançamentos
     * para evitar LazyInitializationException e o problema N+1.
     */
    @Query("SELECT DISTINCT os FROM OS os LEFT JOIN FETCH os.lpus lpus LEFT JOIN FETCH lpus.lancamentos")
    List<OS> findAllWithDetails();

    @Query("SELECT os FROM OS os LEFT JOIN FETCH os.lpus lpus LEFT JOIN FETCH lpus.lancamentos WHERE os.id = :id")
    Optional<OS> findByIdWithDetails(Long id);

    /**
     * Busca todas as OSs que pertencem a um conjunto de segmentos.
     */
    List<OS> findAllBySegmentoIn(Set<Segmento> segmentos);
}