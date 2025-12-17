package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Prestador;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusDocumentacao;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusPagamento;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "lancamento")
public class Lancamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id", nullable = false) // Garante que a coluna não pode ser nula
    private OS os;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_lpu_detalhe_id", nullable = false)
    @JsonIgnore
    private OsLpuDetalhe osLpuDetalhe;

    // --- CAMPOS DO FLUXO DE APROVAÇÃO ---
    @Enumerated(EnumType.STRING)
    @Column(name = "situacao_aprovacao", length = 30)
    private SituacaoAprovacao situacaoAprovacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private Usuario manager;

    @Column(name = "data_submissao")
    private LocalDateTime dataSubmissao;

    @Column(name = "data_prazo")
    private LocalDate dataPrazo;

    @Column(name = "data_prazo_proposta")
    private LocalDate dataPrazoProposta;

    @OneToMany(mappedBy = "lancamento", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Comentario> comentarios = new HashSet<>();

    // --- CAMPOS REFATORADOS PARA RELACIONAMENTOS ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prestador_id")
    private Prestador prestador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etapa_detalhada_id")
    private EtapaDetalhada etapaDetalhada;

    // --- DEMAIS CAMPOS DO LANÇAMENTO ---
    @Column(name = "data_atividade", nullable = false)
    private LocalDate dataAtividade;

    private String equipe;
    private String vistoria;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate planoVistoria;
    private String desmobilizacao;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate planoDesmobilizacao;
    private String instalacao;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate planoInstalacao;
    private String ativacao;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate planoAtivacao;
    private String documentacao;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate planoDocumentacao;
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusEtapa status;
    @Column(columnDefinition = "TEXT")
    private String detalheDiario;
    private BigDecimal valor;
    private BigDecimal valorAdiantamento;
    private String coordenador; // Este campo pode ser revisto/removido no futuro
    @Enumerated(EnumType.STRING)
    @Column(name = "situacao") // Mapeia para a coluna existente 'situacao'
    private SituacaoOperacional situacao;    // Este campo pode ser revisto/removido no futuro
    private LocalDateTime ultUpdate;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    /**
     * O valor final que será pago, definido pelo Coordenador.
     * Pode ser diferente do campo 'valor' (operacional).
     */
    @Column(name = "valor_pagamento", precision = 10, scale = 2)
    private BigDecimal valorPagamento;

    /**
     * O status do fluxo de pagamento (inicia após aprovação operacional).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", length = 30)
    private StatusPagamento statusPagamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_documentacao_id")
    private TipoDocumentacao tipoDocumentacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documentista_id")
    private Usuario documentista;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_documentacao")
    private StatusDocumentacao statusDocumentacao = StatusDocumentacao.NAO_APLICAVEL;

    @Column(name = "data_solicitacao_doc")
    private LocalDateTime dataSolicitacaoDoc;

    @Column(name = "data_recebimento_doc")
    private LocalDateTime dataRecebimentoDoc;

    @Column(name = "data_prazo_doc") // Data limite calculada (SLA)
    private LocalDate dataPrazoDoc;

    @Column(name = "data_finalizacao_doc")
    private LocalDateTime dataFinalizacaoDoc;

    @Column(name = "assunto_email_doc")
    private String assuntoEmailDoc;

    @Column(name = "valor_documentista", precision = 10, scale = 2)
    private BigDecimal valorDocumentista;

    /**
     * O Controller que marcou o lançamento como "PAGO".
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "controller_pagador_id")
    private Usuario controllerPagador;

    /**
     * A data em que o Controller marcou como "PAGO".
     */
    @Column(name = "data_pagamento")
    private LocalDateTime dataPagamento;


    // Construtor padrão exigido pelo JPA
    public Lancamento() {
    }

    @Column(name = "data_competencia")
    private LocalDate dataCompetencia;

    @Column(name = "valor_solicitado_adiantamento")
    private BigDecimal valorSolicitadoAdiantamento;

    /**
     * Este método garante que a data de criação e a situação inicial
     * sejam definidas automaticamente ao criar um novo lançamento.
     */
    @PrePersist
    protected void onCreate() {
        this.dataCriacao = LocalDateTime.now();
        if (this.situacaoAprovacao == null) {
            this.situacaoAprovacao = SituacaoAprovacao.RASCUNHO;
        }
    }

    public BigDecimal getValorDocumentista() {
        return valorDocumentista;
    }

    public void setValorDocumentista(BigDecimal valorDocumentista) {
        this.valorDocumentista = valorDocumentista;
    }

    public BigDecimal getValorPagamento() {
        return valorPagamento;
    }

    public void setValorPagamento(BigDecimal valorPagamento) {
        this.valorPagamento = valorPagamento;
    }

    public StatusPagamento getStatusPagamento() {
        return statusPagamento;
    }

    public void setStatusPagamento(StatusPagamento statusPagamento) {
        this.statusPagamento = statusPagamento;
    }

    public Usuario getControllerPagador() {
        return controllerPagador;
    }

    public void setControllerPagador(Usuario controllerPagador) {
        this.controllerPagador = controllerPagador;
    }

    public LocalDateTime getDataPagamento() {
        return dataPagamento;
    }

    public void setDataPagamento(LocalDateTime dataPagamento) {
        this.dataPagamento = dataPagamento;
    }

    public OsLpuDetalhe getOsLpuDetalhe() {
        return osLpuDetalhe;
    }

    public void setOsLpuDetalhe(OsLpuDetalhe osLpuDetalhe) {
        this.osLpuDetalhe = osLpuDetalhe;
    }

    public OS getOs() {
        return os;
    }

    public void setOs(OS os) {
        this.os = os;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SituacaoAprovacao getSituacaoAprovacao() {
        return situacaoAprovacao;
    }

    public void setSituacaoAprovacao(SituacaoAprovacao situacaoAprovacao) {
        this.situacaoAprovacao = situacaoAprovacao;
    }

    public TipoDocumentacao getTipoDocumentacao() {
        return tipoDocumentacao;
    }

    public void setTipoDocumentacao(TipoDocumentacao tipoDocumentacao) {
        this.tipoDocumentacao = tipoDocumentacao;
    }

    public Usuario getDocumentista() {
        return documentista;
    }

    public void setDocumentista(Usuario documentista) {
        this.documentista = documentista;
    }

    public StatusDocumentacao getStatusDocumentacao() {
        return statusDocumentacao;
    }

    public void setStatusDocumentacao(StatusDocumentacao statusDocumentacao) {
        this.statusDocumentacao = statusDocumentacao;
    }

    public LocalDateTime getDataSolicitacaoDoc() {
        return dataSolicitacaoDoc;
    }

    public void setDataSolicitacaoDoc(LocalDateTime dataSolicitacaoDoc) {
        this.dataSolicitacaoDoc = dataSolicitacaoDoc;
    }

    public LocalDateTime getDataRecebimentoDoc() {
        return dataRecebimentoDoc;
    }

    public void setDataRecebimentoDoc(LocalDateTime dataRecebimentoDoc) {
        this.dataRecebimentoDoc = dataRecebimentoDoc;
    }

    public LocalDate getDataPrazoDoc() {
        return dataPrazoDoc;
    }

    public void setDataPrazoDoc(LocalDate dataPrazoDoc) {
        this.dataPrazoDoc = dataPrazoDoc;
    }

    public LocalDateTime getDataFinalizacaoDoc() {
        return dataFinalizacaoDoc;
    }

    public void setDataFinalizacaoDoc(LocalDateTime dataFinalizacaoDoc) {
        this.dataFinalizacaoDoc = dataFinalizacaoDoc;
    }

    public String getAssuntoEmailDoc() {
        return assuntoEmailDoc;
    }

    public void setAssuntoEmailDoc(String assuntoEmailDoc) {
        this.assuntoEmailDoc = assuntoEmailDoc;
    }

    public Usuario getManager() {
        return manager;
    }

    public void setManager(Usuario manager) {
        this.manager = manager;
    }

    public LocalDateTime getDataSubmissao() {
        return dataSubmissao;
    }

    public void setDataSubmissao(LocalDateTime dataSubmissao) {
        this.dataSubmissao = dataSubmissao;
    }

    public LocalDate getDataPrazo() {
        return dataPrazo;
    }

    public void setDataPrazo(LocalDate dataPrazo) {
        this.dataPrazo = dataPrazo;
    }

    public LocalDate getDataPrazoProposta() {
        return dataPrazoProposta;
    }

    public void setDataPrazoProposta(LocalDate dataPrazoProposta) {
        this.dataPrazoProposta = dataPrazoProposta;
    }

    public BigDecimal getValorAdiantamento() {
        return valorAdiantamento;
    }

    public void setValorAdiantamento(BigDecimal valorAdiantamento) {
        this.valorAdiantamento = valorAdiantamento;
    }

    public Set<Comentario> getComentarios() {
        return comentarios;
    }

    public void setComentarios(Set<Comentario> comentarios) {
        this.comentarios = comentarios;
    }

    public Prestador getPrestador() {
        return prestador;
    }

    public void setPrestador(Prestador prestador) {
        this.prestador = prestador;
    }

    public EtapaDetalhada getEtapaDetalhada() {
        return etapaDetalhada;
    }

    public void setEtapaDetalhada(EtapaDetalhada etapaDetalhada) {
        this.etapaDetalhada = etapaDetalhada;
    }

    public LocalDate getDataAtividade() {
        return dataAtividade;
    }

    public void setDataAtividade(LocalDate dataAtividade) {
        this.dataAtividade = dataAtividade;
    }

    public String getEquipe() {
        return equipe;
    }

    public void setEquipe(String equipe) {
        this.equipe = equipe;
    }

    public String getVistoria() {
        return vistoria;
    }

    public void setVistoria(String vistoria) {
        this.vistoria = vistoria;
    }

    public BigDecimal getValorSolicitadoAdiantamento() {
        return valorSolicitadoAdiantamento;
    }

    public void setValorSolicitadoAdiantamento(BigDecimal valorSolicitadoAdiantamento) {
        this.valorSolicitadoAdiantamento = valorSolicitadoAdiantamento;
    }

    public LocalDate getPlanoVistoria() {
        return planoVistoria;
    }

    public void setPlanoVistoria(LocalDate planoVistoria) {
        this.planoVistoria = planoVistoria;
    }

    public String getDesmobilizacao() {
        return desmobilizacao;
    }

    public void setDesmobilizacao(String desmobilizacao) {
        this.desmobilizacao = desmobilizacao;
    }

    public LocalDate getPlanoDesmobilizacao() {
        return planoDesmobilizacao;
    }

    public void setPlanoDesmobilizacao(LocalDate planoDesmobilizacao) {
        this.planoDesmobilizacao = planoDesmobilizacao;
    }

    public String getInstalacao() {
        return instalacao;
    }

    public void setInstalacao(String instalacao) {
        this.instalacao = instalacao;
    }

    public LocalDate getPlanoInstalacao() {
        return planoInstalacao;
    }

    public void setPlanoInstalacao(LocalDate planoInstalacao) {
        this.planoInstalacao = planoInstalacao;
    }

    public String getAtivacao() {
        return ativacao;
    }

    public void setAtivacao(String ativacao) {
        this.ativacao = ativacao;
    }

    public LocalDate getPlanoAtivacao() {
        return planoAtivacao;
    }

    public void setPlanoAtivacao(LocalDate planoAtivacao) {
        this.planoAtivacao = planoAtivacao;
    }

    public String getDocumentacao() {
        return documentacao;
    }

    public void setDocumentacao(String documentacao) {
        this.documentacao = documentacao;
    }

    public LocalDate getPlanoDocumentacao() {
        return planoDocumentacao;
    }

    public void setPlanoDocumentacao(LocalDate planoDocumentacao) {
        this.planoDocumentacao = planoDocumentacao;
    }

    public String getDetalheDiario() {
        return detalheDiario;
    }

    public void setDetalheDiario(String detalheDiario) {
        this.detalheDiario = detalheDiario;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public String getCoordenador() {
        return coordenador;
    }

    public void setCoordenador(String coordenador) {
        this.coordenador = coordenador;
    }

    public SituacaoOperacional getSituacao() {
        return situacao;
    }

    public void setSituacao(SituacaoOperacional situacao) {
        this.situacao = situacao;
    }


    public LocalDateTime getUltUpdate() {
        return ultUpdate;
    }

    public void setUltUpdate(LocalDateTime ultUpdate) {
        this.ultUpdate = ultUpdate;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public StatusEtapa getStatus() {
        return status;
    }

    public void setStatus(StatusEtapa status) {
        this.status = status;
    }

    public LocalDate getDataCompetencia() {
        return dataCompetencia;
    }

    public void setDataCompetencia(LocalDate dataCompetencia) {
        this.dataCompetencia = dataCompetencia;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Lancamento that = (Lancamento) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}