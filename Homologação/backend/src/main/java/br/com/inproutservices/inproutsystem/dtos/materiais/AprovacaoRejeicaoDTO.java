package br.com.inproutservices.inproutsystem.dtos.materiais;

// DTO para receber os dados necessários para aprovar ou rejeitar uma solicitação
public record AprovacaoRejeicaoDTO(
        Long aprovadorId,
        String observacao // Usado apenas na rejeição, pode ser nulo na aprovação
) {}
