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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
    private final LancamentoRepository lancamentoRepository;

    public OsController(OsService osService, LpuService lpuService, LancamentoRepository lancamentoRepository) {
        this.osService = osService;
        this.lpuService = lpuService;
        this.lancamentoRepository = lancamentoRepository;
    }

    @GetMapping
    public ResponseEntity<Page<OsResponseDto>> getAllOs(
            @PageableDefault(page = 0, size = 100) Pageable pageable
    ) {
        Page<OS> osPage = osService.getAllOsPaginado(pageable);

        Page<OsResponseDto> osResponseDtoPage = osPage.map(os -> {
            List<OsResponseDto.OsLpuDetalheResponseDto> detalhesEnriquecidos = os.getDetalhes().stream().map(detalhe -> {
                Lancamento ultimoLancamento = lancamentoRepository
                        .findFirstByOsIdAndLpuIdOrderByIdDesc(os.getId(), detalhe.getLpu().getId())
                        .orElse(null);
                return new OsResponseDto.OsLpuDetalheResponseDto(detalhe, ultimoLancamento);
            }).collect(Collectors.toList());
            return new OsResponseDto(os, detalhesEnriquecidos);
        });

        return ResponseEntity.ok(osResponseDtoPage);
    }
    // =======================================================


    @PostMapping
    public ResponseEntity<OsResponseDto> createOs(@RequestBody OsRequestDto osDto) {
        OS novaOs = osService.createOs(osDto);
        return new ResponseEntity<>(new OsResponseDto(novaOs), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OsResponseDto> getOsById(@PathVariable Long id) {
        OS osEncontrada = osService.getOsById(id);

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