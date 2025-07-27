package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.Etapa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EtapaRepository extends JpaRepository<Etapa, Long> {

    Optional<Etapa> findByCodigo(String codigo);

    @Query("SELECT DISTINCT e FROM Etapa e LEFT JOIN FETCH e.etapasDetalhadas ORDER BY e.codigo")
    List<Etapa> buscarComDetalhadasOrdenadas();

}
