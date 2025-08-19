package br.com.inproutservices.inproutsystem.services.index;

import br.com.inproutservices.inproutsystem.dtos.index.EtapaDetalhadaUpdateDTO;
import br.com.inproutservices.inproutsystem.entities.index.Etapa;
import br.com.inproutservices.inproutsystem.entities.index.EtapaDetalhada;
import br.com.inproutservices.inproutsystem.repositories.index.EtapaDetalhadaRepository;
import br.com.inproutservices.inproutsystem.repositories.index.EtapaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Importe esta anotação

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EtapaDetalhadaService {

    private final EtapaDetalhadaRepository etapaDetalhadaRepository;
    private final EtapaRepository etapaRepository;

    public EtapaDetalhadaService(EtapaDetalhadaRepository etapaDetalhadaRepository, EtapaRepository etapaRepository) {
        this.etapaDetalhadaRepository = etapaDetalhadaRepository;
        this.etapaRepository = etapaRepository;
    }

    /**
     * Método SIMPLIFICADO apenas para criar UMA nova EtapaDetalhada.
     * Usado pelo endpoint POST.
     */
    @Transactional
    public EtapaDetalhada salvarEtapaDetalhadaPorCodigo(EtapaDetalhada detalhe, String codigo) {
        Etapa etapa = etapaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Etapa não encontrada com código: " + codigo));

        // Lógica para gerar o novo índice corretamente para um único item
        long quantidadeAtual = etapa.getEtapasDetalhadas().size();
        String novoIndice = String.format("%s.%02d", codigo, quantidadeAtual + 1);

        detalhe.setIndice(novoIndice);
        detalhe.setEtapa(etapa);

        return etapaDetalhadaRepository.save(detalhe);
    }

    /**
     * Método CORRIGIDO para atualizar um lote de Etapas Detalhadas.
     * Usado pelo endpoint PUT /lote.
     */
    // Dentro do arquivo EtapaDetalhadaService.java

    @Transactional
    public List<EtapaDetalhada> atualizarLote(String codigoEtapa, List<EtapaDetalhadaUpdateDTO> dtos) { // <-- MUDANÇA AQUI
        // ... busca da etapa pai (continua igual)

        List<EtapaDetalhada> resultado = new ArrayList<>();

        for (EtapaDetalhadaUpdateDTO dto : dtos) { // <-- MUDANÇA AQUI
            if (dto.getId() != null) {
                Optional<EtapaDetalhada> existenteOpt = etapaDetalhadaRepository.findById(dto.getId());

                if (existenteOpt.isPresent()) {
                    EtapaDetalhada existente = existenteOpt.get();

                    existente.setIndice(dto.getIndice()); // <-- MUDANÇA AQUI
                    existente.setNome(dto.getNome());     // <-- MUDANÇA AQUI

                    existente.getStatus().clear();
                    existente.getStatus().addAll(dto.getStatus()); // <-- MUDANÇA AQUI

                    resultado.add(etapaDetalhadaRepository.save(existente));
                }
            }
        }
        return resultado;
    }

    // Métodos restantes não precisam de alteração...
    public Optional<Etapa> buscarEtapaPorCodigo(String codigo) {
        return etapaRepository.findByCodigo(codigo);
    }

    public EtapaDetalhada salvarSemGerarIndice(EtapaDetalhada detalhe) {
        return etapaDetalhadaRepository.save(detalhe);
    }
}