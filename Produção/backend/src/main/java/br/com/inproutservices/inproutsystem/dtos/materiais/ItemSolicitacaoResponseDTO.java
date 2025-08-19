package br.com.inproutservices.inproutsystem.dtos.materiais;

import br.com.inproutservices.inproutsystem.entities.materiais.ItemSolicitacao;

import java.math.BigDecimal;

// DTO para exibir um item dentro de uma solicitação
public record ItemSolicitacaoResponseDTO(
        Long id,
        MaterialResponseDTO material,
        BigDecimal quantidadeSolicitada,
        BigDecimal saldoNoMomentoDaAprovacao // <-- ADICIONE ESTE CAMPO
) {
    // Construtor que converte uma entidade ItemSolicitacao para este DTO
    public ItemSolicitacaoResponseDTO(ItemSolicitacao entity) {
        this(
                entity.getId(),
                new MaterialResponseDTO(entity.getMaterial()),
                entity.getQuantidadeSolicitada(),
                entity.getSaldoNoMomentoDaAprovacao()
        );
    }
}