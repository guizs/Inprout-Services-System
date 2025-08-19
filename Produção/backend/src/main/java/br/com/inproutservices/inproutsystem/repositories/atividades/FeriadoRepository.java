package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.Feriado; // Supondo que você criará a entidade Feriado aqui
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface FeriadoRepository extends JpaRepository<Feriado, Long> {

    // Método para verificar se uma data específica é um feriado cadastrado
    boolean existsByData(LocalDate data);
}