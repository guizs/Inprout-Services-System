package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.time.LocalDate;

public record ProgramacaoDiariaDTO(
        LocalDate data,
        String gestor,
        Long quantidade
) {}