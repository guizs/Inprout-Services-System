package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.*;
import br.com.inproutservices.inproutsystem.dtos.documentacao.CarteiraDocumentistaDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LancamentoService {

    Lancamento rejeitarPeloCoordenador(Long lancamentoId, AcaoCoordenadorDTO dto);

    Lancamento rejeitarPeloController(Long lancamentoId, AcaoControllerDTO dto);

    void aprovarPrazoLotePeloController(List<Long> lancamentoIds, Long controllerId);

    void rejeitarPrazoLotePeloController(List<Long> lancamentoIds, Long controllerId, String motivo, LocalDate novaData);

    List<Lancamento> listarPendentesPorUsuario(Long usuarioId);

    // --- ATUALIZADO: Agora aceita datas para o filtro ---
    List<Lancamento> getHistoricoPorUsuario(Long usuarioId, LocalDate inicio, LocalDate fim);

    Lancamento atualizarLancamento(Long id, LancamentoRequestDTO dto);

    Lancamento reenviarParaAprovacao(Long lancamentoId, Long managerId);

    Lancamento salvarComoRascunho(Long id, LancamentoRequestDTO dto);

    Lancamento criarLancamento(LancamentoRequestDTO dto, Long managerId);

    Lancamento submeterLancamentoManualmente(Long lancamentoId, Long managerId);

    void submeterLancamentosDiarios();

    Lancamento aprovarPeloCoordenador(Long lancamentoId, Long coordenadorId);

    Lancamento solicitarNovoPrazo(Long lancamentoId, AcaoCoordenadorDTO dto);

    Lancamento aprovarPeloController(Long lancamentoId, Long controllerId);

    Lancamento aprovarExtensaoPrazo(Long lancamentoId, Long controllerId);

    Lancamento rejeitarExtensaoPrazo(Long lancamentoId, AcaoControllerDTO dto);

    Lancamento getLancamentoById(Long id);

    List<Lancamento> getAllLancamentos(LocalDate inicio, LocalDate fim);

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

    void deletarLancamento(Long id);
    List<PendenciasPorCoordenadorDTO> getPendenciasPorCoordenador();
    List<String> importarLegadoCps(MultipartFile file) throws IOException;

    Lancamento solicitarAdiantamentoCoordenador(Long lancamentoId, Long coordenadorId, BigDecimal valor, String justificativa);

    Lancamento finalizarDocumentacao(Long lancamentoId, String assuntoEmail);

    Lancamento receberDocumentacao(Long lancamentoId, Long usuarioId, String comentario);

    void adicionarComentario(Long lancamentoId, Long usuarioId, String texto);

    void receberDocumentacaoEmLote(List<Long> ids, Long usuarioId, String comentario);

    CarteiraDocumentistaDTO getCarteiraDocumentista(Long usuarioId, LocalDate inicio, LocalDate fim);
}