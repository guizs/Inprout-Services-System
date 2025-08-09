package br.com.inproutservices.inproutsystem.services.config;

import java.time.LocalDate;

public interface PrazoService {
    /**
     * Calcula uma data futura com base em um número de dias úteis,
     * pulando fins de semana e feriados.
     * @param dataInicial A data de início da contagem.
     * @param diasUteis O número de dias úteis a serem adicionados.
     * @return A data final do prazo.
     */
    LocalDate calcularPrazoEmDiasUteis(LocalDate dataInicial, int diasUteis);

    LocalDate getDiaUtilAnterior(LocalDate dataReferencia);
}