package br.com.inproutservices.inproutsystem.services.materiais;

import br.com.inproutservices.inproutsystem.dtos.materiais.EntradaMaterialDTO;
import br.com.inproutservices.inproutsystem.dtos.materiais.MaterialRequestDTO;
import br.com.inproutservices.inproutsystem.entities.materiais.EntradaMaterial;
import br.com.inproutservices.inproutsystem.entities.materiais.Material;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.materiais.MaterialRepository;
import br.com.inproutservices.inproutsystem.exceptions.materiais.ResourceNotFoundException;
import br.com.inproutservices.inproutsystem.repositories.materiais.SolicitacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

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
}