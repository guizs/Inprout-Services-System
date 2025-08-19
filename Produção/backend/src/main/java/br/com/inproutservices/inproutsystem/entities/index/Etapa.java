package br.com.inproutservices.inproutsystem.entities.index;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "etapa")
public class Etapa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo;

    private String descricao;

    @OneToMany(mappedBy = "etapa", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("indice ASC")
    @JsonManagedReference
    private List<EtapaDetalhada> etapasDetalhadas = new ArrayList<>();


    @Transient
    @JsonProperty("nome")
    public String getNome() {
        if (descricao != null && descricao.contains(" - ")) {
            return descricao.split(" - ", 2)[1];
        }
        return descricao;
    }

    // ======== GETTERS e SETTERS =========
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public List<EtapaDetalhada> getEtapasDetalhadas() {
        return etapasDetalhadas;
    }

    public void setEtapasDetalhadas(List<EtapaDetalhada> etapasDetalhadas) {
        this.etapasDetalhadas = etapasDetalhadas;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Etapa etapa = (Etapa) o;

        return id != null ? id.equals(etapa.id) : etapa.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}