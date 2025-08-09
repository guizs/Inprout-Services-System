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
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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

            // Mapeia Segmentos e LPUs para otimizar a busca
            Map<String, Segmento> segmentoMap = segmentoRepository.findAll().stream()
                    .collect(Collectors.toMap(s -> s.getNome().toUpperCase(), s -> s, (s1, s2) -> s1));

            Map<String, Lpu> lpuMap = lpuRepository.findAll().stream()
                    .filter(lpu -> lpu.getContrato() != null && lpu.getCodigoLpu() != null)
                    .collect(Collectors.toMap(
                            lpu -> (lpu.getContrato().getNome() + "::" + lpu.getCodigoLpu()).toUpperCase(),
                            Function.identity(),
                            (lpu1, lpu2) -> lpu1
                    ));

            int numeroLinha = 1; // Começamos a contar a partir da linha 2 (após o cabeçalho)
            while (rows.hasNext()) {
                numeroLinha++; // Incrementa o número da linha para cada iteração
                Row currentRow = rows.next();

                // Pula linhas completamente em branco
                if(isRowEmpty(currentRow)) continue;

                try {
                    OsRequestDto dto = criarDtoDaLinha(currentRow, segmentoMap, lpuMap);

                    if (dto == null || dto.getOs() == null || dto.getOs().isEmpty()) {
                        System.out.println("Pulando linha " + numeroLinha + " por falta de OS.");
                        continue;
                    }
                    if (dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
                        throw new IllegalArgumentException("A coluna LPU é obrigatória e não foi encontrada ou não corresponde a uma LPU existente para o contrato informado.");
                    }


                    Optional<OS> osExistenteOpt = osRepository.findByOs(dto.getOs());
                    Long lpuIdParaVerificar = dto.getLpuIds().get(0);

                    if (osExistenteOpt.isPresent()) {
                        OS osExistente = osExistenteOpt.get();
                        boolean lpuJaExisteNaOs = osExistente.getLpus().stream()
                                .anyMatch(lpu -> lpu.getId().equals(lpuIdParaVerificar));

                        if (!lpuJaExisteNaOs) {
                            Lpu lpuParaAdicionar = lpuRepository.findById(lpuIdParaVerificar)
                                    .orElseThrow(() -> new EntityNotFoundException("LPU com ID " + lpuIdParaVerificar + " não encontrada."));
                            osExistente.getLpus().add(lpuParaAdicionar);
                            osRepository.save(osExistente);
                        }
                    } else {
                        createOs(dto);
                    }
                } catch (Exception e) {
                    // --- ESSA É A MELHORIA PRINCIPAL ---
                    // Se ocorrer um erro, ele será encapsulado com o número da linha
                    throw new IllegalArgumentException("Erro ao processar a linha " + numeroLinha + " da planilha: " + e.getMessage(), e);
                }
            }
        } catch (IOException e) {
            throw new IOException("Falha ao ler o arquivo. Pode estar corrompido.", e);
        }
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

    private OsRequestDto criarDtoDaLinha(Row row, Map<String, Segmento> segmentoMap, Map<String, Lpu> lpuMap) {
        OsRequestDto dto = new OsRequestDto();

        String contratoDaLinha = getStringCellValue(row, 2).toUpperCase();
        String codigoLpuDaLinha = getStringCellValue(row, 7).toUpperCase();

        // Cria a chave composta para buscar no mapa de LPUs
        String chaveLpuComposta = contratoDaLinha + "::" + codigoLpuDaLinha;
        Lpu lpu = lpuMap.get(chaveLpuComposta);

        if (lpu != null) {
            dto.setLpuIds(List.of(lpu.getId()));
        }

        // O restante do mapeamento continua igual
        dto.setOs(getStringCellValue(row, 0));
        dto.setSite(getStringCellValue(row, 1));
        dto.setContrato(getStringCellValue(row, 2)); // Mantém o nome do contrato no DTO

        String nomeSegmento = getStringCellValue(row, 3).toUpperCase();
        Segmento segmento = segmentoMap.get(nomeSegmento);
        if (segmento != null) {
            dto.setSegmentoId(segmento.getId());
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

        return dto;
    }

    private String getStringCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            // Converte números para string sem o ".0"
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