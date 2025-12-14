package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "tipo_documentacao")
public class TipoDocumentacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nome;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "tipo_documentacao_usuario",
            joinColumns = @JoinColumn(name = "tipo_documentacao_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )

    @JsonIgnoreProperties({"tiposDocumentacao", "senha", "roles"})
    private List<Usuario> documentistas;

    public TipoDocumentacao() {}
    public TipoDocumentacao(String nome) { this.nome = nome; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public List<Usuario> getDocumentistas() {
        return documentistas;
    }

    public void setDocumentistas(List<Usuario> documentistas) {
        this.documentistas = documentistas;
    }
}