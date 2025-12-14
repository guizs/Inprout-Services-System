package br.com.inproutservices.inproutsystem.entities.geral;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "tb_bancos")
public class Banco {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String nome;
}