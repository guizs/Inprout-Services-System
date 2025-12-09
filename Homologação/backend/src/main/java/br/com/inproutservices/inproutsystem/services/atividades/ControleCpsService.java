package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ControleCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.DashboardCpsDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ControleCpsService {

    /**
     * Busca a fila de pendências de pagamento (EM_ABERTO, FECHADO, ALTERACAO_SOLICITADA).
     */
    List<Lancamento> getFilaControleCps(Long usuarioId);

    /**
     * Busca o histórico de pagamentos (PAGO, RECUSADO).
     */
    List<Lancamento> getHistoricoControleCps(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId);

    DashboardCpsDTO getDashboard(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId);

    /**
     * Ação do Coordenador: Fecha um lançamento para pagamento, definindo o valor final.
     */
    Lancamento fecharParaPagamento(ControleCpsDTO.AcaoCoordenadorDTO dto);

    /**
     * Ação do Coordenador: Recusa o pagamento de um lançamento.
     */
    Lancamento recusarPagamento(ControleCpsDTO.AcaoCoordenadorDTO dto);

    /**
     * Ação do Coordenador: Solicita alteração de um lançamento já FECHADO.
     */
    Lancamento solicitarAlteracao(ControleCpsDTO.AcaoCoordenadorDTO dto);

    /**
     * Ação do Controller: Marca um ou mais lançamentos como PAGOS.
     */
    List<Lancamento> marcarComoPago(ControleCpsDTO.AcaoControllerDTO dto);

    Lancamento recusarPeloController(ControleCpsDTO.AcaoRecusaControllerDTO dto);

    List<Lancamento> fecharParaPagamentoLote(ControleCpsDTO.AcaoCoordenadorLoteDTO dto);

    List<Lancamento> recusarPagamentoLote(ControleCpsDTO.AcaoRecusaCoordenadorLoteDTO dto);

    List<Lancamento> recusarPeloControllerLote(ControleCpsDTO.AcaoRecusaControllerLoteDTO dto);

    Lancamento solicitarAdiantamento(Long lancamentoId, BigDecimal valor, Long usuarioId);

    Lancamento aprovarAdiantamento(Long lancamentoId, Long controllerId);

    Lancamento recusarAdiantamento(Long lancamentoId, Long controllerId, String motivo);

    byte[] exportarRelatorioExcel(Long usuarioId, LocalDate inicio, LocalDate fim, Long segmentoId, Long gestorId, Long prestadorId);

}

