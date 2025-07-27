package br.com.inproutservices.inproutsystem.tasks;

import br.com.inproutservices.inproutsystem.entities.atividades.Comentario;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoAprovacao;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.usuarios.UsuarioRepository;
import br.com.inproutservices.inproutsystem.services.atividades.LancamentoService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class LancamentoScheduledTasks {

    private static final Logger log = LoggerFactory.getLogger(LancamentoScheduledTasks.class);
    private final LancamentoService lancamentoService;
    private final LancamentoRepository lancamentoRepository;
    private final UsuarioRepository usuarioRepository;

    public LancamentoScheduledTasks(LancamentoService lancamentoService, LancamentoRepository lancamentoRepository, UsuarioRepository usuarioRepository) {
        this.lancamentoService = lancamentoService;
        this.lancamentoRepository = lancamentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Este método será executado automaticamente todos os dias à meia-noite (00:00).
     * A expressão cron "0 0 0 * * *" significa:
     * (segundo minuto hora dia-do-mês mês dia-da-semana)
     * O timezone garante que ele rode no horário de São Paulo.
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "America/Sao_Paulo")
    public void submeterLancamentosPendentes() {
        log.info("Iniciando tarefa agendada: Submissão diária de lançamentos.");
        try {
            lancamentoService.submeterLancamentosDiarios();
            log.info("Tarefa de submissão diária de lançamentos concluída com sucesso.");
        } catch (Exception e) {
            log.error("Erro ao executar a tarefa de submissão diária de lançamentos.", e);
        }
    }

    /**
     * Roda todo dia à 00:01 (um minuto após a meia-noite) para garantir que pegamos
     * todos os prazos do dia anterior.
     * Verifica os lançamentos com prazo de coordenador vencido e os move para a fila do controller.
     */
    @Scheduled(cron = "0 1 0 * * *", zone = "America/Sao_Paulo")
    @Transactional
    public void verificarPrazosVencidos() {
        log.info("Iniciando tarefa agendada: Verificação de prazos de coordenador vencidos.");
        try {
            // Busca o usuário "Sistema" para ser o autor do comentário.
            // É importante garantir que um usuário com ID 1 (ou outro ID fixo) exista no banco para representar o sistema.
            Usuario autorSistema = usuarioRepository.findById(1L)
                    .orElseThrow(() -> new EntityNotFoundException("Usuário 'Sistema' com ID 1 não encontrado para registrar comentário automático."));

            LocalDate hoje = LocalDate.now();
            List<Lancamento> lancamentosVencidos = lancamentoRepository.findBySituacaoAprovacaoAndDataPrazoBefore(SituacaoAprovacao.PENDENTE_COORDENADOR, hoje);

            if (lancamentosVencidos.isEmpty()) {
                log.info("Nenhum lançamento com prazo vencido encontrado.");
                return;
            }

            log.info("{} lançamentos com prazo vencido encontrados. Atualizando status e adicionando comentários...", lancamentosVencidos.size());

            for (Lancamento lancamento : lancamentosVencidos) {
                // Muda o status do lançamento
                lancamento.setSituacaoAprovacao(SituacaoAprovacao.PRAZO_VENCIDO);

                Comentario comentarioAutomatico = new Comentario();
                comentarioAutomatico.setLancamento(lancamento);
                comentarioAutomatico.setAutor(autorSistema);
                comentarioAutomatico.setTexto("Prazo vencido e encaminhado automaticamente via sistema.");

                lancamento.getComentarios().add(comentarioAutomatico);
            }

            lancamentoRepository.saveAll(lancamentosVencidos);

            log.info("Tarefa de verificação de prazos vencidos concluída com sucesso.");
        } catch (Exception e) {
            log.error("Erro ao executar a tarefa de verificação de prazos vencidos.", e);
        }
    }
}