package br.com.inproutservices.inproutsystem.dtos.index;

import java.util.List;

public record EtapaDTO(Long id, String codigo, String nome, List<EtapaDetalhadaDTO> etapasDetalhadas) {}
