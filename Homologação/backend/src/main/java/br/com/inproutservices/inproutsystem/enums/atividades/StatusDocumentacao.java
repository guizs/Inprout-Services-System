package br.com.inproutservices.inproutsystem.enums.atividades;

public enum StatusDocumentacao {
    PENDENTE, // O lançamento existe, tem data de doc, mas não foi solicitado
    SOLICITADO,           // Manager solicitou, está na fila do Documentador
    EM_ANALISE,           // Documentador pegou para fazer
    CONCLUIDO,          // Finalizado com sucesso
    REPORTADO             // Documentador encontrou um problema
}