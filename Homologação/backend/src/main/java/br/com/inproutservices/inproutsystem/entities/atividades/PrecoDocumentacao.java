package br.com.inproutservices.inproutsystem.entities.atividades;

import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "precos_documentacao", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"documentista_id", "tipo_documentacao_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrecoDocumentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documentista_id", nullable = false)
    private Usuario documentista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_documentacao_id", nullable = false)
    private TipoDocumentacao tipoDocumentacao;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal valor;
}