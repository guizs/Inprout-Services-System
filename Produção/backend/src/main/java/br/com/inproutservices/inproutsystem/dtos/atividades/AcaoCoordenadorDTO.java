package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.time.LocalDate; // Adicione este import

/**
 * DTO para receber os dados das ações do Coordenador.
 */
public record AcaoCoordenadorDTO(
        Long coordenadorId,
        String comentario,
        LocalDate novaDataSugerida // NOVO CAMPO: A data que o Coordenador está propondo.
) {
}