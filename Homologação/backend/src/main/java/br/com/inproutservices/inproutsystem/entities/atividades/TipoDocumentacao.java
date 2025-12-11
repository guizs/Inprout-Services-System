package br.com.inproutservices.inproutsystem.entities.atividades;

import jakarta.persistence.*;

@Entity
@Table(name = "tipo_documentacao")
public class TipoDocumentacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    public TipoDocumentacao() {}
    public TipoDocumentacao(String nome) { this.nome = nome; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }


}