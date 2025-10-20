package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface OsRepository extends JpaRepository<OS, Long> {

    /**
     * Busca todas as OSs, trazendo junto (FETCH) as novas linhas de detalhe
     * para evitar LazyInitializationException e o problema N+1.
     */
    // ================== CORREÇÃO 1 ==================
    @Query("SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH os.segmento")
    List<OS> findAllWithDetails();

    /**
     * Busca uma OS por ID, trazendo junto (FETCH) as novas linhas de detalhe.
     */
    // ================== CORREÇÃO 2 ==================
    @Query("SELECT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH d.lancamentos l " + // Agora isso funciona!
            "LEFT JOIN FETCH os.segmento " +
            "WHERE os.id = :id")
    Optional<OS> findByIdWithDetails(@Param("id") Long id);

    /**
     * Busca todas as OSs que pertencem a um conjunto de segmentos (esta query não precisa de alteração).
     */
    List<OS> findAllBySegmentoIn(Set<Segmento> segmentos);

    /**
     * Busca uma OS pelo seu nome/código (esta query não precisa de alteração).
     */
    Optional<OS> findByOs(String os);

    List<OS> findByProjeto(String projeto);
    
    @Query("SELECT os.os FROM OS os WHERE os.os LIKE %:sufixo ORDER BY os.os DESC")
    List<String> findLastOsByYearSuffix(@Param("sufixo") String sufixo);
}