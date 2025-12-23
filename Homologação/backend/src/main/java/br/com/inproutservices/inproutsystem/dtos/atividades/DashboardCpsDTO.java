package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;
import java.util.List;

public record DashboardCpsDTO(
        BigDecimal valorTotal,           // Total CPS
        BigDecimal valorTotalAdiantado,   // Total Adiantado
        BigDecimal valorTotalConfirmado,  // Total Confirmado (Fechado + Pago)
        BigDecimal valorTotalPendente,    // Total Pendente (Falta pagar / Com Controller)
        BigDecimal valorTotalPago,        // Total Pago
        Long quantidadeItens,
        List<ValoresPorSegmentoDTO> valoresPorSegmento
) {}