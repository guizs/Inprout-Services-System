package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;

// DTO para os totais de cada segmento (para os cards)
public record ValoresPorSegmentoDTO(
        String segmentoNome,
        BigDecimal valorTotal
) {}
