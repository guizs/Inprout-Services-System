package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;

public class ConsolidadoPorPrestadorDTO {

    private String codPrestador;
    private String prestadorNome;
    private BigDecimal valorTotal;
    private Long quantidade;

    public ConsolidadoPorPrestadorDTO() {}

    public ConsolidadoPorPrestadorDTO(String codPrestador, String prestadorNome, BigDecimal valorTotal, Long quantidade) {
        this.codPrestador = codPrestador;
        this.prestadorNome = prestadorNome;
        this.valorTotal = valorTotal;
        this.quantidade = quantidade;
    }

    public String getCodPrestador() {
        return codPrestador;
    }

    public void setCodPrestador(String codPrestador) {
        this.codPrestador = codPrestador;
    }

    public String getPrestadorNome() {
        return prestadorNome;
    }

    public void setPrestadorNome(String prestadorNome) {
        this.prestadorNome = prestadorNome;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }

    public Long getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Long quantidade) {
        this.quantidade = quantidade;
    }
}