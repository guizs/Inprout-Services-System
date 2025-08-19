package br.com.inproutservices.inproutsystem.dtos.materiais;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para receber os dados de criação de uma solicitação a partir do frontend.
 * A estrutura deste record deve corresponder exatamente ao JSON enviado na requisição POST.
 */
public record SolicitacaoRequestDTO(
        Long idSolicitante,
        Long osId,          // CAMPO ADICIONADO: ID da Ordem de Serviço selecionada no modal
        Long lpuId,         // CAMPO ADICIONADO: ID da LPU selecionada no modal
        String justificativa,
        List<ItemDTO> itens // Lista de itens solicitados
) {
    /**
     * DTO aninhado para representar cada item da solicitação.
     * Garante que cada item tenha os campos necessários.
     */
    public record ItemDTO(String codigoMaterial, BigDecimal quantidade) {}
}