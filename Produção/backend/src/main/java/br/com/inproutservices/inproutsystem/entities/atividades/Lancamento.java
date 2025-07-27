package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Prestador;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
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
    @JoinColumn(name = "lpu_id")
    private Lpu lpu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id", nullable = false)
    @JsonIgnore
    private OS os;

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
    private String detalheDiario;
    private BigDecimal valor;
    private String coordenador; // Este campo pode ser revisto/removido no futuro
    @Enumerated(EnumType.STRING)
    @Column(name = "situacao") // Mapeia para a coluna existente 'situacao'
    private SituacaoOperacional situacao;    // Este campo pode ser revisto/removido no futuro
    private LocalDateTime ultUpdate;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;


    // Construtor padrão exigido pelo JPA
    public Lancamento() {
    }

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

    public Lpu getLpu() {
        return lpu;
    }

    public void setLpu(Lpu lpu) {
        this.lpu = lpu;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OS getOs() {
        return os;
    }

    public void setOs(OS os) {
        this.os = os;
    }

    public SituacaoAprovacao getSituacaoAprovacao() {
        return situacaoAprovacao;
    }

    public void setSituacaoAprovacao(SituacaoAprovacao situacaoAprovacao) {
        this.situacaoAprovacao = situacaoAprovacao;
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