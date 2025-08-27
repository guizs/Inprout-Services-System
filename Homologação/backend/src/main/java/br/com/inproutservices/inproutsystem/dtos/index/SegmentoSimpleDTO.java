package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.entities.index.Segmento;

/**
 * DTO simplificado para representar um Segmento.
 * Usado para evitar loops de serialização e expor apenas dados essenciais.
 */
public record SegmentoSimpleDTO(
        Long id,
        String nome
) {
    /**
     * Construtor que converte uma entidade Segmento para este DTO.
     * @param segmento A entidade Segmento a ser convertida.
     */
    public SegmentoSimpleDTO(Segmento segmento) {
        this(
                segmento.getId(),
                segmento.getNome()
        );
    }
}