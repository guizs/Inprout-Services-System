package br.com.inproutservices.inproutsystem.services.gate;

import br.com.inproutservices.inproutsystem.dtos.gate.GateCreateDTO;
import br.com.inproutservices.inproutsystem.dtos.gate.GateReportResponseDTO;
import br.com.inproutservices.inproutsystem.dtos.gate.GateReportRowDTO;
import br.com.inproutservices.inproutsystem.entities.atividades.Lancamento;
import br.com.inproutservices.inproutsystem.entities.atividades.OsLpuDetalhe;
import br.com.inproutservices.inproutsystem.entities.atividades.SolicitacaoFaturamento;
import br.com.inproutservices.inproutsystem.entities.gate.Gate;
import br.com.inproutservices.inproutsystem.entities.index.Segmento;
import br.com.inproutservices.inproutsystem.enums.atividades.SituacaoOperacional;
import br.com.inproutservices.inproutsystem.enums.atividades.StatusFaturamento;
import br.com.inproutservices.inproutsystem.enums.atividades.TipoFaturamento;
import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.repositories.atividades.LancamentoRepository;
import br.com.inproutservices.inproutsystem.repositories.gate.GateRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class GateService {

    private final GateRepository gateRepository;
    private final LancamentoRepository lancamentoRepository;

    public GateService(GateRepository gateRepository, LancamentoRepository lancamentoRepository) {
        this.gateRepository = gateRepository;
        this.lancamentoRepository = lancamentoRepository;
    }

    @Transactional(readOnly = true)
    public List<Gate> listGates() {
        return gateRepository.findAllByOrderByDataInicioDesc();
    }

    @Transactional
    public Gate createGate(GateCreateDTO dto) {
        if (dto.nome() == null || dto.nome().isBlank()) {
            throw new BusinessException("O nome do GATE é obrigatório.");
        }
        if (dto.dataInicio() == null || dto.dataFim() == null) {
            throw new BusinessException("Datas de início e fim são obrigatórias.");
        }
        if (dto.dataFim().isBefore(dto.dataInicio())) {
            throw new BusinessException("A data final não pode ser anterior à data inicial.");
        }
        gateRepository.findByNome(dto.nome()).ifPresent(g -> {
            throw new BusinessException("Já existe um GATE com o nome: " + dto.nome());
        });

        Gate gate = new Gate();
        gate.setNome(dto.nome());
        gate.setDataInicio(dto.dataInicio());
        gate.setDataFim(dto.dataFim());

        return gateRepository.save(gate);
    }

    @Transactional
    public void deleteGate(Long id) {
        Gate gate = gateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("GATE não encontrado com ID: " + id));
        // Adicionar regra de negócio aqui (ex: não deletar se tiver faturamento)
        gateRepository.delete(gate);
    }

    @Transactional(readOnly = true)
    public GateReportResponseDTO getGateReport(Long gateId) {
        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new EntityNotFoundException("GATE não encontrado com ID: " + id));

        LocalDate dataInicio = gate.getDataInicio();
        LocalDate dataFim = gate.getDataFim();

        // 1. Busca todos os lançamentos dentro do período do GATE
        List<Lancamento> lancamentosDoGate = lancamentoRepository.findByDataAtividadeBetweenWithDetails(dataInicio, dataFim);

        BigDecimal valorTotalFaturado = BigDecimal.ZERO;
        BigDecimal valorTotalAntecipado = BigDecimal.ZERO;

        // Mapa para o relatório (Agrupado por Segmento)
        Map<Long, GateReportRowDTO> reportMap = new HashMap<>();
        // Set para garantir que cada OsLpuDetalhe (item da OS) seja processado apenas uma vez
        Set<Long> detalhesProcessados = new HashSet<>();

        for (Lancamento lancamento : lancamentosDoGate) {
            OsLpuDetalhe detalhe = lancamento.getOsLpuDetalhe();
            if (detalhe == null || detalhesProcessados.contains(detalhe.getId())) {
                continue; // Pula se o detalhe não existir ou já tiver sido processado
            }

            Segmento segmento = detalhe.getOs().getSegmento();
            if (segmento == null) {
                continue; // Pula se o lançamento não estiver associado a um segmento
            }

            // Garante que o Segmento exista no mapa
            GateReportRowDTO row = reportMap.computeIfAbsent(segmento.getId(),
                    k -> new GateReportRowDTO(segmento.getNome()));

            BigDecimal valorOS = detalhe.getValorTotal() != null ? detalhe.getValorTotal() : BigDecimal.ZERO;

            // Regra de "Sem PO"
            String po = detalhe.getPo();
            boolean semPO = (po == null || po.isBlank() || po.equals("-") || po.equalsIgnoreCase("PENDENTE"));

            // Colunas A: Status Operacional
            SituacaoOperacional situacao = lancamento.getSituacao();
            if (situacao == SituacaoOperacional.NAO_INICIADO || situacao == null) {
                row.addNaoIniciado(valorOS);
            } else if (situacao == SituacaoOperacional.PARALISADO) {
                row.addParalisado(valorOS);
            } else if (situacao == SituacaoOperacional.EM_ANDAMENTO) {
                if (semPO) row.addEmAndamentoSemPO(valorOS);
                else row.addEmAndamentoComPO(valorOS);
            } else if (situacao == SituacaoOperacional.FINALIZADO) {
                if (semPO) row.addFinalizadoSemPO(valorOS);
                else row.addFinalizadoComPO(valorOS);
            }

            // Colunas B: Status Faturamento
            Optional<SolicitacaoFaturamento> faturamentoOpt = detalhe.getSolicitacoesFaturamento()
                    .stream().findFirst(); // Pega a primeira (e única) solicitação de faturamento

            if (faturamentoOpt.isPresent()) {
                SolicitacaoFaturamento faturamento = faturamentoOpt.get();
                StatusFaturamento statusFaturamento = faturamento.getStatus();

                if (statusFaturamento == StatusFaturamento.PENDENTE_ASSISTANT) {
                    row.addIdSolicitado(valorOS);
                } else if (statusFaturamento == StatusFaturamento.ID_RECEBIDO || statusFaturamento == StatusFaturamento.FATURADO) {
                    row.addIdRecebido(valorOS);
                }

                // Cálculo dos KPIs globais
                if (statusFaturamento == StatusFaturamento.FATURADO) {
                    if (faturamento.getTipo() == TipoFaturamento.ADIANTAMENTO) {
                        valorTotalAntecipado = valorTotalAntecipado.add(valorOS);
                    } else {
                        valorTotalFaturado = valorTotalFaturado.add(valorOS);
                    }
                }
            }

            detalhesProcessados.add(detalhe.getId());
        }

        // Finaliza os cálculos (somas de subgrupos)
        reportMap.values().forEach(GateReportRowDTO::calcularTotais);

        // Converte o mapa em lista e ordena por nome
        List<GateReportRowDTO> linhasDoRelatorio = reportMap.values().stream()
                .sorted(Comparator.comparing(GateReportRowDTO::getSegmentoNome))
                .toList();

        return new GateReportResponseDTO(valorTotalFaturado, valorTotalAntecipado, linhasDoRelatorio);
    }
}