package br.com.inproutservices.inproutsystem.controllers.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.services.atividades.OsService;
import br.com.inproutservices.inproutsystem.services.index.LpuService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/os")
@CrossOrigin(origins = "*")
public class OsController {

    private final OsService osService;
    private final LpuService lpuService;
    private final LancamentoRepository lancamentoRepository; // <-- INJETAR O REPOSITÓRIO DE LANÇAMENTO

    public OsController(OsService osService, LpuService lpuService, LancamentoRepository lancamentoRepository) {
        this.osService = osService;
        this.lpuService = lpuService;
        this.lancamentoRepository = lancamentoRepository; // <-- ADICIONAR AO CONSTRUTOR
    }

    // ================== MÉTODO ATUALIZADO ==================
    @GetMapping
    public ResponseEntity<List<OsResponseDto>> getAllOs() {
        // 1. Busca a lista de OS como antes
        List<OS> todasAsOs = osService.getAllOs();

        // 2. Transforma a lista de Entidades em uma lista de DTOs ENRIQUECIDOS
        List<OsResponseDto> responseList = todasAsOs.stream().map(os -> {
            // Para cada OS, mapeia seus detalhes para o DTO de detalhe
            List<OsResponseDto.OsLpuDetalheResponseDto> detalhesEnriquecidos = os.getDetalhes().stream().map(detalhe -> {
                // Para cada detalhe, BUSCA o último lançamento
                Lancamento ultimoLancamento = lancamentoRepository
                        .findFirstByOsIdAndLpuIdOrderByIdDesc(os.getId(), detalhe.getLpu().getId())
                        .orElse(null); // Retorna null se não encontrar

                // Cria o DTO de detalhe passando o detalhe E o último lançamento encontrado
                return new OsResponseDto.OsLpuDetalheResponseDto(detalhe, ultimoLancamento);
            }).collect(Collectors.toList());

            // Cria o DTO da OS principal usando o novo construtor que aceita os detalhes já prontos
            return new OsResponseDto(os, detalhesEnriquecidos);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    // O restante dos endpoints não precisa de alteração

    @PostMapping
    public ResponseEntity<OsResponseDto> createOs(@RequestBody OsRequestDto osDto) {
        OS novaOs = osService.createOs(osDto);
        return new ResponseEntity<>(new OsResponseDto(novaOs), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OsResponseDto> getOsById(@PathVariable Long id) {
        OS osEncontrada = osService.getOsById(id);

        // Lógica de enriquecimento para o endpoint de busca única também
        List<OsResponseDto.OsLpuDetalheResponseDto> detalhesEnriquecidos = osEncontrada.getDetalhes().stream().map(detalhe -> {
            Lancamento ultimoLancamento = lancamentoRepository
                    .findFirstByOsIdAndLpuIdOrderByIdDesc(osEncontrada.getId(), detalhe.getLpu().getId())
                    .orElse(null);
            return new OsResponseDto.OsLpuDetalheResponseDto(detalhe, ultimoLancamento);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new OsResponseDto(osEncontrada, detalhesEnriquecidos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OsResponseDto> updateOs(@PathVariable Long id, @RequestBody OsRequestDto osDto) {
        OS osAtualizada = osService.updateOs(id, osDto);
        return ResponseEntity.ok(new OsResponseDto(osAtualizada));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOs(@PathVariable Long id) {
        osService.deleteOs(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoints legados (sem alteração)
    @GetMapping("/por-usuario/{usuarioId}")
    public ResponseEntity<List<OsResponseDto>> getOsPorUsuario(@PathVariable Long usuarioId) {
        List<OS> osDoUsuario = osService.getAllOsByUsuario(usuarioId);
        List<OsResponseDto> responseList = osDoUsuario.stream()
                .map(OsResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
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
}