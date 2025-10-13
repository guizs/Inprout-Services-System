package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe; // Import necessário
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public class CpsResponseDTO {
    private BigDecimal valorTotalGeral;
    private List<ValoresPorSegmentoDTO> valoresPorSegmento;
    private List<ConsolidadoPorPrestadorDTO> consolidadoPorPrestador;
    private List<LancamentoCpsDetalheDTO> lancamentosDetalhados;

    public static class LancamentoCpsDetalheDTO {
        private Long id;
        private String key;
        @JsonFormat(pattern = "dd/MM/yyyy")
        private LocalDate dataAtividade;
        private String os;
        private String site;
        private String contrato;
        private String segmento;
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
        @JsonFormat(pattern = "dd/MM/yyyy")
        private LocalDate dataPo;
        private String lpu;
        private String equipe;
        private String vistoria;
        @JsonFormat(pattern = "dd/MM/yyyy")
        private LocalDate planoDeVistoria;
        private String desmobilizacao;
        @JsonFormat(pattern = "dd/MM/yyyy")
        private LocalDate planoDeDesmobilizacao;
        private String instalacao;
        @JsonFormat(pattern = "dd/MM/yyyy")
        private LocalDate planoDeInstalacao;
        private String ativacao;
        @JsonFormat(pattern = "dd/MM/yyyy")
        private LocalDate planoDeAtivacao;
        private String documentacao;
        @JsonFormat(pattern = "dd/MM/yyyy")
        private LocalDate planoDeDocumentacao;
        private String etapaGeral;
        private String etapaDetalhada;
        private StatusEtapa status;
        private SituacaoOperacional situacao;
        private String detalheDiario;
        private String codPrestador;
        private String prestador;
        private BigDecimal valor;
        private String gestor;
        private BigDecimal valorAdiantamento;
        private String idFaturamento;

        // ======================= INÍCIO DA CORREÇÃO =======================
        public LancamentoCpsDetalheDTO(Lancamento l) {
            this.id = l.getId();

            this.dataAtividade = l.getDataAtividade();

            // 1. Pega a linha de detalhe (o "pai" do lançamento)
            Optional<OsLpuDetalhe> detalheOptional = Optional.ofNullable(l.getOsLpuDetalhe());

            // 2. A partir do detalhe, pega a OS (o "avô" do lançamento)
            Optional<OS> osOptional = detalheOptional.map(OsLpuDetalhe::getOs);

            this.key = detalheOptional.map(OsLpuDetalhe::getKey).orElse(null);

            // --- Mapeia os dados da OS (avô) ---
            this.os = osOptional.map(OS::getOs).orElse(null);
            this.projeto = osOptional.map(OS::getProjeto).orElse(null);
            this.gestorTim = osOptional.map(OS::getGestorTim).orElse(null);
            this.segmento = osOptional
                    .map(OS::getSegmento)
                    .map(Segmento::getNome)
                    .orElse("Segmento não informado");

            // --- Mapeia os dados do Detalhe (pai) ---
            this.site = detalheOptional.map(OsLpuDetalhe::getSite).orElse(null);
            this.contrato = detalheOptional.map(OsLpuDetalhe::getContrato).orElse(null);
            this.regional = detalheOptional.map(OsLpuDetalhe::getRegional).orElse(null);
            this.lote = detalheOptional.map(OsLpuDetalhe::getLote).orElse(null);
            this.boq = detalheOptional.map(OsLpuDetalhe::getBoq).orElse(null);
            this.po = detalheOptional.map(OsLpuDetalhe::getPo).orElse(null);
            this.item = detalheOptional.map(OsLpuDetalhe::getItem).orElse(null);
            this.objetoContratado = detalheOptional.map(OsLpuDetalhe::getObjetoContratado).orElse(null);
            this.unidade = detalheOptional.map(OsLpuDetalhe::getUnidade).orElse(null);
            this.quantidade = detalheOptional.map(OsLpuDetalhe::getQuantidade).orElse(null);
            this.valorTotal = detalheOptional.map(OsLpuDetalhe::getValorTotal).orElse(null);
            this.observacoes = detalheOptional.map(OsLpuDetalhe::getObservacoes).orElse(null);
            this.dataPo = detalheOptional.map(OsLpuDetalhe::getDataPo).orElse(null);
            this.lpu = detalheOptional.map(detalhe -> detalhe.getLpu().getCodigoLpu() + " - " + detalhe.getLpu().getNomeLpu()).orElse(null);

            // --- Mapeia os dados do próprio Lançamento (restante dos campos) ---
            this.equipe = l.getEquipe();
            this.vistoria = l.getVistoria();
            this.planoDeVistoria = l.getPlanoVistoria();
            this.desmobilizacao = l.getDesmobilizacao();
            this.planoDeDesmobilizacao = l.getPlanoDesmobilizacao();
            this.instalacao = l.getInstalacao();
            this.planoDeInstalacao = l.getPlanoInstalacao();
            this.ativacao = l.getAtivacao();
            this.planoDeAtivacao = l.getPlanoAtivacao();
            this.documentacao = l.getDocumentacao();
            this.planoDeDocumentacao = l.getPlanoDocumentacao();
            this.etapaGeral = Optional.ofNullable(l.getEtapaDetalhada()).map(ed -> ed.getEtapa().getNome()).orElse(null);
            this.etapaDetalhada = Optional.ofNullable(l.getEtapaDetalhada()).map(ed -> ed.getNome()).orElse(null);
            this.status = l.getStatus();
            this.situacao = l.getSituacao();
            this.detalheDiario = l.getDetalheDiario();
            this.codPrestador = Optional.ofNullable(l.getPrestador()).map(p -> p.getCodigoPrestador()).orElse(null);
            this.prestador = Optional.ofNullable(l.getPrestador()).map(p -> p.getPrestador()).orElse(null);
            this.valor = l.getValor();
            this.gestor = Optional.ofNullable(l.getManager()).map(u -> u.getNome()).orElse(null);
            this.valorAdiantamento = l.getValorAdiantamento();
            this.idFaturamento = detalheOptional.map(OsLpuDetalhe::getIdFaturamento).orElse(null);
        }
        // ======================== FIM DA CORREÇÃO =========================


        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getIdFaturamento() {
            return idFaturamento;
        }

        public void setIdFaturamento(String idFaturamento) {
            this.idFaturamento = idFaturamento;
        }

        public LocalDate getDataAtividade() {
            return dataAtividade;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public void setDataAtividade(LocalDate dataAtividade) {
            this.dataAtividade = dataAtividade;
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

        public String getSegmento() {
            return segmento;
        }

        public void setSegmento(String segmento) {
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

        public String getLpu() {
            return lpu;
        }

        public void setLpu(String lpu) {
            this.lpu = lpu;
        }

        public String getEquipe() {
            return equipe;
        }

        public void setEquipe(String equipe) {
            this.equipe = equipe;
        }

        public String getVistoria() {
            return vistoria;
        }

        public void setVistoria(String vistoria) {
            this.vistoria = vistoria;
        }

        public LocalDate getPlanoDeVistoria() {
            return planoDeVistoria;
        }

        public void setPlanoDeVistoria(LocalDate planoDeVistoria) {
            this.planoDeVistoria = planoDeVistoria;
        }

        public String getDesmobilizacao() {
            return desmobilizacao;
        }

        public void setDesmobilizacao(String desmobilizacao) {
            this.desmobilizacao = desmobilizacao;
        }

        public LocalDate getPlanoDeDesmobilizacao() {
            return planoDeDesmobilizacao;
        }

        public void setPlanoDeDesmobilizacao(LocalDate planoDeDesmobilizacao) {
            this.planoDeDesmobilizacao = planoDeDesmobilizacao;
        }

        public String getInstalacao() {
            return instalacao;
        }

        public void setInstalacao(String instalacao) {
            this.instalacao = instalacao;
        }

        public LocalDate getPlanoDeInstalacao() {
            return planoDeInstalacao;
        }

        public void setPlanoDeInstalacao(LocalDate planoDeInstalacao) {
            this.planoDeInstalacao = planoDeInstalacao;
        }

        public String getAtivacao() {
            return ativacao;
        }

        public void setAtivacao(String ativacao) {
            this.ativacao = ativacao;
        }

        public LocalDate getPlanoDeAtivacao() {
            return planoDeAtivacao;
        }

        public void setPlanoDeAtivacao(LocalDate planoDeAtivacao) {
            this.planoDeAtivacao = planoDeAtivacao;
        }

        public String getDocumentacao() {
            return documentacao;
        }

        public void setDocumentacao(String documentacao) {
            this.documentacao = documentacao;
        }

        public LocalDate getPlanoDeDocumentacao() {
            return planoDeDocumentacao;
        }

        public void setPlanoDeDocumentacao(LocalDate planoDeDocumentacao) {
            this.planoDeDocumentacao = planoDeDocumentacao;
        }

        public String getEtapaGeral() {
            return etapaGeral;
        }

        public void setEtapaGeral(String etapaGeral) {
            this.etapaGeral = etapaGeral;
        }

        public String getEtapaDetalhada() {
            return etapaDetalhada;
        }

        public void setEtapaDetalhada(String etapaDetalhada) {
            this.etapaDetalhada = etapaDetalhada;
        }

        public StatusEtapa getStatus() {
            return status;
        }

        public void setStatus(StatusEtapa status) {
            this.status = status;
        }

        public SituacaoOperacional getSituacao() {
            return situacao;
        }

        public void setSituacao(SituacaoOperacional situacao) {
            this.situacao = situacao;
        }

        public String getDetalheDiario() {
            return detalheDiario;
        }

        public void setDetalheDiario(String detalheDiario) {
            this.detalheDiario = detalheDiario;
        }

        public String getCodPrestador() {
            return codPrestador;
        }

        public void setCodPrestador(String codPrestador) {
            this.codPrestador = codPrestador;
        }

        public String getPrestador() {
            return prestador;
        }

        public void setPrestador(String prestador) {
            this.prestador = prestador;
        }

        public BigDecimal getValor() {
            return valor;
        }

        public void setValor(BigDecimal valor) {
            this.valor = valor;
        }

        public String getGestor() {
            return gestor;
        }

        public void setGestor(String gestor) {
            this.gestor = gestor;
        }

        public BigDecimal getValorAdiantamento() {
            return valorAdiantamento;
        }

        public void setValorAdiantamento(BigDecimal valorAdiantamento) {
            this.valorAdiantamento = valorAdiantamento;
        }
    }

    public BigDecimal getValorTotalGeral() {
        return valorTotalGeral;
    }

    public void setValorTotalGeral(BigDecimal valorTotalGeral) {
        this.valorTotalGeral = valorTotalGeral;
    }

    public List<ValoresPorSegmentoDTO> getValoresPorSegmento() {
        return valoresPorSegmento;
    }

    public void setValoresPorSegmento(List<ValoresPorSegmentoDTO> valoresPorSegmento) {
        this.valoresPorSegmento = valoresPorSegmento;
    }

    public List<ConsolidadoPorPrestadorDTO> getConsolidadoPorPrestador() {
        return consolidadoPorPrestador;
    }

    public void setConsolidadoPorPrestador(List<ConsolidadoPorPrestadorDTO> consolidadoPorPrestador) {
        this.consolidadoPorPrestador = consolidadoPorPrestador;
    }

    public List<LancamentoCpsDetalheDTO> getLancamentosDetalhados() {
        return lancamentosDetalhados;
    }

    public void setLancamentosDetalhados(List<LancamentoCpsDetalheDTO> lancamentosDetalhados) {
        this.lancamentosDetalhados = lancamentosDetalhados;
    }
}