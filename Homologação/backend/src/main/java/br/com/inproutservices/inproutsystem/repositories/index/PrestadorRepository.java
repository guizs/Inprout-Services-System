package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.Prestador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrestadorRepository extends JpaRepository<Prestador, Long> {

    Optional<Prestador> findByCodigoPrestador(String codigoPrestador);

    boolean existsByCodigoPrestador(String codigoPrestador);

    List<Prestador> findByAtivoTrue();

    List<Prestador> findByAtivoFalse();

    @Query("SELECT p FROM Prestador p WHERE lower(p.prestador) LIKE lower(concat('%', :termo, '%')) OR lower(p.codigoPrestador) LIKE lower(concat('%', :termo, '%'))")
    List<Prestador> buscarPorTermo(@Param("termo") String termo);
}