package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoResponseDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.index.ContratoRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import br.com.inproutservices.inproutsystem.repositories.index.SegmentoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OsServiceImpl implements OsService {

    private final OsRepository osRepository;
    private final LpuRepository lpuRepository;
    private final ContratoRepository contratoRepository;
    private final SegmentoRepository segmentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LancamentoRepository lancamentoRepository;

    public OsServiceImpl(OsRepository osRepository, LpuRepository lpuRepository, ContratoRepository contratoRepository, SegmentoRepository segmentoRepository, UsuarioRepository usuarioRepository, LancamentoRepository lancamentoRepository) {
        this.osRepository = osRepository;
        this.lpuRepository = lpuRepository;
        this.contratoRepository = contratoRepository;
        this.segmentoRepository = segmentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.lancamentoRepository = lancamentoRepository;
    }

    @Override
    @Transactional
    public OS createOs(OsRequestDto osDto) {
        // --- INÍCIO DA CORREÇÃO ---
        Optional<OS> osExistenteOpt = osRepository.findByOs(osDto.getOs());

        OS osParaSalvar;

        if (osExistenteOpt.isPresent()) {
            // A OS JÁ EXISTE: Vamos apenas adicionar a nova LPU a ela.
            osParaSalvar = osExistenteOpt.get();

            if (osDto.getLpuIds() != null && !osDto.getLpuIds().isEmpty()) {
                List<Lpu> lpusParaAdicionar = lpuRepository.findAllById(osDto.getLpuIds());
                osParaSalvar.getLpus().addAll(lpusParaAdicionar); // Adiciona as novas LPUs ao conjunto existente
            }
            osParaSalvar.setDataAtualizacao(LocalDateTime.now());
            osParaSalvar.setUsuarioAtualizacao("sistema-import"); // Indica que a atualização veio da importação

        } else {
            // A OS NÃO EXISTE: Criamos uma nova, como antes.
            osParaSalvar = new OS();
            osParaSalvar.setOs(osDto.getOs());
            osParaSalvar.setSite(osDto.getSite());
            osParaSalvar.setContrato(osDto.getContrato());
            osParaSalvar.setProjeto(osDto.getProjeto());
            osParaSalvar.setGestorTim(osDto.getGestorTim());
            osParaSalvar.setRegional(osDto.getRegional());
            osParaSalvar.setLote(osDto.getLote());
            osParaSalvar.setBoq(osDto.getBoq());
            osParaSalvar.setPo(osDto.getPo());
            osParaSalvar.setItem(osDto.getItem());
            osParaSalvar.setObjetoContratado(osDto.getObjetoContratado());
            osParaSalvar.setUnidade(osDto.getUnidade());
            osParaSalvar.setQuantidade(osDto.getQuantidade());
            osParaSalvar.setValorTotal(osDto.getValorTotal());
            osParaSalvar.setObservacoes(osDto.getObservacoes());
            osParaSalvar.setDataPo(osDto.getDataPo());

            if (osDto.getSegmentoId() != null) {
                Segmento segmento = segmentoRepository.findById(osDto.getSegmentoId())
                        .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + osDto.getSegmentoId()));
                osParaSalvar.setSegmento(segmento);
            }

            if (osDto.getLpuIds() != null && !osDto.getLpuIds().isEmpty()) {
                List<Lpu> lpusParaAssociar = lpuRepository.findAllById(osDto.getLpuIds());
                if (lpusParaAssociar.size() != osDto.getLpuIds().size()) {
                    throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos não foram encontradas.");
                }
                osParaSalvar.setLpus(new HashSet<>(lpusParaAssociar));
            }

            osParaSalvar.setDataCriacao(LocalDateTime.now());
            osParaSalvar.setUsuarioCriacao("sistema-import");
            osParaSalvar.setStatusRegistro("ATIVO");
        }

        return osRepository.save(osParaSalvar);
        // --- FIM DA CORREÇÃO ---
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

    // --- MÉTODO ALTERADO ---
    @Override
    @Transactional(readOnly = true)
    public List<OS> getAllOs() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        String userEmail;
        if (principal instanceof UserDetails) {
            userEmail = ((UserDetails) principal).getUsername();
        } else {
            userEmail = principal.toString();
        }

        if ("anonymousUser".equals(userEmail)) {
            return osRepository.findAllWithDetails();
        }

        Usuario usuarioLogado = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuário '" + userEmail + "' não encontrado no banco de dados."));

        Role role = usuarioLogado.getRole();

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            return osRepository.findAllWithDetails();
        }

        if (role == Role.MANAGER || role == Role.COORDINATOR) {
            Set<Segmento> segmentosDoUsuario = usuarioLogado.getSegmentos();
            if (segmentosDoUsuario.isEmpty()) {
                return Collections.emptyList();
            }
            Set<Long> segmentosDoUsuarioIds = segmentosDoUsuario.stream()
                    .map(Segmento::getId)
                    .collect(Collectors.toSet());

            List<OS> todasAsOs = osRepository.findAllWithDetails();

            return todasAsOs.stream()
                    .filter(os -> os.getSegmento() != null && segmentosDoUsuarioIds.contains(os.getSegmento().getId()))
                    .collect(Collectors.toList());
        }

        return Collections.emptyList();
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

    @Override
    @Transactional(readOnly = true)
    public List<LpuComLancamentoDto> getLpusWithLastApprovedLaunch(Long osId) {
        OS os = osRepository.findById(osId)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o id: " + osId));

        return os.getLpus().stream()
                .map(lpu -> {
                    Lancamento ultimoLancamentoEntity = lancamentoRepository
                            .findFirstByOsIdAndLpuIdOrderByIdDesc(osId, lpu.getId())
                            .orElse(null);

                    LancamentoResponseDTO ultimoLancamentoDto = (ultimoLancamentoEntity != null)
                            ? new LancamentoResponseDTO(ultimoLancamentoEntity)
                            : null;

                    LpuResponseDTO lpuDto = new LpuResponseDTO(lpu);

                    return new LpuComLancamentoDto(lpuDto, ultimoLancamentoDto);
                })
                .collect(Collectors.toList());
    }

}