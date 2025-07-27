package br.com.inproutservices.inproutsystem.entities.index;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;

@Entity
@Table(name = "lpu", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"codigo_lpu", "contrato_id"})
})
public class Lpu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "situacao_projeto")
    private SituacaoOperacional situacaoProjeto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_id", nullable = false)
    @JsonBackReference
    private Contrato contrato;

    @Column(name = "codigo_lpu", nullable = false, length = 50)
    private String codigoLpu;

    @Column(name = "nome_lpu", nullable = false, length = 255)
    private String nomeLpu;

    @Column(nullable = false, length = 20)
    private String unidade;

    @Column(name = "valor_sem_imposto", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorSemImposto;

    @Column(name = "valor_com_imposto", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorComImposto;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    public Lpu() {
    }

    public SituacaoOperacional getSituacaoProjeto() {
        return situacaoProjeto;
    }

    public void setSituacaoProjeto(SituacaoOperacional situacaoProjeto) {
        this.situacaoProjeto = situacaoProjeto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Contrato getContrato() {
        return contrato;
    }

    public void setContrato(Contrato contrato) {
        this.contrato = contrato;
    }

    public String getCodigoLpu() {
        return codigoLpu;
    }

    public void setCodigoLpu(String codigoLpu) {
        this.codigoLpu = codigoLpu;
    }

    public String getNomeLpu() {
        return nomeLpu;
    }

    public void setNomeLpu(String nomeLpu) {
        this.nomeLpu = nomeLpu;
    }

    public String getUnidade() {
        return unidade;
    }

    public void setUnidade(String unidade) {
        this.unidade = unidade;
    }

    public BigDecimal getValorSemImposto() {
        return valorSemImposto;
    }

    public void setValorSemImposto(BigDecimal valorSemImposto) {
        this.valorSemImposto = valorSemImposto;
    }

    public BigDecimal getValorComImposto() {
        return valorComImposto;
    }

    public void setValorComImposto(BigDecimal valorComImposto) {
        this.valorComImposto = valorComImposto;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }

    public void setDataAtualizacao(LocalDateTime dataAtualizacao) {
        this.dataAtualizacao = dataAtualizacao;
    }

    @PrePersist
    protected void onCreate() {
        dataCriacao = LocalDateTime.now();
        dataAtualizacao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dataAtualizacao = LocalDateTime.now();
    }
}