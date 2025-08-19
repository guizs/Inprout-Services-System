package br.com.inproutservices.inproutsystem.enums.atividades;

public enum SituacaoAprovacao {
    RASCUNHO,                 // Lançamento criado pelo Manager, ainda não submetido.
    PENDENTE_COORDENADOR,     // Aguardando ação do Coordenador.
    AGUARDANDO_EXTENSAO_PRAZO,// Coordenador solicitou novo prazo, aguardando Controller.
    PENDENTE_CONTROLLER,      // Aguardando ação do Controller.
    APROVADO,                 // Fluxo finalizado com sucesso.
    RECUSADO_COORDENADOR,
    RECUSADO_CONTROLLER,
    PRAZO_VENCIDO
}