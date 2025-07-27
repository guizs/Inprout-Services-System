package br.com.inproutservices.inproutsystem.controllers.index;

import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.services.index.LpuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Map;

// --- Definição dos DTOs (Data Transfer Objects) ---

// DTO para receber os dados de criação de uma LPU

record LpuCreateDTO(
        String codigoLpu,
        String nomeLpu,
        String unidade,
        BigDecimal valorSemImposto,
        BigDecimal valorComImposto,
        Long contratoId
) {}

// DTO para receber os dados de alteração de uma LPU

record LpuUpdateDTO(
        String codigoLpu, // <- ADICIONE ESTA LINHA
        String nomeLpu,
        String unidade,
        BigDecimal valorSemImposto,
        BigDecimal valorComImposto
) {}

@RestController
@RequestMapping("/lpu")
@CrossOrigin(origins = "*")
public class LpuController {

    private final LpuService lpuService;

    public LpuController(LpuService lpuService) {
        this.lpuService = lpuService;
    }

    /**
     * PONTO-CHAVE: Este é o endpoint de listagem flexível que discutimos.
     * Ele está correto e funcional.
     */
    @GetMapping
    public ResponseEntity<List<Lpu>> listarLpus(
            // 1. Recebe o parâmetro opcional "?ativo=true" ou "?ativo=false"
            @RequestParam(required = false) Boolean ativo
    ) {
        // 2. Chama o método correto no Service, passando o parâmetro (que pode ser true, false ou null)
        List<Lpu> lpus = lpuService.listarLpusPorStatus(ativo);
        return ResponseEntity.ok(lpus);
    }

    // O restante dos seus endpoints está perfeito, não precisa de alterações.

    @GetMapping("/{id}")
    public ResponseEntity<LpuResponseDTO> buscarLpuPorId(@PathVariable Long id) {
        LpuResponseDTO lpuDTO = lpuService.buscarLpuPorIdDTO(id);
        return ResponseEntity.ok(lpuDTO);
    }

    @PostMapping
    public ResponseEntity<Lpu> criarLpu(@RequestBody LpuCreateDTO lpuDTO) {
        Lpu novaLpu = new Lpu();
        novaLpu.setCodigoLpu(lpuDTO.codigoLpu());
        novaLpu.setNomeLpu(lpuDTO.nomeLpu());
        novaLpu.setUnidade(lpuDTO.unidade());
        novaLpu.setValorSemImposto(lpuDTO.valorSemImposto());
        novaLpu.setValorComImposto(lpuDTO.valorComImposto());

        Lpu lpuSalva = lpuService.criarLpu(novaLpu, lpuDTO.contratoId());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(lpuSalva.getId()).toUri();

        return ResponseEntity.created(location).body(lpuSalva);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lpu> alterarLpu(@PathVariable Long id, @RequestBody LpuUpdateDTO lpuDTO) {
        Lpu lpuAtualizada = new Lpu();
        lpuAtualizada.setCodigoLpu(lpuDTO.codigoLpu());
        lpuAtualizada.setNomeLpu(lpuDTO.nomeLpu());
        lpuAtualizada.setUnidade(lpuDTO.unidade());
        lpuAtualizada.setValorSemImposto(lpuDTO.valorSemImposto());
        lpuAtualizada.setValorComImposto(lpuDTO.valorComImposto());

        Lpu lpuSalva = lpuService.alterarLpu(id, lpuAtualizada);
        return ResponseEntity.ok(lpuSalva);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativarLpu(@PathVariable Long id) {
        lpuService.desativarLpu(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Lpu> atualizarParcialmenteLpu(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Lpu lpuAtualizada = lpuService.atualizarParcialmente(id, updates);
        return ResponseEntity.ok(lpuAtualizada);
    }
}