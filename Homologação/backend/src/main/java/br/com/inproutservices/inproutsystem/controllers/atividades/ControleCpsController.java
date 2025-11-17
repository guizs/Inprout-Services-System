package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.ControleCpsDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.services.atividades.ControleCpsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/controle-cps")
@CrossOrigin(origins = "*")
public class ControleCpsController {

    private final ControleCpsService controleCpsService;

    public ControleCpsController(ControleCpsService controleCpsService) {
        this.controleCpsService = controleCpsService;
    }

    /**
     * Retorna a fila de pendências de pagamento (EM_ABERTO, FECHADO, ALTERACAO_SOLICITADA).
     */
    @GetMapping
    public ResponseEntity<List<LancamentoResponseDTO>> getFilaControleCps(@RequestHeader("X-User-ID") Long usuarioId) {
        List<Lancamento> fila = controleCpsService.getFilaControleCps(usuarioId);
        // Usamos o construtor do LancamentoResponseDTO, pois ele já é completo
        List<LancamentoResponseDTO> dtos = fila.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Retorna o histórico de pagamentos (PAGO, RECUSADO).
     */
    @GetMapping("/historico")
    public ResponseEntity<List<LancamentoResponseDTO>> getHistoricoControleCps(@RequestHeader("X-User-ID") Long usuarioId) {
        List<Lancamento> historico = controleCpsService.getHistoricoControleCps(usuarioId);
        List<LancamentoResponseDTO> dtos = historico.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Ação do Coordenador: Fecha um lançamento para pagamento.
     */
    @PostMapping("/fechar")
    public ResponseEntity<LancamentoResponseDTO> fecharParaPagamento(@Valid @RequestBody ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Lancamento lancamento = controleCpsService.fecharParaPagamento(dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    /**
     * Ação do Coordenador: Recusa um pagamento.
     */
    @PostMapping("/recusar")
    public ResponseEntity<LancamentoResponseDTO> recusarPagamento(@Valid @RequestBody ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Lancamento lancamento = controleCpsService.recusarPagamento(dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    /**
     * Ação do Coordenador: Solicita alteração em um item já FECHADO.
     */
    @PostMapping("/solicitar-alteracao")
    public ResponseEntity<LancamentoResponseDTO> solicitarAlteracao(@Valid @RequestBody ControleCpsDTO.AcaoCoordenadorDTO dto) {
        Lancamento lancamento = controleCpsService.solicitarAlteracao(dto);
        return ResponseEntity.ok(new LancamentoResponseDTO(lancamento));
    }

    /**
     * Ação do Controller: Marca um ou mais lançamentos como PAGOS.
     */
    @PostMapping("/pagar-lote")
    public ResponseEntity<List<LancamentoResponseDTO>> marcarComoPago(@Valid @RequestBody ControleCpsDTO.AcaoControllerDTO dto) {
        List<Lancamento> lancamentos = controleCpsService.marcarComoPago(dto);
        List<LancamentoResponseDTO> dtos = lancamentos.stream()
                .map(LancamentoResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}