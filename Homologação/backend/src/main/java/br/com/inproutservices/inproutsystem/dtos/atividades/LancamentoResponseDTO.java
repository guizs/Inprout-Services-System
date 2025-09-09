package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.dtos.index.LpuSimpleDTO;
import br.com.inproutservices.inproutsystem.dtos.index.PrestadorSimpleDTO;
import br.com.inproutservices.inproutsystem.dtos.index.SegmentoSimpleDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Comentario;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
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
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LancamentoResponseDTO(
        Long id,
        OsSimpleDTO os,
        OsLpuDetalheSimpleDTO detalhe,
        PrestadorSimpleDTO prestador,
        EtapaInfoDTO etapa,
        ManagerSimpleDTO manager,
        BigDecimal valor,
        SituacaoAprovacao situacaoAprovacao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataAtividade,
        String detalheDiario,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataCriacao,
        @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataPrazo,
        List<ComentarioDTO> comentarios,
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
        BigDecimal totalOs, // Campo para TOTAL OS
        BigDecimal valorCps // Campo para VALOR CPS
) {
    public LancamentoResponseDTO(Lancamento lancamento) {
        this(
                lancamento.getId(),
                (lancamento.getOsLpuDetalhe() != null && lancamento.getOsLpuDetalhe().getOs() != null)
                        ? new OsSimpleDTO(lancamento.getOsLpuDetalhe().getOs()) : null,
                (lancamento.getOsLpuDetalhe() != null)
                        ? new OsLpuDetalheSimpleDTO(lancamento.getOsLpuDetalhe()) : null,
                (lancamento.getPrestador() != null)
                        ? new PrestadorSimpleDTO(lancamento.getPrestador()) : null,
                (lancamento.getEtapaDetalhada() != null)
                        ? new EtapaInfoDTO(lancamento.getEtapaDetalhada()) : null,
                (lancamento.getManager() != null)
                        ? new ManagerSimpleDTO(lancamento.getManager())
                        : null,
                lancamento.getValor(),
                lancamento.getSituacaoAprovacao(),
                lancamento.getDataAtividade(),
                lancamento.getDetalheDiario(),
                lancamento.getDataCriacao(),
                lancamento.getDataPrazo(),
                (lancamento.getComentarios() != null)
                        ? lancamento.getComentarios().stream().map(ComentarioDTO::new).collect(Collectors.toList())
                        : List.of(),
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
                null, // totalOs será preenchido no controller
                null  // valorCps será preenchido no controller
        );
    }

    // (O restante do seu DTO continua igual)
    public record ComentarioDTO(Long id, String texto, @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime dataHora, AutorSimpleDTO autor) {
        public ComentarioDTO(Comentario comentario) { this(comentario.getId(), comentario.getTexto(), comentario.getDataHora(), (comentario.getAutor() != null) ? new AutorSimpleDTO(comentario.getAutor()) : null); }
    }
    public record AutorSimpleDTO(Long id, String nome) {
        public AutorSimpleDTO(Usuario autor) { this(autor.getId(), autor.getNome()); }
    }
    public record ManagerSimpleDTO(Long id, String nome) {
        public ManagerSimpleDTO(Usuario manager) { this(manager.getId(), manager.getNome()); }
    }
    public record EtapaInfoDTO(Long id, String codigoGeral, String nomeGeral, String indiceDetalhado, String nomeDetalhado) {
        public EtapaInfoDTO(br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada etapaDetalhada) { this(etapaDetalhada.getId(), (etapaDetalhada.getEtapa() != null) ? etapaDetalhada.getEtapa().getCodigo() : null, (etapaDetalhada.getEtapa() != null) ? etapaDetalhada.getEtapa().getNome() : null, etapaDetalhada.getIndice(), etapaDetalhada.getNome()); }
    }
    public record OsSimpleDTO(Long id, String os, String projeto, String gestorTim, SegmentoSimpleDTO segmento) {
        public OsSimpleDTO(br.com.inproutservices.inproutsystem.entities.atividades.OS os) { this(os.getId(), os.getOs(), os.getProjeto(), os.getGestorTim(), (os.getSegmento() != null) ? new SegmentoSimpleDTO(os.getSegmento()) : null); }
    }
    public record OsLpuDetalheSimpleDTO(Long id, String key, LpuSimpleDTO lpu, String site, String po, String contrato, String regional, String lote, String boq, String item, String objetoContratado, String unidade, Integer quantidade, BigDecimal valorTotal, String observacoes, @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataPo) {
        public OsLpuDetalheSimpleDTO(br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe detalhe) { this(detalhe.getId(), detalhe.getKey(), (detalhe.getLpu() != null) ? new LpuSimpleDTO(detalhe.getLpu()) : null, detalhe.getSite(), detalhe.getPo(), detalhe.getContrato(), detalhe.getRegional(), detalhe.getLote(), detalhe.getBoq(), detalhe.getItem(), detalhe.getObjetoContratado(), detalhe.getUnidade(), detalhe.getQuantidade(), detalhe.getValorTotal(), detalhe.getObservacoes(), detalhe.getDataPo()); }
    }
}