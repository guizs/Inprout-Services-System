package br.com.inproutservices.inproutsystem.dtos.atividades;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTOs para as ações no módulo de Controle de Pagamento CPS.
 */
public class ControleCpsDTO {

    /**
     * DTO para ações do Coordenador (Fechar, Recusar, Solicitar Alteração).
     */
    public record AcaoCoordenadorDTO(
            @NotNull Long lancamentoId,
            @NotNull Long coordenadorId,
            @NotNull BigDecimal valorPagamento, // Obrigatório mesmo que não mude
            String justificativa // Obrigatória se o valor mudar ou se for recusa
    ) {}

    /**
     * DTO para ações do Controller (Marcar como Pago).
     */
    public record AcaoControllerDTO(
            @NotEmpty List<Long> lancamentoIds,
            @NotNull Long controllerId
    ) {}
}