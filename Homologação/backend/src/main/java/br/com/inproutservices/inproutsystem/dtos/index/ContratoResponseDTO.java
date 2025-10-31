package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.entities.index.Lpu; // Import necessário
import java.util.List;
import java.util.stream.Collectors;

public record ContratoResponseDTO(
        Long id,
        String nome,
        boolean ativo,
        List<LpuResponseDTO> lpus
) {
    public ContratoResponseDTO(Contrato contrato) {
        this(
                contrato.getId(),
                contrato.getNome(),
                contrato.isAtivo(),

                // --- INÍCIO DA CORREÇÃO DEFINITIVA ---
                // Filtra a lista de LPUs para incluir apenas as que estão ativas
                contrato.getLpus().stream()
                        .filter(Lpu::isAtivo) // Garante que apenas LPUs ativas sejam enviadas
                        .map(LpuResponseDTO::new)
                        .collect(Collectors.toList())
                // --- FIM DA CORREÇÃO DEFINITIVA ---
        );
    }
}