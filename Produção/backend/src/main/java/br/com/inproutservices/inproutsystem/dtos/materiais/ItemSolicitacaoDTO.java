package br.com.inproutservices.inproutsystem.dtos.materiais;

import java.math.BigDecimal;

// DTO para um item ao criar uma nova solicitação
public record ItemSolicitacaoDTO(
        String codigoMaterial,
        BigDecimal quantidade
) {}