package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // Importe a classe List

@Repository
public interface EtapaDetalhadaRepository extends JpaRepository<EtapaDetalhada, Long> {

    List<EtapaDetalhada> findByNome(String nome);
}