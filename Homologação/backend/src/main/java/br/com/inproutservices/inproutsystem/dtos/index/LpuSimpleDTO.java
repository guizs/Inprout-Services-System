package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;

/**
 * DTO simplificado para representar uma LPU.
 * Usado para evitar loops de serialização e expor apenas dados essenciais.
 */
public record LpuSimpleDTO(
        Long id,
        String codigoLpu,
        String nomeLpu
) {
    /**
     * Construtor que converte uma entidade Lpu para este DTO.
     * @param lpu A entidade Lpu a ser convertida.
     */
    public LpuSimpleDTO(Lpu lpu) {
        this(
                lpu.getId(),
                lpu.getCodigoLpu(),
                lpu.getNomeLpu()
        );
    }
}