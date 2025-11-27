package br.com.inproutservices.inproutsystem.repositories.gate;

import br.com.inproutservices.inproutsystem.entities.gate.Gate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface GateRepository extends JpaRepository<Gate, Long> {

    Optional<Gate> findByNome(String nome);

    List<Gate> findAllByOrderByDataInicioDesc();
}