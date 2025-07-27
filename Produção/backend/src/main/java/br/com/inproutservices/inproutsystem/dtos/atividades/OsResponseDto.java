package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento; // ADICIONE ESTE IMPORT
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public record OsResponseDto(
        Long id,
        String os,
        String site,
        String contrato,
        SegmentoSimpleDTO segmento, // ALTERADO DE String PARA SegmentoSimpleDTO
        Set<LpuSimpleDTO> lpus,
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
    /**
     * Construtor que converte uma entidade OS para este DTO de resposta.
     * @param os A entidade OS vinda do banco de dados.
     */
    public OsResponseDto(OS os) {
        this(
                os.getId(),
                os.getOs(),
                os.getSite(),
                os.getContrato(),
                // LÓGICA DE MAPEAMENTO DO SEGMENTO
                os.getSegmento() != null ? new SegmentoSimpleDTO(os.getSegmento()) : null,
                os.getLpus().stream()
                        .map(LpuSimpleDTO::new)
                        .collect(Collectors.toSet()),
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

    /**
     * DTO aninhado e simplificado para LPU, para evitar loops de serialização.
     */
    public record LpuSimpleDTO(Long id, String codigo, String nome) {
        public LpuSimpleDTO(Lpu lpu) {
            this(lpu.getId(), lpu.getCodigoLpu(), lpu.getNomeLpu());
        }
    }

    /**
     * NOVO DTO ANINHADO: DTO simplificado para Segmento.
     */
    public record SegmentoSimpleDTO(Long id, String nome) {
        public SegmentoSimpleDTO(Segmento segmento) {
            this(segmento.getId(), segmento.getNome());
        }
    }
}