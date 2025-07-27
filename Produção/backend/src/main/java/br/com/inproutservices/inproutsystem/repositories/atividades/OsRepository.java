// Local: backend/src/main/java/br/com/inproutservices/inproutsystem/repositories/atividades/OsRepository.java

package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento; // Importar Segmento
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set; // Importar Set

@Repository
public interface OsRepository extends JpaRepository<OS, Long> {

    /**
     * Busca todas as OSs, trazendo junto (FETCH) a coleção de LPUs
     * para evitar LazyInitializationException.
     */
    // CORREÇÃO: trocado 'os.lpu' por 'os.lpus'
    @Query("SELECT DISTINCT os FROM OS os LEFT JOIN FETCH os.lpus")
    List<OS> findAllWithDetails();

    @Query("SELECT os FROM OS os LEFT JOIN FETCH os.lpus WHERE os.id = :id")
    Optional<OS> findByIdWithDetails(Long id);

    /**
     * Busca todas as OSs que pertencem a um conjunto de segmentos.
     */
    List<OS> findAllBySegmentoIn(Set<Segmento> segmentos);
}