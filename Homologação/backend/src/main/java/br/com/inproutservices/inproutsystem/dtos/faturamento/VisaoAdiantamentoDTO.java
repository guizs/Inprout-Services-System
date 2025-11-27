package br.com.inproutservices.inproutsystem.dtos.faturamento;

import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto; // IMPORT ADICIONADO
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusFaturamento;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * DTO de Resposta para a aba "Visão de Adiantamentos".
 * Inclui o status do faturamento e o status operacional do item.
 */
public record VisaoAdiantamentoDTO(
        Long id,
        OsResponseDto.OsLpuDetalheCompletoDto osLpuDetalhe, // <-- TIPO ALTERADO
        String solicitanteNome,
        StatusFaturamento statusFaturamento, // O status do fluxo de faturamento
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataSolicitacao,
        boolean isOperacionalFinalizado // <-- A REGRA DE DESTAQUE
) {
    public VisaoAdiantamentoDTO(SolicitacaoFaturamento sf, boolean isOperacionalFinalizado) {
        this(
                sf.getId(),
                new OsResponseDto.OsLpuDetalheCompletoDto(sf.getOsLpuDetalhe()), // <-- CONSTRUTOR ATUALIZADO
                sf.getSolicitante() != null ? sf.getSolicitante().getNome() : null,
                sf.getStatus(),
                sf.getDataSolicitacao(),
                isOperacionalFinalizado
        );
    }
}