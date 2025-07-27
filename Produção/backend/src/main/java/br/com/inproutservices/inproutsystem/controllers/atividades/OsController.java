package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.services.atividades.OsService;
import br.com.inproutservices.inproutsystem.services.index.LpuService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
        OS novaOs = osService.createOs(osDto);
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
        List<OS> todasAsOs = osService.getAllOs();
        // Converte a lista de entidades para uma lista de DTOs
        List<OsResponseDto> responseList = todasAsOs.stream()
                .map(OsResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
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

}
