package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.SolicitacaoDocumentacaoDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoDocumentacao;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusDocumentacao;
import br.com.inproutservices.inproutsystem.enums.usuarios.Role;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.atividades.SolicitacaoDocumentacaoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SolicitacaoDocumentacaoService {

    private final SolicitacaoDocumentacaoRepository repository;
    private final LancamentoRepository lancamentoRepository;
    private final UsuarioRepository usuarioRepository;

    public SolicitacaoDocumentacaoService(SolicitacaoDocumentacaoRepository repository, LancamentoRepository lancamentoRepository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.lancamentoRepository = lancamentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public SolicitacaoDocumentacao criarSolicitacao(SolicitacaoDocumentacaoDTO.Request dto) {
        if (repository.findByLancamentoId(dto.lancamentoId()).isPresent()) {
            throw new BusinessException("Já existe uma solicitação de documentação para este lançamento.");
        }

        Lancamento lancamento = lancamentoRepository.findById(dto.lancamentoId())
                .orElseThrow(() -> new EntityNotFoundException("Lançamento não encontrado."));

        Usuario solicitante = usuarioRepository.findById(dto.solicitanteId())
                .orElseThrow(() -> new EntityNotFoundException("Solicitante não encontrado."));

        Usuario documentador = usuarioRepository.findById(dto.documentadorId())
                .orElseThrow(() -> new EntityNotFoundException("Documentador não encontrado."));

        if (documentador.getRole() != Role.DOCUMENTADOR && documentador.getRole() != Role.ADMIN) {
            throw new BusinessException("O usuário selecionado não tem perfil de Documentador.");
        }

        SolicitacaoDocumentacao solicitacao = new SolicitacaoDocumentacao();
        solicitacao.setLancamento(lancamento);
        solicitacao.setSolicitante(solicitante);
        solicitacao.setDocumentador(documentador);
        solicitacao.setStatus(StatusDocumentacao.PENDENTE);

        return repository.save(solicitacao);
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoDocumentacao> listarMinhaFila(Long documentadorId) {
        // Retorna tudo que NÃO está concluído (Pendente, Em Analise, Reportado)
        return repository.findByDocumentadorIdAndStatusNot(documentadorId, StatusDocumentacao.CONCLUIDO);
    }

    // Este método lista os LANÇAMENTOS que têm data de envio mas NÃO têm solicitação criada
    // Usado para preencher a tabela do Manager
    @Transactional(readOnly = true)
    public List<Lancamento> listarPendentesDeSolicitacao() {
        // Aqui você pode criar uma query customizada no LancamentoRepository se precisar de performance
        // Por enquanto, vou filtrar em memória para simplificar a lógica inicial
        List<Lancamento> todos = lancamentoRepository.findAll();
        return todos.stream()
                .filter(l -> l.getDataEnvioDocumentacao() != null) // Tem data de envio
                .filter(l -> repository.findByLancamentoId(l.getId()).isEmpty()) // Não tem solicitação
                .toList();
    }

    @Transactional
    public void concluir(Long id) {
        SolicitacaoDocumentacao s = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada."));
        s.setStatus(StatusDocumentacao.CONCLUIDO);
        repository.save(s);
    }

    @Transactional
    public void reportar(Long id, String observacao) {
        SolicitacaoDocumentacao s = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada."));
        s.setStatus(StatusDocumentacao.REPORTADO);
        s.setObservacao(observacao);
        repository.save(s);
    }
}