package br.com.inproutservices.inproutsystem.dtos.gate;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public record GateCreateDTO(
        String nome,
        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate dataInicio,
        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate dataFim
) {}