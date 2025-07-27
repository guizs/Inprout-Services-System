package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.Comentario;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Prestador;
import br.com.inproutservices.inproutsystem.entities.index.Segmento; // Importe o Segmento
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LancamentoResponseDTO(
        Long id,
        SituacaoAprovacao situacaoAprovacao,
        ManagerDTO manager,
        OsResponseDTO os,
        LpuSimpleDTO lpu,
        PrestadorSimpleDTO prestador,
        EtapaSimpleDTO etapa,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataCriacao,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataSubmissao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataPrazo,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataPrazoProposta,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataAtividade,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime ultUpdate,
        String equipe,
        String vistoria,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate planoVistoria,
        String desmobilizacao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate planoDesmobilizacao,
        String instalacao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate planoInstalacao,
        String ativacao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate planoAtivacao,
        String documentacao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate planoDocumentacao,
        StatusEtapa status,
        SituacaoOperacional situacao,
        String detalheDiario,
        BigDecimal valor,
        Set<ComentarioDTO> comentarios
) {
    public LancamentoResponseDTO(Lancamento lancamento) {
        this(
                lancamento.getId(),
                lancamento.getSituacaoAprovacao(),
                (lancamento.getManager() != null) ? new ManagerDTO(lancamento.getManager()) : null,
                (lancamento.getOs() != null) ? new OsResponseDTO(lancamento.getOs()) : null,
                (lancamento.getLpu() != null) ? new LpuSimpleDTO(lancamento.getLpu()) : null,
                (lancamento.getPrestador() != null) ? new PrestadorSimpleDTO(lancamento.getPrestador()) : null,
                (lancamento.getEtapaDetalhada() != null) ? new EtapaSimpleDTO(lancamento.getEtapaDetalhada()) : null,
                lancamento.getDataCriacao(),
                lancamento.getDataSubmissao(),
                lancamento.getDataPrazo(),
                lancamento.getDataPrazoProposta(),
                lancamento.getDataAtividade(),
                lancamento.getUltUpdate(),
                lancamento.getEquipe(),
                lancamento.getVistoria(),
                lancamento.getPlanoVistoria(),
                lancamento.getDesmobilizacao(),
                lancamento.getPlanoDesmobilizacao(),
                lancamento.getInstalacao(),
                lancamento.getPlanoInstalacao(),
                lancamento.getAtivacao(),
                lancamento.getPlanoAtivacao(),
                lancamento.getDocumentacao(),
                lancamento.getPlanoDocumentacao(),
                lancamento.getStatus(),
                lancamento.getSituacao(),
                lancamento.getDetalheDiario(),
                lancamento.getValor(),
                (lancamento.getComentarios() != null) ? lancamento.getComentarios().stream().map(ComentarioDTO::new).collect(Collectors.toSet()) : null
        );
    }

    // --- DTOs aninhados ---

    public record ManagerDTO(Long id, String nome) {
        public ManagerDTO(Usuario manager) { this(manager.getId(), manager.getNome()); }
    }

    // A MUDANÇA PRINCIPAL ESTÁ AQUI
    public record OsResponseDTO(
            Long id, String os, String site, String contrato, SegmentoSimpleDTO segmento, String projeto, // MUDOU AQUI
            String gestorTim, String regional, String lote, String boq, String po,
            String item, String objetoContratado, String unidade, Integer quantidade,
            BigDecimal valorTotal, String observacoes, @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataPo
    ) {
        public OsResponseDTO(OS os) {
            this(os.getId(), os.getOs(), os.getSite(), os.getContrato(),
                    // E AQUI
                    os.getSegmento() != null ? new SegmentoSimpleDTO(os.getSegmento()) : null,
                    os.getProjeto(), os.getGestorTim(), os.getRegional(),
                    os.getLote(), os.getBoq(), os.getPo(), os.getItem(), os.getObjetoContratado(),
                    os.getUnidade(), os.getQuantidade(), os.getValorTotal(), os.getObservacoes(),
                    os.getDataPo());
        }
    }

    // NOVO DTO ANINHADO PARA SEGMENTO
    public record SegmentoSimpleDTO(Long id, String nome) {
        public SegmentoSimpleDTO(Segmento segmento) {
            this(segmento.getId(), segmento.getNome());
        }
    }

    public record LpuSimpleDTO(Long id, String codigo, String nome) {
        public LpuSimpleDTO(Lpu lpu) { this(lpu.getId(), lpu.getCodigoLpu(), lpu.getNomeLpu()); }
    }

    public record PrestadorSimpleDTO(Long id, String codigo, String nome) {
        public PrestadorSimpleDTO(Prestador prestador) {
            this(prestador.getId(), prestador.getCodigoPrestador(), prestador.getPrestador());
        }
    }

    public record EtapaSimpleDTO(Long id, String nomeDetalhado, String nomeGeral) {
        public EtapaSimpleDTO(br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada etapaDetalhada) {
            this(etapaDetalhada.getId(), etapaDetalhada.getNome(), etapaDetalhada.getEtapa().getDescricao());
        }
    }

    public record ComentarioDTO(Long id, String texto, ManagerDTO autor, @JsonFormat(pattern="dd/MM/yyyy HH:mm") LocalDateTime dataHora) {
        public ComentarioDTO(Comentario comentario) {
            this(comentario.getId(), comentario.getTexto(),
                    (comentario.getAutor() != null) ? new ManagerDTO(comentario.getAutor()) : null,
                    comentario.getDataHora());
        }
    }
}