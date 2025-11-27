package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusDocumentacao;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "solicitacao_documentacao")
public class SolicitacaoDocumentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne // Um lançamento tem apenas uma solicitação de documentação ativa
    @JoinColumn(name = "lancamento_id", nullable = false, unique = true)
    private Lancamento lancamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante; // Manager

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documentador_id", nullable = false)
    private Usuario documentador; // Quem vai executar

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusDocumentacao status;

    private LocalDateTime dataSolicitacao;
    private LocalDateTime dataUltimaAcao;

    @Column(columnDefinition = "TEXT")
    private String observacao; // Usado para reportar problemas

    @PrePersist
    public void prePersist() {
        this.dataSolicitacao = LocalDateTime.now();
        this.dataUltimaAcao = LocalDateTime.now();
        if (this.status == null) {
            this.status = StatusDocumentacao.PENDENTE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.dataUltimaAcao = LocalDateTime.now();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lancamento getLancamento() { return lancamento; }
    public void setLancamento(Lancamento lancamento) { this.lancamento = lancamento; }
    public Usuario getSolicitante() { return solicitante; }
    public void setSolicitante(Usuario solicitante) { this.solicitante = solicitante; }
    public Usuario getDocumentador() { return documentador; }
    public void setDocumentador(Usuario documentador) { this.documentador = documentador; }
    public StatusDocumentacao getStatus() { return status; }
    public void setStatus(StatusDocumentacao status) { this.status = status; }
    public LocalDateTime getDataSolicitacao() { return dataSolicitacao; }
    public void setDataSolicitacao(LocalDateTime dataSolicitacao) { this.dataSolicitacao = dataSolicitacao; }
    public LocalDateTime getDataUltimaAcao() { return dataUltimaAcao; }
    public void setDataUltimaAcao(LocalDateTime dataUltimaAcao) { this.dataUltimaAcao = dataUltimaAcao; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}