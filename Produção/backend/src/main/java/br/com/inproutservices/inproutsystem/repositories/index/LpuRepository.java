package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface LpuRepository extends JpaRepository<Lpu, Long> {

    /**
     * Busca LPUs com base em um status opcional de ativação.
     * Se o status for nulo, retorna todas as LPUs.
     * Se o status for true/false, filtra de acordo.
     * @param ativo O status de ativação (true, false) ou null.
     * @return Uma lista de LPUs filtrada.
     */
    @Query("SELECT l FROM Lpu l WHERE :ativo IS NULL OR l.ativo = :ativo ORDER BY l.id ASC")
    List<Lpu> findByStatus(@Param("ativo") Boolean ativo);

    Optional<Lpu> findByCodigoLpuAndContratoId(String codigoLpu, Long contratoId);

    /**
     * Busca todas as LPUs ativas associadas a um contrato específico.
     */
    List<Lpu> findAllByContratoIdAndAtivoTrue(Long contratoId);

    @Query("SELECT l FROM Lpu l JOIN FETCH l.contrato WHERE l.id = :id")
    Optional<Lpu> findByIdWithContrato(@Param("id") Long id);

}