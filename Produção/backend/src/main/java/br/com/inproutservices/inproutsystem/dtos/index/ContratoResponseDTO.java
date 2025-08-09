package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import java.util.List;
import java.util.stream.Collectors;

// Este DTO representa a estrutura de resposta para um Contrato.
public record ContratoResponseDTO(
        Long id,
        String nome,
        boolean ativo,
        List<LpuResponseDTO> lpus
) {
    // Construtor que transforma a entidade Contrato neste DTO.
    public ContratoResponseDTO(Contrato contrato) {
        this(
                contrato.getId(),
                contrato.getNome(),
                contrato.isAtivo(),
                // Mapeia a lista de entidades Lpu para uma lista de LpuResponseDTOs.
                contrato.getLpus().stream()
                        .map(LpuResponseDTO::new)
                        .collect(Collectors.toList())
        );
    }
}