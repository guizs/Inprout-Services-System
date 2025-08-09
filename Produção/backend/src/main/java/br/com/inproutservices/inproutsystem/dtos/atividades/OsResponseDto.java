package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao; // Import necessário
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
        String site,
        String contrato,
        SegmentoSimpleDTO segmento,
        List<LpuComLancamentoDto> lpus,
        String projeto,
        String gestorTim,
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
                os.getSite(),
                os.getContrato(),
                os.getSegmento() != null ? new SegmentoSimpleDTO(os.getSegmento()) : null,
                // ================== INÍCIO DA CORREÇÃO ==================
                os.getLpus().stream()
                        .map(lpu -> new LpuComLancamentoDto(
                                new LpuSimpleDTO(lpu),
                                // 1. Filtra a partir dos lançamentos da OS atual
                                os.getLancamentos().stream()
                                        // 2. Garante que o lançamento pertence à LPU correta dentro desta OS
                                        .filter(lancamento -> lancamento.getLpu() != null && lancamento.getLpu().getId().equals(lpu.getId()))
                                        // 3. Filtra para pegar apenas os lançamentos com status APROVADO
                                        .filter(lancamento -> lancamento.getSituacaoAprovacao() == SituacaoAprovacao.APROVADO)
                                        // 4. Encontra o lançamento mais recente (maior ID)
                                        .max(Comparator.comparing(br.com.inproutservices.inproutsystem.entities.atividades.Lancamento::getId))
                                        // 5. Mapeia para o DTO de resposta ou retorna null se não houver
                                        .map(LancamentoResponseDTO::new)
                                        .orElse(null)
                        ))
                        .collect(Collectors.toList()),
                // =================== FIM DA CORREÇÃO ===================
                os.getProjeto(),
                os.getGestorTim(),
                os.getRegional(),
                os.getLote(),
                os.getBoq(),
                os.getPo(),
                os.getItem(),
                os.getObjetoContratado(),
                os.getUnidade(),
                os.getQuantidade(),
                os.getValorTotal(),
                os.getObservacoes(),
                os.getDataPo(),
                os.getFaturamento(),
                os.getSolitIdFat(),
                os.getRecebIdFat(),
                os.getIdFaturamento(),
                os.getDataFatInprout(),
                os.getSolitFsPortal(),
                os.getDataFs(),
                os.getNumFs(),
                os.getGate(),
                os.getGateId(),
                os.getDataCriacao(),
                os.getDataAtualizacao(),
                os.getUsuarioCriacao(),
                os.getUsuarioAtualizacao(),
                os.getStatusRegistro()
        );
    }

    public record LpuSimpleDTO(Long id, String codigo, String nome) {
        public LpuSimpleDTO(Lpu lpu) {
            this(lpu.getId(), lpu.getCodigoLpu(), lpu.getNomeLpu());
        }
    }

    public record SegmentoSimpleDTO(Long id, String nome) {
        public SegmentoSimpleDTO(Segmento segmento) {
            this(segmento.getId(), segmento.getNome());
        }
    }

    public record LpuComLancamentoDto(LpuSimpleDTO lpu, LancamentoResponseDTO ultimoLancamento) {}
}