package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsLpuDetalheUpdateDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.services.atividades.OsService;
import br.com.inproutservices.inproutsystem.services.index.LpuService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController // Anotação que combina @Controller e @ResponseBody, ideal para APIs REST
@RequestMapping("/os") // Define o caminho base para todos os endpoints neste controller
@CrossOrigin(origins = "*")
public class OsController {

    private final OsService osService;
    private final LpuService lpuService;

    // Injeção de dependência do serviço via construtor
    public OsController(OsService osService, LpuService lpuService) {
        this.osService = osService;
        this.lpuService = lpuService;
    }

    /**
     * Endpoint para buscar Ordens de Serviço filtradas por usuário.
     * HTTP Method: GET
     * URL: /os/por-usuario/{usuarioId}
     */
    @GetMapping("/por-usuario/{usuarioId}")
    public ResponseEntity<List<OsResponseDto>> getOsPorUsuario(@PathVariable Long usuarioId) {
        List<OS> osDoUsuario = osService.getAllOsByUsuario(usuarioId);
        List<OsResponseDto> responseList = osDoUsuario.stream()
                .map(OsResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
    }

    /**
     * Endpoint para criar uma nova Ordem de Serviço.
     * HTTP Method: POST
     * URL: /api/os
     * Corpo da Requisição: JSON com os dados de OsRequestDto
     */
    @PostMapping
    public ResponseEntity<OS> createOs(@RequestBody OsRequestDto osDto) {
        OS novaOs = osService.createOs(osDto).getOs();
        // Retorna a OS criada com o status HTTP 201 (Created)
        return new ResponseEntity<>(novaOs, HttpStatus.CREATED);
    }

    /**
     * Endpoint para buscar todas as Ordens de Serviço.
     * HTTP Method: GET
     * URL: /api/os
     */
    @GetMapping("/{id}")
    public ResponseEntity<OsResponseDto> getOsById(@PathVariable Long id) {
        OS osEncontrada = osService.getOsById(id);
        // Converte a entidade para o DTO antes de retornar
        return ResponseEntity.ok(new OsResponseDto(osEncontrada));
    }

    /**
     * Endpoint para buscar uma Ordem de Serviço pelo seu ID.
     * HTTP Method: GET
     * URL: /os/{id}
     */
    @GetMapping
    public ResponseEntity<List<OsResponseDto>> getAllOs() {
        List<OS> oss = osService.findAllWithDetails();
        List<OsResponseDto> dtos = oss.stream()
                .map(OsResponseDto::new) // USA O DTO CORRIGIDO
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

    /**
     * Endpoint para atualizar uma Ordem de Serviço existente.
     * HTTP Method: PUT
     * URL: /api/os/{id}
     * Corpo da Requisição: JSON com os novos dados de OsRequestDto
     */
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

    /**
     * Endpoint para deletar uma Ordem de Serviço.
     * HTTP Method: DELETE
     * URL: /api/os/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOs(@PathVariable Long id) {
        osService.deleteOs(id);
        // Retorna uma resposta vazia com status 204 (No Content), indicando sucesso na exclusão
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

    @PostMapping("/importar")
    public ResponseEntity<String> importarOs(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Por favor, envie um arquivo!");
        }
        try {
            osService.importarOsDePlanilha(file);
            return ResponseEntity.ok("Importação concluída com sucesso!");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Falha ao processar o arquivo.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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