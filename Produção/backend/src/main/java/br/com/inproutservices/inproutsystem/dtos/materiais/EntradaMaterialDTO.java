package br.com.inproutservices.inproutsystem.dtos.materiais;

import java.math.BigDecimal;

public record EntradaMaterialDTO(
        Long materialId,
        BigDecimal quantidade,
        BigDecimal custoUnitario,
        String observacoes
) {}