package br.com.inproutservices.inproutsystem.dtos.materiais;

import jakarta.validation.constraints.NotBlank;


public record MaterialUpdateDTO(
        @NotBlank(message = "O código é obrigatório")
        String codigo,

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        String observacoes
) {}