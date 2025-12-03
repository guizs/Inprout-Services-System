package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.*;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.services.atividades.OsService;
import br.com.inproutservices.inproutsystem.services.index.LpuService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/os")
@CrossOrigin(origins = "*")
public class OsController {

    private final OsService osService;
    private final LpuService lpuService;

    public OsController(OsService osService, LpuService lpuService) {
        this.osService = osService;
        this.lpuService = lpuService;
    }

    @GetMapping
    public ResponseEntity<Page<OsResponseDto>> getAllOs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size, // Carrega só 10 de início
            @RequestParam(defaultValue = "false") boolean completo // Flag para carregar tudo
    ) {
        if (completo) {
            // Se a flag 'completo' for true, traz uma página gigante (hack para trazer tudo)
            // Ou crie um método específico no service para findAllList
            return ResponseEntity.ok(osService.findAllWithDetails(PageRequest.of(0, Integer.MAX_VALUE)));
        }
        return ResponseEntity.ok(osService.findAllWithDetails(PageRequest.of(page, size)));
    }

    @PatchMapping("/{id}/gestor-tim")
    public ResponseEntity<OS> atualizarGestorTim(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String novoGestorTim = payload.get("gestorTim");
        if (novoGestorTim == null) {
            return ResponseEntity.badRequest().build();
        }
        OS osAtualizada = osService.atualizarGestorTim(id, novoGestorTim);
        return ResponseEntity.ok(osAtualizada);
    }

    @GetMapping("/por-usuario/{usuarioId}")
    public ResponseEntity<List<OsResponseDto>> getOsPorUsuario(@PathVariable Long usuarioId) {
        List<OS> osDoUsuario = osService.getAllOsByUsuario(usuarioId);
        List<OsResponseDto> responseList = osDoUsuario.stream()
                .map(OsResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
    }

    @PostMapping
    public ResponseEntity<OS> createOs(@RequestBody OsRequestDto osDto) {
        OS novaOs = osService.createOs(osDto).getOs();
        return new ResponseEntity<>(novaOs, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OsResponseDto> getOsById(@PathVariable Long id) {
        OS osEncontrada = osService.getOsById(id);
        return ResponseEntity.ok(new OsResponseDto(osEncontrada));
    }

    @GetMapping
    public ResponseEntity<List<OsResponseDto>> getAllOs() {
        List<OS> oss = osService.findAllWithDetails();
        List<OsResponseDto> dtos = oss.stream()
                .map(OsResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/importar-linha")
    public ResponseEntity<String> importarLinhaOs(@RequestBody Map<String, Object> rowData) {
        try {
            osService.processarLinhaDePlanilha(rowData);
            return ResponseEntity.ok("Linha processada com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro inesperado ao processar a linha: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<OS> updateOs(@PathVariable Long id, @RequestBody OsRequestDto osDto) {
        OS osAtualizada = osService.updateOs(id, osDto);
        return ResponseEntity.ok(osAtualizada);
    }

    @PostMapping("/importar-lote")
    public ResponseEntity<List<String>> importarLote(@RequestBody List<Map<String, Object>> lote) {
        try {
            List<String> erros = osService.processarLoteDePlanilha(lote);
            if (erros.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            } else {
                return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(erros);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonList("Erro inesperado no servidor: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOs(@PathVariable Long id) {
        osService.deleteOs(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{osId}/lpus")
    public ResponseEntity<List<LpuResponseDTO>> getLpusPorOs(@PathVariable Long osId) {
        List<LpuResponseDTO> lpus = lpuService.findLpusByOsId(osId);
        return ResponseEntity.ok(lpus);
    }

    @GetMapping("/{osId}/lpu-lancamentos")
    public ResponseEntity<List<LpuComLancamentoDto>> getLpusWithLastLaunch(@PathVariable Long osId) {
        List<LpuComLancamentoDto> data = osService.getLpusWithLastApprovedLaunch(osId);
        return ResponseEntity.ok(data);
    }

    // --- VERSÃO ÚNICA E CORRIGIDA DO MÉTODO DE IMPORTAÇÃO ---
    @PostMapping("/importar")
    public ResponseEntity<ImportResponseDTO> importarOs(@RequestParam("file") MultipartFile file, @RequestParam(name = "legado", defaultValue = "false") boolean isLegado) {
        if (file.isEmpty()) {
            throw new BusinessException("Por favor, envie um arquivo!");
        }
        try {
            List<String> warnings = new ArrayList<>();
            List<OS> updatedOses = osService.importarOsDePlanilha(file, isLegado, warnings);

            List<OsResponseDto> dtos = updatedOses.stream()
                    .map(OsResponseDto::new)
                    .collect(Collectors.toList());

            ImportResponseDTO response = new ImportResponseDTO(dtos, warnings);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            throw new BusinessException("Falha ao processar o arquivo. Pode estar corrompido.");
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    @GetMapping("/por-projeto/{projeto}")
    public ResponseEntity<List<OsResponseDto>> getOsPorProjeto(@PathVariable String projeto) {
        List<OS> osDoProjeto = osService.getOsByProjeto(projeto);
        List<OsResponseDto> responseList = osDoProjeto.stream()
                .map(OsResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
    }

    @DeleteMapping("/detalhe/{id}")
    public ResponseEntity<Void> desativarDetalhe(@PathVariable Long id) {
        osService.desativarDetalhe(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/detalhe/{id}/key")
    public ResponseEntity<OsLpuDetalhe> atualizarChaveExterna(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String novaChave = payload.get("key");
        OsLpuDetalhe detalheAtualizado = osService.atualizarChaveExterna(id, novaChave);
        return ResponseEntity.ok(detalheAtualizado);
    }

    @PatchMapping("/detalhe/{id}/segmento")
    public ResponseEntity<Void> atualizarSegmento(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Long novoSegmentoId = payload.get("novoSegmentoId");
        if (novoSegmentoId == null) {
            return ResponseEntity.badRequest().build();
        }
        osService.atualizarSegmentoDaOs(id, novoSegmentoId);
        return ResponseEntity.ok().build();
    }
}