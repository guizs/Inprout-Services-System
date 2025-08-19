package br.com.inproutservices.inproutsystem.enums.atividades;

// Adicione os imports que estão faltando
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum SituacaoOperacional {

    NAO_INICIADO("Não iniciado"),
    AGUARDANDO_DOCUMENTACAO("Aguardando documentação"),
    PARALISADO("Paralisado"),
    EM_ANDAMENTO("Em andamento"),
    FINALIZADO("Finalizado");

    private final String descricao;

    SituacaoOperacional(String descricao) {
        this.descricao = descricao;
    }

    // Adicione a anotação @JsonValue aqui
    @JsonValue
    public String getDescricao() {
        return descricao;
    }

    // Adicione este método estático com a anotação @JsonCreator
    @JsonCreator
    public static SituacaoOperacional fromDescricao(String descricao) {
        for (SituacaoOperacional situacao : SituacaoOperacional.values()) {
            if (situacao.descricao.equalsIgnoreCase(descricao)) {
                return situacao;
            }
        }
        throw new IllegalArgumentException("Descrição inválida para SituacaoOperacional: " + descricao);
    }
}