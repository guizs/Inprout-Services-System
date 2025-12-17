package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.PrecoDocumentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrecoDocumentacaoRepository extends JpaRepository<PrecoDocumentacao, Long> {

    Optional<PrecoDocumentacao> findByDocumentistaIdAndTipoDocumentacaoId(Long documentistaId, Long tipoDocumentacaoId);
}