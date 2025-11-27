package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.TipoFaturamento;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "solicitacao_faturamento")
public class SolicitacaoFaturamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_lpu_detalhe_id", nullable = false)
    private OsLpuDetalhe osLpuDetalhe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante; // O Coordenador que pediu

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id")
    private Usuario responsavel; // O Assistant que está tratando

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusFaturamento status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoFaturamento tipo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataSolicitacao;

    private LocalDateTime dataUltimaAcao;

    @Column(columnDefinition = "TEXT")
    private String observacao; // Para motivo de recusa

    @PrePersist
    protected void onCreate() {
        this.dataSolicitacao = LocalDateTime.now();
        this.dataUltimaAcao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.dataUltimaAcao = LocalDateTime.now();
    }

    // --- Getters e Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public OsLpuDetalhe getOsLpuDetalhe() { return osLpuDetalhe; }
    public void setOsLpuDetalhe(OsLpuDetalhe osLpuDetalhe) { this.osLpuDetalhe = osLpuDetalhe; }
    public Usuario getSolicitante() { return solicitante; }
    public void setSolicitante(Usuario solicitante) { this.solicitante = solicitante; }
    public Usuario getResponsavel() { return responsavel; }
    public void setResponsavel(Usuario responsavel) { this.responsavel = responsavel; }
    public StatusFaturamento getStatus() { return status; }
    public void setStatus(StatusFaturamento status) { this.status = status; }
    public TipoFaturamento getTipo() { return tipo; }
    public void setTipo(TipoFaturamento tipo) { this.tipo = tipo; }
    public LocalDateTime getDataSolicitacao() { return dataSolicitacao; }
    public void setDataSolicitacao(LocalDateTime dataSolicitacao) { this.dataSolicitacao = dataSolicitacao; }
    public LocalDateTime getDataUltimaAcao() { return dataUltimaAcao; }
    public void setDataUltimaAcao(LocalDateTime dataUltimaAcao) { this.dataUltimaAcao = dataUltimaAcao; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SolicitacaoFaturamento that = (SolicitacaoFaturamento) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}