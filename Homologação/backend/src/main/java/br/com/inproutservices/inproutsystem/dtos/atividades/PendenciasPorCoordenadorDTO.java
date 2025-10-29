package br.com.inproutservices.inproutsystem.dtos.atividades;

public record PendenciasPorCoordenadorDTO(
        Long coordenadorId,
        String coordenadorNome,
        Long quantidade
) {}