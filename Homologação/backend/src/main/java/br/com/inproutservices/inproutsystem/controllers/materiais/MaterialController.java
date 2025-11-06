package br.com.inproutservices.inproutsystem.controllers.materiais;

import br.com.inproutservices.inproutsystem.dtos.materiais.EntradaMaterialDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.MaterialRequestDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.MaterialResponseDTO;
// --- NOVO IMPORT ---
import br.com.inproutservices.inproutsystem.dtos.materiais.MaterialUpdateDTO;
import br.com.inproutservices.inproutsystem.entities.materiais.Material;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.services.materiais.MaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/materiais")
@CrossOrigin(origins = "*")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    public ResponseEntity<List<MaterialResponseDTO>> listarTodosMateriais() {
        List<MaterialResponseDTO> list = materialService.listarTodos()
                .stream()
                .map(MaterialResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialResponseDTO> buscarMaterialPorId(@PathVariable Long id) {
        MaterialResponseDTO dto = new MaterialResponseDTO(materialService.buscarPorId(id));
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<MaterialResponseDTO> criarMaterial(@RequestBody MaterialRequestDTO dto) {
        Material novoMaterial = materialService.criarMaterial(dto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(novoMaterial.getId()).toUri();
        return ResponseEntity.created(location).body(new MaterialResponseDTO(novoMaterial));
    }

    // --- NOVO ENDPOINT ADICIONADO ---
    @PutMapping("/{id}")
    public ResponseEntity<MaterialResponseDTO> atualizarMaterial(
            @PathVariable Long id,
            @RequestBody MaterialUpdateDTO dto) {
        Material materialAtualizado = materialService.atualizarMaterial(id, dto);
        return ResponseEntity.ok(new MaterialResponseDTO(materialAtualizado));
    }
    // --- FIM DO NOVO ENDPOINT ---

    @PostMapping("/entradas")
    public ResponseEntity<MaterialResponseDTO> adicionarEntrada(@RequestBody EntradaMaterialDTO dto) {
        Material materialAtualizado = materialService.adicionarEntrada(dto);
        return ResponseEntity.ok(new MaterialResponseDTO(materialAtualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarMaterial(@PathVariable Long id) {
        materialService.deletarMaterial(id);
        return ResponseEntity.noContent().build();
    }

    // --- INÍCIO DO NOVO ENDPOINT DE IMPORTAÇÃO ---
    @PostMapping("/importar-legado")
    public ResponseEntity<Map<String, Object>> importarLegadoCMA(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BusinessException("O arquivo está vazio.");
        }

        List<String> log = materialService.importarLegadoCMA(file);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Importação de legado CMA concluída.");
        response.put("log", log);

        return ResponseEntity.ok(response);
    }

}