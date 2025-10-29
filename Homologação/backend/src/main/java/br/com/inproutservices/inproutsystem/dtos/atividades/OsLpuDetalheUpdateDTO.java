package br.com.inproutservices.inproutsystem.dtos.atividades;


public class OsLpuDetalheUpdateDTO {
    private String novaChave;
    private Long novoSegmentoId;

    public OsLpuDetalheUpdateDTO() {}

    public String getNovaChave() {
        return novaChave;
    }

    public void setNovaChave(String novaChave) {
        this.novaChave = novaChave;
    }

    public Long getNovoSegmentoId() {
        return novoSegmentoId;
    }

    public void setNovoSegmentoId(Long novoSegmentoId) {
        this.novoSegmentoId = novoSegmentoId;
    }
}