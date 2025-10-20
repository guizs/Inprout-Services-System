package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class OsRequestDto {
    // --- Campos de Identificação (lidos da planilha) ---
    private String os;
    private Long segmentoId;
    private List<Long> lpuIds;
    private String key; // A chave principal para o "upsert"

    // --- Campos que NÃO mudam na atualização ---
    private String projeto;
    private String gestorTim;

    // --- Campos que PODEM ser atualizados ---
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
    private LocalDate dataPo;

    // --- Campos de FATURAMENTO (também podem ser atualizados) ---
    private String faturamento;
    private String solitIdFat;
    private String recebIdFat;
    private String idFaturamento;
    private LocalDate dataFatInprout;
    private String solitFsPortal;
    private LocalDate dataFs;
    private String numFs;
    private String gate;
    private String gateId;

    // --- NOVOS CAMPOS PARA IMPORTAÇÃO LEGADO ---
    private String vistoria;
    private LocalDate planoVistoria;
    private String desmobilizacao;
    private LocalDate planoDesmobilizacao;
    private String instalacao;
    private LocalDate planoInstalacao;
    private String ativacao;
    private LocalDate planoAtivacao;
    private String documentacao;
    private LocalDate planoDocumentacao;


    // --- Getters e Setters para todos os campos ---

    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }
    public Long getSegmentoId() { return segmentoId; }
    public void setSegmentoId(Long segmentoId) { this.segmentoId = segmentoId; }
    public List<Long> getLpuIds() { return lpuIds; }
    public void setLpuIds(List<Long> lpuIds) { this.lpuIds = lpuIds; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getProjeto() { return projeto; }
    public void setProjeto(String projeto) { this.projeto = projeto; }
    public String getGestorTim() { return gestorTim; }
    public void setGestorTim(String gestorTim) { this.gestorTim = gestorTim; }
    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }
    public String getContrato() { return contrato; }
    public void setContrato(String contrato) { this.contrato = contrato; }
    public String getRegional() { return regional; }
    public void setRegional(String regional) { this.regional = regional; }
    public String getLote() { return lote; }
    public void setLote(String lote) { this.lote = lote; }
    public String getBoq() { return boq; }
    public void setBoq(String boq) { this.boq = boq; }
    public String getPo() { return po; }
    public void setPo(String po) { this.po = po; }
    public String getItem() { return item; }
    public void setItem(String item) { this.item = item; }
    public String getObjetoContratado() { return objetoContratado; }
    public void setObjetoContratado(String objetoContratado) { this.objetoContratado = objetoContratado; }
    public String getUnidade() { return unidade; }
    public void setUnidade(String unidade) { this.unidade = unidade; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public LocalDate getDataPo() { return dataPo; }
    public void setDataPo(LocalDate dataPo) { this.dataPo = dataPo; }
    public String getFaturamento() { return faturamento; }
    public void setFaturamento(String faturamento) { this.faturamento = faturamento; }
    public String getSolitIdFat() { return solitIdFat; }
    public void setSolitIdFat(String solitIdFat) { this.solitIdFat = solitIdFat; }
    public String getRecebIdFat() { return recebIdFat; }
    public void setRecebIdFat(String recebIdFat) { this.recebIdFat = recebIdFat; }
    public String getIdFaturamento() { return idFaturamento; }
    public void setIdFaturamento(String idFaturamento) { this.idFaturamento = idFaturamento; }
    public LocalDate getDataFatInprout() { return dataFatInprout; }
    public void setDataFatInprout(LocalDate dataFatInprout) { this.dataFatInprout = dataFatInprout; }
    public String getSolitFsPortal() { return solitFsPortal; }
    public void setSolitFsPortal(String solitFsPortal) { this.solitFsPortal = solitFsPortal; }
    public LocalDate getDataFs() { return dataFs; }
    public void setDataFs(LocalDate dataFs) { this.dataFs = dataFs; }
    public String getNumFs() { return numFs; }
    public void setNumFs(String numFs) { this.numFs = numFs; }
    public String getGate() { return gate; }
    public void setGate(String gate) { this.gate = gate; }
    public String getGateId() { return gateId; }
    public void setGateId(String gateId) { this.gateId = gateId; }

    // --- Getters e Setters para os novos campos ---

    public String getVistoria() { return vistoria; }
    public void setVistoria(String vistoria) { this.vistoria = vistoria; }
    public LocalDate getPlanoVistoria() { return planoVistoria; }
    public void setPlanoVistoria(LocalDate planoVistoria) { this.planoVistoria = planoVistoria; }
    public String getDesmobilizacao() { return desmobilizacao; }
    public void setDesmobilizacao(String desmobilizacao) { this.desmobilizacao = desmobilizacao; }
    public LocalDate getPlanoDesmobilizacao() { return planoDesmobilizacao; }
    public void setPlanoDesmobilizacao(LocalDate planoDesmobilizacao) { this.planoDesmobilizacao = planoDesmobilizacao; }
    public String getInstalacao() { return instalacao; }
    public void setInstalacao(String instalacao) { this.instalacao = instalacao; }
    public LocalDate getPlanoInstalacao() { return planoInstalacao; }
    public void setPlanoInstalacao(LocalDate planoInstalacao) { this.planoInstalacao = planoInstalacao; }
    public String getAtivacao() { return ativacao; }
    public void setAtivacao(String ativacao) { this.ativacao = ativacao; }
    public LocalDate getPlanoAtivacao() { return planoAtivacao; }
    public void setPlanoAtivacao(LocalDate planoAtivacao) { this.planoAtivacao = planoAtivacao; }
    public String getDocumentacao() { return documentacao; }
    public void setDocumentacao(String documentacao) { this.documentacao = documentacao; }
    public LocalDate getPlanoDocumentacao() { return planoDocumentacao; }
    public void setPlanoDocumentacao(LocalDate planoDocumentacao) { this.planoDocumentacao = planoDocumentacao; }
}