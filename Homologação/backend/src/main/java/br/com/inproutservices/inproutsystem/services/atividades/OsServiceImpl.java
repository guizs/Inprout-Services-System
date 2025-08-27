package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LancamentoResponseDTO;
import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.index.LpuResponseDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.OsLpuDetalheRepository;
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
    private final OsLpuDetalheRepository osLpuDetalheRepository;

    public OsServiceImpl(OsRepository osRepository, LpuRepository lpuRepository, ContratoRepository contratoRepository, SegmentoRepository segmentoRepository, UsuarioRepository usuarioRepository, LancamentoRepository lancamentoRepository, OsLpuDetalheRepository osLpuDetalheRepository) {
        this.osRepository = osRepository;
        this.lpuRepository = lpuRepository;
        this.contratoRepository = contratoRepository;
        this.segmentoRepository = segmentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.lancamentoRepository = lancamentoRepository;
        this.osLpuDetalheRepository = osLpuDetalheRepository;
    }

    @Override
    @Transactional
    public OS createOs(OsRequestDto osDto) {
        // 1. Busca a OS pelo nome. Se não existir, cria uma nova.
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

                    // Define os campos de auditoria para a nova OS
                    novaOs.setDataCriacao(LocalDateTime.now());
                    novaOs.setUsuarioCriacao("sistema-import"); // Ou o usuário logado
                    novaOs.setStatusRegistro("ATIVO");
                    return novaOs;
                });

        // Define os campos de auditoria para atualização, caso a OS já exista
        osParaSalvar.setDataAtualizacao(LocalDateTime.now());
        osParaSalvar.setUsuarioAtualizacao("sistema-import"); // Ou o usuário logado

        // 2. Processa a lista de LPUs para criar as linhas de detalhe
        if (osDto.getLpuIds() != null && !osDto.getLpuIds().isEmpty()) {
            List<Lpu> lpusParaAssociar = lpuRepository.findAllById(osDto.getLpuIds());
            if (lpusParaAssociar.size() != osDto.getLpuIds().size()) {
                throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos não foram encontradas.");
            }

            for (Lpu lpu : lpusParaAssociar) {
                // Lógica para evitar duplicatas: verifica se já existe um detalhe para esta OS e LPU
                boolean detalheJaExiste = osParaSalvar.getDetalhes().stream()
                        .anyMatch(detalhe -> detalhe.getLpu().getId().equals(lpu.getId()));

                if (!detalheJaExiste) {
                    // 3. Cria uma nova entidade OsLpuDetalhe para cada LPU
                    OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();

                    // Associa o detalhe à OS e à LPU
                    novoDetalhe.setOs(osParaSalvar);
                    novoDetalhe.setLpu(lpu);

                    // Define a chave única. Ex: "OS-123_LPU-45"
                    novoDetalhe.setKey(osDto.getOs() + "_" + lpu.getId());

                    novoDetalhe.setObjetoContratado(lpu.getNomeLpu());

                    // Copia todos os campos de detalhe do DTO para a nova entidade
                    novoDetalhe.setSite(osDto.getSite());
                    novoDetalhe.setContrato(osDto.getContrato());
                    novoDetalhe.setRegional(osDto.getRegional());
                    novoDetalhe.setLote(osDto.getLote());
                    novoDetalhe.setBoq(osDto.getBoq());
                    novoDetalhe.setPo(osDto.getPo());
                    novoDetalhe.setItem(osDto.getItem());
                    novoDetalhe.setObjetoContratado(osDto.getObjetoContratado());
                    novoDetalhe.setUnidade(osDto.getUnidade());
                    novoDetalhe.setQuantidade(osDto.getQuantidade());
                    novoDetalhe.setValorTotal(osDto.getValorTotal());
                    novoDetalhe.setObservacoes(osDto.getObservacoes());
                    novoDetalhe.setDataPo(osDto.getDataPo());

                    // Adiciona o novo detalhe à lista da OS
                    osParaSalvar.getDetalhes().add(novoDetalhe);
                }
            }
        }

        // 4. Salva a OS. Devido ao CascadeType.ALL, os novos detalhes também serão salvos.
        return osRepository.save(osParaSalvar);
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
        // 1. Busca a OS existente que será atualizada
        OS existingOs = osRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o ID: " + id));

        // 2. Atualiza os campos que pertencem diretamente à OS
        existingOs.setOs(osDto.getOs());
        existingOs.setProjeto(osDto.getProjeto());
        existingOs.setGestorTim(osDto.getGestorTim());

        if (osDto.getSegmentoId() != null) {
            Segmento segmento = segmentoRepository.findById(osDto.getSegmentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + osDto.getSegmentoId()));
            existingOs.setSegmento(segmento);
        }

        // 3. Gerencia as linhas de detalhe (OsLpuDetalhe)
        if (osDto.getLpuIds() != null) {
            // Pega a lista de todas as LPUs que devem estar associadas
            List<Lpu> lpusDesejadas = lpuRepository.findAllById(osDto.getLpuIds());
            if (lpusDesejadas.size() != osDto.getLpuIds().size()) {
                throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos para atualização não foram encontradas.");
            }

            // Mapeia os detalhes existentes por LPU ID para fácil acesso
            Map<Long, OsLpuDetalhe> detalhesExistentesMap = existingOs.getDetalhes().stream()
                    .collect(Collectors.toMap(detalhe -> detalhe.getLpu().getId(), detalhe -> detalhe));

            // Remove os detalhes que não estão mais na lista de lpuIds
            existingOs.getDetalhes().removeIf(detalhe ->
                    !osDto.getLpuIds().contains(detalhe.getLpu().getId())
            );

            // Atualiza os detalhes existentes e adiciona novos
            for (Lpu lpu : lpusDesejadas) {
                OsLpuDetalhe detalhe = detalhesExistentesMap.get(lpu.getId());

                if (detalhe != null) {
                    // O detalhe já existe, então ATUALIZA seus campos
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
                    // O detalhe não existe, então CRIA um novo
                    OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();
                    novoDetalhe.setOs(existingOs);
                    novoDetalhe.setLpu(lpu);
                    novoDetalhe.setKey(existingOs.getOs() + "_" + lpu.getId());

                    // Copia os dados do DTO para o novo detalhe
                    novoDetalhe.setSite(osDto.getSite());
                    novoDetalhe.setContrato(osDto.getContrato());
                    // ... (copie todos os outros campos de detalhe do osDto para o novoDetalhe) ...

                    existingOs.getDetalhes().add(novoDetalhe);
                }
            }
        }

        // 4. Define os campos de auditoria
        existingOs.setDataAtualizacao(LocalDateTime.now());
        existingOs.setUsuarioAtualizacao("sistema"); // Idealmente, o nome do usuário logado

        // 5. Salva a OS. O Cascade salvará, atualizará e removerá os detalhes conforme necessário.
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
        // 1. Busca a OS para garantir que ela existe.
        OS os = osRepository.findById(osId)
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada com o id: " + osId));

        // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
        // 2. Itera sobre a lista de 'detalhes' da OS, que é a nova estrutura.
        return os.getDetalhes().stream()
                .map(detalhe -> {
                    // 3. Para cada detalhe, encontra o último lançamento APROVADO.
                    // A lógica é feita em memória, buscando na lista de lançamentos do detalhe.
                    Lancamento ultimoLancamentoAprovado = detalhe.getLancamentos().stream()
                            .filter(lancamento -> lancamento.getSituacaoAprovacao() == SituacaoAprovacao.APROVADO)
                            .max(Comparator.comparing(Lancamento::getId)) // Encontra o mais recente pelo ID
                            .orElse(null);

                    // 4. Cria os DTOs necessários para a resposta.
                    LancamentoResponseDTO ultimoLancamentoDto = (ultimoLancamentoAprovado != null)
                            ? new LancamentoResponseDTO(ultimoLancamentoAprovado)
                            : null;

                    LpuResponseDTO lpuDto = new LpuResponseDTO(detalhe.getLpu());

                    // Retorna o DTO combinado que o frontend espera.
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
                rows.next(); // Pula o cabeçalho da planilha
            }

            // Mapeia Segmentos e LPUs para otimizar buscas no banco de dados
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
                    OsRequestDto dto = criarDtoDaLinha(currentRow, segmentoMap, lpuMap);

                    if (dto == null || dto.getOs() == null || dto.getOs().isEmpty()) {
                        System.out.println("Pulando linha " + numeroLinha + " por falta de OS.");
                        continue;
                    }
                    if (dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
                        throw new IllegalArgumentException("A coluna LPU é obrigatória e não foi encontrada ou não corresponde a uma LPU existente para o contrato informado.");
                    }

                    // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---

                    // 1. Busca a OS pelo nome. Se não existir, o 'createOs' será chamado.
                    Optional<OS> osExistenteOpt = osRepository.findByOs(dto.getOs());

                    // Pega o ID da LPU da linha atual da planilha
                    Long lpuIdParaVerificar = dto.getLpuIds().get(0);

                    if (osExistenteOpt.isPresent()) {
                        // A OS JÁ EXISTE: Verificamos se a linha de detalhe para esta LPU já existe.
                        OS osExistente = osExistenteOpt.get();

                        boolean detalheJaExiste = osExistente.getDetalhes().stream()
                                .anyMatch(detalhe -> detalhe.getLpu().getId().equals(lpuIdParaVerificar));

                        if (!detalheJaExiste) {
                            // O detalhe NÃO existe, então criamos um novo e o adicionamos à OS.
                            Lpu lpuParaAdicionar = lpuRepository.findById(lpuIdParaVerificar)
                                    .orElseThrow(() -> new EntityNotFoundException("LPU com ID " + lpuIdParaVerificar + " não encontrada."));

                            OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();
                            novoDetalhe.setOs(osExistente);
                            novoDetalhe.setLpu(lpuParaAdicionar);
                            novoDetalhe.setKey(osExistente.getOs() + "_" + lpuParaAdicionar.getId());

                            novoDetalhe.setObjetoContratado(lpuParaAdicionar.getNomeLpu());

                            // Copia todos os outros campos do DTO para a nova linha de detalhe
                            novoDetalhe.setSite(dto.getSite());
                            novoDetalhe.setContrato(dto.getContrato());
                            novoDetalhe.setRegional(dto.getRegional());
                            novoDetalhe.setLote(dto.getLote());
                            novoDetalhe.setBoq(dto.getBoq());
                            novoDetalhe.setPo(dto.getPo());
                            novoDetalhe.setItem(dto.getItem());
                            novoDetalhe.setObjetoContratado(dto.getObjetoContratado());
                            novoDetalhe.setUnidade(dto.getUnidade());
                            novoDetalhe.setQuantidade(dto.getQuantidade());
                            novoDetalhe.setValorTotal(dto.getValorTotal());
                            novoDetalhe.setObservacoes(dto.getObservacoes());
                            novoDetalhe.setDataPo(dto.getDataPo());

                            osExistente.getDetalhes().add(novoDetalhe);
                            osRepository.save(osExistente); // Salva a OS, e o cascade salva o novo detalhe.
                        }
                        // Se o detalhe já existe, não fazemos nada, pulando para a próxima linha.
                    } else {
                        // A OS NÃO EXISTE: Chamamos o método createOs, que já está corrigido.
                        createOs(dto);
                    }
                } catch (Exception e) {
                    throw new IllegalArgumentException("Erro ao processar a linha " + numeroLinha + " da planilha: " + e.getMessage(), e);
                }
            }
        } catch (IOException e) {
            throw new IOException("Falha ao ler o arquivo. Pode estar corrompido.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OS> findAllWithDetails() {
        // 1. Primeira busca: Traz as OSs e seus detalhes (mas sem os lançamentos)
        List<OS> oss = osRepository.findAllWithDetails();

        if (oss.isEmpty()) {
            return oss; // Retorna a lista vazia se não houver OSs
        }

        // 2. Pega os IDs das OSs encontradas
        List<Long> osIds = oss.stream().map(OS::getId).collect(Collectors.toList());

        // 3. Segunda busca: Traz TODOS os detalhes com seus lançamentos de uma vez só
        List<OsLpuDetalhe> detalhesComLancamentos = osLpuDetalheRepository.findAllWithLancamentosByOsIds(osIds);

        // Este passo é opcional, mas garante que os objetos estão corretamente montados em memória.
        // O Hibernate geralmente já faz isso sozinho, mas é uma boa prática.
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