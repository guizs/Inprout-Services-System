package br.com.inproutservices.inproutsystem.dtos.materiais;

import java.math.BigDecimal;

public record MaterialRequestDTO(
        String codigo,
        String descricao,
        String unidadeMedida,
        BigDecimal saldoFisicoInicial,
        BigDecimal custoUnitarioInicial, // NOVO
        String observacoes // NOVO
) {}