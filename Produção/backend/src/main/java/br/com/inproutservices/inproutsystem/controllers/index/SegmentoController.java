package br.com.inproutservices.inproutsystem.controllers.index;

import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.services.index.SegmentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/segmentos")
@CrossOrigin(origins = "*")
public class SegmentoController {

    private final SegmentoService segmentoService;

    public SegmentoController(SegmentoService segmentoService) {
        this.segmentoService = segmentoService;
    }

    @PostMapping
    public ResponseEntity<Segmento> criarSegmento(@RequestBody Segmento segmento) {
        Segmento novoSegmento = segmentoService.criarSegmento(segmento);
        return ResponseEntity.ok(novoSegmento);
    }

    @GetMapping
    public ResponseEntity<List<Segmento>> listarSegmentos() {
        List<Segmento> segmentos = segmentoService.listarTodos();
        return ResponseEntity.ok(segmentos);
    }
}