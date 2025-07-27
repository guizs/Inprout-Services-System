package br.com.inproutservices.inproutsystem.repositories.index;

import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {

    /**
     * Busca um Contrato pelo seu nome.
     * Útil para garantir que não sejam criados contratos com nomes duplicados.
     * @param nome O nome do contrato a ser buscado.
     * @return Um Optional contendo o Contrato se encontrado.
     */
    Optional<Contrato> findByNome(String nome);
    List<Contrato> findAllByOrderByNomeAsc();

}
