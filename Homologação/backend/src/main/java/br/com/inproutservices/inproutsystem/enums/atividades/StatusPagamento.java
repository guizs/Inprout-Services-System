package br.com.inproutservices.inproutsystem.enums.atividades;

/**
 * Define o fluxo de status do pagamento de um Lançamento
 * após ele ter sido APROVADO operacionalmente.
 */
public enum StatusPagamento {
    /**
     * Padrão para todos os lançamentos com SituacaoAprovacao = APROVADO.
     * Aguardando ação do Coordenador para "Fechar" o valor.
     */
    EM_ABERTO,

    /**
     * Coordenador confirmou/alterou o valor e fechou para pagamento.
     * Aguardando ação do Controller.
     */
    FECHADO,

    /**
     * Controller marcou o lançamento como pago.
     * Status final, movido para o histórico.
     */
    PAGO,

    /**
     * Coordenador recusou o pagamento (antes de ser pago).
     * Status final, movido para o histórico.
     */
    RECUSADO,

    /**
     * Coordenador solicitou alteração em um item que já estava FECHADO,
     * mas ainda não PAGO. Fica em destaque para o Controller.
     */
    ALTERACAO_SOLICITADA,
    SOLICITACAO_ADIANTAMENTO
}