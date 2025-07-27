package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class OsRequestDto {
    private String os;
    private String site;
    private String contrato;
    private Long segmentoId;
    private String projeto;
    private List<Long> lpuIds;
    private String gestorTim;
    private String regional;
    private String lote;
    private String boq;
    private String po;
    private String item;
    private String objetoContratado;
    private String unidade;
    private Integer quantidade;
    private BigDecimal valorTotal;
    private String observacoes;
    private LocalDate dataPo;

    public String getOs() {
        return os;
    }

    public List<Long> getLpuIds() {
        return lpuIds;
    }

    public void setLpuIds(List<Long> lpuIds) {
        this.lpuIds = lpuIds;
    }

    public void setOs(String os) {
        this.os = os;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getContrato() { return contrato; }

    public void setContrato(String contrato) { this.contrato = contrato; }

    public Long getSegmentoId() {
        return segmentoId;
    }

    public void setSegmentoId(Long segmentoId) {
        this.segmentoId = segmentoId;
    }

    public String getProjeto() {
        return projeto;
    }

    public void setProjeto(String projeto) {
        this.projeto = projeto;
    }

    public String getGestorTim() {
        return gestorTim;
    }

    public void setGestorTim(String gestorTim) {
        this.gestorTim = gestorTim;
    }

    public String getRegional() {
        return regional;
    }

    public void setRegional(String regional) {
        this.regional = regional;
    }

    public String getLote() {
        return lote;
    }

    public void setLote(String lote) {
        this.lote = lote;
    }

    public String getBoq() {
        return boq;
    }

    public void setBoq(String boq) {
        this.boq = boq;
    }

    public String getPo() {
        return po;
    }

    public void setPo(String po) {
        this.po = po;
    }

    public String getItem() {
        return item;
    }

    public void setItem(String item) {
        this.item = item;
    }

    public String getObjetoContratado() {
        return objetoContratado;
    }

    public void setObjetoContratado(String objetoContratado) {
        this.objetoContratado = objetoContratado;
    }

    public String getUnidade() {
        return unidade;
    }

    public void setUnidade(String unidade) {
        this.unidade = unidade;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public LocalDate getDataPo() {
        return dataPo;
    }

    public void setDataPo(LocalDate dataPo) {
        this.dataPo = dataPo;
    }
}