package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Import necessário
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {

    Optional<Contrato> findByNome(String nome);

    // --- INÍCIO DA CORREÇÃO ---
    /**
     * Busca todos os contratos e, para cada um, já carrega (FETCH) a sua lista de LPUs
     * em uma única consulta, resolvendo problemas de "lazy loading".
     */
    @Query("SELECT DISTINCT c FROM Contrato c LEFT JOIN FETCH c.lpus ORDER BY c.nome ASC")
    List<Contrato> findAllWithLpus();
    // --- FIM DA CORREÇÃO ---

    List<Contrato> findAllByOrderByNomeAsc();
}