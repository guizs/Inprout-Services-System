package br.com.inproutservices.inproutsystem.dtos.atividades;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class ControleCpsDTO {

    public record AcaoCoordenadorDTO(
            @NotNull Long lancamentoId,
            @NotNull Long coordenadorId,
            @NotNull BigDecimal valorPagamento,
            String justificativa
    ) {}

    public record AcaoControllerDTO(
            @NotEmpty List<Long> lancamentoIds,
            @NotNull Long controllerId
    ) {}

    public record AcaoRecusaControllerDTO(
            @NotNull Long lancamentoId,
            @NotNull Long controllerId,
            @NotNull String motivo
    ) {}

    public record AcaoCoordenadorLoteDTO(
            @NotEmpty List<Long> lancamentoIds,
            @NotNull Long coordenadorId
    ) {}

    // --- NOVOS DTOs ADICIONADOS ---
    public record AcaoRecusaCoordenadorLoteDTO(
            @NotEmpty List<Long> lancamentoIds,
            @NotNull Long coordenadorId,
            @NotNull String justificativa
    ) {}

    public record AcaoRecusaControllerLoteDTO(
            @NotEmpty List<Long> lancamentoIds,
            @NotNull Long controllerId,
            @NotNull String motivo
    ) {}
}