package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "os_lpu_detalhes")
public class OsLpuDetalhe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relacionamento com a OS "mãe"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id", nullable = false)
    @JsonIgnore // Evita serialização em loop
    private OS os;

    // Relacionamento com a LPU específica desta linha
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lpu_id", nullable = false)
    private Lpu lpu;

    // A nova KEY única de integração
    @Column(name = "chave_externa", unique = true, nullable = false)
    private String key;

    // NOVO CAMPO ADICIONADO
    @Column(name = "origem", length = 50, nullable = false, columnDefinition = "varchar(50) default 'SISTEMA GERAL'")
    private String origem = "SISTEMA GERAL";


    // ---- CAMPOS DE DETALHE ----

    @Column(name = "site")
    private String site;

    // Observação: Assumi que 'contrato' é um texto, mas se for uma entidade, use @ManyToOne
    @Column(name = "contrato")
    private String contrato;

    @Column(name = "regional")
    private String regional;

    @Column(name = "lote")
    private String lote;

    @Column(name = "boq")
    private String boq;

    @Column(name = "po")
    private String po;

    @Column(name = "item")
    private String item;

    @Column(name = "objeto_contratado", columnDefinition = "TEXT")
    private String objetoContratado;

    @Column(name = "unidade")
    private String unidade;

    @Column(name = "quantidade")
    private Integer quantidade;

    @Column(name = "valor_total", precision = 19, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "data_po")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dataPo;

    // ---- CAMPOS DE FATURAMENTO ----

    @Column(name = "faturamento")
    private String faturamento;

    @Column(name = "solit_id_fat")
    private String solitIdFat;

    @Column(name = "receb_id_fat")
    private String recebIdFat;

    @Column(name = "id_faturamento")
    private String idFaturamento;

    @Column(name = "data_fat_inprout")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dataFatInrout;

    @Column(name = "solit_fs_portal")
    private String solitFsPortal;

    @Column(name = "data_fs")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dataFs;

    @Column(name = "num_fs")
    private String numFs;

    @Column(name = "gate")
    private String gate;

    @Column(name = "gate_id")
    private String gateId;

    // Relacionamento com os Lançamentos que pertencem a esta linha de detalhe
    @OneToMany(mappedBy = "osLpuDetalhe", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // Evita recursão infinita
    private Set<Lancamento> lancamentos = new HashSet<>();

    @Column(name = "status_registro", length = 20, nullable = false, columnDefinition = "varchar(20) default 'ATIVO'")
    private String statusRegistro = "ATIVO";

    // ---- GETTERS AND SETTERS ----

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }


    public String getStatusRegistro() {
        return statusRegistro;
    }

    public void setStatusRegistro(String statusRegistro) {
        this.statusRegistro = statusRegistro;
    }

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

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
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
        return dataFatInrout;
    }

    public void setDataFatInprout(LocalDate dataFatInrout) {
        this.dataFatInrout = dataFatInrout;
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

    public Set<Lancamento> getLancamentos() {
        return lancamentos;
    }

    public void setLancamentos(Set<Lancamento> lancamentos) {
        this.lancamentos = lancamentos;
    }


}