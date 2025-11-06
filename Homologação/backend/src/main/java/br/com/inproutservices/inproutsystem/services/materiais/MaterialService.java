package br.com.inproutservices.inproutsystem.services.materiais;

import br.com.inproutservices.inproutsystem.dtos.materiais.EntradaMaterialDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.MaterialRequestDTO;
// --- NOVO IMPORT ---
import br.com.inproutservices.inproutsystem.dtos.materiais.MaterialUpdateDTO;
import br.com.inproutservices.inproutsystem.entities.materiais.EntradaMaterial;
import br.com.inproutservices.inproutsystem.entities.materiais.Material;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.materiais.MaterialRepository;
import br.com.inproutservices.inproutsystem.exceptions.materiais.ResourceNotFoundException;
import br.com.inproutservices.inproutsystem.repositories.materiais.SolicitacaoRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final SolicitacaoRepository solicitacaoRepository;

    public MaterialService(MaterialRepository materialRepository, SolicitacaoRepository solicitacaoRepository) {
        this.materialRepository = materialRepository;
        this.solicitacaoRepository = solicitacaoRepository;
    }

    @Transactional(readOnly = true)
    public List<Material> listarTodos() {
        return materialRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Material buscarPorId(Long id) {
        return materialRepository.findByIdWithEntradas(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material não encontrado com o ID: " + id));
    }

    @Transactional
    public Material criarMaterial(MaterialRequestDTO dto) {
        materialRepository.findByCodigo(dto.codigo()).ifPresent(m -> {
            throw new BusinessException("O código '" + dto.codigo() + "' já está em uso.");
        });

        Material material = new Material();
        material.setCodigo(dto.codigo());
        material.setDescricao(dto.descricao());
        material.setUnidadeMedida(dto.unidadeMedida());
        material.setSaldoFisico(dto.saldoFisicoInicial());
        material.setObservacoes(dto.observacoes());
        material.setEmpresa(dto.empresa());

        // A primeira entrada define o custo médio inicial
        material.setCustoMedioPonderado(dto.custoUnitarioInicial());

        // Cria a primeira entrada no histórico
        EntradaMaterial primeiraEntrada = new EntradaMaterial();
        primeiraEntrada.setMaterial(material);
        primeiraEntrada.setQuantidade(dto.saldoFisicoInicial());
        primeiraEntrada.setCustoUnitario(dto.custoUnitarioInicial());
        primeiraEntrada.setObservacoes("Entrada inicial de estoque.");
        material.getEntradas().add(primeiraEntrada);

        return materialRepository.save(material);
    }

    // --- NOVO MÉTODO ADICIONADO ---
    @Transactional
    public Material atualizarMaterial(Long id, MaterialUpdateDTO dto) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material não encontrado com o ID: " + id));

        // Validação de duplicidade de código
        if (dto.codigo() != null && !dto.codigo().equals(material.getCodigo())) {
            materialRepository.findByCodigo(dto.codigo()).ifPresent(existente -> {
                if (!existente.getId().equals(material.getId())) {
                    throw new BusinessException("O código '" + dto.codigo() + "' já está em uso por outro material.");
                }
            });
            material.setCodigo(dto.codigo());
        }

        material.setDescricao(dto.descricao());
        material.setObservacoes(dto.observacoes());

        return materialRepository.save(material);
    }
    // --- FIM DO NOVO MÉTODO ---

    @Transactional
    public Material adicionarEntrada(EntradaMaterialDTO dto) {
        Material material = buscarPorId(dto.materialId());

        BigDecimal saldoAtual = material.getSaldoFisico();
        BigDecimal custoMedioAtual = material.getCustoMedioPonderado();
        BigDecimal novaQuantidade = dto.quantidade();
        BigDecimal novoCustoUnitario = dto.custoUnitario();

        // Fórmula do Custo Médio Ponderado
        BigDecimal valorEstoqueAtual = saldoAtual.multiply(custoMedioAtual);
        BigDecimal valorNovaEntrada = novaQuantidade.multiply(novoCustoUnitario);
        BigDecimal novoSaldo = saldoAtual.add(novaQuantidade);

        if (novoSaldo.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException("O novo saldo não pode ser zero.");
        }

        BigDecimal novoCustoMedio = (valorEstoqueAtual.add(valorNovaEntrada)).divide(novoSaldo, 4, RoundingMode.HALF_UP);

        // Atualiza o material
        material.setSaldoFisico(novoSaldo);
        material.setCustoMedioPonderado(novoCustoMedio);

        // Cria o registro no histórico
        EntradaMaterial novaEntrada = new EntradaMaterial();
        novaEntrada.setMaterial(material);
        novaEntrada.setQuantidade(dto.quantidade());
        novaEntrada.setCustoUnitario(dto.custoUnitario());
        novaEntrada.setObservacoes(dto.observacoes());
        material.getEntradas().add(novaEntrada);

        return materialRepository.save(material);
    }

    @Transactional
    public void deletarMaterial(Long id) {
        Material material = buscarPorId(id);

        if (solicitacaoRepository.existsByItensMaterialId(id)) {
            throw new BusinessException("Não é possível deletar o material '" + material.getDescricao() + "' pois ele já foi utilizado em solicitações.");
        }

        materialRepository.deleteById(id);
    }

    // --- INÍCIO DO NOVO MÉTODO DE IMPORTAÇÃO ---

    /**
     * Importa um lote de materiais legados de uma planilha Excel.
     * @param file O arquivo .xlsx enviado pelo usuário.
     * @return Uma lista de strings contendo o log de sucesso/erro de cada linha.
     * @throws IOException Se houver um erro ao ler o arquivo.
     */
    @Transactional
    public List<String> importarLegadoCMA(MultipartFile file) throws IOException {
        List<String> log = new ArrayList<>();
        List<String> unidadesValidas = Arrays.asList("PÇ", "MT", "LT"); // Unidades permitidas pelo formulário
        List<String> empresasValidas = Arrays.asList("INPROUT", "TLP"); // Empresas permitidas

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Pula o cabeçalho
            if (rows.hasNext()) {
                rows.next();
            }

            int rowCounter = 1; // Começa em 1 para pular o cabeçalho no log
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                rowCounter++;

                if (isRowEmpty(currentRow)) {
                    continue;
                }

                try {
                    // Mapeamento das colunas conforme sua solicitação
                    String empresa = getStringCellValue(currentRow, 0); // Col A: ESTOQUE
                    String codigo = getStringCellValue(currentRow, 1); // Col B: CÓDIGO
                    String descricao = getStringCellValue(currentRow, 2); // Col C: DESCRIÇÃO
                    String unidade = getStringCellValue(currentRow, 3); // Col D: UNIDADE
                    BigDecimal saldoFisico = getBigDecimalCellValue(currentRow, 4); // Col E: SALDO FISICO
                    BigDecimal custoUnitario = getBigDecimalCellValue(currentRow, 5); // Col F: CUSTO UNITÁRIO

                    String codigoOriginal = codigo;
                    if ("PENDENTE".equalsIgnoreCase(codigo)) {
                        // Gera um código único para itens pendentes para evitar conflito no BD
                        codigo = String.format("PENDENTE-%04d", rowCounter);
                    }

                    // 1. Validação de campos obrigatórios
                    if (saldoFisico == null) {
                        saldoFisico = BigDecimal.ZERO;
                    }

                    if (custoUnitario == null) {
                        custoUnitario = BigDecimal.ZERO;
                    }

                    if (codigo == null || descricao == null || unidade == null || empresa == null) {
                        log.add("Linha " + rowCounter + ": ERRO - Campos obrigatórios (ESTOQUE, CÓDIGO, DESCRIÇÃO, UNIDADE) não podem estar em branco.");
                        continue;
                    }

                    // 2. Validação de valores (Empresa e Unidade)
                    if (!empresasValidas.contains(empresa.toUpperCase())) {
                        log.add("Linha " + rowCounter + ": ERRO - Valor de ESTOQUE ('" + empresa + "') inválido. Use 'INPROUT' ou 'TLP'.");
                        continue;
                    }
                    if (!unidadesValidas.contains(unidade.toUpperCase())) {
                        log.add("Linha " + rowCounter + ": ERRO - Valor de UNIDADE ('" + unidade + "') inválido. Use 'PÇ', 'MT' ou 'LT'.");
                        continue;
                    }

                    // 4. Verifica se o material já existe
                    if (materialRepository.findByCodigo(codigo).isPresent()) {
                        log.add("Linha " + rowCounter + ": IGNORADO - Material com código '" + codigo + "' já existe no banco de dados.");
                        continue;
                    }

                    // 5. Se passou em tudo, cria o DTO e chama o serviço
                    MaterialRequestDTO dto = new MaterialRequestDTO(
                            codigo,
                            descricao,
                            unidade.toUpperCase(),
                            saldoFisico,
                            custoUnitario,
                            "Importação de Legado CMA", // Observação padrão
                            empresa.toUpperCase()
                    );

                    // Usa o método de criação existente
                    criarMaterial(dto);

                    if ("PENDENTE".equalsIgnoreCase(codigoOriginal)) {
                        log.add("Linha " + rowCounter + ": SUCESSO - Material '" + descricao + "' criado com código provisório '" + codigo + "'.");
                    } else {
                        log.add("Linha " + rowCounter + ": SUCESSO - Material '" + codigo + "' criado.");
                    }

                    log.add("Linha " + rowCounter + ": SUCESSO - Material '" + codigo + "' criado.");

                } catch (BusinessException be) { // Captura erros de negócio (ex: código duplicado)
                    log.add("Linha " + rowCounter + ": ERRO - " + be.getMessage());
                } catch (Exception e) {
                    log.add("Linha " + rowCounter + ": ERRO INESPERADO - " + e.getMessage());
                }
            }
        }
        return log;
    }

    // --- Métodos auxiliares para leitura de planilha ---

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int cellNum = row.getFirstCellNum(); cellNum < row.getLastCellNum(); cellNum++) {
            Cell cell = row.getCell(cellNum, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    private String getStringCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue().trim();
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf(cell.getNumericCellValue());
        }
        return null;
    }

    private BigDecimal getBigDecimalCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }
        if (cell.getCellType() == CellType.STRING) {
            String value = cell.getStringCellValue().trim();

            if ("-".equals(value)) {
                return BigDecimal.ZERO;
            }
            try {
                return new BigDecimal(value.replace(",", "."));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}