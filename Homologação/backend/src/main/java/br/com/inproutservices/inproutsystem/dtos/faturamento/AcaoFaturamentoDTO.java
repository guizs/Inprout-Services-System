package br.com.inproutservices.inproutsystem.dtos.faturamento;

/**
 * DTO para receber o payload das ações do Assistant (Aprovar, Recusar, Faturar).
 */
public record AcaoFaturamentoDTO(
        Long assistantId,
        String motivo // Usado apenas na recusa
) {}