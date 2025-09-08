package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SegmentoRepository extends JpaRepository<Segmento, Long> {

    Optional<Segmento> findByNome(String nome);

}