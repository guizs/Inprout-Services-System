package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;
import java.util.List;

public record DashboardCpsDTO(
        BigDecimal valorTotal,
        BigDecimal valorTotalPago,
        List<ValoresPorSegmentoDTO> valoresPorSegmento
) {}