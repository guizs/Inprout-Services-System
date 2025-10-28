package br.com.inproutservices.inproutsystem.repositories.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoAtividadeComplementar;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusSolicitacaoComplementar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface SolicitacaoAtividadeComplementarRepository extends JpaRepository<SolicitacaoAtividadeComplementar, Long> {

    // Busca solicitações pendentes para um coordenador, filtrando por seus segmentos
    List<SolicitacaoAtividadeComplementar> findByStatusInAndOsSegmentoIn(List<StatusSolicitacaoComplementar> statuses, Set<Segmento> segmentos);

    // Busca todas as solicitações com determinados status (usado pelo Controller/Admin)
    List<SolicitacaoAtividadeComplementar> findByStatusIn(List<StatusSolicitacaoComplementar> statuses);

    // Busca o histórico de um usuário (aprovadas/rejeitadas) dentro de seus segmentos
    @Query("SELECT s FROM SolicitacaoAtividadeComplementar s WHERE s.status IN :statuses AND s.os.segmento IN :segmentos ORDER BY s.dataSolicitacao DESC")
    List<SolicitacaoAtividadeComplementar> findHistoricoBySegmentoIn(@Param("statuses") List<StatusSolicitacaoComplementar> statuses, @Param("segmentos") Set<Segmento> segmentos);

    @Query("SELECT s FROM SolicitacaoAtividadeComplementar s WHERE s.os.segmento IN :segmentos ORDER BY s.dataSolicitacao DESC")
    List<SolicitacaoAtividadeComplementar> findAllByOsSegmentoIn(@Param("segmentos") Set<Segmento> segmentos);
}