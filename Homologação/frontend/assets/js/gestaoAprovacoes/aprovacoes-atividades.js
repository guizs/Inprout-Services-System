// ==========================================================
// 2. LÓGICA DE ATIVIDADES E HISTÓRICO (aprovacoes-atividades.js)
// ==========================================================

async function carregarDadosAtividades() {
    toggleLoader(true, '#atividades-pane');
    try {
        const [responseGeral, responseHistorico, responsePendenciasAtiv] = await Promise.all([
            fetchComAuth(`${API_BASE_URL}/lancamentos`),
            fetchComAuth(`${API_BASE_URL}/lancamentos/historico/${userId}`),
            fetchComAuth(`${API_BASE_URL}/lancamentos/pendentes/${userId}`)
        ]);

        if (!responseGeral.ok || !responseHistorico.ok || !responsePendenciasAtiv.ok) {
            throw new Error('Falha ao carregar dados de atividades.');
        }

        window.todosOsLancamentosGlobais = await responseGeral.json();
        const historicoParaExibir = await responseHistorico.json();
        window.todasPendenciasAtividades = await responsePendenciasAtiv.json();

        renderizarTabelaHistorico(historicoParaExibir);
        renderizarAcordeonPendencias(window.todasPendenciasAtividades);

        // Atualiza Título da Tabela conforme Role (do backup)
        const tituloEl = document.getElementById('titulo-tabela');
        if (tituloEl) {
            if (userRole === 'COORDINATOR') {
                tituloEl.innerHTML = '<i class="bi bi-clock-history me-2"></i> Pendências';
            } else if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                tituloEl.innerHTML = '<i class="bi bi-shield-check me-2"></i> Pendências do Controller';
            }
        }

    } catch (error) {
        console.error(error);
        mostrarToast('Falha ao carregar os dados de atividades.', 'error');
    } finally {
        toggleLoader(false, '#atividades-pane');
    }
}

async function carregarDadosHistoricoAtividades(append = false) {
    const tbodyHistorico = document.getElementById('tbody-historico');
    if (!tbodyHistorico) return;

    if (!append) {
        window.histDataFim = new Date();
        window.histDataInicio = new Date();
        window.histDataInicio.setDate(window.histDataFim.getDate() - 30);
        window.todosHistoricoAtividades = []; 
    }

    toggleLoader(true, '#historico-atividades-pane');
    const btnCarregarMais = document.getElementById('btn-carregar-mais-historico');
    if (btnCarregarMais) btnCarregarMais.disabled = true;

    try {
        const params = new URLSearchParams({
            inicio: formatarISO(window.histDataInicio),
            fim: formatarISO(window.histDataFim)
        });

        const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/historico/${userId}?${params}`);
        if (!response.ok) throw new Error('Falha ao carregar histórico.');

        const novosDados = await response.json();

        if (!append) {
            window.todosHistoricoAtividades = novosDados;
        } else {
            window.todosHistoricoAtividades = [...window.todosHistoricoAtividades, ...novosDados];
        }

        renderizarTabelaHistorico(window.todosHistoricoAtividades);

        if (novosDados.length === 0 && append) {
            mostrarToast("Não há mais registros no período anterior.", "warning");
        }

    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao carregar histórico.', 'error');
    } finally {
        toggleLoader(false, '#historico-atividades-pane');
        if (btnCarregarMais) btnCarregarMais.disabled = false;
    }
}

function renderizarAcordeonPendencias(dados) {
    const accordionContainer = document.getElementById('accordion-pendencias');
    if (!accordionContainer) return;

    accordionContainer.innerHTML = ''; 

    if (!dados || dados.length === 0) {
        accordionContainer.innerHTML = `<div class="text-center p-4 text-muted">Nenhuma pendência encontrada para seu perfil.</div>`;
        return;
    }

    // Agrupa por OS
    const agrupadoPorOS = dados.reduce((acc, lancamento) => {
        const osId = lancamento.os.id;
        if (!acc[osId]) {
            acc[osId] = {
                id: osId,
                os: lancamento.os.os,
                projeto: lancamento.os.projeto,
                totalOs: lancamento.totalOs,
                valorCps: lancamento.valorCps,
                valorPendente: lancamento.valorPendente,
                custoTotalMateriais: lancamento.os.custoTotalMateriais,
                linhas: []
            };
        }
        acc[osId].linhas.push(lancamento);
        return acc;
    }, {});

    const grupos = Object.values(agrupadoPorOS);
    const frag = document.createDocumentFragment();

    const colunas = [
        "AÇÕES", "PRAZO AÇÃO", "STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE", "VALOR DA ATIVIDADE", "CONTRATO", "SEGMENTO", "PROJETO",
        "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE",
        "OBSERVAÇÕES", "DATA PO", "VISTORIA", "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DE DESMOBILIZAÇÃO",
        "INSTALAÇÃO", "PLANO DE INSTALAÇÃO", "ATIVAÇÃO", "PLANO DE ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DE DOCUMENTAÇÃO",
        "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "GESTOR"
    ];

    const dataMapping = {
        "PRAZO AÇÃO": (lancamento) => userRole !== 'CONTROLLER' ? `<span class="badge bg-danger">${formatarData(lancamento.dataPrazo)}</span>` : '',
        "STATUS APROVAÇÃO": (lancamento) => {
            let statusHtml = `<span class="badge rounded-pill text-bg-warning">${(lancamento.situacaoAprovacao || '').replace(/_/g, ' ')}</span>`;
            if (lancamento.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO' && lancamento.dataPrazoProposta) {
                statusHtml += `<br><small class="text-muted">Prazo Solicitado: <b>${lancamento.dataPrazoProposta.split('-').reverse().join('/')}</b></small>`;
            }
            return statusHtml;
        },
        "DATA ATIVIDADE": (lancamento) => formatarData(lancamento.dataAtividade),
        "OS": (lancamento) => get(lancamento, 'os.os'), "SITE": (lancamento) => get(lancamento, 'detalhe.site'),
        "VALOR DA ATIVIDADE": (lancamento) => formatarMoeda(lancamento.valor),
        "VALOR TOTAL DO ITEM": (lancamento) => formatarMoeda(get(lancamento, 'detalhe.valorTotal')),
        "CONTRATO": (lancamento) => get(lancamento, 'detalhe.contrato'),
        "SEGMENTO": (lancamento) => get(lancamento, 'os.segmento.nome'), "PROJETO": (lancamento) => get(lancamento, 'os.projeto'),
        "GESTOR TIM": (lancamento) => get(lancamento, 'os.gestorTim'), "REGIONAL": (lancamento) => get(lancamento, 'detalhe.regional'),
        "LPU": (lancamento) => get(lancamento, 'detalhe.lpu.nomeLpu'), "LOTE": (lancamento) => get(lancamento, 'detalhe.lote'), "BOQ": (lancamento) => get(lancamento, 'detalhe.boq'),
        "PO": (lancamento) => get(lancamento, 'detalhe.po'), "ITEM": (lancamento) => get(lancamento, 'detalhe.item'),
        "OBJETO CONTRATADO": (lancamento) => get(lancamento, 'detalhe.objetoContratado'), "UNIDADE": (lancamento) => get(lancamento, 'detalhe.unidade'),
        "QUANTIDADE": (lancamento) => get(lancamento, 'detalhe.quantidade'), "OBSERVAÇÕES": (lancamento) => get(lancamento, 'detalhe.observacoes'),
        "DATA PO": (lancamento) => formatarData(get(lancamento, 'detalhe.dataPo')), "VISTORIA": (lancamento) => get(lancamento, 'vistoria'),
        "PLANO DE VISTORIA": (lancamento) => formatarData(lancamento.planoVistoria), "DESMOBILIZAÇÃO": (lancamento) => get(lancamento, 'desmobilizacao'),
        "PLANO DE DESMOBILIZAÇÃO": (lancamento) => formatarData(lancamento.planoDesmobilizacao), "INSTALAÇÃO": (lancamento) => get(lancamento, 'instalacao'),
        "PLANO DE INSTALAÇÃO": (lancamento) => formatarData(lancamento.planoInstalacao), "ATIVAÇÃO": (lancamento) => get(lancamento, 'ativacao'),
        "PLANO DE ATIVAÇÃO": (lancamento) => formatarData(lancamento.planoAtivacao), "DOCUMENTAÇÃO": (lancamento) => get(lancamento, 'documentacao'),
        "PLANO DE DOCUMENTAÇÃO": (lancamento) => formatarData(lancamento.planoDocumentacao),
        "ETAPA GERAL": (lancamento) => get(lancamento, 'etapa.codigoGeral', '') + ' - ' + get(lancamento, 'etapa.nomeGeral', ''),
        "ETAPA DETALHADA": (lancamento) => get(lancamento, 'etapa.indiceDetalhado', '') + ' - ' + get(lancamento, 'etapa.nomeDetalhado', ''),
        "STATUS": (lancamento) => get(lancamento, 'status'), "SITUAÇÃO": (lancamento) => get(lancamento, 'situacao'),
        "DETALHE DIÁRIO": (lancamento) => get(lancamento, 'detalheDiario'), "CÓD. PRESTADOR": (lancamento) => get(lancamento, 'prestador.codigo'),
        "PRESTADOR": (lancamento) => get(lancamento, 'prestador.nome'), "GESTOR": (lancamento) => get(lancamento, 'manager.nome'),
    };

    grupos.forEach((grupo, index) => {
        const uniqueId = `${grupo.id}-${index}`;
        const item = document.createElement('div');
        item.className = 'accordion-item';

        const isVencido = grupo.linhas.some(lancamento => {
            const dataPrazo = lancamento.dataPrazo ? parseDataBrasileira(lancamento.dataPrazo) : null;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            return dataPrazo && dataPrazo < hoje;
        });

        const primeiroLancamento = grupo.linhas[0];
        const dadosOS = primeiroLancamento.os || {};
        const isComplementar = get(primeiroLancamento, 'detalhe.key', '').includes('_AC_');
        let tituloOS = grupo.os;
        if (isComplementar) {
            const lpu = get(primeiroLancamento, 'detalhe.lpu.nomeLpu', '');
            tituloOS = `${grupo.os} (Complementar: ${lpu})`;
        }

        const buttonClass = isVencido ? 'accordion-button collapsed accordion-button-vencido' : 'accordion-button collapsed';

        // KPIs (Ajustado conforme o backup)
        const valorTotalOS = grupo.totalOs || 0;
        const valorTotalCPS = grupo.valorCps || 0;
        const custoTotalMateriais = grupo.custoTotalMateriais || 0;
        const valorCpsLegado = dadosOS.valorCpsLegado || 0;
        const valorTransporte = dadosOS.transporte || 0;
        const percentual = valorTotalOS > 0
            ? ((valorTotalCPS + custoTotalMateriais + valorCpsLegado + valorTransporte) / valorTotalOS) * 100
            : 0;

        let kpiHTML = `
        <div class="header-kpi-wrapper">
            <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(valorTotalOS)}</span></div>
            ${valorCpsLegado > 0 ? `<div class="header-kpi"><span class="kpi-label text-warning">Legado</span><span class="kpi-value text-warning">${formatarMoeda(valorCpsLegado)}</span></div>` : ''}
            <div class="header-kpi"><span class="kpi-label">CPS</span><span class="kpi-value">${formatarMoeda(valorTotalCPS)}</span></div>
            <div class="header-kpi"><span class="kpi-label">Material</span><span class="kpi-value">${formatarMoeda(custoTotalMateriais)}</span></div>
            <div class="header-kpi"><span class="kpi-label">Transp.</span><span class="kpi-value">${formatarMoeda(valorTransporte)}</span></div>
            <div class="header-kpi"><span class="kpi-label">%</span><span class="kpi-value kpi-percentage">${percentual.toFixed(2)}%</span></div>
        </div>`;

        const headerHTML = `
        <h2 class="accordion-header position-relative" id="heading-${uniqueId}">
            <div class="position-absolute top-50 start-0 translate-middle-y ms-3 check-container-header" style="z-index: 5;">
                <input class="form-check-input selecionar-todos-acordeon shadow-sm" type="checkbox" 
                       data-target-body="collapse-${uniqueId}" 
                       style="cursor: pointer; margin: 0;">
            </div>
            <button class="${buttonClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                <div class="header-content w-100 ps-5"> <div class="header-title-wrapper">
                        <span class="header-title-project">${grupo.projeto}</span>
                        <span class="header-title-os">${tituloOS}</span>
                    </div>
                    ${kpiHTML}
                    <span class="badge bg-primary header-badge">${grupo.linhas.length} itens pendentes</span>
                </div>
            </button>
        </h2>`;

        let colunasParaRenderizar = [...colunas]; 
        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            colunasParaRenderizar = colunasParaRenderizar.filter(c => c !== "PRAZO AÇÃO");
        }

        const bodyRowsHTML = grupo.linhas.map(lancamento => {
            const cellsHTML = colunasParaRenderizar.map(header => {
                
                // === LÓGICA DE AÇÕES DO BACKUP ===
                if (header === 'AÇÕES') {
                    let acoesHtml = '';
                    
                    if ((userRole === 'COORDINATOR' || userRole === 'MANAGER') && lancamento.situacaoAprovacao === 'PENDENTE_COORDENADOR') {
                        acoesHtml = `
                            <button class="btn btn-sm btn-outline-success me-1" onclick="aprovarLancamento(${lancamento.id})" title="Aprovar"><i class="bi bi-check-lg"></i></button>
                            <button class="btn btn-sm btn-outline-danger me-1" onclick="recusarLancamento(${lancamento.id})" title="Recusar"><i class="bi bi-x-lg"></i></button>
                            <button class="btn btn-sm btn-outline-warning" onclick="comentarLancamento(${lancamento.id})" title="Solicitar Prazo"><i class="bi bi-clock-history"></i></button>
                        `;
                    }
                    else if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                        if (lancamento.situacaoAprovacao === 'PENDENTE_CONTROLLER') {
                            acoesHtml = `
                                <button class="btn btn-sm btn-outline-success me-1" onclick="aprovarLancamentoController(${lancamento.id})" title="Aprovar"><i class="bi bi-check-lg"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="recusarLancamentoController(${lancamento.id})" title="Recusar"><i class="bi bi-x-lg"></i></button>
                            `;
                        } else if (lancamento.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO') {
                            acoesHtml = `
                                <button class="btn btn-sm btn-outline-success me-1" onclick="aprovarPrazoController(${lancamento.id})" title="Aprovar Prazo"><i class="bi bi-calendar-check"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="recusarPrazoController(${lancamento.id})" title="Recusar Prazo"><i class="bi bi-calendar-x"></i></button>
                            `;
                        } else if (lancamento.situacaoAprovacao === 'PRAZO_VENCIDO') {
                             acoesHtml = `
                                <button class="btn btn-sm btn-outline-success me-1" onclick="aprovarLancamentoController(${lancamento.id})" title="Aprovar (Vencido)"><i class="bi bi-check-lg"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="recusarLancamentoController(${lancamento.id})" title="Recusar (Vencido)"><i class="bi bi-x-lg"></i></button>
                            `;
                        }
                    }
                    
                    return `<td class="text-center text-nowrap">${acoesHtml || '—'}</td>`;
                }

                const func = dataMapping[header]; 
                const valor = func ? func(lancamento) : '-'; 
                let classes = ''; 
                // Cores de status
                if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(header)) {
                    classes += ' status-cell';
                    if (valor === 'OK') classes += ' status-ok';
                    else if (valor === 'NOK') classes += ' status-nok';
                    else if (valor === 'N/A') classes += ' status-na';
                }
                if (header === "DETALHE DIÁRIO") {
                    classes += ' detalhe-diario-cell';
                }
                return `<td class="${classes}">${valor}</td>`;
            }).join('');
            
            return `<tr data-id="${lancamento.id}"><td><input type="checkbox" class="form-check-input linha-checkbox" data-id="${lancamento.id}"></td>${cellsHTML}</tr>`;
        }).join('');

        const bodyHTML = `
        <div id="collapse-${uniqueId}" class="accordion-collapse collapse">
            <div class="accordion-body">
                <div class="table-responsive">
                    <table class="table modern-table table-sm">
                        <thead>
                            <tr>
                                <th></th> ${colunasParaRenderizar.map(c => `<th>${c}</th>`).join('')} </tr>
                        </thead>
                        <tbody data-group-id="${uniqueId}">
                            ${bodyRowsHTML} </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        item.innerHTML = headerHTML + bodyHTML;
        frag.appendChild(item);
    });

    accordionContainer.appendChild(frag);
}

function renderizarTabelaHistorico(dados) {
    const tbodyHistorico = document.getElementById('tbody-historico');
    const theadHistorico = document.getElementById('thead-historico');
    if (!tbodyHistorico) return;

    // Filtro em memória
    const statusFiltrado = document.getElementById('filtro-historico-status')?.value || 'todos';
    let dadosFiltrados = statusFiltrado === 'todos' ? dados : dados.filter(l => l.situacaoAprovacao === statusFiltrado);

    // Ordenação
    dadosFiltrados.sort((a, b) => {
         const dateA = a.dataAtividade ? new Date(a.dataAtividade.split('/').reverse().join('-')) : new Date(0);
         const dateB = b.dataAtividade ? new Date(b.dataAtividade.split('/').reverse().join('-')) : new Date(0);
         return dateB - dateA;
    });

    const colunasHeaders = [
        { key: 'dataAtividade', label: 'DATA ATIVIDADE' }, { key: 'statusAprovacao', label: 'STATUS' },
        { key: 'os', label: 'OS' }, { key: 'site', label: 'SITE' },
        { key: 'segmento', label: 'SEGMENTO' }, { key: 'valor', label: 'VALOR' },
        { key: 'prestador', label: 'PRESTADOR' }
    ];

    if (theadHistorico) {
        theadHistorico.innerHTML = `<tr>
        <th>COMENTÁRIOS</th>
        ${colunasHeaders.map(h => `<th>${h.label}</th>`).join('')}
    </tr>`;
    }

    tbodyHistorico.innerHTML = '';
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        tbodyHistorico.innerHTML = `<tr><td colspan="${colunasHeaders.length + 1}" class="text-center text-muted p-4">Nenhum histórico para o filtro.</td></tr>`;
        return;
    }

    dadosFiltrados.forEach(lancamento => {
        const tr = document.createElement('tr');
        const statusBadge = lancamento.situacaoAprovacao.includes('RECUSADO') ? `<span class="badge rounded-pill text-bg-danger">${lancamento.situacaoAprovacao.replace(/_/g, ' ')}</span>` : `<span class="badge rounded-pill text-bg-success">${lancamento.situacaoAprovacao.replace(/_/g, ' ')}</span>`;

        tr.innerHTML = `
        <td><button class="btn btn-sm btn-outline-secondary" onclick="verComentarios(${lancamento.id})" ${!lancamento.comentarios || lancamento.comentarios.length === 0 ? 'disabled' : ''}><i class="bi bi-eye"></i></button></td>
        <td>${lancamento.dataAtividade || ''}</td>
        <td>${statusBadge}</td>
        <td>${lancamento.os?.os || ''}</td>
        <td>${lancamento.detalhe?.site || ''}</td>
        <td>${lancamento.os?.segmento?.nome || ''}</td>
        <td>${formatarMoeda(lancamento.valor)}</td>
        <td>${lancamento.prestador?.nome || ''}</td>
    `;
        tbodyHistorico.appendChild(tr);
    });
}

function atualizarEstadoAcoesLote() {
    const checkboxes = document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked');
    const container = document.getElementById('acoes-lote-container');
    if (!container) return;
    
    container.classList.toggle('d-none', checkboxes.length === 0);
    
    if (checkboxes.length > 0) {
        // Atualiza contadores
        const total = checkboxes.length;
        document.getElementById('contador-aprovacao').textContent = total;
        document.getElementById('contador-recusa').textContent = total;
        document.getElementById('contador-prazo').textContent = total;
        
        // Verifica consistência dos status
        const ids = Array.from(checkboxes).map(c => c.dataset.id);
        const lancs = window.todosOsLancamentosGlobais.filter(l => ids.includes(String(l.id)));
        const status = lancs[0]?.situacaoAprovacao;
        const allSame = lancs.every(l => l.situacaoAprovacao === status);
        
        const btnAprovar = document.getElementById('btn-aprovar-selecionados');
        const btnRecusar = document.getElementById('btn-recusar-selecionados');
        const btnPrazo = document.getElementById('btn-solicitar-prazo-selecionados');
        
        [btnAprovar, btnRecusar, btnPrazo].forEach(btn => btn.style.display = 'none');
        
        if (allSame) {
            // Regra de Coordenador/Manager
            if (['COORDINATOR', 'MANAGER', 'ADMIN'].includes(userRole) && status === 'PENDENTE_COORDENADOR') {
                [btnAprovar, btnRecusar, btnPrazo].forEach(btn => btn.style.display = 'inline-block');
            } 
            // Regra de Controller/Admin
            else if (['CONTROLLER', 'ADMIN'].includes(userRole)) {
                if (status === 'PENDENTE_CONTROLLER') {
                    [btnAprovar, btnRecusar].forEach(btn => btn.style.display = 'inline-block');
                } else if (status === 'AGUARDANDO_EXTENSAO_PRAZO' || status === 'PRAZO_VENCIDO') {
                    // Para prazo, botões especiais
                    btnAprovar.style.display = 'inline-block';
                    btnAprovar.innerHTML = `<i class="bi bi-calendar-check"></i> Aprovar Prazo (${total})`;
                    
                    btnRecusar.style.display = 'inline-block';
                    btnRecusar.innerHTML = `<i class="bi bi-calendar-x"></i> Recusar Prazo (${total})`;
                }
            }
        }
    }
}