package br.com.inproutservices.inproutsystem.entities.index;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "segmentos")
public class Segmento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String nome;

    // Relacionamento com Usuario será mapeado na entidade Usuario
    @JsonIgnore
    @ManyToMany(mappedBy = "segmentos")
    private Set<br.com.inproutservices.inproutsystem.entities.usuario.Usuario> usuarios = new HashSet<>();

    public Segmento() {
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Set<br.com.inproutservices.inproutsystem.entities.usuario.Usuario> getUsuarios() {
        return usuarios;
    }

    public void setUsuarios(Set<br.com.inproutservices.inproutsystem.entities.usuario.Usuario> usuarios) {
        this.usuarios = usuarios;
    }
}