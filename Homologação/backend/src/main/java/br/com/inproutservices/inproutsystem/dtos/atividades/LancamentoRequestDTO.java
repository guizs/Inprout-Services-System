package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import com.fasterxml.jackson.annotation.JsonFormat; // <-- IMPORT NECESSÁRIO
import java.math.BigDecimal;
import java.time.LocalDate;

public record LancamentoRequestDTO(
        Long osId,
        Long prestadorId,
        Long etapaDetalhadaId,
        Long lpuId,
        Long osLpuDetalheId,

        @JsonFormat(pattern = "dd/MM/yyyy") // <-- CORREÇÃO
        LocalDate dataAtividade,

        String equipe,
        String vistoria,

        @JsonFormat(pattern = "dd/MM/yyyy") // <-- CORREÇÃO
        LocalDate planoVistoria,

        String desmobilizacao,

        @JsonFormat(pattern = "dd/MM/yyyy") // <-- CORREÇÃO
        LocalDate planoDesmobilizacao,

        String instalacao,

        @JsonFormat(pattern = "dd/MM/yyyy") // <-- CORREÇÃO
        LocalDate planoInstalacao,

        String ativacao,
        SituacaoAprovacao situacaoAprovacao,

        @JsonFormat(pattern = "dd/MM/yyyy") // <-- CORREÇÃO
        LocalDate planoAtivacao,

        String documentacao,

        @JsonFormat(pattern = "dd/MM/yyyy") // <-- CORREÇÃO
        LocalDate planoDocumentacao,

        StatusEtapa status,
        SituacaoOperacional situacao,
        String detalheDiario,
        BigDecimal valor,
        Long managerId,
        Boolean atividadeComplementar,
        Integer quantidade
) {}