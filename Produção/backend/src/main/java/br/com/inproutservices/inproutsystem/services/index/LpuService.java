package br.com.inproutservices.inproutsystem.services.index;

import br.com.inproutservices.inproutsystem.dtos.index.ContratoSimpleDTO;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.index.ContratoRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LpuService {

    private final LpuRepository lpuRepository;
    private final ContratoRepository contratoRepository;
    private final OsRepository osRepository;

    public LpuService(LpuRepository lpuRepository, ContratoRepository contratoRepository, OsRepository osRepository) {
        this.lpuRepository = lpuRepository;
        this.contratoRepository = contratoRepository;
        this.osRepository = osRepository;
    }

    @Transactional(readOnly = true)
    public List<LpuResponseDTO> findLpusByOsId(Long osId) {
        // 1. Busca a OS completa, que já carrega a lista de detalhes
        OS os = osRepository.findByIdWithDetails(osId)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + osId));

        // 2. Acessa a nova lista 'os.getDetalhes()'
        return os.getDetalhes().stream()
                // 3. Para cada objeto 'detalhe', extrai a entidade 'Lpu'
                .map(detalhe -> detalhe.getLpu())
                // 4. Converte a entidade 'Lpu' para o seu DTO de resposta
                .map(LpuResponseDTO::new)
                // 5. Coleta o resultado em uma lista
                .collect(Collectors.toList());
    }

    // --- O RESTO DO SEU CÓDIGO PERMANECE IGUAL ---
    @Transactional(readOnly = true)
    public List<Lpu> listarLpusPorStatus(Boolean ativo) {
        if (ativo == null) {
            return lpuRepository.findAll();
        }
        // Assumindo que você tenha um método findByAtivo no seu repositório
        return lpuRepository.findByAtivo(ativo);
    }

    @Transactional(readOnly = true)
    public Lpu buscarPorId(Long id) {
        return lpuRepository.findByIdWithContrato(id)
                .orElseThrow(() -> new EntityNotFoundException("LPU não encontrada com o ID: " + id));
    }

    @Transactional(readOnly = true)
    public LpuResponseDTO buscarLpuPorIdDTO(Long id) {
        Lpu lpu = lpuRepository.findByIdWithContrato(id)
                .orElseThrow(() -> new EntityNotFoundException("LPU não encontrada com o ID: " + id));
        return new LpuResponseDTO(lpu);
    }

    @Transactional
    public Lpu criarLpu(Lpu lpu, Long contratoId) {
        lpuRepository.findByCodigoLpuAndContratoId(lpu.getCodigoLpu(), contratoId).ifPresent(l -> {
            throw new IllegalArgumentException(
                    "Já existe uma LPU com o código: " + lpu.getCodigoLpu() + " para este contrato."
            );
        });

        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new EntityNotFoundException("Contrato não encontrado com o ID: " + contratoId));

        lpu.setContrato(contrato);
        lpu.setAtivo(true);

        return lpuRepository.save(lpu);
    }

    @Transactional
    public Lpu alterarLpu(Long id, Lpu lpuAtualizada) {
        Lpu lpuExistente = buscarPorId(id);

        if (lpuAtualizada.getCodigoLpu() != null && !lpuAtualizada.getCodigoLpu().equals(lpuExistente.getCodigoLpu())) {
            lpuRepository.findByCodigoLpuAndContratoId(lpuAtualizada.getCodigoLpu(), lpuExistente.getContrato().getId())
                    .ifPresent(l -> {
                        if (!l.getId().equals(id)) {
                            throw new IllegalArgumentException(
                                    "Já existe outra LPU com o código: " + lpuAtualizada.getCodigoLpu() + " para este contrato."
                            );
                        }
                    });
            lpuExistente.setCodigoLpu(lpuAtualizada.getCodigoLpu());
        }

        lpuExistente.setNomeLpu(lpuAtualizada.getNomeLpu());
        lpuExistente.setUnidade(lpuAtualizada.getUnidade());
        lpuExistente.setValorSemImposto(lpuAtualizada.getValorSemImposto());
        lpuExistente.setValorComImposto(lpuAtualizada.getValorComImposto());

        return lpuRepository.save(lpuExistente);
    }

    @Transactional
    public void desativarLpu(Long id) {
        Lpu lpuParaDesativar = buscarPorId(id);
        lpuParaDesativar.setAtivo(false);
        lpuRepository.save(lpuParaDesativar);
    }

    @Transactional
    public Lpu atualizarParcialmente(Long id, Map<String, Object> updates) {
        Lpu lpuExistente = lpuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LPU não encontrada com o id: " + id));

        updates.forEach((key, value) -> {
            switch (key) {
                case "ativo":
                    lpuExistente.setAtivo((Boolean) value);
                    break;
                case "codigoLpu":
                    lpuExistente.setCodigoLpu((String) value);
                    break;
                case "nomeLpu":
                    lpuExistente.setNomeLpu((String) value);
                    break;
                case "unidade":
                    lpuExistente.setUnidade((String) value);
                    break;
                case "valorSemImposto":
                    lpuExistente.setValorSemImposto(new BigDecimal(value.toString()));
                    break;
                case "valorComImposto":
                    lpuExistente.setValorComImposto(new BigDecimal(value.toString()));
                    break;
            }
        });

        return lpuRepository.save(lpuExistente);
    }
}