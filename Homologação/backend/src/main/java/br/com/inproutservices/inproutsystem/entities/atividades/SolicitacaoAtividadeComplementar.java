package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusSolicitacaoComplementar;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "solicitacao_atividade_complementar")
public class SolicitacaoAtividadeComplementar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id", nullable = false)
    private OS os;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lpu_id", nullable = false)
    private Lpu lpu;

    @Column(nullable = false)
    private Integer quantidade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @Column(columnDefinition = "TEXT")
    private String justificativa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusSolicitacaoComplementar status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataSolicitacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprovador_coordenador_id")
    private Usuario aprovadorCoordenador;

    private LocalDateTime dataAcaoCoordenador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprovador_controller_id")
    private Usuario aprovadorController;

    private LocalDateTime dataAcaoController;

    @Column(columnDefinition = "TEXT")
    private String motivoRecusa;

    @PrePersist
    protected void onCreate() {
        this.dataSolicitacao = LocalDateTime.now();
        this.status = StatusSolicitacaoComplementar.PENDENTE_COORDENADOR;
    }

    // Getters e Setters

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

    public Lpu getLpu() {
        return lpu;
    }

    public void setLpu(Lpu lpu) {
        this.lpu = lpu;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    public Usuario getSolicitante() {
        return solicitante;
    }

    public void setSolicitante(Usuario solicitante) {
        this.solicitante = solicitante;
    }

    public String getJustificativa() {
        return justificativa;
    }

    public void setJustificativa(String justificativa) {
        this.justificativa = justificativa;
    }

    public StatusSolicitacaoComplementar getStatus() {
        return status;
    }

    public void setStatus(StatusSolicitacaoComplementar status) {
        this.status = status;
    }

    public LocalDateTime getDataSolicitacao() {
        return dataSolicitacao;
    }

    public void setDataSolicitacao(LocalDateTime dataSolicitacao) {
        this.dataSolicitacao = dataSolicitacao;
    }

    public Usuario getAprovadorCoordenador() {
        return aprovadorCoordenador;
    }

    public void setAprovadorCoordenador(Usuario aprovadorCoordenador) {
        this.aprovadorCoordenador = aprovadorCoordenador;
    }

    public LocalDateTime getDataAcaoCoordenador() {
        return dataAcaoCoordenador;
    }

    public void setDataAcaoCoordenador(LocalDateTime dataAcaoCoordenador) {
        this.dataAcaoCoordenador = dataAcaoCoordenador;
    }

    public Usuario getAprovadorController() {
        return aprovadorController;
    }

    public void setAprovadorController(Usuario aprovadorController) {
        this.aprovadorController = aprovadorController;
    }

    public LocalDateTime getDataAcaoController() {
        return dataAcaoController;
    }

    public void setDataAcaoController(LocalDateTime dataAcaoController) {
        this.dataAcaoController = dataAcaoController;
    }

    public String getMotivoRecusa() {
        return motivoRecusa;
    }

    public void setMotivoRecusa(String motivoRecusa) {
        this.motivoRecusa = motivoRecusa;
    }
}