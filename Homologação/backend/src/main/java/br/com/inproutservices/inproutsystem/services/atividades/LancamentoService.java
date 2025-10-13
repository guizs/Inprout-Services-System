package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.*;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LancamentoService {

    Lancamento rejeitarPeloCoordenador(Long lancamentoId, AcaoCoordenadorDTO dto);

    Lancamento rejeitarPeloController(Long lancamentoId, AcaoControllerDTO dto);

    void aprovarPrazoLotePeloController(List<Long> lancamentoIds, Long controllerId);

    void rejeitarPrazoLotePeloController(List<Long> lancamentoIds, Long controllerId, String motivo, LocalDate novaData);

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

    CpsResponseDTO getRelatorioCps(LocalDate dataInicio, LocalDate dataFim);

    Lancamento alterarValorPago(Long lancamentoId, BigDecimal novoValor);

    void aprovarLotePeloCoordenador(List<Long> lancamentoIds, Long aprovadorId);

    void aprovarLotePeloController(List<Long> lancamentoIds, Long aprovadorId);

    void rejeitarLotePeloCoordenador(List<Long> lancamentoIds, Long aprovadorId, String motivo);
    void rejeitarLotePeloController(List<Long> lancamentoIds, Long controllerId, String motivo);
    void solicitarPrazoLote(List<Long> lancamentoIds, Long coordenadorId, String comentario, LocalDate novaData);

    List<Lancamento> criarLancamentosEmLote(List<LancamentoRequestDTO> dtos);

    Lancamento registrarAdiantamento(Long lancamentoId, BigDecimal valorAdiantamento);

    List<ProgramacaoDiariaDTO> getProgramacaoDiaria(LocalDate dataInicio, LocalDate dataFim);
}