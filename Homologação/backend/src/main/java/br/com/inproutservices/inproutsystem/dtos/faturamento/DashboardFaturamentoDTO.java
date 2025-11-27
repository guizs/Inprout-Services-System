package br.com.inproutservices.inproutsystem.dtos.faturamento;

public record DashboardFaturamentoDTO(
        long pendenteSolicitacao,  // Card 1: Fila do Coordenador (Etapa 06.05)
        long pendenteFila,         // Card 2: Fila do Assistant (PENDENTE_ASSISTANT)
        long idsRecusados,         // Card 3: Itens com status ID_RECUSADO
        long adiantamentosPendentes, // Card 4: Tipo ADIANTAMENTO que não estão FATURADO
        long faturadoMes           // Card 5: Total com status FATURADO nos últimos 30 dias
) {
}