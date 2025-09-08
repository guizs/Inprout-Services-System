package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.dtos.index.LpuSimpleDTO; // Crie este se não existir
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

// Este DTO representa uma única linha de detalhe de uma OS
public record OsLpuDetalheResponseDTO(
        Long id,
        String key,
        LpuSimpleDTO lpu,
        String site,
        String contrato,
        String regional,
        String lote,
        String boq,
        String po,
        String item,
        String objetoContratado,
        String unidade,
        Integer quantidade,
        BigDecimal valorTotal,
        String observacoes,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
        LocalDate dataPo
        // Adicione aqui os outros campos de faturamento se precisar retorná-los
) {
    public OsLpuDetalheResponseDTO(OsLpuDetalhe detalhe) {
        this(
                detalhe.getId(),
                detalhe.getKey(),
                detalhe.getLpu() != null ? new LpuSimpleDTO(detalhe.getLpu()) : null,
                detalhe.getSite(),
                detalhe.getContrato(),
                detalhe.getRegional(),
                detalhe.getLote(),
                detalhe.getBoq(),
                detalhe.getPo(),
                detalhe.getItem(),
                detalhe.getObjetoContratado(),
                detalhe.getUnidade(),
                detalhe.getQuantidade(),
                detalhe.getValorTotal(),
                detalhe.getObservacoes(),
                detalhe.getDataPo()
        );
    }
}