package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OsLpuDetalhesRepository extends JpaRepository<OsLpuDetalhes, Long> {

    Optional<OsLpuDetalhes> findByKey(String key);
}