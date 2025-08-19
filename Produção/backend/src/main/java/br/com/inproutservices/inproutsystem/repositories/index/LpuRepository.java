// Local: backend/src/main/java/br/com/inproutservices/inproutsystem/repositories/index/LpuRepository.java

package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LpuRepository extends JpaRepository<Lpu, Long> {

    Optional<Lpu> findByCodigoLpu(String codigoLpu);

    List<Lpu> findByAtivo(boolean ativo);

    @Query("SELECT l FROM Lpu l LEFT JOIN FETCH l.contrato WHERE l.id = :id")
    Optional<Lpu> findByIdWithContrato(@Param("id") Long id);

    Optional<Lpu> findByCodigoLpuAndContratoId(String codigoLpu, Long contratoId);

    // ================== ADICIONE ESTE MÉTODO ==================
    // Este método buscará todas as LPUs ativas para um ID de contrato específico.
    List<Lpu> findAllByContratoIdAndAtivoTrue(Long contratoId);
    // =========================================================

}