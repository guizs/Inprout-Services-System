package br.com.inproutservices.inproutsystem.entities.index;

import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "etapa_detalhada")
public class EtapaDetalhada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @ElementCollection(targetClass = StatusEtapa.class)
    @CollectionTable(name = "etapa_detalhada_status", joinColumns = @JoinColumn(name = "etapa_detalhada_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private List<StatusEtapa> status = new ArrayList<>();


    private String indice;

    @ManyToOne
    @JoinColumn(name = "etapa_id")
    @JsonBackReference
    private Etapa etapa;

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

    public List<StatusEtapa> getStatus() {
        return status;
    }

    public void setStatus(List<StatusEtapa> status) {
        this.status = status;
    }

    public Etapa getEtapa() {
        return etapa;
    }

    public void setEtapa(Etapa etapa) {
        this.etapa = etapa;
    }

    public String getIndice() {
        return indice;
    }

    public void setIndice(String indice) {
        this.indice = indice;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        EtapaDetalhada that = (EtapaDetalhada) o;

        return id != null ? id.equals(that.id) : that.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}