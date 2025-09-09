package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // Importe o Optional

/**
 * Repositório para a entidade OsLpuDetalhe, que representa as linhas de detalhe de uma OS.
 */
@Repository
public interface OsLpuDetalheRepository extends JpaRepository<OsLpuDetalhe, Long> {

    @Query("SELECT DISTINCT d FROM OsLpuDetalhe d " +
            "LEFT JOIN FETCH d.lancamentos " +
            "WHERE d.os.id IN :osIds")
    List<OsLpuDetalhe> findAllWithLancamentosByOsIds(@Param("osIds") List<Long> osIds);

    Optional<OsLpuDetalhe> findByKey(String key);

    List<OsLpuDetalhe> findAllByOsId(Long osId);

    List<OsLpuDetalhe> findAllByOsIdIn(List<Long> osIds);

}