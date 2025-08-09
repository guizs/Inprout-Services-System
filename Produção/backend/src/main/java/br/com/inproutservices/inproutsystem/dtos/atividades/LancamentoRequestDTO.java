package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import java.math.BigDecimal;
import java.time.LocalDate;

public record LancamentoRequestDTO(
        Long osId,
        Long prestadorId,
        Long etapaDetalhadaId,
        Long lpuId,
        LocalDate dataAtividade, // SEM @JsonFormat
        String equipe,
        String vistoria,
        LocalDate planoVistoria, // SEM @JsonFormat
        String desmobilizacao,
        LocalDate planoDesmobilizacao, // SEM @JsonFormat
        String instalacao,
        LocalDate planoInstalacao, // SEM @JsonFormat
        String ativacao,
        SituacaoAprovacao situacaoAprovacao,
        LocalDate planoAtivacao, // SEM @JsonFormat
        String documentacao,
        LocalDate planoDocumentacao, // SEM @JsonFormat
        StatusEtapa status,
        SituacaoOperacional situacao,
        String detalheDiario,
        BigDecimal valor,
        Long managerId
) {}