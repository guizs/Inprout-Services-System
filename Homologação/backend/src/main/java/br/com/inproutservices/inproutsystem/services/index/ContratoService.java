package br.com.inproutservices.inproutsystem.services.index;

import br.com.inproutservices.inproutsystem.entities.index.Contrato;
import br.com.inproutservices.inproutsystem.repositories.index.ContratoRepository;
import br.com.inproutservices.inproutsystem.repositories.index.LpuRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final LpuRepository lpuRepository;

    public ContratoService(ContratoRepository contratoRepository, LpuRepository lpuRepository) {
        this.contratoRepository = contratoRepository;
        this.lpuRepository = lpuRepository;
    }

    /**
     * Cria um novo Contrato no banco de dados.
     * @param contrato O objeto Contrato a ser salvo.
     * @return O Contrato salvo com o ID preenchido.
     */
    @Transactional
    public Contrato criarContrato(Contrato contrato) {
        // Valida se já existe um contrato com o mesmo nome
        contratoRepository.findByNome(contrato.getNome()).ifPresent(c -> {
            throw new IllegalArgumentException("Já existe um Contrato com o nome: " + contrato.getNome());
        });
        contrato.setAtivo(true); // Garante que o contrato seja criado como ativo
        return contratoRepository.save(contrato);
    }

    /**
     * Retorna uma lista com todos os contratos ATIVOS.
     * @return Lista de Contratos ativos.
     */
    @Transactional(readOnly = true)
    public List<Contrato> listarContratosAtivos() {
        return contratoRepository.findAllByOrderByNomeAsc();
    }

    /**
     * Busca um único contrato pelo seu ID.
     * @param id O ID do contrato.
     * @return O Contrato encontrado.
     */
    @Transactional(readOnly = true)
    public Contrato buscarPorId(Long id) {
        return contratoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contrato não encontrado com o ID: " + id));
    }

    /**
     * Desativa um Contrato (soft delete).
     * Regra: Só permite desativar se não houver LPUs ativas vinculadas a ele.
     * @param id O ID do contrato a ser desativado.
     */
    @Transactional
    public void desativarContrato(Long id) {
        Contrato contrato = buscarPorId(id);

        // Verifica se existem LPUs ativas para este contrato
        boolean existemLpusAtivas = !lpuRepository.findAllByContratoIdAndAtivoTrue(id).isEmpty();
        if (existemLpusAtivas) {
            throw new IllegalStateException("Não é possível desativar um contrato que possui LPUs ativas.");
        }

        contrato.setAtivo(false);
        contratoRepository.save(contrato);
    }

    /**
     * Atualiza parcialmente um Contrato (usado para reativar/desativar via PATCH).
     * @param id O ID do contrato a ser atualizado.
     * @param updates Um mapa com os campos e valores a serem alterados.
     * @return O Contrato atualizado.
     */
    @Transactional
    public Contrato atualizarParcialmente(Long id, Map<String, Object> updates) {
        Contrato contrato = buscarPorId(id);

        if (updates.containsKey("ativo")) {
            boolean novoStatus = (Boolean) updates.get("ativo");

            // Se estiver tentando desativar, aplica a mesma regra de negócio
            if (!novoStatus) {
                boolean existemLpusAtivas = !lpuRepository.findAllByContratoIdAndAtivoTrue(id).isEmpty();
                if (existemLpusAtivas) {
                    throw new IllegalStateException("Não é possível desativar um contrato que possui LPUs ativas.");
                }
            }

            contrato.setAtivo(novoStatus);
        }

        // Adicione aqui outros campos que queira permitir a alteração via PATCH
        // Ex: if (updates.containsKey("nome")) { ... }

        return contratoRepository.save(contrato);
    }
}