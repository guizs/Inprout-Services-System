package br.com.inproutservices.inproutsystem.dtos.faturamento;

import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;

/**
 * DTO para a fila "Solicitar Adiantamento" do Coordenador.
 * Mostra o item da OS e seu último status operacional.
 */
public record FilaAdiantamentoDTO(
        OsResponseDto.OsLpuDetalheCompletoDto detalhe // <-- ALTERADO
) {
    public FilaAdiantamentoDTO(OsLpuDetalhe detalhe, SituacaoOperacional status) {
        this(
                // O status operacional já está embutido no OsLpuDetalheCompletoDto (via ultimoLancamento)
                new OsResponseDto.OsLpuDetalheCompletoDto(detalhe) // <-- ALTERADO
        );
    }
}