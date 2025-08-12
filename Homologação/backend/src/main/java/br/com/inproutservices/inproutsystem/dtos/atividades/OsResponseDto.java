package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhes; // Importe a nova entidade
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record OsResponseDto(
        Long id,
        String os,
        SegmentoSimpleDTO segmento,
        String projeto,
        String gestorTim,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataCriacao,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataAtualizacao,
        String usuarioCriacao,
        String usuarioAtualizacao,
        String statusRegistro,

        // NOVO: A resposta agora contém uma lista de detalhes
        List<OsLpuDetalheResponseDto> detalhes
) {
    public OsResponseDto(OS os) {
        this(
                os.getId(),
                os.getOs(),
                os.getSegmento() != null ? new SegmentoSimpleDTO(os.getSegmento()) : null,
                os.getProjeto(),
                os.getGestorTim(),
                os.getDataCriacao(),
                os.getDataAtualizacao(),
                os.getUsuarioCriacao(),
                os.getUsuarioAtualizacao(),
                os.getStatusRegistro(),
                // Mapeia a lista de entidades 'OsLpuDetalhes' para uma lista de DTOs de resposta
                os.getDetalhes().stream()
                        .map(OsLpuDetalheResponseDto::new)
                        .collect(Collectors.toList())
        );
    }

    // DTO aninhado para representar cada detalhe de LPU na resposta
    public record OsLpuDetalheResponseDto(
            Long id,
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
            String gateId
    ) {
        public OsLpuDetalheResponseDto(OsLpuDetalhes detalhe) {
            this(
                    detalhe.getId(),
                    new LpuSimpleDTO(detalhe.getLpu()),
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
                    detalhe.getGateId()
            );
        }
    }

    // DTOs aninhados para Segmento e LPU (simplificados)
    public record SegmentoSimpleDTO(Long id, String nome) {
        public SegmentoSimpleDTO(Segmento segmento) { this(segmento.getId(), segmento.getNome()); }
    }

    public record LpuSimpleDTO(Long id, String codigo, String nome) {
        public LpuSimpleDTO(Lpu lpu) { this(lpu.getId(), lpu.getCodigoLpu(), lpu.getNomeLpu()); }
    }
}