package br.com.inproutservices.inproutsystem.enums.index;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum StatusEtapa {
    // Para cada constante, associamos a sua descrição
    TRABALHADO("Trabalhado"),
    TRABALHO_PARCIAL("Trabalho Parcial"),
    NAO_TRABALHADO("Não trabalhado");

    private final String descricao;

    // Construtor para receber a descrição
    StatusEtapa(String descricao) {
        this.descricao = descricao;
    }

    /**
     * Esta anotação diz ao sistema (Jackson) para usar o valor retornado por este método
     * quando for converter o enum para JSON (serialização).
     * Ex: StatusEtapa.NAO_TRABALHADO se tornará "Não trabalhado" no JSON.
     */
    @JsonValue
    public String getDescricao() {
        return descricao;
    }

    /**
     * Esta anotação diz ao sistema (Jackson) para usar este método para criar
     * o enum a partir de um valor de texto vindo do JSON (desserialização).
     * Ex: Ele vai receber "Não trabalhado" do JSON e retornar StatusEtapa.NAO_TRABALHADO.
     */
    @JsonCreator
    public static StatusEtapa fromDescricao(String descricao) {
        for (StatusEtapa status : StatusEtapa.values()) {
            if (status.descricao.equalsIgnoreCase(descricao)) {
                return status;
            }
        }
        // Lança uma exceção se a descrição recebida não for válida
        throw new IllegalArgumentException("Descrição inválida para StatusEtapa: " + descricao);
    }
}