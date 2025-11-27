package br.com.inproutservices.inproutsystem.dtos.gate;

import java.math.BigDecimal;
import java.util.Objects;

public class GateReportRowDTO {

    private String segmentoNome;
    private BigDecimal naoIniciado = BigDecimal.ZERO;
    private BigDecimal paralisado = BigDecimal.ZERO;
    private BigDecimal emAndamentoSemPO = BigDecimal.ZERO;
    private BigDecimal emAndamentoComPO = BigDecimal.ZERO;
    private BigDecimal totalEmAndamento = BigDecimal.ZERO;
    private BigDecimal finalizadoSemPO = BigDecimal.ZERO;
    private BigDecimal finalizadoComPO = BigDecimal.ZERO;
    private BigDecimal totalFinalizado = BigDecimal.ZERO;
    private BigDecimal idSolicitado = BigDecimal.ZERO;
    private BigDecimal idRecebido = BigDecimal.ZERO;
    private BigDecimal previsao = BigDecimal.ZERO;

    public GateReportRowDTO(String segmentoNome) {
        this.segmentoNome = segmentoNome;
    }

    // Métodos "add" para facilitar a soma
    public void addNaoIniciado(BigDecimal valor) { this.naoIniciado = this.naoIniciado.add(valor); }
    public void addParalisado(BigDecimal valor) { this.paralisado = this.paralisado.add(valor); }
    public void addEmAndamentoSemPO(BigDecimal valor) { this.emAndamentoSemPO = this.emAndamentoSemPO.add(valor); }
    public void addEmAndamentoComPO(BigDecimal valor) { this.emAndamentoComPO = this.emAndamentoComPO.add(valor); }
    public void addFinalizadoSemPO(BigDecimal valor) { this.finalizadoSemPO = this.finalizadoSemPO.add(valor); }
    public void addFinalizadoComPO(BigDecimal valor) { this.finalizadoComPO = this.finalizadoComPO.add(valor); }
    public void addIdSolicitado(BigDecimal valor) { this.idSolicitado = this.idSolicitado.add(valor); }
    public void addIdRecebido(BigDecimal valor) { this.idRecebido = this.idRecebido.add(valor); }

    // Calcula os totais de subgrupo
    public void calcularTotais() {
        this.totalEmAndamento = this.emAndamentoSemPO.add(this.emAndamentoComPO);
        this.totalFinalizado = this.finalizadoSemPO.add(this.finalizadoComPO);
        this.previsao = this.idSolicitado.add(this.idRecebido);
    }

    // Getters (necessários para serialização JSON)
    public String getSegmentoNome() { return segmentoNome; }
    public BigDecimal getNaoIniciado() { return naoIniciado; }
    public BigDecimal getParalisado() { return paralisado; }
    public BigDecimal getEmAndamentoSemPO() { return emAndamentoSemPO; }
    public BigDecimal getEmAndamentoComPO() { return emAndamentoComPO; }
    public BigDecimal getTotalEmAndamento() { return totalEmAndamento; }
    public BigDecimal getFinalizadoSemPO() { return finalizadoSemPO; }
    public BigDecimal getFinalizadoComPO() { return finalizadoComPO; }
    public BigDecimal getTotalFinalizado() { return totalFinalizado; }
    public BigDecimal getIdSolicitado() { return idSolicitado; }
    public BigDecimal getIdRecebido() { return idRecebido; }
    public BigDecimal getPrevisao() { return previsao; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GateReportRowDTO that = (GateReportRowDTO) o;
        return Objects.equals(segmentoNome, that.segmentoNome);
    }

    @Override
    public int hashCode() {
        return Objects.hash(segmentoNome);
    }
}