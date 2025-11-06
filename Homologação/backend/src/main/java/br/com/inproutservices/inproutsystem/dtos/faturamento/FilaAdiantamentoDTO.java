package br.com.inproutservices.inproutsystem.dtos.faturamento;

import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;

/**
 * DTO para a fila "Solicitar Adiantamento" do Coordenador.
 * Mostra o item da OS e seu último status operacional.
 */
public record FilaAdiantamentoDTO(
        Long osLpuDetalheId,
        String os,
        String key,
        String lpuNome,
        SituacaoOperacional ultimoStatusOperacional
) {
    public FilaAdiantamentoDTO(OsLpuDetalhe detalhe, SituacaoOperacional status) {
        this(
                detalhe.getId(),
                detalhe.getOs() != null ? detalhe.getOs().getOs() : "N/A",
                detalhe.getKey(),
                detalhe.getLpu() != null ? detalhe.getLpu().getNomeLpu() : "N/A",
                status
        );
    }
}