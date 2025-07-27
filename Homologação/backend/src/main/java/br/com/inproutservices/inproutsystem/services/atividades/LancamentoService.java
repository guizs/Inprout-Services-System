package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.AcaoControllerDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.AcaoCoordenadorDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoRequestDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;

import java.util.List;

public interface LancamentoService {

    Lancamento rejeitarPeloCoordenador(Long lancamentoId, AcaoCoordenadorDTO dto);

    Lancamento rejeitarPeloController(Long lancamentoId, AcaoControllerDTO dto);

    List<Lancamento> listarPendentesPorUsuario(Long usuarioId);

    List<Lancamento> getHistoricoPorUsuario(Long usuarioId);

    Lancamento atualizarLancamento(Long id, LancamentoRequestDTO dto);

    Lancamento reenviarParaAprovacao(Long lancamentoId, Long managerId);

    Lancamento salvarComoRascunho(Long id, LancamentoRequestDTO dto);

    Lancamento criarLancamento(LancamentoRequestDTO dto, Long managerId);

    Lancamento submeterLancamentoManualmente(Long lancamentoId, Long managerId);

    void submeterLancamentosDiarios();

    Lancamento aprovarPeloCoordenador(Long lancamentoId, Long coordenadorId);

    // Assinatura padronizada para receber o DTO
    Lancamento solicitarNovoPrazo(Long lancamentoId, AcaoCoordenadorDTO dto);

    Lancamento aprovarPeloController(Long lancamentoId, Long controllerId);

    Lancamento aprovarExtensaoPrazo(Long lancamentoId, Long controllerId);

    // Assinatura padronizada para receber o DTO
    Lancamento rejeitarExtensaoPrazo(Long lancamentoId, AcaoControllerDTO dto);

    Lancamento getLancamentoById(Long id);

    List<Lancamento> getAllLancamentos();
}