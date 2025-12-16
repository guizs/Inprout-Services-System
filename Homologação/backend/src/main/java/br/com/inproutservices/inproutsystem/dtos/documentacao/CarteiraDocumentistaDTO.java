package br.com.inproutservices.inproutsystem.dtos.documentacao;

import java.math.BigDecimal;
import java.util.List;

public record CarteiraDocumentistaDTO(
        BigDecimal totalPrevisto,
        BigDecimal totalFinalizado,
        BigDecimal totalGeral,
        List<ResumoMensalDTO> historicoMensal
) {
    public record ResumoMensalDTO(
            String mesAno,
            BigDecimal valorPrevisto,
            BigDecimal valorFinalizado,
            Long quantidadeDocs
    ) {}
}