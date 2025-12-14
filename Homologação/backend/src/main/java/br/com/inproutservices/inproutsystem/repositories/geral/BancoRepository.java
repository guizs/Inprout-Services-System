package br.com.inproutservices.inproutsystem.repositories.geral;

import br.com.inproutservices.inproutsystem.entities.geral.Banco;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BancoRepository extends JpaRepository<Banco, Long> {
    List<Banco> findAllByOrderByNomeAsc();
}