package br.com.inproutservices.inproutsystem.enums.index;

public enum TipoPix {
    CPF("CPF"),
    CNPJ("CNPJ"),
    EMAIL("EMAIL"),
    TELEFONE("TELEFONE"),
    CHAVE_ALEATORIA("CHAVE_ALEATORIA"),
    NA("NA");

    private final String descricao;

    TipoPix(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}

