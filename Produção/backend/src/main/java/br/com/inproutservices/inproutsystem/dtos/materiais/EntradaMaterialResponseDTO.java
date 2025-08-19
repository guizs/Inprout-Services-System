package br.com.inproutservices.inproutsystem.dtos.materiais;

import br.com.inproutservices.inproutsystem.entities.materiais.EntradaMaterial;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EntradaMaterialResponseDTO(
        Long id,
        BigDecimal quantidade,
        BigDecimal custoUnitario,
        LocalDateTime dataEntrada,
        String observacoes
) {
    public EntradaMaterialResponseDTO(EntradaMaterial entrada) {
        this(
                entrada.getId(),
                entrada.getQuantidade(),
                entrada.getCustoUnitario(),
                entrada.getDataEntrada(),
                entrada.getObservacoes()
        );
    }
}