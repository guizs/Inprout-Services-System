package br.com.inproutservices.inproutsystem.dtos.faturamento;

import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;

/**
 * DTO simples para a fila "Solicitar ID" do Coordenador.
 */
public record FilaCoordenadorDTO(
        Long lancamentoId,
        Long osLpuDetalheId,
        String os,
        String key,
        String lpuNome,
        String etapaNome
) {
    public FilaCoordenadorDTO(Lancamento l) {
        this(
                l.getId(),
                l.getOsLpuDetalhe().getId(),
                l.getOsLpuDetalhe().getOs().getOs(),
                l.getOsLpuDetalhe().getKey(),
                l.getOsLpuDetalhe().getLpu().getNomeLpu(),
                l.getEtapaDetalhada() != null ? l.getEtapaDetalhada().getNome() : "Etapa não informada"
        );
    }
}