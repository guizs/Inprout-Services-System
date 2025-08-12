package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "os_lpu_detalhes")
public class OsLpuDetalhes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id", nullable = false)
    @JsonBackReference
    private OS os;

    @ManyToOne(fetch = FetchType.EAGER) // EAGER para facilitar o acesso aos dados da LPU
    @JoinColumn(name = "lpu_id", nullable = false)
    private Lpu lpu;

    // Todos os campos que antes eram da OS
    private String site;
    private String contrato;
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
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dataPo;
    private String faturamento;
    private String solitIdFat;
    private String recebIdFat;
    private String idFaturamento;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dataFatInprout;
    private String solitFsPortal;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dataFs;
    private String numFs;
    private String gate;
    private String gateId;
    @Column(name = "chave_unica", unique = true, nullable = true)
    private String key;

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

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getContrato() {
        return contrato;
    }

    public void setContrato(String contrato) {
        this.contrato = contrato;
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

    public String getFaturamento() {
        return faturamento;
    }

    public void setFaturamento(String faturamento) {
        this.faturamento = faturamento;
    }

    public String getSolitIdFat() {
        return solitIdFat;
    }

    public void setSolitIdFat(String solitIdFat) {
        this.solitIdFat = solitIdFat;
    }

    public String getRecebIdFat() {
        return recebIdFat;
    }

    public void setRecebIdFat(String recebIdFat) {
        this.recebIdFat = recebIdFat;
    }

    public String getIdFaturamento() {
        return idFaturamento;
    }

    public void setIdFaturamento(String idFaturamento) {
        this.idFaturamento = idFaturamento;
    }

    public LocalDate getDataFatInprout() {
        return dataFatInprout;
    }

    public void setDataFatInprout(LocalDate dataFatInprout) {
        this.dataFatInprout = dataFatInprout;
    }

    public String getSolitFsPortal() {
        return solitFsPortal;
    }

    public void setSolitFsPortal(String solitFsPortal) {
        this.solitFsPortal = solitFsPortal;
    }

    public LocalDate getDataFs() {
        return dataFs;
    }

    public void setDataFs(LocalDate dataFs) {
        this.dataFs = dataFs;
    }

    public String getNumFs() {
        return numFs;
    }

    public void setNumFs(String numFs) {
        this.numFs = numFs;
    }

    public String getGate() {
        return gate;
    }

    public void setGate(String gate) {
        this.gate = gate;
    }

    public String getGateId() {
        return gateId;
    }

    public void setGateId(String gateId) {
        this.gateId = gateId;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}