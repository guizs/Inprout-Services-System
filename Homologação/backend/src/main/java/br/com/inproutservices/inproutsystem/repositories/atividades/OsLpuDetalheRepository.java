package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OsLpuDetalheRepository extends JpaRepository<OsLpuDetalhe, Long> {

    @Query("SELECT DISTINCT d FROM OsLpuDetalhe d " +
            "LEFT JOIN FETCH d.lancamentos " +
            "WHERE d.os.id IN :osIds")
    List<OsLpuDetalhe> findAllWithLancamentosByOsIds(@Param("osIds") List<Long> osIds);

    Optional<OsLpuDetalhe> findByKey(String key);

    List<OsLpuDetalhe> findAllByOsId(Long osId);

    List<OsLpuDetalhe> findAllByOsIdIn(List<Long> osIds);

    /**
     * Conta quantos detalhes de OS/LPU existem para um par OS/LPU que contenham '_AC_' na chave.
     * Usado para gerar a sequência de atividades complementares.
     */
    long countByOsAndLpuAndKeyContaining(OS os, Lpu lpu, String infix);

    /**
     * Conta quantos detalhes de OS/LPU existem para um par OS/LPU que NÃO contenham '_AC_' na chave.
     * Usado para gerar a sequência de atividades normais.
     */
    long countByOsAndLpuAndKeyNotContaining(OS os, Lpu lpu, String infix);
}