package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.time.LocalDate;

/**
 * DTO para receber os dados das ações de aprovação ou rejeição do Controller.
 */
public record AcaoControllerDTO(
        /**
         * O ID do Controller que está realizando a ação.
         * Virá do usuário autenticado na sessão.
         */
        Long controllerId,

        /**
         * O motivo da rejeição. Este campo é obrigatório ao rejeitar.
         * Pode ser nulo no caso de uma aprovação.
         */
        String motivoRejeicao,
        LocalDate novaDataPrazo
) {
}