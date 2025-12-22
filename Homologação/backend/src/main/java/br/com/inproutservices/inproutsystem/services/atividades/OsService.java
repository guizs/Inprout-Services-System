package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Interface para o serviço de Ordens de Serviço (OS).
 * Define o contrato para as operações de negócio relacionadas a OS,
 * abstraindo a implementação real.
 */
public interface OsService {

    /**
     * Cria uma nova Ordem de Serviço com base nos dados fornecidos.
     * @param osDto DTO com os dados para a criação da OS.
     * @return A entidade OS criada e salva no banco de dados.
     */
    OsLpuDetalhe createOs(OsRequestDto osDto);

    List<LpuComLancamentoDto> getLpusWithLastApprovedLaunch(Long osId);

    /**
     * Retorna uma lista de Ordens de Serviço filtradas pelos segmentos
     * do usuário especificado.
     * @param usuarioId O ID do usuário.
     * @return Lista de entidades OS filtradas.
     */
    List<OS> getAllOsByUsuario(Long usuarioId);

    /**
     * Busca uma Ordem de Serviço pelo seu ID.
     * @param id O ID da OS.
     * @return A entidade OS encontrada. Lança uma exceção se não encontrar.
     */
    OS getOsById(Long id);

    /**
     * Retorna uma lista com todas as Ordens de Serviço cadastradas.
     * @return Lista de entidades OS.
     */
    List<OsResponseDto> getAllOs();

    /**
     * Atualiza uma Ordem de Serviço existente com base em seu ID.
     * @param id O ID da OS a ser atualizada.
     * @param osDto DTO com os novos dados.
     * @return A entidade OS atualizada.
     */
    OS updateOs(Long id, OsRequestDto osDto);

    /**
     * Deleta uma Ordem de Serviço pelo seu ID.
     * @param id O ID da OS a ser deletada.
     */
    void deleteOs(Long id);

    List<String> processarLoteDePlanilha(List<Map<String, Object>> lote);

    void importarOsDePlanilha(MultipartFile file) throws IOException;

    // --- NOVA LINHA ADICIONADA ---
    // Adiciona a assinatura do método sobrecarregado que aceita o parâmetro 'legado'.
    List<OS> importarOsDePlanilha(MultipartFile file, boolean isLegado) throws IOException;


    void processarLinhaDePlanilha(Map<String, Object> rowData);

    List<OS> getOsByProjeto(String projeto);

    OsLpuDetalhe criarOsLpuDetalheComplementar(Long osId, Long lpuId, Integer quantidade);

    void desativarDetalhe(Long detalheId);

    OsLpuDetalhe atualizarChaveExterna(Long detalheId, String novaChave);

    void atualizarSegmentoDaOs(Long detalheId, Long novoSegmentoId);

    List<OS> importarOsDePlanilha(MultipartFile file, boolean isLegado, List<String> warnings) throws IOException;

    OS atualizarGestorTim(Long osId, String novoGestorTim);

    Page<OsResponseDto> findAllWithDetails(Pageable pageable);

    OS atualizarValoresFinanceiros(Long osId, BigDecimal materialAdicional, BigDecimal novoTransporte);

    List<String> importarFinanceiroLegado(MultipartFile file) throws IOException;


}