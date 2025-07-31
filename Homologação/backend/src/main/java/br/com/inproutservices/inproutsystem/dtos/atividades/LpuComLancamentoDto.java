package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO; // Importe o DTO
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;

public class LpuComLancamentoDto {

    private LpuResponseDTO lpu; // Alterado de Lpu para LpuResponseDTO
    private LancamentoResponseDTO ultimoLancamento;

    public LpuComLancamentoDto() {
    }

    // O construtor agora receberá o DTO
    public LpuComLancamentoDto(LpuResponseDTO lpu, LancamentoResponseDTO ultimoLancamento) {
        this.lpu = lpu;
        this.ultimoLancamento = ultimoLancamento;
    }

    // Getters e Setters atualizados
    public LpuResponseDTO getLpu() {
        return lpu;
    }

    public void setLpu(LpuResponseDTO lpu) {
        this.lpu = lpu;
    }

    public LancamentoResponseDTO getUltimoLancamento() {
        return ultimoLancamento;
    }

    public void setUltimoLancamento(LancamentoResponseDTO ultimoLancamento) {
        this.ultimoLancamento = ultimoLancamento;
    }
}