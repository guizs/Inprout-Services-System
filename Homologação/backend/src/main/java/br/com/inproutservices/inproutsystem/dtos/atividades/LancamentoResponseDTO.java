package br.com.inproutservices.inproutsystem.dtos.atividades;

// Importe os DTOs que criamos em arquivos separados
import br.com.inproutservices.inproutsystem.dtos.index.LpuSimpleDTO;
import br.com.inproutservices.inproutsystem.dtos.index.PrestadorSimpleDTO;
import br.com.inproutservices.inproutsystem.dtos.index.SegmentoSimpleDTO;

// Outros imports necessários
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para representar a resposta de um Lançamento, alinhado com a nova estrutura de entidades.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LancamentoResponseDTO(
        Long id,
        OsSimpleDTO os,
        OsLpuDetalheSimpleDTO detalhe,
        PrestadorSimpleDTO prestador,
        BigDecimal valor,
        SituacaoAprovacao situacaoAprovacao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataAtividade,
        String detalheDiario,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataCriacao
        // Adicione aqui outros campos específicos do LANÇAMENTO que você precise retornar
) {
    public LancamentoResponseDTO(Lancamento lancamento) {
        this(
                lancamento.getId(),
                // Cria o DTO da OS a partir do "avô"
                (lancamento.getOsLpuDetalhe() != null && lancamento.getOsLpuDetalhe().getOs() != null)
                        ? new OsSimpleDTO(lancamento.getOsLpuDetalhe().getOs())
                        : null,

                // Cria o DTO do detalhe a partir do "pai"
                (lancamento.getOsLpuDetalhe() != null)
                        ? new OsLpuDetalheSimpleDTO(lancamento.getOsLpuDetalhe())
                        : null,

                (lancamento.getPrestador() != null)
                        ? new PrestadorSimpleDTO(lancamento.getPrestador())
                        : null,

                lancamento.getValor(),
                lancamento.getSituacaoAprovacao(),
                lancamento.getDataAtividade(),
                lancamento.getDetalheDiario(),
                lancamento.getDataCriacao()
        );
    }

    /**
     * DTO aninhado e simplificado para representar a OS.
     */
    public record OsSimpleDTO(
            Long id,
            String os,
            String projeto,
            String gestorTim,
            SegmentoSimpleDTO segmento
    ) {
        public OsSimpleDTO(br.com.inproutservices.inproutsystem.entities.atividades.OS os) {
            this(
                    os.getId(),
                    os.getOs(),
                    os.getProjeto(),
                    os.getGestorTim(),
                    (os.getSegmento() != null) ? new SegmentoSimpleDTO(os.getSegmento()) : null
            );
        }
    }

    /**
     * DTO aninhado e simplificado para representar a linha de detalhe (OsLpuDetalhe).
     */
    public record OsLpuDetalheSimpleDTO(
            Long id,
            String key,
            LpuSimpleDTO lpu,
            String site,
            String po,
            String contrato,
            String regional
            // Adicione aqui outros campos do detalhe que sejam importantes para o lançamento
    ) {
        public OsLpuDetalheSimpleDTO(br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe detalhe) {
            this(
                    detalhe.getId(),
                    detalhe.getKey(),
                    (detalhe.getLpu() != null) ? new LpuSimpleDTO(detalhe.getLpu()) : null,
                    detalhe.getSite(),
                    detalhe.getPo(),
                    detalhe.getContrato(),
                    detalhe.getRegional()
            );
        }
    }
}