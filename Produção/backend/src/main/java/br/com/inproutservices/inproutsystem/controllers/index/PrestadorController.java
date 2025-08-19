    package br.com.inproutservices.inproutsystem.controllers.index;

    import br.com.inproutservices.inproutsystem.entities.index.Prestador;
    import br.com.inproutservices.inproutsystem.services.index.PrestadorService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @CrossOrigin(origins = "*")
    @RequestMapping("/index/prestadores")
    public class PrestadorController {

        @Autowired
        private PrestadorService prestadorService;

        @GetMapping
        public ResponseEntity<List<Prestador>> listarTodos(
                @RequestParam(name = "search", required = false) String termoDeBusca
        ) {
            List<Prestador> prestadores;

            if (termoDeBusca != null && !termoDeBusca.isEmpty()) {
                prestadores = prestadorService.buscarPorTermo(termoDeBusca);
            } else {
                prestadores = prestadorService.listarTodos();
            }
            return ResponseEntity.ok(prestadores);
        }

        @GetMapping("/ativos")
        public ResponseEntity<List<Prestador>> listarAtivos() {
            return ResponseEntity.ok(prestadorService.listarAtivos());
        }

        @GetMapping("/{id}")
        public ResponseEntity<Prestador> buscarPorId(@PathVariable Long id) {
            return prestadorService.buscarPorId(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        @PostMapping
        public ResponseEntity<Prestador> salvar(@RequestBody Prestador prestador) {
            Prestador novo = prestadorService.salvar(prestador);
            return ResponseEntity.ok(novo);
        }

        @PutMapping("/desativar/{codigo}")
        public ResponseEntity<Void> desativar(@PathVariable String codigo) {
            prestadorService.desativar(codigo);
            return ResponseEntity.ok().build();
        }

        @GetMapping("/desativados")
        public ResponseEntity<List<Prestador>> listarDesativados() {
            List<Prestador> desativados = prestadorService.listarDesativados();
            return ResponseEntity.ok(desativados);
        }

        @PutMapping("/ativar/{codigo}")
        public ResponseEntity<Void> ativar(@PathVariable String codigo) {
            prestadorService.ativar(codigo);
            return ResponseEntity.ok().build();
        }

        @GetMapping("/por-codigo/{codigo}")
        public ResponseEntity<Prestador> buscarPorCodigo(@PathVariable String codigo) {
            return prestadorService.buscarPorCodigo(codigo)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        @PutMapping("/{id}")
        public ResponseEntity<Prestador> atualizar(@PathVariable Long id, @RequestBody Prestador dadosPrestador) {
            Prestador prestadorAtualizado = prestadorService.atualizar(id, dadosPrestador);
            return ResponseEntity.ok(prestadorAtualizado);
        }
    }