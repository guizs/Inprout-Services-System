package br.com.inproutservices.inproutsystem.entities.materiais;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "materiais")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 255)
    private String descricao;

    @Column(name = "unidade_medida", nullable = false, length = 10)
    private String unidadeMedida;

    @Column(name = "saldo_fisico", nullable = false, precision = 10, scale = 2)
    private BigDecimal saldoFisico;

    @Column(name = "custo_medio_ponderado", precision = 10, scale = 4)
    private BigDecimal custoMedioPonderado;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @OneToMany(mappedBy = "material", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<EntradaMaterial> entradas = new ArrayList<>();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    // Construtores...
    public Material() {
    }

    public Material(String codigo, String descricao, String unidadeMedida, BigDecimal saldoFisico) {
        this.codigo = codigo;
        this.descricao = descricao;
        this.unidadeMedida = unidadeMedida;
        this.saldoFisico = saldoFisico;
    }

    @PrePersist
    @PreUpdate
    public void prePersistOrUpdate() {
        dataAtualizacao = LocalDateTime.now();
    }

    // --- Getters e Setters ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getUnidadeMedida() {
        return unidadeMedida;
    }

    public void setUnidadeMedida(String unidadeMedida) {
        this.unidadeMedida = unidadeMedida;
    }

    public BigDecimal getSaldoFisico() {
        return saldoFisico;
    }

    public void setSaldoFisico(BigDecimal saldoFisico) {
        this.saldoFisico = saldoFisico;
    }

    public BigDecimal getCustoMedioPonderado() {
        return custoMedioPonderado;
    }

    public void setCustoMedioPonderado(BigDecimal custoMedioPonderado) {
        this.custoMedioPonderado = custoMedioPonderado;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public List<EntradaMaterial> getEntradas() {
        return entradas;
    }

    public void setEntradas(List<EntradaMaterial> entradas) {
        this.entradas = entradas;
    }

    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }

    public void setDataAtualizacao(LocalDateTime dataAtualizacao) {
        this.dataAtualizacao = dataAtualizacao;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Material material = (Material) o;
        return Objects.equals(id, material.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}