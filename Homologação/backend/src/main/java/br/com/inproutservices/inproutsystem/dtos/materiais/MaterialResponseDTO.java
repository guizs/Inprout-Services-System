package br.com.inproutservices.inproutsystem.dtos.materiais;

import br.com.inproutservices.inproutsystem.entities.materiais.Material;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

public record MaterialResponseDTO(
        Long id,
        String codigo,
        String descricao,
        String unidadeMedida,
        BigDecimal saldoFisico,
        BigDecimal custoMedioPonderado,
        BigDecimal custoTotal,
        String observacoes,
        List<EntradaMaterialResponseDTO> entradas // NOVO CAMPO
) {
    public MaterialResponseDTO(Material entity) {
        this(
                entity.getId(),
                entity.getCodigo(),
                entity.getDescricao(),
                entity.getUnidadeMedida(),
                entity.getSaldoFisico(),
                entity.getCustoMedioPonderado(),
                (entity.getSaldoFisico() != null && entity.getCustoMedioPonderado() != null)
                        ? entity.getSaldoFisico().multiply(entity.getCustoMedioPonderado()).setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO,
                entity.getObservacoes(),
                // Mapeia a lista de entidades para a lista de DTOs
                entity.getEntradas() != null ?
                        entity.getEntradas().stream()
                                .map(EntradaMaterialResponseDTO::new)
                                .collect(Collectors.toList()) : List.of()
        );
    }
}