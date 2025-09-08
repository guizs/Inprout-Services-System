package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.entities.index.Prestador;

/**
 * DTO simplificado para representar um Prestador.
 */
public record PrestadorSimpleDTO(
        Long id,
        String codigo,
        String nome
) {
    /**
     * Construtor que converte uma entidade Prestador para este DTO.
     * @param prestador A entidade Prestador a ser convertida.
     */
    public PrestadorSimpleDTO(Prestador prestador) {
        this(
                prestador.getId(),
                prestador.getCodigoPrestador(), // Verifique se o nome do método é este na sua entidade
                prestador.getPrestador()        // Verifique se o nome do método é este na sua entidade
        );
    }
}