package br.com.inproutservices.inproutsystem.services.index;

import br.com.inproutservices.inproutsystem.dtos.index.EtapaDTO;
import br.com.inproutservices.inproutsystem.dtos.index.EtapaDetalhadaDTO;
import br.com.inproutservices.inproutsystem.entities.index.Etapa;
import br.com.inproutservices.inproutsystem.repositories.index.EtapaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EtapaService {

    @Autowired
    private EtapaRepository etapaRepository;

    public Etapa criarEtapa(Etapa etapa) {
        String codigo = etapa.getCodigo();
        String descricao = etapa.getDescricao();

        if (codigo != null && descricao != null) {
            String prefixoEsperado = codigo + " - ";
            if (!descricao.startsWith(prefixoEsperado)) {
                etapa.setDescricao(prefixoEsperado + descricao);
            }
        }

        return etapaRepository.save(etapa);
    }

    public List<Etapa> listarTodasEtapas() {
        return etapaRepository.findAll();
    }

    /**
     * MÉTODO ATUALIZADO
     * Agora passa o ID da etapa ao criar o EtapaDTO.
     */
    public List<EtapaDTO> listarEtapasComDetalhes() {
        List<Etapa> etapas = etapaRepository.buscarComDetalhadasOrdenadas();

        return etapas.stream().map(etapa ->
                new EtapaDTO(
                        etapa.getId(), // <-- AQUI ESTÁ A MUDANÇA
                        etapa.getCodigo(),
                        etapa.getNome(),
                        etapa.getEtapasDetalhadas().stream()
                                .map(d -> new EtapaDetalhadaDTO(
                                        d.getId(),
                                        d.getIndice(),
                                        d.getNome(),
                                        d.getStatus()
                                )).collect(Collectors.toList())
                )
        ).collect(Collectors.toList());
    }
}