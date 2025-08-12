package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhes;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// Adicionado para não serializar campos nulos, como 'ultimoLancamento' quando não existir
@JsonInclude(JsonInclude.Include.NON_NULL)
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
        List<OsLpuDetalheResponseDto> detalhes
) {
    // Este construtor agora é usado para quando não precisamos do último lançamento
    public OsResponseDto(OS os) {
        this(
                os.getId(), os.getOs(),
                os.getSegmento() != null ? new SegmentoSimpleDTO(os.getSegmento()) : null,
                os.getProjeto(), os.getGestorTim(), os.getDataCriacao(), os.getDataAtualizacao(),
                os.getUsuarioCriacao(), os.getUsuarioAtualizacao(), os.getStatusRegistro(),
                os.getDetalhes().stream()
                        .map(detalhe -> new OsLpuDetalheResponseDto(detalhe, null)) // Passa null para o lançamento
                        .collect(Collectors.toList())
        );
    }

    // Este novo construtor aceita a lista de detalhes já enriquecida
    public OsResponseDto(OS os, List<OsLpuDetalheResponseDto> detalhesEnriquecidos) {
        this(
                os.getId(), os.getOs(),
                os.getSegmento() != null ? new SegmentoSimpleDTO(os.getSegmento()) : null,
                os.getProjeto(), os.getGestorTim(), os.getDataCriacao(), os.getDataAtualizacao(),
                os.getUsuarioCriacao(), os.getUsuarioAtualizacao(), os.getStatusRegistro(),
                detalhesEnriquecidos // Usa a lista que já veio pronta
        );
    }


    public record OsLpuDetalheResponseDto(
            Long id,
            LpuSimpleDTO lpu,
            String site, String contrato, String regional, String lote, String boq, String po, String item,
            String objetoContratado, String unidade, Integer quantidade, BigDecimal valorTotal, String observacoes,
            @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataPo,
            String faturamento, String solitIdFat, String recebIdFat, String idFaturamento,
            @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataFatInprout,
            String solitFsPortal, @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataFs,
            String numFs, String gate, String gateId, String key,
            // ================== MUDANÇA PRINCIPAL AQUI ==================
            // Adicionamos o campo para carregar os dados do último lançamento
            LancamentoResponseDTO ultimoLancamento
    ) {
        // O construtor agora aceita a entidade de detalhe e a entidade do último lançamento
        public OsLpuDetalheResponseDto(OsLpuDetalhes detalhe, Lancamento ultimoLancamento) {
            this(
                    detalhe.getId(), new LpuSimpleDTO(detalhe.getLpu()), detalhe.getSite(), detalhe.getContrato(),
                    detalhe.getRegional(), detalhe.getLote(), detalhe.getBoq(), detalhe.getPo(), detalhe.getItem(),
                    detalhe.getObjetoContratado(), detalhe.getUnidade(), detalhe.getQuantidade(), detalhe.getValorTotal(),
                    detalhe.getObservacoes(), detalhe.getDataPo(), detalhe.getFaturamento(), detalhe.getSolitIdFat(),
                    detalhe.getRecebIdFat(), detalhe.getIdFaturamento(), detalhe.getDataFatInprout(),
                    detalhe.getSolitFsPortal(), detalhe.getDataFs(), detalhe.getNumFs(), detalhe.getGate(),
                    detalhe.getGateId(), detalhe.getKey(),
                    // Converte a entidade Lancamento para DTO, se ela não for nula
                    ultimoLancamento != null ? new LancamentoResponseDTO(ultimoLancamento) : null
            );
        }
    }

    // DTOs aninhados (sem alterações, mas o LpuSimpleDTO precisa estar correto)
    public record SegmentoSimpleDTO(Long id, String nome) {
        public SegmentoSimpleDTO(Segmento segmento) { this(segmento.getId(), segmento.getNome()); }
    }
    public record LpuSimpleDTO(Long id, String codigo, String nome) {
        // Corrigido para usar os campos corretos da entidade Lpu
        public LpuSimpleDTO(Lpu lpu) { this(lpu.getId(), lpu.getCodigoLpu(), lpu.getNomeLpu()); }
    }
}