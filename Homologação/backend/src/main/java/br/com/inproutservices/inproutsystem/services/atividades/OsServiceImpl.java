package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoResponseDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhes;
import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsLpuDetalhesRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsRepository;
import br.com.inproutservices.inproutsystem.repositories.index.ContratoRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import br.com.inproutservices.inproutsystem.repositories.index.SegmentoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
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
    private final OsLpuDetalhesRepository osLpuDetalhesRepository;

    public OsServiceImpl(OsRepository osRepository, LpuRepository lpuRepository, ContratoRepository contratoRepository, SegmentoRepository segmentoRepository, UsuarioRepository usuarioRepository, LancamentoRepository lancamentoRepository, OsLpuDetalhesRepository osLpuDetalhesRepository) {
        this.osRepository = osRepository;
        this.lpuRepository = lpuRepository;
        this.contratoRepository = contratoRepository;
        this.segmentoRepository = segmentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.lancamentoRepository = lancamentoRepository;
        this.osLpuDetalhesRepository = osLpuDetalhesRepository;
    }

    @Override
    @Transactional
    public OS createOs(OsRequestDto osDto) {
        osRepository.findByOs(osDto.getOs()).ifPresent(os -> {
            throw new IllegalArgumentException("Uma Ordem de Serviço com o código '" + osDto.getOs() + "' já existe.");
        });

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
        novaOs.setStatusRegistro("ATIVO");
        novaOs.setUsuarioCriacao("sistema");

        if (osDto.getDetalhes() != null && !osDto.getDetalhes().isEmpty()) {
            for (OsRequestDto.OsLpuDetalheRequestDto detalheDto : osDto.getDetalhes()) {
                if (detalheDto.getLpuId() == null) continue; // Pula se não houver LPU associada

                Lpu lpu = lpuRepository.findById(detalheDto.getLpuId())
                        .orElseThrow(() -> new EntityNotFoundException("LPU não encontrada com o ID: " + detalheDto.getLpuId()));

                OsLpuDetalhes detalhe = new OsLpuDetalhes();
                detalhe.setOs(novaOs);
                detalhe.setLpu(lpu);

                mapearDtoParaDetalhe(detalheDto, detalhe);

                novaOs.getDetalhes().add(detalhe);
            }
        }

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
    public Page<OS> getAllOs(Pageable pageable) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        String userEmail;
        if (principal instanceof UserDetails) {
            userEmail = ((UserDetails) principal).getUsername();
        } else {
            userEmail = principal.toString();
        }

        if ("anonymousUser".equals(userEmail)) {
            return osRepository.findAllWithDetails(pageable);
        }

        Usuario usuarioLogado = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuário '" + userEmail + "' não encontrado no banco de dados."));

        Role role = usuarioLogado.getRole();

        if (role == Role.ADMIN || role == Role.CONTROLLER || role == Role.ASSISTANT) {
            return osRepository.findAllWithDetails(pageable);
        }

        if (role == Role.MANAGER || role == Role.COORDINATOR) {
            Set<Segmento> segmentosDoUsuario = usuarioLogado.getSegmentos();
            if (segmentosDoUsuario.isEmpty()) {
                return Page.empty(pageable);
            }
            // A filtragem agora acontece diretamente no banco
            return osRepository.findAllBySegmentoIn(segmentosDoUsuario, pageable);
        }

        return Page.empty(pageable);
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

        return osRepository.findAllBySegmentoInWithDetails(segmentosDoUsuario);
    }

    @Override
    @Transactional
    public OS updateOs(Long id, OsRequestDto osDto) {
        // 1. Busca a OS existente no banco de dados. Se não encontrar, lança uma exceção.
        OS osExistente = getOsById(id);

        // 2. Atualiza os campos que pertencem diretamente à entidade OS principal.
        osExistente.setProjeto(osDto.getProjeto());
        osExistente.setGestorTim(osDto.getGestorTim());

        // Atualiza o segmento, buscando a entidade completa pelo ID.
        if (osDto.getSegmentoId() != null) {
            Segmento segmento = segmentoRepository.findById(osDto.getSegmentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + osDto.getSegmentoId()));
            osExistente.setSegmento(segmento);
        } else {
            osExistente.setSegmento(null);
        }

        // 3. Limpa a lista de detalhes antigos.
        // Graças à configuração 'orphanRemoval=true' na entidade OS,
        // o JPA irá deletar automaticamente do banco de dados os registros que forem removidos desta lista.
        osExistente.getDetalhes().clear();

        // 4. Itera sobre a nova lista de detalhes vinda do frontend para (re)criá-los.
        if (osDto.getDetalhes() != null && !osDto.getDetalhes().isEmpty()) {
            for (OsRequestDto.OsLpuDetalheRequestDto detalheDto : osDto.getDetalhes()) {

                // Busca a entidade LPU completa para criar a associação.
                Lpu lpu = lpuRepository.findById(detalheDto.getLpuId())
                        .orElseThrow(() -> new EntityNotFoundException("LPU não encontrada com o ID: " + detalheDto.getLpuId()));

                // Cria uma nova instância de OsLpuDetalhes.
                OsLpuDetalhes detalhe = new OsLpuDetalhes();

                // Associa o novo detalhe à OS existente e à LPU.
                detalhe.setOs(osExistente);
                detalhe.setLpu(lpu);

                // Mapeia todos os campos do DTO de detalhe para a nova entidade de detalhe.
                detalhe.setSite(detalheDto.getSite());
                detalhe.setContrato(detalheDto.getContrato());
                detalhe.setRegional(detalheDto.getRegional());
                detalhe.setLote(detalheDto.getLote());
                detalhe.setBoq(detalheDto.getBoq());
                detalhe.setPo(detalheDto.getPo());
                detalhe.setItem(detalheDto.getItem());
                detalhe.setObjetoContratado(detalheDto.getObjetoContratado());
                detalhe.setUnidade(detalheDto.getUnidade());
                detalhe.setQuantidade(detalheDto.getQuantidade());
                detalhe.setValorTotal(detalheDto.getValorTotal());
                detalhe.setObservacoes(detalheDto.getObservacoes());
                detalhe.setDataPo(detalheDto.getDataPo());
                detalhe.setFaturamento(detalheDto.getFaturamento());
                detalhe.setSolitIdFat(detalheDto.getSolitIdFat());
                detalhe.setRecebIdFat(detalheDto.getRecebIdFat());
                detalhe.setIdFaturamento(detalheDto.getIdFaturamento());
                detalhe.setDataFatInprout(detalheDto.getDataFatInprout());
                detalhe.setSolitFsPortal(detalheDto.getSolitFsPortal());
                detalhe.setDataFs(detalheDto.getDataFs());
                detalhe.setNumFs(detalheDto.getNumFs());
                detalhe.setGate(detalheDto.getGate());
                detalhe.setGateId(detalheDto.getGateId());

                // Adiciona o detalhe recém-criado e preenchido à lista da OS.
                osExistente.getDetalhes().add(detalhe);
            }
        }

        // 5. Atualiza os campos de auditoria da OS principal.
        osExistente.setDataAtualizacao(LocalDateTime.now());
        osExistente.setUsuarioAtualizacao("sistema"); // No futuro, substitua pelo usuário logado

        // 6. Salva a entidade OS. O JPA, por causa do 'cascade', cuidará de
        // persistir a nova lista de detalhes (inserindo os novos e removendo os órfãos).
        return osRepository.save(osExistente);
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
        // 1. Busca a OS completa, incluindo a lista de detalhes
        OS os = osRepository.findById(osId)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o id: " + osId));

        // 2. Itera sobre a lista de 'detalhes' da OS, em vez da antiga lista de 'lpus'
        return os.getDetalhes().stream()
                .map(detalhe -> {
                    // 3. Pega a LPU a partir do objeto de detalhe
                    Lpu lpu = detalhe.getLpu();

                    // 4. A busca pelo último lançamento continua a mesma, usando os IDs da OS e da LPU
                    Lancamento ultimoLancamentoEntity = lancamentoRepository
                            .findFirstByOsIdAndLpuIdOrderByIdDesc(osId, lpu.getId())
                            .orElse(null);

                    LancamentoResponseDTO ultimoLancamentoDto = (ultimoLancamentoEntity != null)
                            ? new LancamentoResponseDTO(ultimoLancamentoEntity)
                            : null;

                    LpuResponseDTO lpuDto = new LpuResponseDTO(lpu);

                    // 5. Monta o DTO de resposta com a LPU e seu último lançamento
                    return new LpuComLancamentoDto(lpuDto, ultimoLancamentoDto);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void importarOsDePlanilha(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (rows.hasNext()) {
                rows.next(); // Pula o cabeçalho
            }

            Map<String, Segmento> segmentoMap = segmentoRepository.findAll().stream()
                    .collect(Collectors.toMap(s -> s.getNome().toUpperCase(), s -> s, (s1, s2) -> s1));

            Map<String, Lpu> lpuMap = lpuRepository.findAll().stream()
                    .filter(lpu -> lpu.getContrato() != null && lpu.getCodigoLpu() != null)
                    .collect(Collectors.toMap(
                            lpu -> (lpu.getContrato().getNome() + "::" + lpu.getCodigoLpu()).toUpperCase(),
                            Function.identity(),
                            (lpu1, lpu2) -> lpu1));

            // ETAPA 1: Ler todas as linhas e agrupar os detalhes por código da OS.
            Map<String, List<OsRequestDto.OsLpuDetalheRequestDto>> osDetalhesMap = new HashMap<>();
            Map<String, OsRequestDto> osGeraisMap = new HashMap<>();

            int numeroLinha = 1;
            while (rows.hasNext()) {
                numeroLinha++;
                Row currentRow = rows.next();
                if (isRowEmpty(currentRow)) continue;

                try {
                    OsRequestDto dtoDaLinha = criarDtoDaLinha(currentRow, segmentoMap, lpuMap);
                    if (dtoDaLinha == null || dtoDaLinha.getOs() == null || dtoDaLinha.getOs().isEmpty() || dtoDaLinha.getDetalhes().isEmpty()) {
                        continue; // Pula linhas inválidas
                    }
                    String osCode = dtoDaLinha.getOs();
                    OsRequestDto.OsLpuDetalheRequestDto detalhe = dtoDaLinha.getDetalhes().get(0);

                    osDetalhesMap.computeIfAbsent(osCode, k -> new ArrayList<>()).add(detalhe);
                    osGeraisMap.put(osCode, dtoDaLinha);

                } catch (Exception e) {
                    throw new IllegalArgumentException("Erro ao processar a linha " + numeroLinha + " da planilha: " + e.getMessage(), e);
                }
            }

            // ETAPA 2: Processar cada grupo de OS de uma vez.
            for (Map.Entry<String, List<OsRequestDto.OsLpuDetalheRequestDto>> entry : osDetalhesMap.entrySet()) {
                String osCode = entry.getKey();
                List<OsRequestDto.OsLpuDetalheRequestDto> detalhesDaOs = entry.getValue();

                // Primeiro, processa atualizações via KEY
                for (Iterator<OsRequestDto.OsLpuDetalheRequestDto> iterator = detalhesDaOs.iterator(); iterator.hasNext();) {
                    OsRequestDto.OsLpuDetalheRequestDto detalhe = iterator.next();
                    String key = detalhe.getKey();
                    if (key != null && !key.trim().isEmpty()) {
                        Optional<OsLpuDetalhes> detalheExistenteOpt = osLpuDetalhesRepository.findByKey(key);
                        if (detalheExistenteOpt.isPresent()) {
                            OsLpuDetalhes detalheParaAtualizar = detalheExistenteOpt.get();
                            mapearDtoParaDetalhe(detalhe, detalheParaAtualizar);
                            osLpuDetalhesRepository.save(detalheParaAtualizar);
                            iterator.remove(); // Remove da lista para não tentar criar de novo
                        }
                    }
                }

                if (detalhesDaOs.isEmpty()) {
                    continue; // Se todos foram atualizados, vai para a próxima OS
                }

                // Em seguida, processa as criações
                Optional<OS> osExistenteOpt = osRepository.findByOs(osCode);

                if (osExistenteOpt.isPresent()) {
                    // OS já existe: apenas adiciona os novos detalhes
                    OS osExistente = osExistenteOpt.get();
                    for (OsRequestDto.OsLpuDetalheRequestDto detalheParaCriar : detalhesDaOs) {
                        if (detalheParaCriar.getLpuId() == null) continue;

                        boolean detalheJaExiste = osExistente.getDetalhes().stream()
                                .anyMatch(d -> d.getLpu().getId().equals(detalheParaCriar.getLpuId()));

                        if (!detalheJaExiste) {
                            Lpu lpuParaAdicionar = lpuRepository.findById(detalheParaCriar.getLpuId())
                                    .orElseThrow(() -> new EntityNotFoundException("LPU com ID " + detalheParaCriar.getLpuId() + " não encontrada."));
                            OsLpuDetalhes novoDetalhe = new OsLpuDetalhes();
                            novoDetalhe.setOs(osExistente);
                            novoDetalhe.setLpu(lpuParaAdicionar);
                            mapearDtoParaDetalhe(detalheParaCriar, novoDetalhe);
                            osLpuDetalhesRepository.save(novoDetalhe);
                        }
                    }
                } else {
                    // OS não existe: cria a OS com todos os seus detalhes de uma vez
                    OsRequestDto osGeral = osGeraisMap.get(osCode);
                    OsRequestDto osCompletaDto = new OsRequestDto();
                    osCompletaDto.setOs(osCode);
                    osCompletaDto.setProjeto(osGeral.getProjeto());
                    osCompletaDto.setGestorTim(osGeral.getGestorTim());
                    osCompletaDto.setSegmentoId(osGeral.getSegmentoId());
                    osCompletaDto.setDetalhes(detalhesDaOs); // Adiciona todos os detalhes de uma vez

                    createOs(osCompletaDto);
                }
            }
        } catch (IOException e) {
            throw new IOException("Falha ao ler o arquivo. Pode estar corrompido.", e);
        }
    }

    private OsRequestDto criarDtoDaLinha(Row row, Map<String, Segmento> segmentoMap, Map<String, Lpu> lpuMap) {
        OsRequestDto osDto = new OsRequestDto();
        osDto.setOs(getStringCellValue(row, 0));
        osDto.setProjeto(getStringCellValue(row, 4));
        osDto.setGestorTim(getStringCellValue(row, 5));

        String nomeSegmento = getStringCellValue(row, 3).toUpperCase();
        Segmento segmento = segmentoMap.get(nomeSegmento);
        if (segmento != null) {
            osDto.setSegmentoId(segmento.getId());
        }

        OsRequestDto.OsLpuDetalheRequestDto detalheDto = new OsRequestDto.OsLpuDetalheRequestDto();

        String contratoDaLinha = getStringCellValue(row, 2).toUpperCase().trim();
        String codigoLpuDaLinha = getStringCellValue(row, 7).toUpperCase().trim();
        String chaveLpuComposta = contratoDaLinha + "::" + codigoLpuDaLinha;
        Lpu lpu = lpuMap.get(chaveLpuComposta);

        if (lpu != null) {
            detalheDto.setLpuId(lpu.getId());
            // Se o objeto contratado na planilha estiver vazio, usa o nome da LPU como padrão
            String objetoContratadoPlanilha = getStringCellValue(row, 12);
            detalheDto.setObjetoContratado(
                    objetoContratadoPlanilha.isEmpty() ? lpu.getNomeLpu() : objetoContratadoPlanilha
            );
        }

        // Mapeamento dos campos da linha para o DTO de detalhe
        detalheDto.setSite(getStringCellValue(row, 1));
        detalheDto.setContrato(getStringCellValue(row, 2));
        detalheDto.setRegional(getStringCellValue(row, 6));
        detalheDto.setLote(getStringCellValue(row, 8));
        detalheDto.setBoq(getStringCellValue(row, 9));
        detalheDto.setPo(getStringCellValue(row, 10));
        detalheDto.setItem(getStringCellValue(row, 11));
        detalheDto.setUnidade(getStringCellValue(row, 13));
        detalheDto.setQuantidade(getIntegerCellValue(row, 14));
        detalheDto.setValorTotal(getBigDecimalCellValue(row, 15));
        detalheDto.setObservacoes(getStringCellValue(row, 16));
        detalheDto.setDataPo(getLocalDateCellValue(row, 17));

        // Mapeamento dos campos de faturamento com seus índices atualizados
        detalheDto.setFaturamento(getStringCellValue(row, 38));
        detalheDto.setSolitIdFat(getStringCellValue(row, 39));
        detalheDto.setRecebIdFat(getStringCellValue(row, 40));
        detalheDto.setIdFaturamento(getStringCellValue(row, 41));
        detalheDto.setDataFatInprout(getLocalDateCellValue(row, 42));
        detalheDto.setSolitFsPortal(getStringCellValue(row, 43));
        detalheDto.setDataFs(getLocalDateCellValue(row, 44));
        detalheDto.setNumFs(getStringCellValue(row, 45));
        detalheDto.setGate(getStringCellValue(row, 46));
        detalheDto.setGateId(getStringCellValue(row, 47));

        detalheDto.setKey(getStringCellValue(row, 49));

        osDto.setDetalhes(List.of(detalheDto));

        return osDto;
    }

    private void mapearDtoParaDetalhe(OsRequestDto.OsLpuDetalheRequestDto dto, OsLpuDetalhes entidade) {
        entidade.setSite(dto.getSite());
        entidade.setContrato(dto.getContrato());
        entidade.setRegional(dto.getRegional());
        entidade.setLote(dto.getLote());
        entidade.setBoq(dto.getBoq());
        entidade.setPo(dto.getPo());
        entidade.setItem(dto.getItem());
        entidade.setObjetoContratado(dto.getObjetoContratado());
        entidade.setUnidade(dto.getUnidade());
        entidade.setQuantidade(dto.getQuantidade());
        entidade.setValorTotal(dto.getValorTotal());
        entidade.setObservacoes(dto.getObservacoes());
        entidade.setDataPo(dto.getDataPo());
        entidade.setFaturamento(dto.getFaturamento());
        entidade.setSolitIdFat(dto.getSolitIdFat());
        entidade.setRecebIdFat(dto.getRecebIdFat());
        entidade.setIdFaturamento(dto.getIdFaturamento());
        entidade.setDataFatInprout(dto.getDataFatInprout());
        entidade.setSolitFsPortal(dto.getSolitFsPortal());
        entidade.setDataFs(dto.getDataFs());
        entidade.setNumFs(dto.getNumFs());
        entidade.setGate(dto.getGate());
        entidade.setGateId(dto.getGateId());
        entidade.setKey(dto.getKey());
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

    private String getStringCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return new BigDecimal(cell.getNumericCellValue()).toPlainString();
        }
        return cell.getStringCellValue().trim();
    }

    private Integer getIntegerCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null || cell.getCellType() != CellType.NUMERIC) {
            return null;
        }
        return (int) cell.getNumericCellValue();
    }

    private BigDecimal getBigDecimalCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null || cell.getCellType() != CellType.NUMERIC) {
            return null;
        }
        return BigDecimal.valueOf(cell.getNumericCellValue());
    }

    private LocalDate getLocalDateCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();
            }
        }
        return null;
    }

}