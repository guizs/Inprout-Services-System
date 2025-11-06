// Em: backend/src/main/java/br/com/inproutservices/inproutsystem/services/atividades/OsServiceImpl.java

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

                // --- INÍCIO DA CORREÇÃO ---
                Integer quantidade = osDto.getQuantidade();
                detalheCriado.setQuantidade(quantidade);
                BigDecimal valorTotalPlanilha = osDto.getValorTotal();

                // Se o valor total não foi informado na planilha, o sistema calcula.
                if (valorTotalPlanilha == null || valorTotalPlanilha.compareTo(BigDecimal.ZERO) == 0) {
                    if (quantidade != null && quantidade > 0 && lpu.getValorSemImposto() != null) {
                        // Cálculo: valor da LPU * quantidade
                        BigDecimal valorCalculado = lpu.getValorSemImposto().multiply(new BigDecimal(quantidade));
                        detalheCriado.setValorTotal(valorCalculado);
                    } else {
                        // Se não for possível calcular, o valor fica como zero.
                        detalheCriado.setValorTotal(BigDecimal.ZERO);
                    }
                } else {
                    // Se o valor foi informado na planilha, ele é utilizado.
                    detalheCriado.setValorTotal(valorTotalPlanilha);
                }
                // --- FIM DA CORREÇÃO ---

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
        // Busca o detalhe que será excluído
        OsLpuDetalhe detalhe = osLpuDetalheRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de detalhe da OS não encontrado com o ID: " + id));

        OS osPai = detalhe.getOs(); // Pega a OS "pai" antes de excluir o filho

        // Exclui permanentemente o registro (detalhe) do banco de dados
        osLpuDetalheRepository.delete(detalhe);

        // Força o Hibernate a executar a exclusão no banco de dados imediatamente
        osLpuDetalheRepository.flush();

        // Verifica se a OS "pai" ainda tem algum outro detalhe associado a ela
        if (osLpuDetalheRepository.countByOs(osPai) == 0) {
            // Se não houver mais nenhum detalhe, exclui a OS "pai" também
            osRepository.delete(osPai);
        }
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

    // =================================================================================
    // INÍCIO DAS FUNÇÕES DE IMPORTAÇÃO CORRIGIDAS
    // =================================================================================

    /**
     * Adiciona uma nova função helper para preencher com "-"
     */
    private String getStringCellValue(Row row, int cellIndex, boolean preencherVazioComHifen) {
        String valor = getStringCellValue(row, cellIndex); // Usa o método que já existe
        if (preencherVazioComHifen && (valor == null || valor.isBlank())) {
            return "-";
        }
        return valor;
    }

    /**
     * MÉTODO ATUALIZADO (O que você pediu)
     * Método corrigido para criar o DTO da linha da planilha, aplicando as regras de negócio.
     * Regra 1 (Campos Chave): OS, KEY, Projeto, Segmento, LPU, Cod. Prestador, Gestor
     * não são preenchidos com '-'.
     * Regra 2 (Campos de Texto): Todos os outros campos de texto são preenchidos
     * com '-' se estiverem vazios.
     * Regra 3 (Legado): Lê o nomeGestorLancamento (coluna 35) se isLegado for true.
     */
    private OsRequestDto criarDtoDaLinha(Row row, Map<String, Segmento> segmentoMap, Map<String, Lpu> lpuMap, boolean isLegado) {
        OsRequestDto dto = new OsRequestDto();
        String valor; // Variável auxiliar para aplicar a regra do hífen

        // --- Lógica de LPU (Campos de Busca - não usam '-') ---
        String contratoDaLinha = getStringCellValue(row, 2, false); // Coluna 2: CONTRATO
        if (contratoDaLinha != null && !contratoDaLinha.isBlank()) {
            String codigoLpuDaLinha = getStringCellValue(row, 7, false); // Coluna 7: LPU
            if (codigoLpuDaLinha != null && !codigoLpuDaLinha.isBlank()) {
                String chaveLpuComposta = (contratoDaLinha + "::" + codigoLpuDaLinha).toUpperCase();
                Lpu lpu = lpuMap.get(chaveLpuComposta);
                if (lpu != null) {
                    dto.setLpuIds(List.of(lpu.getId()));
                }
            }
        }
        dto.setContrato(contratoDaLinha); // Salva o contrato (nulo ou com valor)

        // --- Campos de Lógica (não usam '-') ---
        dto.setOs(getStringCellValue(row, 0, false)); // Coluna 0: OS
        dto.setProjeto(getStringCellValue(row, 4, false)); // Coluna 4: PROJETO
        dto.setKey(getStringCellValue(row, 49, false)); // Coluna 49: KEY

        // Coluna 3: SEGMENTO (Busca)
        String nomeSegmento = getStringCellValue(row, 3, false);
        if (nomeSegmento != null && !nomeSegmento.isBlank()) {
            Segmento segmento = segmentoMap.get(nomeSegmento.toUpperCase());
            if (segmento != null) {
                dto.setSegmentoId(segmento.getId());
            }
        }

        // --- Campos Cadastrais (usar '-' se vazio) ---
        valor = getStringCellValue(row, 1); // Coluna 1: SITE
        dto.setSite((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 5); // Coluna 5: GESTOR TIM
        dto.setGestorTim((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 6); // Coluna 6: REGIONAL
        dto.setRegional((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 8); // Coluna 8: LOTE
        dto.setLote((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 9); // Coluna 9: BOQ
        dto.setBoq((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 10); // Coluna 10: PO
        dto.setPo((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 11); // Coluna 11: ITEM
        dto.setItem((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 12); // Coluna 12: OBJETO CONTRATADO
        dto.setObjetoContratado((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 13); // Coluna 13: UNIDADE
        dto.setUnidade((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 16); // Coluna 16: OBSERVAÇÕES
        dto.setObservacoes((valor == null || valor.isBlank()) ? "-" : valor);

        // --- Campos Numéricos e de Data (tratam nulo por padrão) ---
        dto.setQuantidade(getIntegerCellValue(row, 14)); // Coluna 14: QUANTIDADE
        dto.setValorTotal(getBigDecimalCellValue(row, 15)); // Coluna 15: VALOR TOTAL OS
        dto.setDataPo(getLocalDateCellValue(row, 17)); // Coluna 17: DATA PO

        // --- Campos de Faturamento (usar '-' se vazio) ---
        valor = getStringCellValue(row, 38); // Coluna 38: FATURAMENTO
        dto.setFaturamento((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 39); // Coluna 39: SOLICIT ID FAT
        dto.setSolitIdFat((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 40); // Coluna 40: RECEB ID FAT
        dto.setRecebIdFat((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 41); // Coluna 41: ID FATURAMENTO
        dto.setIdFaturamento((valor == null || valor.isBlank()) ? "-" : valor);

        dto.setDataFatInprout(getLocalDateCellValue(row, 42)); // Coluna 42: DATA FAT INPROUT

        valor = getStringCellValue(row, 43); // Coluna 43: SOLICIT FS PORTAL
        dto.setSolitFsPortal((valor == null || valor.isBlank()) ? "-" : valor);

        dto.setDataFs(getLocalDateCellValue(row, 44)); // Coluna 44: DATA FS

        valor = getStringCellValue(row, 45); // Coluna 45: NUM FS
        dto.setNumFs((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 46); // Coluna 46: GATE
        dto.setGate((valor == null || valor.isBlank()) ? "-" : valor);

        valor = getStringCellValue(row, 47); // Coluna 47: GATE ID
        dto.setGateId((valor == null || valor.isBlank()) ? "-" : valor);

        // --- Campos de Legado (só preenche se a flag for true) ---
        if (isLegado) {
            valor = getStringCellValue(row, 18); // Coluna 18: VISTORIA
            dto.setVistoria((valor == null || valor.isBlank()) ? "-" : valor);
            dto.setPlanoVistoria(getLocalDateCellValue(row, 19)); // Coluna 19: PLANO VISTORIA

            valor = getStringCellValue(row, 20); // Coluna 20: DESMOBILIZAÇÃO
            dto.setDesmobilizacao((valor == null || valor.isBlank()) ? "-" : valor);
            dto.setPlanoDesmobilizacao(getLocalDateCellValue(row, 21)); // Coluna 21: PLANO DESMOBILIZAÇÃO

            valor = getStringCellValue(row, 22); // Coluna 22: INSTALAÇÃO
            dto.setInstalacao((valor == null || valor.isBlank()) ? "-" : valor);
            dto.setPlanoInstalacao(getLocalDateCellValue(row, 23)); // Coluna 23: PLANO INSTALAÇÃO

            valor = getStringCellValue(row, 24); // Coluna 24: ATIVAÇÃO
            dto.setAtivacao((valor == null || valor.isBlank()) ? "-" : valor);
            dto.setPlanoAtivacao(getLocalDateCellValue(row, 25)); // Coluna 25: PLANO ATIVAÇÃO

            valor = getStringCellValue(row, 26); // Coluna 26: DOCUMENTAÇÃO
            dto.setDocumentacao((valor == null || valor.isBlank()) ? "-" : valor);
            dto.setPlanoDocumentacao(getLocalDateCellValue(row, 27)); // Coluna 27: PLANO DOCUMENTAÇÃO

            // --- Campos de Lançamento (Busca/Lógica - não usam '-') ---
            dto.setNomeEtapaDetalhada(getStringCellValue(row, 29, false)); // Coluna 29: ETAPA DETALHADA
            dto.setStatusLancamento(getStringCellValue(row, 30, false)); // Coluna 30: STATUS
            dto.setCodigoPrestador(getStringCellValue(row, 32, false)); // Coluna 32: CÓD. PRESTADOR
            dto.setNomeGestorLancamento(getStringCellValue(row, 35, false)); // Coluna 35: GESTOR
            dto.setSituacaoLancamento(getStringCellValue(row, 36, false)); // Coluna 36: SITUAÇÃO

            // --- Campos de Lançamento (Texto Livre - usam '-') ---
            valor = getStringCellValue(row, 31); // Coluna 31: DETALHE DIÁRIO
            dto.setDetalheDiario((valor == null || valor.isBlank()) ? "-" : valor);

            // --- Campos de Lançamento (Numérico/Data - não usam '-') ---
            dto.setValorLancamento(getBigDecimalCellValue(row, 34)); // Coluna 34: VALOR
            dto.setDataAtividadeLancamento(getLocalDateCellValue(row, 37)); // Coluna 37: DATA ATIVIDADE
        }

        return dto;
    }

    @Override
    @Transactional
    public List<OS> importarOsDePlanilha(MultipartFile file, boolean isLegado) throws IOException {
        return importarOsDePlanilha(file, isLegado, new ArrayList<>());
    }

    /**
     * MÉTODO ATUALIZADO (Correção do Erro Lambda)
     */
    @Override
    @Transactional
    public List<OS> importarOsDePlanilha(MultipartFile file, boolean isLegado, List<String> warnings) throws IOException {
        Set<Long> affectedOsIds = new HashSet<>();
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

                // ===================================================================
                // INÍCIO DA CORREÇÃO (Erro Lambda)
                // ===================================================================
                // Cria uma cópia final da variável para ser usada dentro de lambdas
                final int currentRowNum = numeroLinha;
                // ===================================================================
                // FIM DA CORREÇÃO (Erro Lambda)
                // ===================================================================

                try {
                    OsRequestDto dto = criarDtoDaLinha(currentRow, segmentoMap, lpuMap, isLegado);
                    String osPlanilha = dto.getOs();
                    String keyPlanilha = dto.getKey();
                    String projetoPlanilha = dto.getProjeto();

                    // ===================================================================
                    // INÍCIO DA LÓGICA REFEITA BASEADA NOS 3 CENÁRIOS
                    // ===================================================================

                    if (isLegado) {
                        // *** CENÁRIO 3: SUBIDA DE LEGADO (Flag está ON) ***
                        if (osPlanilha == null || osPlanilha.isBlank()) {
                            warnings.add("Linha " + currentRowNum + ": IGNORADA. A flag 'Importar Legado' está ativa, mas a coluna 'OS' está em branco.");
                            continue;
                        }

                        // Encontra ou Cria a OS "Pai"
                        OS osPai = osRepository.findByOs(osPlanilha)
                                .orElseGet(() -> {
                                    warnings.add("Linha " + currentRowNum + ": OS '" + osPlanilha + "' não encontrada. Criando nova OS.");
                                    OS novaOs = new OS();
                                    novaOs.setOs(osPlanilha);
                                    novaOs.setProjeto(dto.getProjeto());
                                    novaOs.setGestorTim(dto.getGestorTim());
                                    if (dto.getSegmentoId() != null) {
                                        novaOs.setSegmento(segmentoRepository.findById(dto.getSegmentoId()).orElse(null));
                                    }
                                    novaOs.setDataCriacao(LocalDateTime.now());
                                    novaOs.setUsuarioCriacao("sistema-import-legado");
                                    novaOs.setStatusRegistro("ATIVO");
                                    return osRepository.save(novaOs);
                                });

                        // Cria o *novo item* (OsLpuDetalhe) e o Lançamento Legado
                        OsLpuDetalhe novoDetalheLegado = criarNovoDetalheParaOS(osPai, dto, currentRowNum, warnings); // Passa 'currentRowNum'
                        criarOuAtualizarLancamentoLegado(novoDetalheLegado, dto, isLegado, warnings, currentRowNum); // Passa 'currentRowNum'

                        affectedOsIds.add(osPai.getId());

                    } else if (keyPlanilha != null && !keyPlanilha.isBlank()) {
                        // *** CENÁRIO 2: ATUALIZAÇÃO CADASTRAL (Flag está OFF, KEY existe) ***

                        Optional<OsLpuDetalhe> detalheExistenteOpt = osLpuDetalheRepository.findByKey(keyPlanilha);

                        if (detalheExistenteOpt.isPresent()) {
                            // Encontrou a KEY, vamos ATUALIZAR
                            OsLpuDetalhe detalheExistente = detalheExistenteOpt.get();
                            // Passa 'isLegado' como 'false' para não tocar no lançamento
                            atualizarDetalheExistente(detalheExistente, dto, false, warnings, currentRowNum); // Passa 'currentRowNum'
                            affectedOsIds.add(detalheExistente.getOs().getId());
                        } else {
                            // KEY não encontrada, mas foi fornecida.
                            warnings.add("Linha " + currentRowNum + ": IGNORADA. A KEY '" + keyPlanilha + "' foi fornecida, mas não foi encontrada no sistema para atualização. (A flag 'Importar Legado' está desmarcada).");
                        }

                    } else if (osPlanilha == null || osPlanilha.isBlank()) {
                        // *** CENÁRIO 1: CRIAÇÃO AUTOMÁTICA DE OS (Flag OFF, OS e KEY em branco) ***

                        if (projetoPlanilha == null || projetoPlanilha.isBlank()) {
                            warnings.add("Linha " + currentRowNum + ": IGNORADA. Para geração automática de OS, a coluna 'PROJETO' não pode estar em branco.");
                            continue;
                        }

                        OS osPai;
                        String projetoUpper = projetoPlanilha.toUpperCase();

                        if (osPorProjetoCache.containsKey(projetoUpper)) {
                            // Reutiliza a OS recém-criada para este projeto
                            osPai = osPorProjetoCache.get(projetoUpper);
                            warnings.add("Linha " + currentRowNum + ": Adicionando item à OS '" + osPai.getOs() + "' (criada automaticamente para o projeto '" + projetoPlanilha + "').");
                        } else {
                            // É a primeira linha deste projeto, precisa criar uma nova OS

                            // --- INÍCIO DA CORREÇÃO Cenário 1 (Busca por Projeto) ---
                            // Verifica se já existe uma OS para esse projeto
                            Optional<OS> osExistenteOpt = osRepository.findByProjeto(dto.getProjeto());
                            if (osExistenteOpt.isPresent()) {
                                osPai = osExistenteOpt.get();
                                if (osPai.getOs() == null || osPai.getOs().isBlank()) {
                                    osPai.setOs(gerarNovaOsSequencial());
                                    warnings.add("Linha " + currentRowNum + ": Encontrada OS existente para o projeto '" + projetoPlanilha + "' sem número. Atribuído novo número de OS: '" + osPai.getOs() + "'.");
                                } else {
                                    warnings.add("Linha " + currentRowNum + ": Já existe uma OS para o projeto '" + projetoPlanilha + "'. A linha foi adicionada à OS '" + osPai.getOs() + "'.");
                                }
                            } else {
                                // Projeto não encontrado, cria uma nova OS
                                osPai = new OS();
                                osPai.setProjeto(projetoPlanilha);
                                osPai.setOs(gerarNovaOsSequencial()); // Gera "00001-24"
                                if (dto.getSegmentoId() != null) {
                                    osPai.setSegmento(segmentoRepository.findById(dto.getSegmentoId()).orElse(null));
                                }
                                osPai.setGestorTim(dto.getGestorTim());
                                osPai.setDataCriacao(LocalDateTime.now());
                                osPai.setUsuarioCriacao("sistema-import-auto");
                                osPai.setStatusRegistro("ATIVO");
                            }
                            // --- FIM DA CORREÇÃO Cenário 1 ---
                            osRepository.save(osPai);
                            osPorProjetoCache.put(projetoUpper, osPai); // Salva no cache
                        }

                        // Cria o *novo item* (OsLpuDetalhe)
                        OsLpuDetalhe novoDetalhe = criarNovoDetalheParaOS(osPai, dto, currentRowNum, warnings);
                        affectedOsIds.add(osPai.getId());

                    } else {
                        // Caso de "Fallback" (Flag OFF, OS preenchida, KEY em branco)
                        warnings.add("Linha " + currentRowNum + ": IGNORADA. A coluna 'OS' está preenchida, mas a 'KEY' está em branco e a flag 'Importar Legado' está desmarcada. O sistema não sabe se deve atualizar ou criar.");
                    }
                    // ===================================================================
                    // FIM DA LÓGICA REFEITA
                    // ===================================================================

                } catch (IllegalArgumentException | BusinessException | EntityNotFoundException e) {
                    warnings.add("Erro na linha " + currentRowNum + ": " + e.getMessage());
                } catch (Exception e) {
                    e.printStackTrace();
                    warnings.add("Erro inesperado na linha " + currentRowNum + ": " + e.getMessage());
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

    /**
     * MÉTODO AUXILIAR ATUALIZADO (para Cenários 1 e 3)
     * Cria um novo OsLpuDetalhe e o associa à OS pai.
     */
    private OsLpuDetalhe criarNovoDetalheParaOS(OS os, OsRequestDto dto, int numeroLinha, List<String> warnings) {
        if (dto.getLpuIds() == null || dto.getLpuIds().isEmpty()) {
            throw new BusinessException("A coluna LPU é obrigatória para criar um novo item.");
        }
        Lpu lpu = lpuRepository.findById(dto.getLpuIds().get(0))
                .orElseThrow(() -> new EntityNotFoundException("LPU com ID " + dto.getLpuIds().get(0) + " não encontrada."));

        OsLpuDetalhe novoDetalhe = new OsLpuDetalhe();
        novoDetalhe.setOs(os);
        novoDetalhe.setLpu(lpu);

        // Lógica de Geração de KEY (Cenário 1 vs Cenário 3)
        String keyPlanilha = dto.getKey();
        if (keyPlanilha != null && !keyPlanilha.isBlank()) {
            // Veio do Cenário 3 (Legado)
            if (osLpuDetalheRepository.findByKey(keyPlanilha).isPresent()) {
                throw new BusinessException("A KEY '" + keyPlanilha + "' já existe. (Linha: " + numeroLinha + ")");
            }
            novoDetalhe.setKey(keyPlanilha);
        } else {
            // Veio do Cenário 1 (Auto-Geração)
            long count = osLpuDetalheRepository.countByOsAndLpuAndKeyNotContaining(os, lpu, "_AC_");
            String sequencia = String.format("%04d", count + 1);
            String novaKey = os.getOs() + "_" + lpu.getId() + "_" + sequencia;
            novoDetalhe.setKey(novaKey);
            warnings.add("Linha " + numeroLinha + ": KEY em branco. Gerada nova KEY automática: " + novaKey);
        }

        // Preenche o resto dos dados...
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

        // Lógica de Valor (igual à de atualização)
        Integer quantidade = dto.getQuantidade();
        BigDecimal valorTotalPlanilha = dto.getValorTotal();
        if (valorTotalPlanilha == null || valorTotalPlanilha.compareTo(BigDecimal.ZERO) == 0) {
            if (quantidade != null && quantidade > 0 && lpu.getValorSemImposto() != null) {
                BigDecimal valorCalculado = lpu.getValorSemImposto().multiply(new BigDecimal(quantidade));
                novoDetalhe.setValorTotal(valorCalculado);
            } else {
                novoDetalhe.setValorTotal(BigDecimal.ZERO);
            }
        } else {
            novoDetalhe.setValorTotal(valorTotalPlanilha);
        }

        novoDetalhe.setObservacoes(dto.getObservacoes());
        novoDetalhe.setDataPo(dto.getDataPo());
        novoDetalhe.setFaturamento(dto.getFaturamento());
        novoDetalhe.setSolitIdFat(dto.getSolitIdFat());
        novoDetalhe.setRecebIdFat(dto.getRecebIdFat());
        novoDetalhe.setIdFaturamento(dto.getIdFaturamento());
        novoDetalhe.setDataFatInprout(dto.getDataFatInprout());
        novoDetalhe.setSolitFsPortal(dto.getSolitFsPortal());
        novoDetalhe.setDataFs(dto.getDataFs());
        novoDetalhe.setNumFs(dto.getNumFs());
        novoDetalhe.setGate(dto.getGate());
        novoDetalhe.setGateId(dto.getGateId());

        return osLpuDetalheRepository.save(novoDetalhe);
    }

    /**
     * MÉTODO AUXILIAR ATUALIZADO (para Cenário 2)
     */
    private void atualizarDetalheExistente(OsLpuDetalhe detalheExistente, OsRequestDto dto, boolean isLegado, List<String> warnings, int numeroLinha) {
        // 1. ATUALIZA A ENTIDADE 'PAI' (OS)
        OS os = detalheExistente.getOs();
        if (dto.getProjeto() != null) {
            os.setProjeto(dto.getProjeto());
        }
        if (dto.getGestorTim() != null) {
            os.setGestorTim(dto.getGestorTim());
        }
        if (dto.getSegmentoId() != null) {
            Segmento novoSegmento = segmentoRepository.findById(dto.getSegmentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Segmento não encontrado com o ID: " + dto.getSegmentoId()));
            os.setSegmento(novoSegmento);
        }
        os.setDataAtualizacao(LocalDateTime.now());
        os.setUsuarioAtualizacao("sistema-import-update");
        osRepository.save(os);

        // 2. ATUALIZA A ENTIDADE 'FILHA' (OsLpuDetalhe)
        detalheExistente.setSite(dto.getSite());
        detalheExistente.setRegional(dto.getRegional());
        detalheExistente.setLote(dto.getLote());
        detalheExistente.setBoq(dto.getBoq());
        detalheExistente.setPo(dto.getPo());
        detalheExistente.setItem(dto.getItem());
        detalheExistente.setObjetoContratado(dto.getObjetoContratado());
        detalheExistente.setUnidade(dto.getUnidade());
        detalheExistente.setQuantidade(dto.getQuantidade());

        Integer quantidade = dto.getQuantidade();
        BigDecimal valorTotalPlanilha = dto.getValorTotal();
        Lpu lpuDoDetalhe = detalheExistente.getLpu();

        if (valorTotalPlanilha == null || valorTotalPlanilha.compareTo(BigDecimal.ZERO) == 0) {
            if (lpuDoDetalhe != null && lpuDoDetalhe.getValorSemImposto() != null && quantidade != null && quantidade > 0) {
                BigDecimal valorCalculado = lpuDoDetalhe.getValorSemImposto().multiply(new BigDecimal(quantidade));
                detalheExistente.setValorTotal(valorCalculado);
            } else {
                detalheExistente.setValorTotal(BigDecimal.ZERO);
            }
        } else {
            detalheExistente.setValorTotal(valorTotalPlanilha);
        }

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

        // 3. (AQUI ESTÁ A MUDANÇA) SÓ mexe no lançamento se a flag for TRUE
        if (isLegado) {
            criarOuAtualizarLancamentoLegado(detalheExistente, dto, isLegado, warnings, numeroLinha);
        }
        // Se 'isLegado' for false (Cenário 2), a função termina aqui.
    }

    /**
     * MÉTODO AUXILIAR ATUALIZADO (Constraint 2: Gestor)
     */
    private void criarOuAtualizarLancamentoLegado(OsLpuDetalhe detalhe, OsRequestDto dto, boolean isLegado, List<String> warnings, int numeroLinha) {
        if (!isLegado) return; // Segurança extra

        // 1. Traz a busca pelo usuário "Sistema" (fallback) para o INÍCIO.
        // Isso evita fazer uma query após a criação do novo Lancamento.
        Usuario managerSistema = usuarioRepository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Manager padrão (ID 1) não encontrado."));

        Lancamento lancamento = detalhe.getLancamentos().stream()
                .filter(l -> l.getSituacaoAprovacao() == SituacaoAprovacao.APROVADO_LEGADO)
                .findFirst()
                .orElseGet(() -> {
                    Lancamento novoLancamento = new Lancamento();
                    novoLancamento.setOsLpuDetalhe(detalhe);
                    novoLancamento.setOs(detalhe.getOs());

                    // ===================================================================
                    // INÍCIO DA CORREÇÃO (Campos NOT NULL)
                    // ===================================================================
                    // Define valores padrão/temporários IMEDIATAMENTE após a criação.

                    // 1. Define um manager padrão (Sistema)
                    novoLancamento.setManager(managerSistema);

                    // 2. Define uma data_atividade padrão (que será corrigida logo abaixo)
                    LocalDate dataAtividadeDto = dto.getDataAtividadeLancamento();
                    if (dataAtividadeDto != null) {
                        novoLancamento.setDataAtividade(dataAtividadeDto);
                    } else {
                        // Se a planilha não tem, usa a data de hoje como fallback inicial
                        novoLancamento.setDataAtividade(LocalDate.now());
                    }
                    // O @PrePersist cuidará de data_criacao.
                    // ===================================================================
                    // FIM DA CORREÇÃO (Campos NOT NULL)
                    // ===================================================================

                    detalhe.getLancamentos().add(novoLancamento);
                    return novoLancamento;
                });

        // *** CORREÇÃO CONSTRAINT 2: GESTOR (Agora é seguro fazer a query) ***
        Usuario manager;
        String nomeGestor = dto.getNomeGestorLancamento();

        if (nomeGestor != null && !nomeGestor.isBlank()) {
            // Tenta buscar pelo nome exato do gestor na planilha
            manager = usuarioRepository.findByNome(nomeGestor)
                    .orElseGet(() -> {
                        // Se não encontrar, usa o Usuário "Sistema" (ID 1) como fallback
                        warnings.add("Linha " + numeroLinha + ": O Gestor '" + nomeGestor + "' não foi encontrado. O lançamento legado será atribuído ao 'Sistema'.");
                        return managerSistema; // Usa o manager "Sistema" buscado no início
                    });
        } else {
            // Se a coluna gestor estiver em branco, usa o "Sistema"
            manager = managerSistema;
        }
        lancamento.setManager(manager); // Define o manager correto


        // ... (preenchimento de vistoria, planos, etc.) ...
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

        // Lógica de Data Atividade (revalidada)
        LocalDate dataAtividadeDto = dto.getDataAtividadeLancamento();
        if (dataAtividadeDto != null) {
            lancamento.setDataAtividade(dataAtividadeDto); // Usa a data da planilha
        } else if (lancamento.getDataAtividade() == null || lancamento.getDataAtividade().equals(LocalDate.now())) {
            // Se o DTO é nulo e o lançamento ainda tem o fallback de "hoje",
            // significa que a planilha estava em branco.
            warnings.add("Linha " + numeroLinha + ": Data de Atividade não fornecida ou inválida, usando data atual.");
            // (O valor de LocalDate.now() já foi setado, então não fazemos nada)
        }
        // Se a data do DTO for nula, mas o lançamento já tinha uma data (de uma atualização anterior), ela é mantida.


        if (dto.getCodigoPrestador() != null && !dto.getCodigoPrestador().isBlank()) {
            prestadorRepository.findByCodigoPrestador(dto.getCodigoPrestador())
                    .ifPresentOrElse(
                            lancamento::setPrestador,
                            () -> warnings.add("Linha " + numeroLinha + ": Prestador com código '" + dto.getCodigoPrestador() + "' não encontrado.")
                    );
        }

        if (dto.getNomeEtapaDetalhada() != null && !dto.getNomeEtapaDetalhada().isBlank() && !dto.getNomeEtapaDetalhada().equals("-")) {
            etapaDetalhadaRepository.findByNome(dto.getNomeEtapaDetalhada())
                    .stream().findFirst()
                    .ifPresentOrElse(
                            lancamento::setEtapaDetalhada,
                            () -> warnings.add("Linha " + numeroLinha + ": Etapa Detalhada com nome '" + dto.getNomeEtapaDetalhada() + "' não encontrada.")
                    );
        }

        if (dto.getStatusLancamento() != null && !dto.getStatusLancamento().isBlank() && !dto.getStatusLancamento().equals("-")) {
            try {
                lancamento.setStatus(br.com.inproutservices.inproutsystem.enums.index.StatusEtapa.fromDescricao(dto.getStatusLancamento()));
            } catch (IllegalArgumentException e) {
                warnings.add("Linha " + numeroLinha + ": Status '" + dto.getStatusLancamento() + "' é inválido.");
            }
        }

        if (dto.getSituacaoLancamento() != null && !dto.getSituacaoLancamento().isBlank() && !dto.getSituacaoLancamento().equals("-")) {
            try {
                lancamento.setSituacao(br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional.fromDescricao(dto.getSituacaoLancamento()));
            } catch (IllegalArgumentException e) {
                warnings.add("Linha " + numeroLinha + ": Situação '" + dto.getSituacaoLancamento() + "' é inválida.");
            }
        }

        lancamento.setDetalheDiario(dto.getDetalheDiario());

        lancamento.setValor(dto.getValorLancamento());

        lancamento.setSituacaoAprovacao(SituacaoAprovacao.APROVADO_LEGADO);
        lancamento.setUltUpdate(LocalDateTime.now());

        // O save do detalhe (pai) vai persistir o novo lançamento (filho)
        osLpuDetalheRepository.save(detalhe);
    }

    // =================================================================================
    // FIM DAS FUNÇÕES DE IMPORTAÇÃO CORRIGIDAS
    // =================================================================================

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
                // Tenta formatar dd/MM/yyyy
                return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } catch (Exception e) {
                try {
                    // Tenta formatar yyyy-MM-dd (ISO)
                    return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
                } catch (Exception e2) {
                    return null; // Retorna nulo se ambos falharem
                }
            }
        }
        return null;
    }

    @Override
    public List<OS> getOsByProjeto(String projeto) {
        return osRepository.findByProjeto(projeto)
                .map(Collections::singletonList) // Se encontrar, cria uma lista com o único elemento
                .orElse(Collections.emptyList()); // Se não encontrar, retorna uma lista vazia
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

    @Override
    @Transactional
    public void desativarDetalhe(Long detalheId) {
        // 1. Busca o registro de detalhe que o usuário deseja excluir.
        OsLpuDetalhe detalhe = osLpuDetalheRepository.findById(detalheId)
                .orElseThrow(() -> new EntityNotFoundException("Detalhe de OS não encontrado com o ID: " + detalheId));

        OS osPai = detalhe.getOs(); // Pega a referência da OS "pai" antes de excluir o "filho"

        // 2. Exclui permanentemente o registro (o detalhe) do banco de dados.
        osLpuDetalheRepository.delete(detalhe);
        osLpuDetalheRepository.flush(); // Garante que a exclusão seja executada no banco neste momento

        // 3. Verifica se a OS "pai" ficou sem nenhum outro detalhe.
        //    Agora, o método countByOs existe e funcionará.
        if (osLpuDetalheRepository.countByOs(osPai) == 0) {
            // 4. Se não houver mais nenhum detalhe, exclui a OS "pai" também.
            osRepository.delete(osPai);
        }
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