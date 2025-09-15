package br.com.inproutservices.inproutsystem.dtos.materiais;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MaterialRequestDTO(
        @NotBlank(message = "O código é obrigatório")
        String codigo,

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        @NotBlank(message = "A unidade de medida é obrigatória")
        String unidadeMedida,

        @NotNull(message = "O saldo físico inicial é obrigatório")
        @DecimalMin(value = "0.0", inclusive = false, message = "O saldo físico deve ser maior que zero")
        BigDecimal saldoFisicoInicial,

        @NotNull(message = "O custo unitário inicial é obrigatório")
        @DecimalMin(value = "0.0", inclusive = false, message = "O custo unitário deve ser maior que zero")
        BigDecimal custoUnitarioInicial,

        String observacoes,

        @NotBlank(message = "A empresa é obrigatória")
        String empresa
) {}