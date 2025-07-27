package br.com.inproutservices.inproutsystem.dtos.index;

// Adicione a importação da sua entidade Lpu
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
        ContratoResponseDTO contrato
) {
    // --- INÍCIO DA CORREÇÃO: ADICIONE ESTE CONSTRUTOR ---
    /**
     * Construtor adicional que converte uma entidade Lpu para este DTO.
     * @param lpu A entidade Lpu vinda do banco de dados.
     */
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
                        ? new ContratoResponseDTO(lpu.getContrato().getId(), lpu.getContrato().getNome())
                        : null
        );
    }
    // --- FIM DA CORREÇÃO ---
}