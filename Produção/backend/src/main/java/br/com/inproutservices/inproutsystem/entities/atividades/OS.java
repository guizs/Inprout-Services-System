package br.com.inproutservices.inproutsystem.entities.atividades;

// Garanta que este import aponte para o pacote onde sua classe Lpu está
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "os")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "os_lpus", // Nome da tabela de junção
            joinColumns = @JoinColumn(name = "os_id"),
            inverseJoinColumns = @JoinColumn(name = "lpu_id")
    )
    private Set<Lpu> lpus = new HashSet<>();

    private String os;
    private String site;
    private String contrato;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segmento_id")
    private Segmento segmento;
    private String projeto;
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

    // --- CAMPO ADICIONADO ---
    @Column(name = "custo_total_materiais", precision = 10, scale = 2)
    private BigDecimal custoTotalMateriais;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dataPo;

    @JsonIgnore
    @OneToMany(mappedBy = "os", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private List<Lancamento> lancamentos;

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
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDateTime dataCriacao;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDateTime dataAtualizacao;
    private String usuarioCriacao;
    private String usuarioAtualizacao;
    private String statusRegistro;

    // --- GETTERS E SETTERS ---

    // ... (todos os getters e setters existentes) ...

    // --- MÉTODOS ADICIONADOS ---
    public BigDecimal getCustoTotalMateriais() {
        return custoTotalMateriais;
    }

    public void setCustoTotalMateriais(BigDecimal custoTotalMateriais) {
        this.custoTotalMateriais = custoTotalMateriais;
    }

    public Long getId() {
        return id;
    }

    public Set<Lpu> getLpus() {
        return lpus;
    }

    public void setLpus(Set<Lpu> lpus) {
        this.lpus = lpus;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOs() {
        return os;
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

    public String getContrato() {
        return contrato;
    }

    public void setContrato(String contrato) {
        this.contrato = contrato;
    }

    public Segmento getSegmento() {
        return segmento;
    }

    public void setSegmento(Segmento segmento) {
        this.segmento = segmento;
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

    public List<Lancamento> getLancamentos() {
        return lancamentos;
    }

    public void setLancamentos(List<Lancamento> lancamentos) {
        this.lancamentos = lancamentos;
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

    public String getUsuarioCriacao() {
        return usuarioCriacao;
    }

    public void setUsuarioCriacao(String usuarioCriacao) {
        this.usuarioCriacao = usuarioCriacao;
    }

    public String getUsuarioAtualizacao() {
        return usuarioAtualizacao;
    }

    public void setUsuarioAtualizacao(String usuarioAtualizacao) {
        this.usuarioAtualizacao = usuarioAtualizacao;
    }

    public String getStatusRegistro() {
        return statusRegistro;
    }

    public void setStatusRegistro(String statusRegistro) {
        this.statusRegistro = statusRegistro;
    }
}