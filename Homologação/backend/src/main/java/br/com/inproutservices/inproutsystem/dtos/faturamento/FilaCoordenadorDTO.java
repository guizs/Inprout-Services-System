package br.com.inproutservices.inproutsystem.dtos.faturamento;

import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;

/**
 * DTO simples para a fila "Solicitar ID" do Coordenador.
 */
public record FilaCoordenadorDTO(
        Long lancamentoId,
        OsResponseDto.OsLpuDetalheCompletoDto detalhe // <-- ALTERADO
) {
    public FilaCoordenadorDTO(Lancamento l) {
        this(
                l.getId(),
                // Constrói o DTO completo usando o detalhe do lançamento
                new OsResponseDto.OsLpuDetalheCompletoDto(l.getOsLpuDetalhe()) // <-- ALTERADO
        );
    }
}