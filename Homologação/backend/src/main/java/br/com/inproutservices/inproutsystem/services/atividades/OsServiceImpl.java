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

    // REMOVIDO: private final OsService osService;

    // CONSTRUTOR CORRIGIDO: Removida a injeção de OsService
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

        OsLpuDetalhe osLpuDetalhe = null;

        if (osDto.getLpuIds() != null && !osDto.getLpuIds().isEmpty()) {
            List<Lpu> lpusParaAssociar = lpuRepository.findAllById(osDto.getLpuIds());
            if (lpusParaAssociar.size() != osDto.getLpuIds().size()) {
                throw new EntityNotFoundException("Uma ou mais LPUs com os IDs fornecidos não foram encontradas.");
            }

            for (Lpu lpu : lpusParaAssociar) {
                osLpuDetalhe = osParaSalvar.getDetalhes().stream()
                        .filter(detalhe -> detalhe.getLpu().getId().equals(lpu.getId()))
                        .findFirst()
                        .orElseGet(() -> {
                            OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();
                            novoDetalhe.setOs(osParaSalvar);
                            novoDetalhe.setLpu(lpu);
                            novoDetalhe.setKey(osDto.getKey()); // Pega a KEY do DTO
                            novoDetalhe.setObjetoContratado(lpu.getNomeLpu());
                            osParaSalvar.getDetalhes().add(novoDetalhe);
                            return novoDetalhe;
                        });

                // Preenche todos os campos atualizáveis
                osLpuDetalhe.setSite(osDto.getSite());
                osLpuDetalhe.setContrato(osDto.getContrato());
                osLpuDetalhe.setRegional(osDto.getRegional());
                osLpuDetalhe.setLote(osDto.getLote());
                osLpuDetalhe.setBoq(osDto.getBoq());
                osLpuDetalhe.setPo(osDto.getPo());
                osLpuDetalhe.setItem(osDto.getItem());
                osLpuDetalhe.setUnidade(osDto.getUnidade());
                osLpuDetalhe.setQuantidade(osDto.getQuantidade());
                osLpuDetalhe.setValorTotal(osDto.getValorTotal());
                osLpuDetalhe.setObservacoes(osDto.getObservacoes());
                osLpuDetalhe.setDataPo(osDto.getDataPo());

                // Preenche os campos de faturamento
                osLpuDetalhe.setFaturamento(osDto.getFaturamento());
                osLpuDetalhe.setSolitIdFat(osDto.getSolitIdFat());
                osLpuDetalhe.setRecebIdFat(osDto.getRecebIdFat());
                osLpuDetalhe.setIdFaturamento(osDto.getIdFaturamento());
                osLpuDetalhe.setDataFatInprout(osDto.getDataFatInprout());
                osLpuDetalhe.setSolitFsPortal(osDto.getSolitFsPortal());
                osLpuDetalhe.setDataFs(osDto.getDataFs());
                osLpuDetalhe.setNumFs(osDto.getNumFs());
                osLpuDetalhe.setGate(osDto.getGate());
                osLpuDetalhe.setGateId(osDto.getGateId());
            }
        }
        osRepository.save(osParaSalvar);
        return osLpuDetalhe;
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
        String chaveLpuComposta = contratoDaLinha + "::" + codigoLpuDaLinha;
        Lpu lpu = lpuMap.get(chaveLpuComposta);
        if (lpu != null) {
            dto.setLpuIds(List.of(lpu.getId()));
        }

        // Mapeamento baseado na sua lista de colunas
        dto.setOs(getStringCellValue(row, 0));
        dto.setSite(getStringCellValue(row, 1));
        dto.setContrato(getStringCellValue(row, 2));

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

        // Faturamento
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

        // KEY
        dto.setKey(getStringCellValue(row, 49));

        return dto;
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

            // Cache para otimizar buscas no banco
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

                    if (dto == null || dto.getKey() == null || dto.getKey().isBlank()) {
                        System.out.println("Pulando linha " + numeroLinha + " por falta de KEY.");
                        continue;
                    }

                    Optional<OsLpuDetalhe> detalheExistenteOpt = osLpuDetalheRepository.findByKey(dto.getKey());

                    if (detalheExistenteOpt.isPresent()) {
                        // A KEY JÁ EXISTE: ATUALIZAR
                        OsLpuDetalhe detalheExistente = detalheExistenteOpt.get();

                        // Atualiza os campos de detalhe editáveis
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

                        // --- INÍCIO DA CORREÇÃO ---
                        // Adiciona a atualização dos campos de faturamento que estava faltando
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
                        // --- FIM DA CORREÇÃO ---

                        osLpuDetalheRepository.save(detalheExistente);

                    } else {
                        // A KEY NÃO EXISTE: CRIAR
                        if (dto.getOs() == null || dto.getOs().isEmpty() || dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
                            throw new IllegalArgumentException("Para criar um novo registro (KEY não encontrada), as colunas OS, Contrato e LPU são obrigatórias.");
                        }
                        this.createOs(dto); // CHAMADA CORRIGIDA
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
    @Transactional
    public void processarLinhaDePlanilha(Map<String, Object> rowData) {
        // 1. Cria os mapas de cache, assim como fazemos no processamento em lote.
        //    Isso é menos eficiente para uma única linha, mas garante que o código funcione.
        Map<String, Segmento> segmentoMap = segmentoRepository.findAll().stream()
                .collect(Collectors.toMap(s -> s.getNome().toUpperCase(), s -> s, (s1, s2) -> s1));
        Map<String, Lpu> lpuMap = lpuRepository.findAll().stream()
                .filter(lpu -> lpu.getContrato() != null && lpu.getCodigoLpu() != null)
                .collect(Collectors.toMap(
                        lpu -> (lpu.getContrato().getNome() + "::" + lpu.getCodigoLpu()).toUpperCase(),
                        Function.identity(),
                        (lpu1, lpu2) -> lpu1
                ));

        // 2. Agora a chamada para 'criarDtoDoMapa' inclui os mapas, correspondendo à assinatura do método.
        OsRequestDto dto = criarDtoDoMapa(rowData, segmentoMap, lpuMap);

        if (dto == null || dto.getKey() == null || dto.getKey().isBlank()) {
            throw new IllegalArgumentException("A coluna 'KEY' é obrigatória e não pode estar vazia.");
        }

        // 3. O resto da lógica de "upsert" permanece a mesma.
        Optional<OsLpuDetalhe> detalheExistenteOpt = osLpuDetalheRepository.findByKey(dto.getKey());

        if (detalheExistenteOpt.isPresent()) {
            // ATUALIZAR
            OsLpuDetalhe detalheExistente = detalheExistenteOpt.get();
            detalheExistente.setSite(dto.getSite());
            detalheExistente.setRegional(dto.getRegional());
            // ... (copie todos os outros campos atualizáveis aqui)
            detalheExistente.setFaturamento(dto.getFaturamento());
            detalheExistente.setSolitIdFat(dto.getSolitIdFat());
            // ... etc ...
            osLpuDetalheRepository.save(detalheExistente);
        } else {
            // CRIAR
            if (dto.getOs() == null || dto.getOs().isEmpty() || dto.getContrato() == null || dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
                throw new IllegalArgumentException("Para criar um novo registro (KEY não encontrada), as colunas OS, Contrato e LPU são obrigatórias.");
            }
            this.createOs(dto); // CHAMADA CORRIGIDA
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

        // Lógica para encontrar Segmento e LPU usando os mapas em cache
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

    // Funções auxiliares para extrair e converter tipos do Mapa com segurança
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
        // Verifica se o valor é um número (seja Integer, Double, etc.)
        if (val instanceof Number) {
            // Converte o valor para double de forma segura antes de usar
            return DateUtil.getJavaDate(((Number) val).doubleValue()).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        // Retorna nulo se não for um número (outros formatos não são suportados)
        return null;
    }

    @Override
    @Transactional
    public List<String> processarLoteDePlanilha(List<Map<String, Object>> loteDeLinhas) {
        List<String> erros = new ArrayList<>();

        // Cache para otimizar buscas, evitando múltiplas chamadas ao banco dentro do loop
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
                // A chamada para a função agora está correta
                OsRequestDto dto = criarDtoDoMapa(rowData, segmentoMap, lpuMap);

                if (dto == null || dto.getKey() == null || dto.getKey().isBlank()) {
                    erros.add("Linha " + i + " no lote: A coluna 'KEY' é obrigatória.");
                    continue;
                }

                Optional<OsLpuDetalhe> detalheExistenteOpt = osLpuDetalheRepository.findByKey(dto.getKey());

                if (detalheExistenteOpt.isPresent()) {
                    // LÓGICA DE ATUALIZAÇÃO
                    OsLpuDetalhe detalheExistente = detalheExistenteOpt.get();
                    // ... (a lógica de atualização que já tínhamos)
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
                    // LÓGICA DE CRIAÇÃO
                    if (dto.getOs() == null || dto.getOs().isEmpty() || dto.getContrato() == null || dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
                        throw new IllegalArgumentException("Para criar novo registro (KEY não encontrada), as colunas OS, Contrato e LPU são obrigatórias.");
                    }
                    this.createOs(dto); // CHAMADA CORRIGIDA
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
        novoDetalhe.setKey("COMPLEMENTAR_" + os.getOs() + "_" + lpu.getId() + "_" + System.currentTimeMillis());
        novoDetalhe.setQuantidade(quantidade);
        novoDetalhe.setObjetoContratado(lpu.getNomeLpu());

        // Copia dados do primeiro detalhe da OS como base
        os.getDetalhes().stream().findFirst().ifPresent(base -> {
            novoDetalhe.setSite(base.getSite());
            novoDetalhe.setContrato(base.getContrato());
            novoDetalhe.setRegional(base.getRegional());
        });


        return osLpuDetalheRepository.save(novoDetalhe);
    }
}