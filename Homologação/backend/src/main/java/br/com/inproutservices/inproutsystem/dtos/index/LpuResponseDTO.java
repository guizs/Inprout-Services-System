package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;

import java.math.BigDecimal;

public record LpuResponseDTO(
        Long id,
        String codigoLpu,
        String nomeLpu,
        String unidade,
        BigDecimal valorSemImposto,
        BigDecimal valorComImposto,
        boolean ativo,
        ContratoSimpleDTO contrato
) {
    public LpuResponseDTO(Lpu lpu) {
        this(
                lpu.getId(),
                lpu.getCodigoLpu(),
                lpu.getNomeLpu(),
                lpu.getUnidade(),
                lpu.getValorSemImposto(),
                lpu.getValorComImposto(),
                lpu.isAtivo(),
                // Cria o DTO de contrato aninhado, tratando o caso de ser nulo para evitar erros
                (lpu.getContrato() != null)
                        ? new ContratoSimpleDTO(lpu.getContrato().getId(), lpu.getContrato().getNome())
                        : null
        );
    }

}