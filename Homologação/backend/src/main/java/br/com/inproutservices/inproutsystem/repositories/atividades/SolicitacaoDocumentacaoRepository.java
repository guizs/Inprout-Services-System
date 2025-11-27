package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoDocumentacao;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusDocumentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitacaoDocumentacaoRepository extends JpaRepository<SolicitacaoDocumentacao, Long> {

    List<SolicitacaoDocumentacao> findByDocumentadorIdAndStatusNot(Long documentadorId, StatusDocumentacao statusExcluido);

    List<SolicitacaoDocumentacao> findBySolicitanteId(Long solicitanteId);

    Optional<SolicitacaoDocumentacao> findByLancamentoId(Long lancamentoId);
}