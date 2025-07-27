package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO para receber os dados de criação de um novo Lançamento.
 */
public record LancamentoRequestDTO(
        Long osId,
        Long prestadorId,
        Long etapaDetalhadaId,
        Long lpuId,

        // CORREÇÃO: O backend agora espera o formato dd/MM/yyyy
        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate dataAtividade,

        String equipe,
        String vistoria,

        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate planoVistoria,

        String desmobilizacao,

        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate planoDesmobilizacao,

        String instalacao,

        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate planoInstalacao,

        String ativacao,
        SituacaoAprovacao situacaoAprovacao,

        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate planoAtivacao,

        String documentacao,

        @JsonFormat(pattern = "dd/MM/yyyy")
        LocalDate planoDocumentacao,

        StatusEtapa status,
        SituacaoOperacional situacao,
        String detalheDiario,
        BigDecimal valor,
        Long managerId
) {
}