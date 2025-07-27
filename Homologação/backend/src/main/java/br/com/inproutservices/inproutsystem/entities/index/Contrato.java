    package br.com.inproutservices.inproutsystem.entities.index;

    import com.fasterxml.jackson.annotation.JsonManagedReference;
    import jakarta.persistence.*;
    import java.util.ArrayList;
    import java.util.List;

    @Entity
    @Table(name = "contratos")
    public class Contrato {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "nome_contrato", nullable = false, unique = true)
        private String nome;

        @Column(nullable = false)
        private boolean ativo = true;

        @OneToMany(
                mappedBy = "contrato",
                cascade = CascadeType.ALL,
                orphanRemoval = true
        )
        @JsonManagedReference
        private List<Lpu> lpus = new ArrayList<>();

        public Contrato() {
        }

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

        public List<Lpu> getLpus() {
            return lpus;
        }

        public void setLpus(List<Lpu> lpus) {
            this.lpus = lpus;
        }

        public boolean isAtivo() { // <-- ADICIONE GETTER E SETTER
            return ativo;
        }

        public void setAtivo(boolean ativo) {
            this.ativo = ativo;
        }
    }
