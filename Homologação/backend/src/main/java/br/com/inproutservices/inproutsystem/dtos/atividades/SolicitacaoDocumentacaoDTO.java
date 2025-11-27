package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoDocumentacao;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusDocumentacao;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class SolicitacaoDocumentacaoDTO {

    public record Response(
            Long id,
            Long lancamentoId,
            String os,
            String projeto,
            String lpu,
            String solicitanteNome,
            String documentadorNome,
            StatusDocumentacao status,
            @JsonFormat(pattern = "dd/MM/yyyy HH:mm") LocalDateTime dataSolicitacao,
            String observacao
    ) {
        public Response(SolicitacaoDocumentacao s) {
            this(
                    s.getId(),
                    s.getLancamento().getId(),
                    s.getLancamento().getOs().getOs(),
                    s.getLancamento().getOs().getProjeto(),
                    s.getLancamento().getOsLpuDetalhe().getLpu().getCodigoLpu(),
                    s.getSolicitante().getNome(),
                    s.getDocumentador().getNome(),
                    s.getStatus(),
                    s.getDataSolicitacao(),
                    s.getObservacao()
            );
        }
    }

    public record Request(
            Long lancamentoId,
            Long solicitanteId,
            Long documentadorId
    ) {}

    public record Report(
            String observacao
    ) {}
}