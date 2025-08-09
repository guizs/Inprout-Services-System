package br.com.inproutservices.inproutsystem.dtos.index;

import br.com.inproutservices.inproutsystem.enums.index.StatusEtapa;
import java.util.List;

// Este DTO representa os dados que o frontend envia para atualizar.
public class EtapaDetalhadaUpdateDTO {
    private Long id;
    private String indice;
    private String nome;
    private List<StatusEtapa> status;

    // Crie Getters e Setters para todos os campos
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIndice() { return indice; }
    public void setIndice(String indice) { this.indice = indice; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public List<StatusEtapa> getStatus() { return status; }
    public void setStatus(List<StatusEtapa> status) { this.status = status; }
}