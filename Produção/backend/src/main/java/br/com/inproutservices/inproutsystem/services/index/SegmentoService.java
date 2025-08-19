package br.com.inproutservices.inproutsystem.services.index;

import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.repositories.index.SegmentoRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SegmentoService {

    private final SegmentoRepository segmentoRepository;

    public SegmentoService(SegmentoRepository segmentoRepository) {
        this.segmentoRepository = segmentoRepository;
    }

    public Segmento criarSegmento(Segmento segmento) {
        return segmentoRepository.save(segmento);
    }

    public List<Segmento> listarTodos() {
        return segmentoRepository.findAll();
    }
}