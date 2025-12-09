package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * OTIMIZAÇÃO DE PERFORMANCE (N+1 Problem):
     * O 'JOIN FETCH' força o carregamento da OS, seus Detalhes e Segmento em UMA única query SQL.
     * Sem isso, o Hibernate faria 1 query para listar OS e +1 query para cada OS para pegar os detalhes.
     */
    @Query(value = "SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH os.segmento s",
            countQuery = "SELECT count(DISTINCT os) FROM OS os")
    Page<OS> findAllWithDetails(Pageable pageable);

    // Método para Admin/Controller ver tudo sem paginação (cuidado com volume de dados)
    @Query("SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH os.segmento " +
            "ORDER BY os.id DESC")
    List<OS> findAllWithDetails();

    // Otimização para filtros por segmento (Perfil Manager/Coordenador)
    @Query(value = "SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH os.segmento s " +
            "WHERE s.id IN :segmentoIds",
            countQuery = "SELECT count(DISTINCT os) FROM OS os JOIN os.segmento s WHERE s.id IN :segmentoIds")
    Page<OS> findBySegmentoIdIn(@Param("segmentoIds") Set<Long> segmentoIds, Pageable pageable);

    // Otimização para busca por ID (Carrega LPU e Lançamentos juntos para a tela de detalhes)
    @Query("SELECT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH d.lancamentos l " +
            "LEFT JOIN FETCH os.segmento " +
            "WHERE os.id = :id")
    Optional<OS> findByIdWithDetails(@Param("id") Long id);

    // --- MÉTODOS AUXILIARES ---

    Optional<OS> findByOs(String os);

    Optional<OS> findByProjeto(String projeto);

    List<OS> findAllBySegmentoIn(Set<Segmento> segmentos);

    @Query("SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH os.segmento " +
            "WHERE os.segmento.id IN :ids")
    List<OS> findAllListWithDetailsBySegmentoIds(@Param("ids") Set<Long> ids);

    @Query(value = "SELECT os.os FROM OS os WHERE os.os LIKE %:sufixo ORDER BY CAST(SUBSTRING(os.os FROM 1 FOR POSITION('-' IN os.os) - 1) AS INTEGER) DESC", nativeQuery = true)
    List<String> findLastOsByYearSuffix(@Param("sufixo") String sufixo);

    @Query("SELECT DISTINCT os FROM OS os " +
            "LEFT JOIN FETCH os.detalhes d " +
            "LEFT JOIN FETCH d.lpu " +
            "LEFT JOIN FETCH os.segmento " +
            "WHERE os.id IN :ids")
    List<OS> findAllWithDetailsByIds(@Param("ids") List<Long> ids);
}