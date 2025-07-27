package br.com.inproutservices.inproutsystem.entities.materiais;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "itens_solicitacao")
public class ItemSolicitacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // RELACIONAMENTO COM SOLICITACAO: Define a coluna de ligação APENAS para a solicitação.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitacao_id", nullable = false)
    private Solicitacao solicitacao;

    // RELACIONAMENTO COM MATERIAL: Define a coluna de ligação APENAS para o material.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(name = "quantidade_solicitada", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantidadeSolicitada;

    @Column(name = "saldo_no_momento_aprovacao")
    private BigDecimal saldoNoMomentoDaAprovacao;

    public ItemSolicitacao() {
    }

    // --- Getters e Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonIgnore
    public Solicitacao getSolicitacao() {
        return solicitacao;
    }

    public void setSolicitacao(Solicitacao solicitacao) {
        this.solicitacao = solicitacao;
    }

    public Material getMaterial() {
        return material;
    }

    public void setMaterial(Material material) {
        this.material = material;
    }

    public BigDecimal getQuantidadeSolicitada() {
        return quantidadeSolicitada;
    }

    public void setQuantidadeSolicitada(BigDecimal quantidadeSolicitada) {
        this.quantidadeSolicitada = quantidadeSolicitada;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ItemSolicitacao that = (ItemSolicitacao) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public BigDecimal getSaldoNoMomentoDaAprovacao() {
        return saldoNoMomentoDaAprovacao;
    }

    public void setSaldoNoMomentoDaAprovacao(BigDecimal saldoNoMomentoDaAprovacao) {
        this.saldoNoMomentoDaAprovacao = saldoNoMomentoDaAprovacao;
    }
}