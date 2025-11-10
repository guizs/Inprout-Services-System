package br.com.inproutservices.inproutsystem.dtos.gate;

import java.math.BigDecimal;
import java.util.List;

public record GateReportResponseDTO(
        BigDecimal valorTotalFaturado,
        BigDecimal valorTotalAntecipado,
        List<GateReportRowDTO> linhasDoRelatorio
) {}