package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.index.ContratoRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import br.com.inproutservices.inproutsystem.repositories.index.SegmentoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class OsServiceImpl implements OsService {

    private final OsRepository osRepository;
    private final LpuRepository lpuRepository;
    private final ContratoRepository contratoRepository;
    private final SegmentoRepository segmentoRepository;
    private final UsuarioRepository usuarioRepository;

    public OsServiceImpl(OsRepository osRepository, LpuRepository lpuRepository, ContratoRepository contratoRepository, SegmentoRepository segmentoRepository, UsuarioRepository usuarioRepository) {
        this.osRepository = osRepository;
        this.lpuRepository = lpuRepository;
        this.contratoRepository = contratoRepository;
        this.segmentoRepository = segmentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional
    public OS createOs(OsRequestDto osDto) {
        // 1. Cria a nova entidade OS e preenche os dados simples do DTO
        OS novaOs = new OS();
        novaOs.setOs(osDto.getOs());
        novaOs.setSite(osDto.getSite());
        novaOs.setContrato(osDto.getContrato());
        novaOs.setProjeto(osDto.getProjeto());
        novaOs.setGestorTim(osDto.getGestorTim());
        novaOs.setRegional(osDto.getRegional());
        novaOs.setLote(osDto.getLote());
        novaOs.setBoq(osDto.getBoq());
        novaOs.setPo(osDto.getPo());
        novaOs.setItem(osDto.getItem());
        novaOs.setObjetoContratado(osDto.getObjetoContratado());
        novaOs.setUnidade(osDto.getUnidade());
        novaOs.setQuantidade(osDto.getQuantidade());
        novaOs.setValorTotal(osDto.getValorTotal());
        novaOs.setObservacoes(osDto.getObservacoes());
        novaOs.setDataPo(osDto.getDataPo());

        if (osDto.getSegmentoId() != null) {
            Segmento segmento = segmentoRepository.findById(osDto.getSegmentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + osDto.getSegmentoId()));
            novaOs.setSegmento(segmento);
        }

        // 2. Associa a coleção de LPUs selecionadas
        if (osDto.getLpuIds() != null && !osDto.getLpuIds().isEmpty()) {
            List<Lpu> lpusParaAssociar = lpuRepository.findAllById(osDto.getLpuIds());
            if (lpusParaAssociar.size() != osDto.getLpuIds().size()) {
                throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos não foram encontradas.");
            }
            novaOs.setLpus(new HashSet<>(lpusParaAssociar));
        }

        // 3. Define os campos de auditoria
        novaOs.setDataCriacao(LocalDateTime.now());
        novaOs.setUsuarioCriacao("sistema");
        novaOs.setStatusRegistro("ATIVO");

        // 4. Salva a OS
        return osRepository.save(novaOs);
    }

    @Override
    @Transactional(readOnly = true)
    public OS getOsById(Long id) {
        return osRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OS> getAllOsByUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado com o ID: " + usuarioId));

        Set<Segmento> segmentosDoUsuario = usuario.getSegmentos();

        if (segmentosDoUsuario.isEmpty()) {
            return Collections.emptyList(); // Retorna lista vazia se o usuário não tiver segmentos
        }

        return osRepository.findAllBySegmentoIn(segmentosDoUsuario);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OS> getAllOs() {
        return osRepository.findAllWithDetails();
    }

    @Override
    @Transactional
    public OS updateOs(Long id, OsRequestDto osDto) {
        // 1. Busca a OS existente
        OS existingOs = getOsById(id);

        // 2. Atualiza os campos simples
        existingOs.setOs(osDto.getOs());
        existingOs.setSite(osDto.getSite());
        existingOs.setContrato(osDto.getContrato());
        existingOs.setProjeto(osDto.getProjeto());
        existingOs.setGestorTim(osDto.getGestorTim());
        existingOs.setRegional(osDto.getRegional());
        existingOs.setLote(osDto.getLote());
        existingOs.setBoq(osDto.getBoq());
        existingOs.setPo(osDto.getPo());
        existingOs.setItem(osDto.getItem());
        existingOs.setObjetoContratado(osDto.getObjetoContratado());
        existingOs.setUnidade(osDto.getUnidade());
        existingOs.setQuantidade(osDto.getQuantidade());
        existingOs.setValorTotal(osDto.getValorTotal());
        existingOs.setObservacoes(osDto.getObservacoes());
        existingOs.setDataPo(osDto.getDataPo());

        if (osDto.getSegmentoId() != null) {
            Segmento segmento = segmentoRepository.findById(osDto.getSegmentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + osDto.getSegmentoId()));
            existingOs.setSegmento(segmento);
        }

        // 3. Atualiza a lista de LPUs associadas
        if (osDto.getLpuIds() != null) {
            List<Lpu> novasLpus = lpuRepository.findAllById(osDto.getLpuIds());
            if (novasLpus.size() != osDto.getLpuIds().size()) {
                throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos para atualização não foram encontradas.");
            }
            existingOs.setLpus(new HashSet<>(novasLpus));
        }

        // 4. Define os campos de auditoria
        existingOs.setDataAtualizacao(LocalDateTime.now());
        existingOs.setUsuarioAtualizacao("sistema");

        return osRepository.save(existingOs);
    }


    @Override
    @Transactional
    public void deleteOs(Long id) {
        if (!osRepository.existsById(id)) {
            throw new EntityNotFoundException("OS não encontrada com o ID: " + id);
        }
        osRepository.deleteById(id);
    }

}