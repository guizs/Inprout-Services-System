package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;
import java.util.List;

// DTO Principal que agrupa todos os dados do relatório
public record CpsResponseDTO(
        BigDecimal valorTotalGeral,
        List<ValoresPorSegmentoDTO> valoresPorSegmento,
        List<ConsolidadoPorPrestadorDTO> consolidadoPorPrestador,
        List<LancamentoResponseDTO> lancamentosDetalhados
) {}

