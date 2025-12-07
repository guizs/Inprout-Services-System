// ==========================================================
// LÓGICA DO CONTROLE CPS
// ==========================================================

// Variáveis de Choices (específicas deste módulo)
let choicesCpsPrestador = null;
let choicesCpsHistPrestador = null;

function initFiltrosCPS() {
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const hoje = new Date();
    
    // Filtros DOM
    const filtroCpsMes = document.getElementById('cps-filtro-mes-ref');
    const filtroCpsHistMes = document.getElementById('cps-hist-filtro-mes-ref');
    const filtroCpsSegmento = document.getElementById('cps-filtro-segmento');
    const filtroCpsHistSegmento = document.getElementById('cps-hist-filtro-segmento');
    const filtroCpsPrestador = document.getElementById('cps-filtro-prestador');
    const filtroCpsHistPrestador = document.getElementById('cps-hist-filtro-prestador');


    // 1. Popula Mês (Pendências)
    if (filtroCpsMes && filtroCpsMes.options.length === 0) {
        for (let i = 0; i < 12; i++) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const txt = `${nomesMeses[d.getMonth()]}/${d.getFullYear()}`;
            filtroCpsMes.add(new Option(txt, val, i === 0, i === 0));
        }
    }

    // 2. Popula Mês (Histórico)
    if (filtroCpsHistMes && filtroCpsHistMes.options.length === 0) {
        for (let i = 0; i < 12; i++) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const txt = `${nomesMeses[d.getMonth()]}/${d.getFullYear()}`;
            filtroCpsHistMes.add(new Option(txt, val, i === 0, i === 0));
        }
    }

    // 3. Carrega Segmentos e Prestadores
    const precisaCarregar = (filtroCpsSegmento && filtroCpsSegmento.options.length <= 1) ||
        (filtroCpsHistSegmento && filtroCpsHistSegmento.options.length <= 1);

    if (precisaCarregar) {
        Promise.all([
            fetchComAuth(`${API_BASE_URL}/segmentos`),
            fetchComAuth(`${API_BASE_URL}/index/prestadores`)
        ]).then(async ([resSeg, resPrest]) => {

            if (resSeg.ok) {
                const segs = await resSeg.json();
                if (filtroCpsSegmento) {
                    filtroCpsSegmento.innerHTML = '<option value="">Todos</option>';
                    segs.forEach(s => filtroCpsSegmento.add(new Option(s.nome, s.id)));
                }
                if (filtroCpsHistSegmento) {
                    filtroCpsHistSegmento.innerHTML = '<option value="">Todos</option>';
                    segs.forEach(s => filtroCpsHistSegmento.add(new Option(s.nome, s.id)));
                }
            }

            if (resPrest.ok) {
                const prests = await resPrest.json();
                if (filtroCpsPrestador) {
                    filtroCpsPrestador.innerHTML = '<option value="">Todos</option>';
                    prests.forEach(p => filtroCpsPrestador.add(new Option(`${p.codigoPrestador} - ${p.prestador}`, p.id)));
                    if (typeof Choices !== 'undefined') {
                        if (choicesCpsPrestador) choicesCpsPrestador.destroy();
                        choicesCpsPrestador = new Choices(filtroCpsPrestador, { searchEnabled: true, itemSelectText: '', shouldSort: false });
                    }
                }
                if (filtroCpsHistPrestador) {
                    filtroCpsHistPrestador.innerHTML = '<option value="">Todos</option>';
                    prests.forEach(p => filtroCpsHistPrestador.add(new Option(`${p.codigoPrestador} - ${p.prestador}`, p.id)));
                    if (typeof Choices !== 'undefined') {
                        if (choicesCpsHistPrestador) choicesCpsHistPrestador.destroy();
                        choicesCpsHistPrestador = new Choices(filtroCpsHistPrestador, { searchEnabled: true, itemSelectText: '', shouldSort: false });
                    }
                }
            }
        });
    }
}

async function carregarPendenciasCPS() {
    toggleLoader(true, '#cps-pendencias-pane');
    atualizarHeaderKpiCPS();

    try {
        const res = await fetchComAuth(`${API_BASE_URL}/controle-cps`, { headers: { 'X-User-ID': userId } });
        if (!res.ok) throw new Error('Erro ao buscar pendências CPS');
        window.dadosCpsGlobais = await res.json();

        renderizarAcordeonCPS(window.dadosCpsGlobais, 'accordionPendenciasCPS', 'msg-sem-pendencias-cps', true);
    } catch (error) {
        console.error(error);
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#cps-pendencias-pane');
    }
}

async function carregarHistoricoCPS(append = false) {
    toggleLoader(true, '#cps-historico-pane');
    atualizarHeaderKpiCPS();

    const btnCarregar = document.getElementById('btn-carregar-mais-historico-cps');
    const accordion = document.getElementById('accordionHistoricoCPS');
    const msgSem = document.getElementById('msg-sem-historico-cps');

    if (btnCarregar) btnCarregar.disabled = true;

    if (!append) {
        window.cpsHistDataFim = new Date();
        window.cpsHistDataInicio = new Date();
        window.cpsHistDataInicio.setDate(window.cpsHistDataFim.getDate() - 30);
        window.dadosCpsHistorico = [];
        if (accordion) accordion.innerHTML = '';
    }

    const inicioStr = window.cpsHistDataInicio.toISOString().split('T')[0];
    const fimStr = window.cpsHistDataFim.toISOString().split('T')[0];
    const segmentoId = document.getElementById('cps-hist-filtro-segmento')?.value || '';
    const prestadorId = document.getElementById('cps-hist-filtro-prestador')?.value || '';

    const params = new URLSearchParams({
        inicio: inicioStr,
        fim: fimStr,
        segmentoId: segmentoId,
        prestadorId: prestadorId
    });

    try {
        const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/historico?${params}`, {
            headers: { 'X-User-ID': userId }
        });
        if (!res.ok) throw new Error('Erro ao buscar histórico CPS');

        const novosDados = await res.json();

        if (novosDados.length === 0) {
            if (!append && msgSem) msgSem.classList.remove('d-none');
            if (append) mostrarToast("Não há mais registros no período anterior.", "warning");
        } else {
            if (msgSem) msgSem.classList.add('d-none');
            if (append) {
                window.dadosCpsHistorico = [...window.dadosCpsHistorico, ...novosDados];
            } else {
                window.dadosCpsHistorico = novosDados;
            }
            renderizarAcordeonCPS(window.dadosCpsHistorico, 'accordionHistoricoCPS', 'msg-sem-historico-cps', false);
        }

    } catch (error) {
        console.error(error);
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#cps-historico-pane');
        if (btnCarregar) btnCarregar.disabled = false;
    }
}

async function atualizarHeaderKpiCPS() {
    const elsTotal = document.querySelectorAll('.kpi-cps-total-mes-value');
    const elsAdiantado = document.querySelectorAll('.kpi-cps-total-adiantado-value');
    const elsPendente = document.querySelectorAll('.kpi-cps-total-pendente-value');
    const elsPago = document.querySelectorAll('.kpi-cps-total-pago-value');
    const elsQtd = document.querySelectorAll('.kpi-cps-qtd-itens-value');

    if (elsTotal.length === 0) return;

    const mesVal = document.getElementById('cps-filtro-mes-ref')?.value;
    const segmentoId = document.getElementById('cps-filtro-segmento')?.value;
    const prestadorId = document.getElementById('cps-filtro-prestador')?.value;

    if (!mesVal) return;

    const [ano, mes] = mesVal.split('-');
    const dataInicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataFim = `${ano}-${mes}-${ultimoDia}`;

    const params = new URLSearchParams({
        inicio: dataInicio,
        fim: dataFim,
        segmentoId: segmentoId || '',
        prestadorId: prestadorId || ''
    });

    const setLoading = (text) => {
        [elsTotal, elsAdiantado, elsPendente, elsPago, elsQtd].forEach(nodeList => {
            nodeList.forEach(el => el.textContent = text);
        });
    };
    setLoading("...");

    try {
        const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/dashboard?${params}`, {
            headers: { 'X-User-ID': userId }
        });
        if (!response.ok) throw new Error('Erro ao carregar KPIs');

        const dados = await response.json();
        const formatar = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

        elsTotal.forEach(el => el.textContent = formatar(dados.valorTotal));
        elsAdiantado.forEach(el => el.textContent = formatar(dados.valorTotalAdiantado));
        elsPendente.forEach(el => el.textContent = formatar(dados.valorTotalPendente));
        elsPago.forEach(el => el.textContent = formatar(dados.valorTotalPago));
        elsQtd.forEach(el => el.textContent = dados.quantidadeItens || 0);

    } catch (error) {
        console.error("Erro KPIs:", error);
        setLoading("-");
    }
}

function renderizarAcordeonCPS(lista, containerId, msgVazioId, isPendencia) {
    const container = document.getElementById(containerId);
    const msgDiv = document.getElementById(msgVazioId);

    if (!container || !msgDiv) return;
    container.innerHTML = '';

    if (!lista || lista.length === 0) {
        msgDiv.classList.remove('d-none');
        return;
    }
    msgDiv.classList.add('d-none');

    const grupos = lista.reduce((acc, l) => {
        const id = l.os?.id || 0;
        if (!acc[id]) acc[id] = {
            os: l.os?.os,
            projeto: l.os?.projeto,
            totalCps: l.valorCps || 0,
            totalPago: l.totalPago || 0,
            totalAdiantado: 0,
            itens: []
        };
        acc[id].totalAdiantado += parseFloat(l.valorAdiantamento) || 0;
        acc[id].itens.push(l);
        return acc;
    }, {});

    const isControllerOrAdmin = ['CONTROLLER', 'ADMIN'].includes(userRole);
    const isCoordOrAdmin = ['COORDINATOR', 'ADMIN', 'MANAGER'].includes(userRole);
    const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    Object.values(grupos).forEach((grp, idx) => {
        const uniqueId = `cps-${isPendencia ? 'pend' : 'hist'}-${idx}`;

        grp.itens.sort((a, b) => {
            const peso = (s) => s === 'EM_ABERTO' ? 1 : (s === 'FECHADO' ? 2 : 3);
            return peso(a.statusPagamento) - peso(b.statusPagamento);
        });

        const valorTotalCps = grp.totalCps;
        const valorAdiantado = grp.totalAdiantado;
        const saldoPendente = valorTotalCps - valorAdiantado;
        const valorPago = grp.totalPago;
        const percentual = valorTotalCps > 0 ? (valorPago / valorTotalCps) * 100 : 0;

        let showHeaderCheckbox = false;
        if (isPendencia) {
            if (userRole === 'ADMIN') showHeaderCheckbox = true;
            else if (['COORDINATOR', 'MANAGER'].includes(userRole) && grp.itens.some(i => i.statusPagamento === 'EM_ABERTO')) showHeaderCheckbox = true;
            else if (userRole === 'CONTROLLER' && grp.itens.some(i => i.statusPagamento === 'FECHADO' || i.statusPagamento === 'ALTERACAO_SOLICITADA' || i.statusPagamento === 'SOLICITACAO_ADIANTAMENTO')) showHeaderCheckbox = true;
        }

        const checkboxHeaderHtml = showHeaderCheckbox ? `
        <div class="position-absolute top-50 start-0 translate-middle-y ms-3 check-container-header" style="z-index: 5;">
            <input class="form-check-input cps-select-all shadow-sm" type="checkbox" data-target-body="collapse-${uniqueId}" style="cursor: pointer; margin: 0;">
        </div>` : '';
        const paddingLeft = showHeaderCheckbox ? 'ps-5' : 'ps-3';

        const headerContentHtml = `
        <div class="header-content w-100">
            <div class="header-title-wrapper">
                <span class="header-title-project">${grp.projeto || '-'}</span>
                <span class="header-title-os">${grp.os || '-'}</span>
            </div>
            <div class="header-kpi-wrapper" style="gap: 1.5rem;">
                <div class="header-kpi"><span class="kpi-label">TOTAL CPS</span><span class="kpi-value">${formatMoney(valorTotalCps)}</span></div>
                <div class="header-kpi"><span class="kpi-label text-warning">ADIANTADO</span><span class="kpi-value text-warning">${formatMoney(valorAdiantado)}</span></div>
                <div class="header-kpi"><span class="kpi-label text-danger">PENDENTE</span><span class="kpi-value text-danger">${formatMoney(saldoPendente)}</span></div>
                <div class="header-kpi"><span class="kpi-label text-success">PAGO</span><span class="kpi-value text-success">${formatMoney(valorPago)}</span></div>
                <div class="header-kpi border-start ps-3 d-flex flex-column justify-content-center">
                    <span class="kpi-value" style="font-size: 1.1rem;">${percentual.toFixed(1)}%</span>
                </div>
            </div>
            <span class="badge bg-secondary header-badge ms-3">${grp.itens.length} item(s)</span>
        </div>`;

        const linhas = grp.itens.map(l => {
            let btns = `<button class="btn btn-sm btn-outline-info me-1" title="Ver Detalhes" onclick="verComentarios(${l.id})"><i class="bi bi-eye"></i></button>`;
            let showRowCheckbox = false;

            if (isPendencia) {
                if (l.statusPagamento === 'EM_ABERTO' && isCoordOrAdmin) {
                    btns += `<button class="btn btn-sm btn-outline-success me-1" title="Fechar Pagamento Total" onclick="abrirModalCpsValor(${l.id}, 'fechar')"><i class="bi bi-check-circle"></i></button>`;
                    btns += `<button class="btn btn-sm btn-outline-primary me-1" title="Solicitar Adiantamento" onclick="abrirModalSolicitarAdiantamento(${l.id}, ${l.valor}, ${l.valorAdiantamento || 0})"><i class="bi bi-cash-stack"></i></button>`;
                    btns += `<button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="abrirModalCpsValor(${l.id}, 'recusar')"><i class="bi bi-x-circle"></i></button>`;
                    showRowCheckbox = true;
                }
                else if (l.statusPagamento === 'SOLICITACAO_ADIANTAMENTO' && isControllerOrAdmin) {
                    btns += `<button class="btn btn-sm btn-outline-success me-1" title="Pagar Adiantamento" onclick="aprovarAdiantamento(${l.id}, ${l.valorSolicitadoAdiantamento})"><i class="bi bi-check-lg"></i></button>`;
                    btns += `<button class="btn btn-sm btn-outline-danger" title="Recusar Adiantamento" onclick="recusarAdiantamento(${l.id})"><i class="bi bi-x-lg"></i></button>`;
                    showRowCheckbox = true;
                }
                else if (isControllerOrAdmin && (l.statusPagamento === 'FECHADO' || l.statusPagamento === 'ALTERACAO_SOLICITADA')) {
                    btns += `<button class="btn btn-sm btn-outline-danger" title="Devolver ao Coordenador" onclick="abrirModalCpsRecusarController(${l.id})"><i class="bi bi-arrow-counterclockwise"></i></button>`;
                    showRowCheckbox = true;
                }
            }

            const checkHtml = showRowCheckbox ? `<td><input type="checkbox" class="form-check-input cps-check" data-id="${l.id}" data-status="${l.statusPagamento}"></td>` : (isPendencia ? '<td></td>' : '');
            const valPg = l.valorPagamento !== null ? l.valorPagamento : l.valor;
            const rowClass = l.statusPagamento === 'FECHADO' ? 'table-success' : '';

            return `
            <tr class="${rowClass}">
                ${checkHtml}
                <td class="text-center bg-transparent">${btns}</td>
                <td class="bg-transparent"><span class="badge text-bg-secondary bg-opacity-75 text-dark">${(l.statusPagamento || '').replace(/_/g, ' ')}</span></td>
                <td class="bg-transparent">${l.dataAtividade || '-'}</td>
                <td class="bg-transparent text-center fw-bold text-primary">${l.dataCompetencia || '-'}</td> 
                <td class="bg-transparent">${l.detalhe?.site || '-'}</td>
                <td class="bg-transparent">${l.detalhe?.lpu?.nomeLpu || '-'}</td>
                <td class="bg-transparent">${l.prestador?.nome || '-'}</td>
                <td class="bg-transparent">${l.manager?.nome || '-'}</td>
                <td class="text-center bg-transparent fw-bold">${formatMoney(valPg)}</td>
                <td class="bg-transparent"><small>${l.detalhe?.key || '-'}</small></td>
            </tr>`;
        }).join('');

        const thCheck = isPendencia ? '<th><i class="bi bi-check-all"></i></th>' : '';

        container.insertAdjacentHTML('beforeend', `
        <div class="accordion-item border mb-2">
            <h2 class="accordion-header position-relative" id="heading-${uniqueId}">
                ${checkboxHeaderHtml}
                <button class="accordion-button collapsed ${paddingLeft}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                    ${headerContentHtml}
                </button>
            </h2>
            <div id="collapse-${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#${containerId}">
                <div class="accordion-body p-0">
                    <div class="table-responsive">
                        <table class="table mb-0 align-middle small table-hover">
                            <thead class="table-light">
                                <tr>
                                    ${thCheck} <th class="text-center">Ações</th> <th>Status</th> <th>DATA ATIVIDADE</th>
                                    <th>COMPETÊNCIA</th> <th>Site</th> <th>Item</th> <th>Prestador</th> <th>Gestor</th>
                                    <th class="text-center">Valor</th> <th>KEY</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-${uniqueId}">${linhas}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`);
    });

    if (isPendencia) {
        // Função que deve estar no main ou aqui, para atualizar os botões de lote
        if (typeof atualizarBotoesLoteCPS === 'function') atualizarBotoesLoteCPS();
        configurarBuscaCps('input-busca-cps-pendencias', 'accordionPendenciasCPS');
    } else {
        configurarBuscaCps('input-busca-cps-historico', 'accordionHistoricoCPS');
    }
}

// Handlers de Ação Unitária
window.abrirModalCpsValor = function (id, acao) {
    const l = window.dadosCpsGlobais.find(x => x.id == id);
    if (!l) return;
    document.getElementById('cpsLancamentoIdAcao').value = id;
    document.getElementById('cpsAcaoCoordenador').value = acao;
    modalAlterarValorCPS._element.dataset.acaoEmLote = 'false';

    const btn = document.getElementById('btnConfirmarAcaoCPS');
    const inputJust = document.getElementById('cpsJustificativaInput');
    const divComp = document.getElementById('divCompetenciaCps');

    if (acao === 'recusar') {
        btn.className = 'btn btn-danger';
        btn.textContent = "Confirmar Recusa";
        divComp.style.display = 'none';
        document.getElementById('cpsCompetenciaInput').required = false;
        inputJust.required = true;
    } else {
        btn.className = 'btn btn-success';
        btn.textContent = "Confirmar Fechamento";
        divComp.style.display = 'block';
        gerarOpcoesCompetencia();
        document.getElementById('cpsCompetenciaInput').required = true;
        inputJust.required = false;
        const val = l.valorPagamento !== null ? l.valorPagamento : l.valor;
        document.getElementById('cpsValorPagamentoInput').value = val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    modalAlterarValorCPS.show();
};

window.abrirModalCpsRecusarController = function (id) {
    document.getElementById('cpsLancamentoIdRecusar').value = id;
    modalRecusarCPS._element.dataset.acaoEmLote = 'false';
    document.getElementById('cpsMotivoRecusaInput').value = '';
    modalRecusarCPS.show();
};

window.abrirModalSolicitarAdiantamento = function (id, valorTotal, valorJaAdiantado) {
    document.getElementById('adiantamentoLancamentoId').value = id;
    document.getElementById('adiantamentoValorTotalDisplay').value = formatarMoeda(valorTotal);
    document.getElementById('adiantamentoValorJaPagoDisplay').value = formatarMoeda(valorJaAdiantado);
    document.getElementById('valorSolicitadoInput').value = '';
    modalAdiantamento.show();
};

window.aprovarAdiantamento = function (id, valor) {
    document.getElementById('idAdiantamentoAprovar').value = id;
    document.getElementById('displayValorAdiantamento').textContent = formatarMoeda(valor);
    modalAprovarAdiantamento.show();
};

window.recusarAdiantamento = function (id) {
    document.getElementById('idAdiantamentoRecusar').value = id;
    document.getElementById('motivoRecusaAdiantamento').value = '';
    modalRecusarAdiantamento.show();
};

function gerarOpcoesCompetencia() {
    const select = document.getElementById('cpsCompetenciaInput');
    if (!select) return;
    select.innerHTML = '';
    const hoje = new Date();
    let dataBase = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    if (hoje.getDate() > 5) dataBase.setMonth(dataBase.getMonth() + 1);

    const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    for (let i = 0; i < 60; i++) {
        const mes = dataBase.getMonth();
        const ano = dataBase.getFullYear();
        select.add(new Option(`${meses[mes]}/${ano}`, `${ano}-${String(mes + 1).padStart(2, '0')}-01`));
        dataBase.setMonth(dataBase.getMonth() + 1);
    }
}

function configurarBuscaCps(inputId, accordionId) {
    const input = document.getElementById(inputId);
    const accordion = document.getElementById(accordionId);
    if (!input || !accordion) return;

    // Clone para remover listeners antigos
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('keyup', function () {
        const termo = this.value.toLowerCase();
        const items = accordion.querySelectorAll('.accordion-item');
        items.forEach(item => {
            const headerText = item.querySelector('.accordion-header').innerText.toLowerCase();
            let visivel = headerText.includes(termo);
            if (!visivel) {
                const linhas = item.querySelectorAll('tbody tr');
                linhas.forEach(tr => {
                    if (tr.innerText.toLowerCase().includes(termo)) {
                        tr.classList.remove('d-none');
                        visivel = true;
                    } else {
                        tr.classList.add('d-none');
                    }
                });
            } else {
                item.querySelectorAll('tbody tr').forEach(tr => tr.classList.remove('d-none'));
            }
            item.classList.toggle('d-none', !visivel);
        });
    });
}