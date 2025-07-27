package br.com.inproutservices.inproutsystem.repositories.materiais;

import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.materiais.Solicitacao;
import br.com.inproutservices.inproutsystem.enums.materiais.StatusSolicitacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

/**
 * Repositório para a entidade Solicitacao.
 */
@Repository
public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {

    /**
     * Encontra todas as solicitações que correspondem a um status específico.
     * Usaremos este método para buscar as solicitações "PENDENTE" para a tela de aprovação.
     *
     * @param status O status a ser filtrado (PENDENTE, APROVADA, etc).
     * @return Uma lista de Solicitações com o status especificado.
     */
    List<Solicitacao> findByStatus(StatusSolicitacao status);

    /**
     * Encontra todas as solicitações cujo status esteja em uma lista de status.
     * Perfeito para a tela de "Histórico", onde queremos buscar tanto "APROVADA" quanto "REJEITADA".
     *
     * @param statuses A lista de status para o filtro.
     * @return Uma lista de Solicitações que correspondem a qualquer um dos status da lista.
     */
    List<Solicitacao> findByStatusIn(List<StatusSolicitacao> statuses);

    /**
     * Verifica se existe algum ItemSolicitacao associado a um determinado ID de material.
     * Isso é usado para impedir a exclusão de um material que já possui histórico de solicitações.
     * A anotação @Query é necessária para consultar através de um relacionamento aninhado.
     */
    @Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM ItemSolicitacao i WHERE i.material.id = :materialId")
    boolean existsByItensMaterialId(@Param("materialId") Long materialId);

    List<Solicitacao> findByStatusInAndOsSegmentoIn(List<StatusSolicitacao> statuses, Set<Segmento> segmentos);
}