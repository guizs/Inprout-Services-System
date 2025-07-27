package br.com.inproutservices.inproutsystem.dtos.atividades;

// Adicione os imports das entidades que serão usadas no DTO interno
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public class CpsResponseDTO {
    private BigDecimal valorTotalGeral;
    private List<ValoresPorSegmentoDTO> valoresPorSegmento;
    private List<ConsolidadoPorPrestadorDTO> consolidadoPorPrestador;
    private List<LancamentoCpsDetalheDTO> lancamentosDetalhados;

    public static class LancamentoCpsDetalheDTO {
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

        // O construtor agora funcionará sem erros, pois o 'import' tornou a classe OS visível
        public LancamentoCpsDetalheDTO(Lancamento l) {
            this.dataAtividade = l.getDataAtividade();
            Optional<OS> osOptional = Optional.ofNullable(l.getOs());
            this.os = osOptional.map(OS::getOs).orElse(null);
            this.site = osOptional.map(OS::getSite).orElse(null);
            this.contrato = osOptional.map(OS::getContrato).orElse(null);
            this.segmento = osOptional
                    .map(OS::getSegmento)
                    .map(Segmento::getNome)
                    .orElse("Segmento não informado");
            this.projeto = osOptional.map(OS::getProjeto).orElse(null);
            this.gestorTim = osOptional.map(OS::getGestorTim).orElse(null);
            this.regional = osOptional.map(OS::getRegional).orElse(null);
            this.lote = osOptional.map(OS::getLote).orElse(null);
            this.boq = osOptional.map(OS::getBoq).orElse(null);
            this.po = osOptional.map(OS::getPo).orElse(null);
            this.item = osOptional.map(OS::getItem).orElse(null);
            this.objetoContratado = osOptional.map(OS::getObjetoContratado).orElse(null);
            this.unidade = osOptional.map(OS::getUnidade).orElse(null);
            this.quantidade = osOptional.map(OS::getQuantidade).orElse(null);
            this.valorTotal = osOptional.map(OS::getValorTotal).orElse(null);
            this.observacoes = osOptional.map(OS::getObservacoes).orElse(null);
            this.dataPo = osOptional.map(OS::getDataPo).orElse(null);

            // Mapeamento dos outros campos (LPU, Prestador, etc.)
            this.lpu = Optional.ofNullable(l.getLpu()).map(lpu -> lpu.getCodigoLpu() + " - " + lpu.getNomeLpu()).orElse(null);
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
        }

        public LocalDate getDataAtividade() {
            return dataAtividade;
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