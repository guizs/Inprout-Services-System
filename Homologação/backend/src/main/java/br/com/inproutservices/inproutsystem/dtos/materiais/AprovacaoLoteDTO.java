package br.com.inproutservices.inproutsystem.dtos.materiais;

import java.util.List;

public record AprovacaoLoteDTO(
        List<Long> ids,
        Long aprovadorId,
        String observacao
) {}