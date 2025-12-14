package br.com.inproutservices.inproutsystem.controllers.geral;

import br.com.inproutservices.inproutsystem.entities.geral.Banco;
import br.com.inproutservices.inproutsystem.repositories.geral.BancoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/geral/bancos")
@CrossOrigin(origins = "*")
public class BancoController {

    @Autowired
    private BancoRepository bancoRepository;

    @GetMapping
    public ResponseEntity<List<Banco>> listar() {
        return ResponseEntity.ok(bancoRepository.findAllByOrderByNomeAsc());
    }

    @PostMapping
    public ResponseEntity<Banco> salvar(@RequestBody Banco banco) {
        return ResponseEntity.ok(bancoRepository.save(banco));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        bancoRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}