package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhes;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "os")
public class OS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String os;

    // Relacionamentos que permanecem na OS
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segmento_id")
    private Segmento segmento;
    private String projeto;
    private String gestorTim;

    // NOVO RELACIONAMENTO: Uma OS agora tem uma lista de detalhes (um para cada LPU)
    @OneToMany(mappedBy = "os", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JsonManagedReference
    private List<OsLpuDetalhes> detalhes = new ArrayList<>();


    // CAMPOS DE AUDITORIA (permanecem na OS)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy HH:mm:ss")
    private LocalDateTime dataCriacao;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy HH:mm:ss")
    private LocalDateTime dataAtualizacao;
    private String usuarioCriacao;
    private String usuarioAtualizacao;
    private String statusRegistro;

    @Column(name = "custo_total_materiais", precision = 10, scale = 2)
    private BigDecimal custoTotalMateriais;

    @JsonIgnore
    @OneToMany(mappedBy = "os", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private List<Lancamento> lancamentos;

    private BigDecimal valorTotal;

    public Long getId() {
        return id;
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

    public List<OsLpuDetalhes> getDetalhes() {
        return detalhes;
    }

    public void setDetalhes(List<OsLpuDetalhes> detalhes) {
        this.detalhes = detalhes;
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

    public BigDecimal getCustoTotalMateriais() {
        return custoTotalMateriais;
    }

    public void setCustoTotalMateriais(BigDecimal custoTotalMateriais) {
        this.custoTotalMateriais = custoTotalMateriais;
    }

    public List<Lancamento> getLancamentos() {
        return lancamentos;
    }

    public void setLancamentos(List<Lancamento> lancamentos) {
        this.lancamentos = lancamentos;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }
}