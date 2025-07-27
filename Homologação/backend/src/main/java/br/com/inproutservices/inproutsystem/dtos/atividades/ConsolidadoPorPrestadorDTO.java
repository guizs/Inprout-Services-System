package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;

// DTO para a tabela consolidada por prestador
public record ConsolidadoPorPrestadorDTO(
        String prestadorNome,
        BigDecimal valorTotal,
        Long totalLancamentos
) {}
