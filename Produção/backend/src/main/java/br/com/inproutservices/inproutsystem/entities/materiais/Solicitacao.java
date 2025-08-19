package br.com.inproutservices.inproutsystem.entities.materiais;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.materiais.StatusSolicitacao;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "solicitacoes")
public class Solicitacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "os_id", nullable = false)
    private OS os;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lpu_id", nullable = false)
    private Lpu lpu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_solicitante")
    private Usuario solicitante;

    @Column(name = "data_solicitacao", nullable = false, updatable = false)
    private LocalDateTime dataSolicitacao;

    @Column(columnDefinition = "TEXT")
    private String justificativa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusSolicitacao status;

    @OneToMany(
            mappedBy = "solicitacao",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<ItemSolicitacao> itens = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_aprovador_coordenador")
    private Usuario aprovadorCoordenador;


    @Column(name = "data_acao_coordenador")
    private LocalDateTime dataAcaoCoordenador;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_aprovador_controller")
    private Usuario aprovadorController;

    @Column(name = "data_acao_controller")
    private LocalDateTime dataAcaoController;

    @Column(name = "motivo_recusa", columnDefinition = "TEXT")
    private String motivoRecusa;


    public Solicitacao() {
    }

    @PrePersist
    public void prePersist() {
        this.dataSolicitacao = LocalDateTime.now();
        this.status = StatusSolicitacao.PENDENTE_COORDENADOR; // Status inicial alterado
    }

    // --- GETTERS E SETTERS ---
    // (Todos os getters e setters existentes + os novos abaixo)

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


    public LocalDateTime getDataSolicitacao() {
        return dataSolicitacao;
    }

    public void setDataSolicitacao(LocalDateTime dataSolicitacao) {
        this.dataSolicitacao = dataSolicitacao;
    }

    public String getJustificativa() {
        return justificativa;
    }

    public void setJustificativa(String justificativa) {
        this.justificativa = justificativa;
    }

    public StatusSolicitacao getStatus() {
        return status;
    }

    public void setStatus(StatusSolicitacao status) {
        this.status = status;
    }

    public List<ItemSolicitacao> getItens() {
        return itens;
    }

    public void setItens(List<ItemSolicitacao> itens) {
        this.itens = itens;
    }

    public LocalDateTime getDataAcaoCoordenador() {
        return dataAcaoCoordenador;
    }

    public void setDataAcaoCoordenador(LocalDateTime dataAcaoCoordenador) {
        this.dataAcaoCoordenador = dataAcaoCoordenador;
    }

    public Usuario getSolicitante() {
        return solicitante;
    }

    public void setSolicitante(Usuario solicitante) {
        this.solicitante = solicitante;
    }

    public Usuario getAprovadorCoordenador() {
        return aprovadorCoordenador;
    }

    public void setAprovadorCoordenador(Usuario aprovadorCoordenador) {
        this.aprovadorCoordenador = aprovadorCoordenador;
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


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Solicitacao that = (Solicitacao) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}