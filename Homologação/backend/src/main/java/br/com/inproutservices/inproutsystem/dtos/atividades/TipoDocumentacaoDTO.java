package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;
import java.util.List;

public record TipoDocumentacaoDTO(
        Long id,
        String nome,
        BigDecimal valorPadrao,
        List<ConfigPrecoDTO> configuracoes
) {
    public record ConfigPrecoDTO(
            Long documentistaId,
            BigDecimal valor
    ) {}
}