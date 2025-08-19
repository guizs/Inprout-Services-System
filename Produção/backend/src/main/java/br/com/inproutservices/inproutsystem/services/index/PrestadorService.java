package br.com.inproutservices.inproutsystem.services.index;

import br.com.inproutservices.inproutsystem.entities.index.Prestador;
import br.com.inproutservices.inproutsystem.repositories.index.PrestadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PrestadorService {

    @Autowired
    private PrestadorRepository prestadorRepository;

    public List<Prestador> listarTodos() {
        return prestadorRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    public List<Prestador> listarAtivos() {
        return prestadorRepository.findByAtivoTrue();
    }

    public List<Prestador> listarDesativados() {
        return prestadorRepository.findByAtivoFalse();
    }

    // --- CORRIGIDO ---
    // O parâmetro 'codigo' agora é String.
    public Optional<Prestador> buscarPorCodigo(String codigo) {
        return prestadorRepository.findByCodigoPrestador(codigo);
    }

    @Transactional
    public Prestador salvar(Prestador prestador) {
        // Esta chamada agora funciona, pois getCodigoPrestador() retorna String
        // e o repositório (que também devemos corrigir) espera uma String.
        if (prestadorRepository.existsByCodigoPrestador(prestador.getCodigoPrestador())) {
            throw new RuntimeException("Já existe um prestador com esse código!");
        }
        prestador.setAtivo(true);
        return prestadorRepository.save(prestador);
    }

    public Optional<Prestador> buscarPorId(Long id) {
        return prestadorRepository.findById(id);
    }

    // --- CORRIGIDO ---
    // O parâmetro 'codigo' agora é String.
    @Transactional
    public void desativar(String codigo) {
        Prestador prestador = prestadorRepository.findByCodigoPrestador(codigo)
                .orElseThrow(() -> new RuntimeException("Prestador não encontrado"));

        prestador.setAtivo(false);
        prestadorRepository.save(prestador);
    }

    // --- CORRIGIDO ---
    // O parâmetro 'codigo' agora é String.
    @Transactional
    public void ativar(String codigo) {
        Prestador prestador = prestadorRepository.findByCodigoPrestador(codigo)
                .orElseThrow(() -> new RuntimeException("Prestador não encontrado"));

        prestador.setAtivo(true);
        prestadorRepository.save(prestador);
    }

    @Transactional
    public Prestador atualizar(Long id, Prestador dadosNovos) {
        Prestador prestadorExistente = prestadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prestador não encontrado com o ID: " + id));

        // Esta chamada agora funciona, pois getCodigoPrestador() retorna String
        // e o repositório espera uma String.
        Optional<Prestador> prestadorComMesmoCodigo = prestadorRepository.findByCodigoPrestador(dadosNovos.getCodigoPrestador());
        if (prestadorComMesmoCodigo.isPresent() && !prestadorComMesmoCodigo.get().getId().equals(prestadorExistente.getId())) {
            throw new RuntimeException("O código de prestador '" + dadosNovos.getCodigoPrestador() + "' já está em uso por outro prestador.");
        }

        atualizarDados(prestadorExistente, dadosNovos);
        return prestadorRepository.save(prestadorExistente);
    }

    private void atualizarDados(Prestador existente, Prestador novosDados) {
        // Esta chamada está correta pois ambos são String.
        existente.setCodigoPrestador(novosDados.getCodigoPrestador());
        existente.setPrestador(novosDados.getPrestador());
        existente.setRazaoSocial(novosDados.getRazaoSocial());
        existente.setCidade(novosDados.getCidade());
        existente.setUf(novosDados.getUf());
        existente.setRegiao(novosDados.getRegiao());
        existente.setRg(novosDados.getRg());
        existente.setCpf(novosDados.getCpf());
        existente.setCnpj(novosDados.getCnpj());
        existente.setCodigoBanco(novosDados.getCodigoBanco());
        existente.setBanco(novosDados.getBanco());
        existente.setAgencia(novosDados.getAgencia());
        existente.setConta(novosDados.getConta());
        existente.setTipoDeConta(novosDados.getTipoDeConta());
        existente.setTelefone(novosDados.getTelefone());
        existente.setEmail(novosDados.getEmail());
        existente.setTipoPix(novosDados.getTipoPix());
        existente.setChavePix(novosDados.getChavePix());
        existente.setObservacoes(novosDados.getObservacoes());
    }

    @Transactional(readOnly = true)
    public List<Prestador> buscarPorTermo(String termo) {
        if (termo == null || termo.isBlank()) {
            return List.of();
        }
        return prestadorRepository.buscarPorTermo(termo);
    }
}