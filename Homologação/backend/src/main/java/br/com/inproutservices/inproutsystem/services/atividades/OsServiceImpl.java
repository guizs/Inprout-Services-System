package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoResponseDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.entities.index.*;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsLpuDetalheRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.index.*;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.DataFormatter;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OsServiceImpl implements OsService {

    private final OsRepository osRepository;
    private final LpuRepository lpuRepository;
    private final ContratoRepository contratoRepository;
    private final SegmentoRepository segmentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LancamentoRepository lancamentoRepository;
    private final OsLpuDetalheRepository osLpuDetalheRepository;
    private final PrestadorRepository prestadorRepository;
    private final EtapaDetalhadaRepository etapaDetalhadaRepository;


    public OsServiceImpl(OsRepository osRepository, LpuRepository lpuRepository, ContratoRepository contratoRepository, SegmentoRepository segmentoRepository, UsuarioRepository usuarioRepository, LancamentoRepository lancamentoRepository, OsLpuDetalheRepository osLpuDetalheRepository, PrestadorRepository prestadorRepository, EtapaDetalhadaRepository etapaDetalhadaRepository) {
        this.osRepository = osRepository;
        this.lpuRepository = lpuRepository;
        this.contratoRepository = contratoRepository;
        this.segmentoRepository = segmentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.lancamentoRepository = lancamentoRepository;
        this.osLpuDetalheRepository = osLpuDetalheRepository;
        this.prestadorRepository = prestadorRepository;
        this.etapaDetalhadaRepository = etapaDetalhadaRepository;
    }

    @Override
    @Transactional
    public OsLpuDetalhe createOs(OsRequestDto osDto) {
        OS osParaSalvar = osRepository.findByOs(osDto.getOs())
                .orElseGet(() -> {
                    OS novaOs = new OS();
                    novaOs.setOs(osDto.getOs());
                    novaOs.setProjeto(osDto.getProjeto());
                    novaOs.setGestorTim(osDto.getGestorTim());
                    if (osDto.getSegmentoId() != null) {
                        Segmento segmento = segmentoRepository.findById(osDto.getSegmentoId())
                                .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + osDto.getSegmentoId()));
                        novaOs.setSegmento(segmento);
                    }
                    novaOs.setDataCriacao(LocalDateTime.now());
                    novaOs.setUsuarioCriacao("sistema-import");
                    novaOs.setStatusRegistro("ATIVO");
                    return novaOs;
                });

        osParaSalvar.setDataAtualizacao(LocalDateTime.now());
        osParaSalvar.setUsuarioAtualizacao("sistema-import");

        // --- CORREÇÃO PRINCIPAL AQUI ---
        // Salvamos a OS *antes* de usá-la em qualquer outra operação.
        osRepository.save(osParaSalvar);

        OsLpuDetalhe detalheCriado = null;

        if (osDto.getLpuIds() != null && !osDto.getLpuIds().isEmpty()) {
            List<Lpu> lpusParaAssociar = lpuRepository.findAllById(osDto.getLpuIds());
            if (lpusParaAssociar.size() != osDto.getLpuIds().size()) {
                throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos não foram encontradas.");
            }

            for (Lpu lpu : lpusParaAssociar) {
                OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();
                novoDetalhe.setOs(osParaSalvar);
                novoDetalhe.setLpu(lpu);

                if (osDto.getKey() != null && !osDto.getKey().isBlank()) {
                    novoDetalhe.setKey(osDto.getKey());
                } else {
                    long count = osLpuDetalheRepository.countByOsAndLpuAndKeyNotContaining(osParaSalvar, lpu, "_AC_");
                    String sequencia = String.format("%04d", count + 1);
                    String novaKey = osParaSalvar.getOs() + "_" + lpu.getId() + "_" + sequencia;
                    novoDetalhe.setKey(novaKey);
                }

                novoDetalhe.setObjetoContratado(lpu.getNomeLpu());
                osParaSalvar.getDetalhes().add(novoDetalhe);
                detalheCriado = novoDetalhe;
                detalheCriado.setSite(osDto.getSite());
                detalheCriado.setContrato(osDto.getContrato());
                detalheCriado.setRegional(osDto.getRegional());
                detalheCriado.setLote(osDto.getLote());
                detalheCriado.setBoq(osDto.getBoq());
                detalheCriado.setPo(osDto.getPo());
                detalheCriado.setItem(osDto.getItem());
                detalheCriado.setUnidade(osDto.getUnidade());
                detalheCriado.setQuantidade(osDto.getQuantidade());
                detalheCriado.setValorTotal(osDto.getValorTotal());
                detalheCriado.setObservacoes(osDto.getObservacoes());
                detalheCriado.setDataPo(osDto.getDataPo());
                detalheCriado.setFaturamento(osDto.getFaturamento());
                detalheCriado.setSolitIdFat(osDto.getSolitIdFat());
                detalheCriado.setRecebIdFat(osDto.getRecebIdFat());
                detalheCriado.setIdFaturamento(osDto.getIdFaturamento());
                detalheCriado.setDataFatInprout(osDto.getDataFatInprout());
                detalheCriado.setSolitFsPortal(osDto.getSolitFsPortal());
                detalheCriado.setDataFs(osDto.getDataFs());
                detalheCriado.setNumFs(osDto.getNumFs());
                detalheCriado.setGate(osDto.getGate());
                detalheCriado.setGateId(osDto.getGateId());
            }
        }

        // A OS já foi salva, agora o save vai apenas atualizar a coleção de detalhes
        osRepository.save(osParaSalvar);
        return detalheCriado;
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
            return Collections.emptyList();
        }

        return osRepository.findAllBySegmentoIn(segmentosDoUsuario);
    }

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
        OS existingOs = osRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + id));

        existingOs.setOs(osDto.getOs());
        existingOs.setProjeto(osDto.getProjeto());
        existingOs.setGestorTim(osDto.getGestorTim());

        if (osDto.getSegmentoId() != null) {
            Segmento segmento = segmentoRepository.findById(osDto.getSegmentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + osDto.getSegmentoId()));
            existingOs.setSegmento(segmento);
        }

        if (osDto.getLpuIds() != null) {
            List<Lpu> lpusDesejadas = lpuRepository.findAllById(osDto.getLpuIds());
            if (lpusDesejadas.size() != osDto.getLpuIds().size()) {
                throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos para atualização não foram encontradas.");
            }

            Map<Long, OsLpuDetalhe> detalhesExistentesMap = existingOs.getDetalhes().stream()
                    .collect(Collectors.toMap(detalhe -> detalhe.getLpu().getId(), detalhe -> detalhe));

            existingOs.getDetalhes().removeIf(detalhe ->
                    !osDto.getLpuIds().contains(detalhe.getLpu().getId())
            );

            for (Lpu lpu : lpusDesejadas) {
                OsLpuDetalhe detalhe = detalhesExistentesMap.get(lpu.getId());

                if (detalhe != null) {
                    detalhe.setObjetoContratado(lpu.getNomeLpu());
                    detalhe.setSite(osDto.getSite());
                    detalhe.setContrato(osDto.getContrato());
                    detalhe.setRegional(osDto.getRegional());
                    detalhe.setLote(osDto.getLote());
                    detalhe.setBoq(osDto.getBoq());
                    detalhe.setPo(osDto.getPo());
                    detalhe.setItem(osDto.getItem());
                    detalhe.setObjetoContratado(osDto.getObjetoContratado());
                    detalhe.setUnidade(osDto.getUnidade());
                    detalhe.setQuantidade(osDto.getQuantidade());
                    detalhe.setValorTotal(osDto.getValorTotal());
                    detalhe.setObservacoes(osDto.getObservacoes());
                    detalhe.setDataPo(osDto.getDataPo());
                } else {
                    OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();
                    novoDetalhe.setOs(existingOs);
                    novoDetalhe.setLpu(lpu);
                    novoDetalhe.setKey(existingOs.getOs() + "_" + lpu.getId());
                    novoDetalhe.setSite(osDto.getSite());
                    novoDetalhe.setContrato(osDto.getContrato());
                    existingOs.getDetalhes().add(novoDetalhe);
                }
            }
        }

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

        return os.getDetalhes().stream()
                .map(detalhe -> {
                    Lancamento ultimoLancamentoAprovado = detalhe.getLancamentos().stream()
                            .filter(lancamento -> lancamento.getSituacaoAprovacao() == SituacaoAprovacao.APROVADO)
                            .max(Comparator.comparing(Lancamento::getId))
                            .orElse(null);

                    LancamentoResponseDTO ultimoLancamentoDto = (ultimoLancamentoAprovado != null)
                            ? new LancamentoResponseDTO(ultimoLancamentoAprovado)
                            : null;

                    LpuResponseDTO lpuDto = new LpuResponseDTO(detalhe.getLpu());

                    return new LpuComLancamentoDto(lpuDto, ultimoLancamentoDto);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OS> findAllWithDetails() {
        List<OS> oss = osRepository.findAllWithDetails();

        if (oss.isEmpty()) {
            return oss;
        }

        List<Long> osIds = oss.stream().map(OS::getId).collect(Collectors.toList());
        osLpuDetalheRepository.findAllWithLancamentosByOsIds(osIds);
        return oss;
    }

    public static boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }
        if (row.getLastCellNum() <= 0) {
            return true;
        }
        for (int cellNum = row.getFirstCellNum(); cellNum < row.getLastCellNum(); cellNum++) {
            Cell cell = row.getCell(cellNum);
            if (cell != null && cell.getCellType() != CellType.BLANK && !cell.toString().trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private OsRequestDto criarDtoDaLinha(Row row, Map<String, Segmento> segmentoMap, Map<String, Lpu> lpuMap, boolean isLegado) {
        OsRequestDto dto = new OsRequestDto();

        String contratoDaLinha = getStringCellValue(row, 2);
        if(contratoDaLinha != null && !contratoDaLinha.isBlank()){
            String codigoLpuDaLinha = getStringCellValue(row, 7);
            if (codigoLpuDaLinha != null && !codigoLpuDaLinha.isBlank()) {
                String chaveLpuComposta = (contratoDaLinha + "::" + codigoLpuDaLinha).toUpperCase();
                Lpu lpu = lpuMap.get(chaveLpuComposta);
                if (lpu != null) {
                    dto.setLpuIds(List.of(lpu.getId()));
                }
            }
        }

        dto.setOs(getStringCellValue(row, 0));
        dto.setSite(getStringCellValue(row, 1));
        dto.setContrato(getStringCellValue(row, 2));

        String nomeSegmento = getStringCellValue(row, 3);
        if(nomeSegmento != null && !nomeSegmento.isBlank()){
            Segmento segmento = segmentoMap.get(nomeSegmento.toUpperCase());
            if (segmento != null) {
                dto.setSegmentoId(segmento.getId());
            }
        }

        dto.setProjeto(getStringCellValue(row, 4));
        dto.setGestorTim(getStringCellValue(row, 5));
        dto.setRegional(getStringCellValue(row, 6));
        dto.setLote(getStringCellValue(row, 8));
        dto.setBoq(getStringCellValue(row, 9));
        dto.setPo(getStringCellValue(row, 10));
        dto.setItem(getStringCellValue(row, 11));
        dto.setObjetoContratado(getStringCellValue(row, 12));
        dto.setUnidade(getStringCellValue(row, 13));
        dto.setQuantidade(getIntegerCellValue(row, 14));
        dto.setValorTotal(getBigDecimalCellValue(row, 15));
        dto.setObservacoes(getStringCellValue(row, 16));
        dto.setDataPo(getLocalDateCellValue(row, 17));
        dto.setFaturamento(getStringCellValue(row, 38));
        dto.setSolitIdFat(getStringCellValue(row, 39));
        dto.setRecebIdFat(getStringCellValue(row, 40));
        dto.setIdFaturamento(getStringCellValue(row, 41));
        dto.setDataFatInprout(getLocalDateCellValue(row, 42));
        dto.setSolitFsPortal(getStringCellValue(row, 43));
        dto.setDataFs(getLocalDateCellValue(row, 44));
        dto.setNumFs(getStringCellValue(row, 45));
        dto.setGate(getStringCellValue(row, 46));
        dto.setGateId(getStringCellValue(row, 47));
        dto.setKey(getStringCellValue(row, 49));

        if (isLegado) {
            dto.setVistoria(getStringCellValue(row, 18));
            dto.setPlanoVistoria(getLocalDateCellValue(row, 19));
            dto.setDesmobilizacao(getStringCellValue(row, 20));
            dto.setPlanoDesmobilizacao(getLocalDateCellValue(row, 21));
            dto.setInstalacao(getStringCellValue(row, 22));
            dto.setPlanoInstalacao(getLocalDateCellValue(row, 23));
            dto.setAtivacao(getStringCellValue(row, 24));
            dto.setPlanoAtivacao(getLocalDateCellValue(row, 25));
            dto.setDocumentacao(getStringCellValue(row, 26));
            dto.setPlanoDocumentacao(getLocalDateCellValue(row, 27));
            dto.setNomeEtapaDetalhada(getStringCellValue(row, 29));
            dto.setStatusLancamento(getStringCellValue(row, 30));
            dto.setDetalheDiario(getStringCellValue(row, 31));
            dto.setCodigoPrestador(getStringCellValue(row, 32));
            dto.setValorLancamento(getBigDecimalCellValue(row, 34));
            dto.setSituacaoLancamento(getStringCellValue(row, 36));
            dto.setDataAtividadeLancamento(getLocalDateCellValue(row, 37));
        }
        return dto;
    }

    @Override
    @Transactional
    public List<OS> importarOsDePlanilha(MultipartFile file, boolean isLegado) throws IOException {
        return importarOsDePlanilha(file, isLegado, new ArrayList<>());
    }

    @Override
    @Transactional
    public List<OS> importarOsDePlanilha(MultipartFile file, boolean isLegado, List<String> warnings) throws IOException {
        Set<Long> affectedOsIds = new HashSet<>();
        // Mapa para rastrear a primeira OS criada para cada projeto na planilha
        Map<String, OS> osPorProjetoCache = new HashMap<>();

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (rows.hasNext()) {
                rows.next();
            }

            Map<String, Segmento> segmentoMap = segmentoRepository.findAll().stream()
                    .collect(Collectors.toMap(s -> s.getNome().toUpperCase(), s -> s, (s1, s2) -> s1));
            Map<String, Lpu> lpuMap = lpuRepository.findAll().stream()
                    .filter(lpu -> lpu.getContrato() != null && lpu.getCodigoLpu() != null)
                    .collect(Collectors.toMap(
                            lpu -> (lpu.getContrato().getNome() + "::" + lpu.getCodigoLpu()).toUpperCase(),
                            Function.identity(),
                            (lpu1, lpu2) -> lpu1
                    ));

            int numeroLinha = 1;
            while (rows.hasNext()) {
                numeroLinha++;
                Row currentRow = rows.next();
                if (isRowEmpty(currentRow)) continue;

                try {
                    OsRequestDto dto = criarDtoDaLinha(currentRow, segmentoMap, lpuMap, isLegado);

                    // --- INÍCIO DA NOVA LÓGICA DE PROJETO ÚNICO ---

                    // Cenário 1: A linha da planilha tem OS e/ou KEY, ou o projeto não foi informado.
                    // A lógica antiga de busca por KEY ou OS continua valendo.
                    if ((dto.getKey() != null && !dto.getKey().isBlank()) || (dto.getOs() != null && !dto.getOs().isBlank()) || (dto.getProjeto() == null || dto.getProjeto().isBlank())) {

                        // (A lógica que estava aqui antes para tratar KEY e OS permanece a mesma)
                        // ... implementação original ...

                    }
                    // Cenário 2: A linha NÃO tem OS nem KEY, MAS TEM um projeto.
                    // Esta é a nossa nova regra de negócio!
                    else {
                        OS osParaEstaLinha;

                        // Primeiro, verifica no nosso cache da importação atual
                        if (osPorProjetoCache.containsKey(dto.getProjeto().toUpperCase())) {
                            osParaEstaLinha = osPorProjetoCache.get(dto.getProjeto().toUpperCase());
                            warnings.add("Linha " + numeroLinha + ": O projeto '" + dto.getProjeto() + "' já foi processado nesta importação. A linha foi adicionada à OS '" + osParaEstaLinha.getOs() + "'.");
                        }
                        // Se não está no cache, busca no banco de dados
                        else {
                            Optional<OS> osExistenteOpt = osRepository.findByProjeto(dto.getProjeto());
                            if (osExistenteOpt.isPresent()) {
                                osParaEstaLinha = osExistenteOpt.get();
                                warnings.add("Linha " + numeroLinha + ": Já existe uma OS para o projeto '" + dto.getProjeto() + "'. A linha foi adicionada à OS '" + osParaEstaLinha.getOs() + "'.");
                            }
                            // Se não existe em lugar nenhum, cria uma nova OS
                            else {
                                osParaEstaLinha = new OS();
                                osParaEstaLinha.setProjeto(dto.getProjeto());
                                osParaEstaLinha.setOs(gerarNovaOsSequencial());
                                // Preenche outros campos necessários para criar a OS
                                if (dto.getSegmentoId() != null) {
                                    Segmento segmento = segmentoMap.get(getStringCellValue(currentRow, 3).toUpperCase());
                                    osParaEstaLinha.setSegmento(segmento);
                                }
                                osParaEstaLinha.setGestorTim(dto.getGestorTim());
                                osParaEstaLinha.setDataCriacao(LocalDateTime.now());
                                osParaEstaLinha.setUsuarioCriacao("sistema-import");
                                osParaEstaLinha.setStatusRegistro("ATIVO");
                            }
                            // Salva a OS (seja nova ou existente) e adiciona ao cache
                            osRepository.save(osParaEstaLinha);
                            osPorProjetoCache.put(dto.getProjeto().toUpperCase(), osParaEstaLinha);
                        }

                        // Agora que temos a OS correta, criamos o detalhe (a linha) dentro dela
                        dto.setOs(osParaEstaLinha.getOs());
                        OsLpuDetalhe novoDetalhe = createOs(dto);
                        if (novoDetalhe != null) {
                            if (isLegado) {
                                criarOuAtualizarLancamentoLegado(novoDetalhe, dto);
                            }
                            affectedOsIds.add(novoDetalhe.getOs().getId());
                        }
                    }
                    // --- FIM DA NOVA LÓGICA ---

                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Erro na linha " + numeroLinha + ": " + e.getMessage());
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new RuntimeException("Erro inesperado ao processar a linha " + numeroLinha + ".", e);
                }
            }
        } catch (IOException e) {
            throw new IOException("Falha ao ler o arquivo.", e);
        }

        if (affectedOsIds.isEmpty()) {
            return new ArrayList<>();
        }

        return osRepository.findAllWithDetailsByIds(new ArrayList<>(affectedOsIds));
    }

    private void atualizarDetalheExistente(OsLpuDetalhe detalheExistente, OsRequestDto dto, boolean isLegado) {
        detalheExistente.setSite(dto.getSite());
        detalheExistente.setRegional(dto.getRegional());
        detalheExistente.setLote(dto.getLote());
        detalheExistente.setBoq(dto.getBoq());
        detalheExistente.setPo(dto.getPo());
        detalheExistente.setItem(dto.getItem());
        detalheExistente.setObjetoContratado(dto.getObjetoContratado());
        detalheExistente.setUnidade(dto.getUnidade());
        detalheExistente.setQuantidade(dto.getQuantidade());
        detalheExistente.setValorTotal(dto.getValorTotal());
        detalheExistente.setObservacoes(dto.getObservacoes());
        detalheExistente.setDataPo(dto.getDataPo());
        detalheExistente.setFaturamento(dto.getFaturamento());
        detalheExistente.setSolitIdFat(dto.getSolitIdFat());
        detalheExistente.setRecebIdFat(dto.getRecebIdFat());
        detalheExistente.setIdFaturamento(dto.getIdFaturamento());
        detalheExistente.setDataFatInprout(dto.getDataFatInprout());
        detalheExistente.setSolitFsPortal(dto.getSolitFsPortal());
        detalheExistente.setDataFs(dto.getDataFs());
        detalheExistente.setNumFs(dto.getNumFs());
        detalheExistente.setGate(dto.getGate());
        detalheExistente.setGateId(dto.getGateId());
        osLpuDetalheRepository.save(detalheExistente);

        if (isLegado) {
            criarOuAtualizarLancamentoLegado(detalheExistente, dto);
        }
    }

    private void criarOuAtualizarLancamentoLegado(OsLpuDetalhe detalhe, OsRequestDto dto) {
        Lancamento lancamento = detalhe.getLancamentos().stream()
                .max(Comparator.comparing(Lancamento::getId))
                .orElseGet(() -> {
                    Lancamento novoLancamento = new Lancamento();
                    novoLancamento.setOsLpuDetalhe(detalhe);
                    novoLancamento.setOs(detalhe.getOs());
                    Usuario manager = usuarioRepository.findById(1L)
                            .orElseThrow(() -> new EntityNotFoundException("Manager padrão (ID 1) não encontrado."));
                    novoLancamento.setManager(manager);
                    detalhe.getLancamentos().add(novoLancamento);
                    return novoLancamento;
                });

        lancamento.setVistoria(dto.getVistoria());
        lancamento.setPlanoVistoria(dto.getPlanoVistoria());
        lancamento.setDesmobilizacao(dto.getDesmobilizacao());
        lancamento.setPlanoDesmobilizacao(dto.getPlanoDesmobilizacao());
        lancamento.setInstalacao(dto.getInstalacao());
        lancamento.setPlanoInstalacao(dto.getPlanoInstalacao());
        lancamento.setAtivacao(dto.getAtivacao());
        lancamento.setPlanoAtivacao(dto.getPlanoAtivacao());
        lancamento.setDocumentacao(dto.getDocumentacao());
        lancamento.setPlanoDocumentacao(dto.getPlanoDocumentacao());

        if (dto.getDataAtividadeLancamento() != null) {
            lancamento.setDataAtividade(dto.getDataAtividadeLancamento());
        } else if (lancamento.getDataAtividade() == null) {
            lancamento.setDataAtividade(LocalDate.now());
        }

        if (dto.getCodigoPrestador() != null && !dto.getCodigoPrestador().isBlank()) {
            prestadorRepository.findByCodigoPrestador(dto.getCodigoPrestador())
                    .ifPresent(lancamento::setPrestador);
        }

        if (dto.getNomeEtapaDetalhada() != null && !dto.getNomeEtapaDetalhada().isBlank()) {
            etapaDetalhadaRepository.findByNome(dto.getNomeEtapaDetalhada())
                    .stream().findFirst().ifPresent(lancamento::setEtapaDetalhada);
        }

        if (dto.getStatusLancamento() != null && !dto.getStatusLancamento().isBlank()) {
            try {
                lancamento.setStatus(br.com.inproutservices.inproutsystem.enums.index.StatusEtapa.fromDescricao(dto.getStatusLancamento()));
            } catch (IllegalArgumentException e) { /* Ignora status inválido */ }
        }

        if (dto.getSituacaoLancamento() != null && !dto.getSituacaoLancamento().isBlank()) {
            try {
                lancamento.setSituacao(br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional.fromDescricao(dto.getSituacaoLancamento()));
            } catch (IllegalArgumentException e) { /* Ignora situação inválida */ }
        }

        lancamento.setDetalheDiario(dto.getDetalheDiario());
        lancamento.setValor(dto.getValorLancamento());
        lancamento.setSituacaoAprovacao(SituacaoAprovacao.APROVADO_LEGADO);
    }


    private String gerarNovaOsSequencial() {
        String ano = String.valueOf(LocalDate.now().getYear()).substring(2);
        String sufixo = "-" + ano;
        List<String> ultimasOsDoAno = osRepository.findLastOsByYearSuffix(sufixo);

        int proximoNumero = 1;
        if (!ultimasOsDoAno.isEmpty()) {
            String ultimaOs = ultimasOsDoAno.get(0);
            try {
                int ultimoNumero = Integer.parseInt(ultimaOs.split("-")[0]);
                proximoNumero = ultimoNumero + 1;
            } catch (NumberFormatException e) {
                // Lidar com o caso de a OS não estar no formato esperado
            }
        }

        return String.format("%05d-%s", proximoNumero, ano);
    }

    @Override
    @Transactional
    public void processarLinhaDePlanilha(Map<String, Object> rowData) {
        Map<String, Segmento> segmentoMap = segmentoRepository.findAll().stream()
                .collect(Collectors.toMap(s -> s.getNome().toUpperCase(), s -> s, (s1, s2) -> s1));
        Map<String, Lpu> lpuMap = lpuRepository.findAll().stream()
                .filter(lpu -> lpu.getContrato() != null && lpu.getCodigoLpu() != null)
                .collect(Collectors.toMap(
                        lpu -> (lpu.getContrato().getNome() + "::" + lpu.getCodigoLpu()).toUpperCase(),
                        Function.identity(),
                        (lpu1, lpu2) -> lpu1
                ));

        OsRequestDto dto = criarDtoDoMapa(rowData, segmentoMap, lpuMap);

        if (dto == null || dto.getKey() == null || dto.getKey().isBlank()) {
            throw new IllegalArgumentException("A coluna 'KEY' é obrigatória e não pode estar vazia.");
        }

        Optional<OsLpuDetalhe> detalheExistenteOpt = osLpuDetalheRepository.findByKey(dto.getKey());

        if (detalheExistenteOpt.isPresent()) {
            OsLpuDetalhe detalheExistente = detalheExistenteOpt.get();
            detalheExistente.setSite(dto.getSite());
            detalheExistente.setRegional(dto.getRegional());
            detalheExistente.setFaturamento(dto.getFaturamento());
            detalheExistente.setSolitIdFat(dto.getSolitIdFat());
            osLpuDetalheRepository.save(detalheExistente);
        } else {
            if (dto.getOs() == null || dto.getOs().isEmpty() || dto.getContrato() == null || dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
                throw new IllegalArgumentException("Para criar um novo registro (KEY não encontrada), as colunas OS, Contrato e LPU são obrigatórias.");
            }
            this.createOs(dto);
        }
    }

    private OsRequestDto criarDtoDoMapa(Map<String, Object> rowData, Map<String, Segmento> segmentoMap, Map<String, Lpu> lpuMap) {
        OsRequestDto dto = new OsRequestDto();

        dto.setKey(getMapString(rowData, "KEY"));
        dto.setOs(getMapString(rowData, "OS"));
        dto.setSite(getMapString(rowData, "SITE"));
        dto.setContrato(getMapString(rowData, "CONTRATO"));
        dto.setProjeto(getMapString(rowData, "PROJETO"));
        dto.setGestorTim(getMapString(rowData, "GESTOR TIM"));
        dto.setRegional(getMapString(rowData, "REGIONAL"));
        dto.setLote(getMapString(rowData, "LOTE"));
        dto.setBoq(getMapString(rowData, "BOQ"));
        dto.setPo(getMapString(rowData, "PO"));
        dto.setItem(getMapString(rowData, "ITEM"));
        dto.setObjetoContratado(getMapString(rowData, "OBJETO CONTRATADO"));
        dto.setUnidade(getMapString(rowData, "UNIDADE"));
        dto.setQuantidade(getMapInteger(rowData, "QUANTIDADE"));
        dto.setValorTotal(getMapBigDecimal(rowData, "VALOR TOTAL OS"));
        dto.setObservacoes(getMapString(rowData, "OBSERVAÇÕES"));
        dto.setDataPo(getMapLocalDate(rowData, "DATA PO"));
        dto.setFaturamento(getMapString(rowData, "FATURAMENTO"));
        dto.setSolitIdFat(getMapString(rowData, "SOLICIT ID FAT"));
        dto.setRecebIdFat(getMapString(rowData, "RECEB ID FAT"));
        dto.setIdFaturamento(getMapString(rowData, "ID FATURAMENTO"));
        dto.setDataFatInprout(getMapLocalDate(rowData, "DATA FAT INPROUT"));
        dto.setSolitFsPortal(getMapString(rowData, "SOLICIT FS PORTAL"));
        dto.setDataFs(getMapLocalDate(rowData, "DATA FS"));
        dto.setNumFs(getMapString(rowData, "NUM FS"));
        dto.setGate(getMapString(rowData, "GATE"));
        dto.setGateId(getMapString(rowData, "GATE ID"));

        String nomeSegmento = getMapString(rowData, "SEGMENTO");
        if (nomeSegmento != null && !nomeSegmento.isEmpty()) {
            Segmento segmento = segmentoMap.get(nomeSegmento.toUpperCase());
            if (segmento != null) {
                dto.setSegmentoId(segmento.getId());
            }
        }

        String codigoLpu = getMapString(rowData, "LPU");
        String nomeContrato = getMapString(rowData, "CONTRATO");
        if (codigoLpu != null && nomeContrato != null) {
            String chaveComposta = (nomeContrato + "::" + codigoLpu).toUpperCase();
            Lpu lpu = lpuMap.get(chaveComposta);
            if (lpu != null) {
                dto.setLpuIds(List.of(lpu.getId()));
            }
        }
        return dto;
    }

    private String getMapString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : null;
    }
    private Integer getMapInteger(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        try {
            return val != null ? Integer.parseInt(String.valueOf(val)) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
    private BigDecimal getMapBigDecimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) {
            return BigDecimal.valueOf(((Number) val).doubleValue());
        }
        try {
            return val != null ? new BigDecimal(String.valueOf(val).replace(",", ".")) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
    private LocalDate getMapLocalDate(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) {
            return DateUtil.getJavaDate(((Number) val).doubleValue()).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        return null;
    }

    @Override
    public void importarOsDePlanilha(MultipartFile file) throws IOException {
        importarOsDePlanilha(file, false);
    }

    @Override
    @Transactional
    public List<String> processarLoteDePlanilha(List<Map<String, Object>> loteDeLinhas) {
        List<String> erros = new ArrayList<>();

        Map<String, Segmento> segmentoMap = segmentoRepository.findAll().stream()
                .collect(Collectors.toMap(s -> s.getNome().toUpperCase(), s -> s, (s1, s2) -> s1));
        Map<String, Lpu> lpuMap = lpuRepository.findAll().stream()
                .filter(lpu -> lpu.getContrato() != null && lpu.getCodigoLpu() != null)
                .collect(Collectors.toMap(
                        lpu -> (lpu.getContrato().getNome() + "::" + lpu.getCodigoLpu()).toUpperCase(),
                        Function.identity(),
                        (lpu1, lpu2) -> lpu1
                ));

        int i = 0;
        for (Map<String, Object> rowData : loteDeLinhas) {
            i++;
            try {
                OsRequestDto dto = criarDtoDoMapa(rowData, segmentoMap, lpuMap);

                if (dto == null || dto.getKey() == null || dto.getKey().isBlank()) {
                    erros.add("Linha " + i + " no lote: A coluna 'KEY' é obrigatória.");
                    continue;
                }

                Optional<OsLpuDetalhe> detalheExistenteOpt = osLpuDetalheRepository.findByKey(dto.getKey());

                if (detalheExistenteOpt.isPresent()) {
                    OsLpuDetalhe detalheExistente = detalheExistenteOpt.get();
                    detalheExistente.setSite(dto.getSite());
                    detalheExistente.setRegional(dto.getRegional());
                    detalheExistente.setLote(dto.getLote());
                    detalheExistente.setBoq(dto.getBoq());
                    detalheExistente.setPo(dto.getPo());
                    detalheExistente.setItem(dto.getItem());
                    detalheExistente.setObjetoContratado(dto.getObjetoContratado());
                    detalheExistente.setUnidade(dto.getUnidade());
                    detalheExistente.setQuantidade(dto.getQuantidade());
                    detalheExistente.setValorTotal(dto.getValorTotal());
                    detalheExistente.setObservacoes(dto.getObservacoes());
                    detalheExistente.setDataPo(dto.getDataPo());
                    detalheExistente.setFaturamento(dto.getFaturamento());
                    detalheExistente.setSolitIdFat(dto.getSolitIdFat());
                    detalheExistente.setRecebIdFat(dto.getRecebIdFat());
                    detalheExistente.setIdFaturamento(dto.getIdFaturamento());
                    detalheExistente.setDataFatInprout(dto.getDataFatInprout());
                    detalheExistente.setSolitFsPortal(dto.getSolitFsPortal());
                    detalheExistente.setDataFs(dto.getDataFs());
                    detalheExistente.setNumFs(dto.getNumFs());
                    detalheExistente.setGate(dto.getGate());
                    detalheExistente.setGateId(dto.getGateId());
                    osLpuDetalheRepository.save(detalheExistente);
                } else {
                    if (dto.getOs() == null || dto.getOs().isEmpty() || dto.getContrato() == null || dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
                        throw new IllegalArgumentException("Para criar novo registro (KEY não encontrada), as colunas OS, Contrato e LPU são obrigatórias.");
                    }
                    this.createOs(dto);
                }
            } catch (Exception e) {
                erros.add("Linha " + i + " no lote: " + e.getMessage());
            }
        }
        return erros;
    }

    private String getStringCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            return null;
        }
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }

    private Integer getIntegerCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        }
        if (cell.getCellType() == CellType.STRING) {
            String value = cell.getStringCellValue().trim();
            if(value.isEmpty()) return null;
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private BigDecimal getBigDecimalCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }
        if (cell.getCellType() == CellType.STRING) {
            String value = cell.getStringCellValue()
                    .replaceAll("[^\\d,.-]", "")
                    .replace(".", "")
                    .replace(",", ".");
            if(value.isBlank()) return null;
            try {
                return new BigDecimal(value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private LocalDate getLocalDateCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();
            }
        }

        if (cell.getCellType() == CellType.STRING) {
            String dateStr = cell.getStringCellValue();
            if (dateStr == null || dateStr.isBlank() || dateStr.equalsIgnoreCase("-")) return null;

            try {
                return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } catch (Exception e) {
                try {
                    return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
                } catch (Exception e2) {
                    return null;
                }
            }
        }
        return null;
    }

    @Override
    public List<OS> getOsByProjeto(String projeto) {
        return osRepository.findByProjeto(projeto);
    }

    @Override
    @Transactional
    public OsLpuDetalhe criarOsLpuDetalheComplementar(Long osId, Long lpuId, Integer quantidade) {
        OS os = osRepository.findById(osId)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + osId));
        Lpu lpu = lpuRepository.findById(lpuId)
                .orElseThrow(() -> new EntityNotFoundException("LPU não encontrada com o ID: " + lpuId));

        OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();
        novoDetalhe.setOs(os);
        novoDetalhe.setLpu(lpu);

        // --- INÍCIO DA LÓGICA DE GERAÇÃO DE KEY (ATIVIDADE COMPLEMENTAR) ---
        long count = osLpuDetalheRepository.countByOsAndLpuAndKeyContaining(os, lpu, "_AC_");
        String sequencia = String.format("%04d", count + 1);
        String novaKey = os.getOs() + "_" + lpu.getId() + "_AC_" + sequencia;
        novoDetalhe.setKey(novaKey);
        // --- FIM DA LÓGICA DE GERAÇÃO DE KEY ---

        novoDetalhe.setQuantidade(quantidade);
        novoDetalhe.setObjetoContratado(lpu.getNomeLpu());

        if (lpu.getValorSemImposto() != null && quantidade != null && quantidade > 0) {
            BigDecimal valorTotal = lpu.getValorSemImposto().multiply(new BigDecimal(quantidade));
            novoDetalhe.setValorTotal(valorTotal);
        }

        os.getDetalhes().stream().findFirst().ifPresent(base -> {
            novoDetalhe.setSite(base.getSite());
            novoDetalhe.setContrato(base.getContrato());
            novoDetalhe.setRegional(base.getRegional());
        });

        String dataFormatada = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(java.time.LocalDate.now());
        novoDetalhe.setObservacoes("Criação automática de atividade complementar dia " + dataFormatada);

        return osLpuDetalheRepository.save(novoDetalhe);
    }

    @Transactional
    public void desativarDetalhe(Long detalheId) {
        OsLpuDetalhe detalhe = osLpuDetalheRepository.findById(detalheId)
                .orElseThrow(() -> new EntityNotFoundException("Detalhe de OS não encontrado com o ID: " + detalheId));

        if (detalhe.getLancamentos() != null && !detalhe.getLancamentos().isEmpty()) {
            throw new BusinessException("Não é possível excluir um registro que já possui lançamentos de atividade.");
        }
        osLpuDetalheRepository.delete(detalhe);
    }

    @Override
    @Transactional
    public void atualizarSegmentoDaOs(Long detalheId, Long novoSegmentoId) {
        OsLpuDetalhe detalhe = osLpuDetalheRepository.findById(detalheId)
                .orElseThrow(() -> new EntityNotFoundException("Detalhe de OS não encontrado com o ID: " + detalheId));

        OS os = detalhe.getOs();
        if (os == null) {
            throw new EntityNotFoundException("OS principal não encontrada para o Detalhe com ID: " + detalheId);
        }

        Segmento novoSegmento = segmentoRepository.findById(novoSegmentoId)
                .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + novoSegmentoId));

        os.setSegmento(novoSegmento);
        os.setDataAtualizacao(LocalDateTime.now());
        osRepository.save(os);
    }

    @Transactional
    public OsLpuDetalhe atualizarChaveExterna(Long detalheId, String novaChave) {
        if (novaChave == null || novaChave.isBlank()) {
            throw new BusinessException("A nova chave não pode ser vazia.");
        }

        OsLpuDetalhe detalhe = osLpuDetalheRepository.findById(detalheId)
                .orElseThrow(() -> new EntityNotFoundException("Detalhe de OS não encontrado com o ID: " + detalheId));

        osLpuDetalheRepository.findByKey(novaChave).ifPresent(existente -> {
            if (!existente.getId().equals(detalhe.getId())) {
                throw new BusinessException("A chave '" + novaChave + "' já está em uso por outro registro.");
            }
        });

        detalhe.setKey(novaChave);
        return osLpuDetalheRepository.save(detalhe);
    }
}