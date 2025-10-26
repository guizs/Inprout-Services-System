package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoAtividadeComplementar;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusSolicitacaoComplementar;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public class SolicitacaoAtividadeComplementarDTO {

    // DTO para a RESPOSTA que o backend envia para o frontend
    public record Response(
            Long id,
            OsSimpleDTO os,
            LpuSimpleDTO lpu,
            Integer quantidade,
            String solicitanteNome,
            String justificativa,
            StatusSolicitacaoComplementar status,
            @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataSolicitacao,
            String aprovadorCoordenadorNome,
            @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataAcaoCoordenador,
            String aprovadorControllerNome,
            @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataAcaoController,
            String motivoRecusa
    ) {
        public Response(SolicitacaoAtividadeComplementar s) {
            this(
                    s.getId(),
                    new OsSimpleDTO(s.getOs()),
                    new LpuSimpleDTO(s.getLpu()),
                    s.getQuantidade(),
                    s.getSolicitante() != null ? s.getSolicitante().getNome() : null,
                    s.getJustificativa(),
                    s.getStatus(),
                    s.getDataSolicitacao(),
                    s.getAprovadorCoordenador() != null ? s.getAprovadorCoordenador().getNome() : null,
                    s.getDataAcaoCoordenador(),
                    s.getAprovadorController() != null ? s.getAprovadorController().getNome() : null,
                    s.getDataAcaoController(),
                    s.getMotivoRecusa()
            );
        }
    }

    // DTO para a REQUISIÇÃO que o frontend envia para o backend
    public record Request(
            Long osId,
            Long lpuId,
            Integer quantidade,
            Long solicitanteId,
            String justificativa
    ) {}

    // DTO para APROVAR ou REJEITAR uma solicitação
    public record AcaoDTO(
            Long aprovadorId,
            String motivo // Usado apenas na rejeição
    ) {}

    // DTOs aninhados para simplificar a resposta
    public record OsSimpleDTO(Long id, String os, SegmentoSimpleDTO segmento) {
        public OsSimpleDTO(OS osEntity) {
            this(osEntity.getId(), osEntity.getOs(), osEntity.getSegmento() != null ? new SegmentoSimpleDTO(osEntity.getSegmento()) : null);
        }
    }

    public record LpuSimpleDTO(Long id, String codigoLpu, String nomeLpu) {
        public LpuSimpleDTO(Lpu lpuEntity) {
            this(lpuEntity.getId(), lpuEntity.getCodigoLpu(), lpuEntity.getNomeLpu());
        }
    }

    public record SegmentoSimpleDTO(Long id, String nome) {
        public SegmentoSimpleDTO(Segmento segmento) {
            this(segmento.getId(), segmento.getNome());
        }
    }
}