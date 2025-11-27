package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "os")
public class OS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String os;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segmento_id")
    private Segmento segmento;

    private String projeto;
    private String gestorTim;

    @Column(name = "custo_total_materiais", precision = 10, scale = 2)
    private BigDecimal custoTotalMateriais;

    // ----- RELACIONAMENTO CORRETO -----
    @OneToMany(mappedBy = "os", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<OsLpuDetalhe> detalhes = new HashSet<>();

    // ----- CAMPOS DE AUDITORIA -----
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy HH:mm:ss")
    private LocalDateTime dataCriacao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy HH:mm:ss")
    private LocalDateTime dataAtualizacao;

    @Column(name = "valor_cps_legado", precision = 19, scale = 2)
    private BigDecimal valorCpsLegado = BigDecimal.ZERO;

    private String usuarioCriacao;
    private String usuarioAtualizacao;
    private String statusRegistro;

    // ----- CONSTRUTORES (Substituindo o Lombok) -----

    /**
     * Construtor padrão (sem argumentos).
     * Exigido pelo JPA. Substitui o @NoArgsConstructor do Lombok.
     */
    public OS() {
    }

    /**
     * Construtor com todos os argumentos.
     * Substitui o @AllArgsConstructor do Lombok.
     */
    public OS(Long id, String os, Segmento segmento, String projeto, String gestorTim,
              BigDecimal custoTotalMateriais, Set<OsLpuDetalhe> detalhes,
              LocalDateTime dataCriacao, LocalDateTime dataAtualizacao,
              String usuarioCriacao, String usuarioAtualizacao, String statusRegistro) {
        this.id = id;
        this.os = os;
        this.segmento = segmento;
        this.projeto = projeto;
        this.gestorTim = gestorTim;
        this.custoTotalMateriais = custoTotalMateriais;
        this.detalhes = detalhes;
        this.dataCriacao = dataCriacao;
        this.dataAtualizacao = dataAtualizacao;
        this.usuarioCriacao = usuarioCriacao;
        this.usuarioAtualizacao = usuarioAtualizacao;
        this.statusRegistro = statusRegistro;
    }


    // ----- GETTERS E SETTERS -----


    public Set<OsLpuDetalhe> getDetalhes() {
        return detalhes;
    }

    public void setDetalhes(Set<OsLpuDetalhe> detalhes) {
        this.detalhes = detalhes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }
    public Segmento getSegmento() { return segmento; }
    public void setSegmento(Segmento segmento) { this.segmento = segmento; }
    public String getProjeto() { return projeto; }
    public void setProjeto(String projeto) { this.projeto = projeto; }
    public String getGestorTim() { return gestorTim; }
    public void setGestorTim(String gestorTim) { this.gestorTim = gestorTim; }
    public BigDecimal getCustoTotalMateriais() { return custoTotalMateriais; }
    public void setCustoTotalMateriais(BigDecimal custoTotalMateriais) { this.custoTotalMateriais = custoTotalMateriais; }
    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
    public LocalDateTime getDataAtualizacao() { return dataAtualizacao; }
    public void setDataAtualizacao(LocalDateTime dataAtualizacao) { this.dataAtualizacao = dataAtualizacao; }
    public String getUsuarioCriacao() { return usuarioCriacao; }
    public void setUsuarioCriacao(String usuarioCriacao) { this.usuarioCriacao = usuarioCriacao; }
    public String getUsuarioAtualizacao() { return usuarioAtualizacao; }
    public void setUsuarioAtualizacao(String usuarioAtualizacao) { this.usuarioAtualizacao = usuarioAtualizacao; }
    public String getStatusRegistro() { return statusRegistro; }
    public void setStatusRegistro(String statusRegistro) { this.statusRegistro = statusRegistro; }

    public BigDecimal getValorCpsLegado() {
        return valorCpsLegado;
    }

    public void setValorCpsLegado(BigDecimal valorCpsLegado) {
        this.valorCpsLegado = valorCpsLegado;
    }
}