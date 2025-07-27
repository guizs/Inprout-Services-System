package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;

import java.util.List;

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
    OS createOs(OsRequestDto osDto);

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
    List<OS> getAllOs();

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
}