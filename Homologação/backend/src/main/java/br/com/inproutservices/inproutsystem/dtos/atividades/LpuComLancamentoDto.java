package br.com.inproutservices.inproutsystem.dtos.atividades;

import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;

// Sem anotações do Lombok
public class LpuComLancamentoDto {

    private Lpu lpu;
    private LancamentoResponseDTO ultimoLancamento;

    // 1. Construtor padrão (sem argumentos)
    public LpuComLancamentoDto() {
    }

    // 2. Construtor com todos os argumentos
    public LpuComLancamentoDto(Lpu lpu, LancamentoResponseDTO ultimoLancamento) {
        this.lpu = lpu;
        this.ultimoLancamento = ultimoLancamento;
    }

    // 3. Getters e Setters para todos os campos
    public Lpu getLpu() {
        return lpu;
    }

    public void setLpu(Lpu lpu) {
        this.lpu = lpu;
    }

    public LancamentoResponseDTO getUltimoLancamento() {
        return ultimoLancamento;
    }

    public void setUltimoLancamento(LancamentoResponseDTO ultimoLancamento) {
        this.ultimoLancamento = ultimoLancamento;
    }
}