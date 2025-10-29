package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.dtos.index.LpuSimpleDTO;
import br.com.inproutservices.inproutsystem.dtos.index.SegmentoSimpleDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public record OsResponseDto(
        Long id,
        String os,
        SegmentoSimpleDTO segmento,
        String projeto,
        String gestorTim,
        BigDecimal custoTotalMateriais,
        List<OsLpuDetalheCompletoDto> detalhes,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataCriacao,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataAtualizacao,
        String usuarioCriacao,
        String usuarioAtualizacao,
        String statusRegistro
) {
    public OsResponseDto(OS os) {
        this(
                os.getId(),
                os.getOs(),
                os.getSegmento() != null ? new SegmentoSimpleDTO(os.getSegmento()) : null,
                os.getProjeto(),
                os.getGestorTim(),
                os.getCustoTotalMateriais(),
                os.getDetalhes().stream()
                        .map(OsLpuDetalheCompletoDto::new)
                        .collect(Collectors.toList()),
                os.getDataCriacao(),
                os.getDataAtualizacao(),
                os.getUsuarioCriacao(),
                os.getUsuarioAtualizacao(),
                os.getStatusRegistro()
        );
    }

    public record OsLpuDetalheCompletoDto(
            Long id,
            String key,
            LpuSimpleDTO lpu,
            String site,
            String contrato,
            Long contratoId,
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
            @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataPo,
            String faturamento,
            String solitIdFat,
            String recebIdFat,
            String idFaturamento,
            @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataFatInprout,
            String solitFsPortal,
            @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataFs,
            String numFs,
            String gate,
            String gateId,
            LancamentoResponseDTO ultimoLancamento,
            List<LancamentoResponseDTO> lancamentos
    ) {
        public OsLpuDetalheCompletoDto(OsLpuDetalhe detalhe) {
            this(
                    detalhe.getId(),
                    detalhe.getKey(),
                    detalhe.getLpu() != null ? new LpuSimpleDTO(detalhe.getLpu()) : null,
                    detalhe.getSite(),
                    detalhe.getContrato(),
                    (detalhe.getLpu() != null && detalhe.getLpu().getContrato() != null) ? detalhe.getLpu().getContrato().getId() : null,
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
                    detalhe.getDataPo(),
                    detalhe.getFaturamento(),
                    detalhe.getSolitIdFat(),
                    detalhe.getRecebIdFat(),
                    detalhe.getIdFaturamento(),
                    detalhe.getDataFatInprout(),
                    detalhe.getSolitFsPortal(),
                    detalhe.getDataFs(),
                    detalhe.getNumFs(),
                    detalhe.getGate(),
                    detalhe.getGateId(),

                    // --- INÍCIO DA CORREÇÃO COM REGRA DE EXCEÇÃO ---
                    detalhe.getLancamentos().stream()
                            .filter(lancamento -> lancamento.getSituacaoAprovacao() != SituacaoAprovacao.APROVADO_LEGADO)
                            .max(Comparator.comparing(br.com.inproutservices.inproutsystem.entities.atividades.Lancamento::getId))
                            .map(LancamentoResponseDTO::new)
                            .orElseGet(() -> detalhe.getLancamentos().stream()
                                    .max(Comparator.comparing(br.com.inproutservices.inproutsystem.entities.atividades.Lancamento::getId))
                                    .map(LancamentoResponseDTO::new)
                                    .orElse(null)),
                    // --- FIM DA CORREÇÃO ---

                    detalhe.getLancamentos().stream()
                            .map(LancamentoResponseDTO::new)
                            .collect(Collectors.toList())
            );
        }
    }
}