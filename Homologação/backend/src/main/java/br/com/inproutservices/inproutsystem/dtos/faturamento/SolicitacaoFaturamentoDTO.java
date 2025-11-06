package br.com.inproutservices.inproutsystem.dtos.faturamento;

import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.TipoFaturamento;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * DTO de Resposta para o frontend, contendo dados da solicitação e do item da OS.
 */
public record SolicitacaoFaturamentoDTO(
        Long id,
        OsLpuDetalheDTO osLpuDetalhe,
        String solicitanteNome,
        String responsavelNome,
        StatusFaturamento status,
        TipoFaturamento tipo,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataSolicitacao,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataUltimaAcao,
        String observacao
) {
    public SolicitacaoFaturamentoDTO(SolicitacaoFaturamento sf) {
        this(
                sf.getId(),
                new OsLpuDetalheDTO(sf.getOsLpuDetalhe()),
                sf.getSolicitante() != null ? sf.getSolicitante().getNome() : null,
                sf.getResponsavel() != null ? sf.getResponsavel().getNome() : null,
                sf.getStatus(),
                sf.getTipo(),
                sf.getDataSolicitacao(),
                sf.getDataUltimaAcao(),
                sf.getObservacao()
        );
    }

    /**
     * DTO aninhado para os detalhes do item da OS.
     */
    public record OsLpuDetalheDTO(
            Long id,
            String os,
            String key,
            String lpuCodigo,
            String lpuNome
    ) {
        public OsLpuDetalheDTO(OsLpuDetalhe d) {
            this(
                    d.getId(),
                    d.getOs() != null ? d.getOs().getOs() : null,
                    d.getKey(),
                    d.getLpu() != null ? d.getLpu().getCodigoLpu() : null,
                    d.getLpu() != null ? d.getLpu().getNomeLpu() : null
            );
        }
    }
}