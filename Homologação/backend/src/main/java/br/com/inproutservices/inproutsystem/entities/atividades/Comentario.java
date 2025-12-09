package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.materiais.Solicitacao;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comentarios_lancamento")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Agora pode ser nulo, pois o comentário pode ser de uma Solicitação
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lancamento_id", nullable = true)
    @JsonIgnore
    private Lancamento lancamento;

    // Novo relacionamento com Solicitação
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitacao_id", nullable = true)
    @JsonIgnore
    private Solicitacao solicitacao;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String texto;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    public Comentario() {
    }

    @PrePersist
    protected void onCreate() {
        this.dataHora = LocalDateTime.now();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lancamento getLancamento() { return lancamento; }
    public void setLancamento(Lancamento lancamento) { this.lancamento = lancamento; }

    public Solicitacao getSolicitacao() { return solicitacao; }
    public void setSolicitacao(Solicitacao solicitacao) { this.solicitacao = solicitacao; }

    public Usuario getAutor() { return autor; }
    public void setAutor(Usuario autor) { this.autor = autor; }

    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
}