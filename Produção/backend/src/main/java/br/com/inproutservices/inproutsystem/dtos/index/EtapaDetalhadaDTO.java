package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;

import java.util.List;

public record EtapaDetalhadaDTO(Long id, String indice, String nome, List<StatusEtapa> status) {}
