// ==========================================================
// LÓGICA DO CONTROLE CPS (Versão Final - Valor Bloqueado)
// ==========================================================

// --- Variáveis de Dados ---
window.choicesCpsPrestador = null;
window.choicesCpsHistPrestador = null;
window.dadosCpsGlobais = [];
window.dadosCpsHistorico = [];

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os modais anexando diretamente ao window para evitar conflitos
    const elAlterar = document.getElementById('modalAlterarValorCPS');
    const elRecusar = document.getElementById('modalRecusarCPS');
    const elSolAdiant = document.getElementById('modalSolicitarAdiantamento');
    const elAprAdiant = document.getElementById('modalAprovarAdiantamento');
    const elRecAdiant = document.getElementById('modalRecusarAdiantamento');

    if (elAlterar) window.modalAlterarValorCPS = new bootstrap.Modal(elAlterar);
    if (elRecusar) window.modalRecusarCPS = new bootstrap.Modal(elRecusar);
    if (elSolAdiant) window.modalSolicitarAdiantamento = new bootstrap.Modal(elSolAdiant);
    if (elAprAdiant) window.modalAprovarAdiantamento = new bootstrap.Modal(elAprAdiant);
    if (elRecAdiant) window.modalRecusarAdiantamento = new bootstrap.Modal(elRecAdiant);
});

// --- Styles Dinâmicos ---
if (!document.getElementById('cps-custom-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'cps-custom-styles';
    styleSheet.innerText = `
      .accordion-item.cps-selected { background-color: #e9ecef !important; border-color: #6c757d !important; }
      .accordion-item.cps-selected .accordion-button { background-color: #dee2e6 !important; color: #212529 !important; }
      .cps-toolbar-floating { position: sticky; top: 0; z-index: 1020; background: white; padding: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-bottom: 1px solid #ddd; margin-bottom: 15px; border-radius: 4px; }
      .table-primary-light { background-color: #e7f1ff !important; }
    `;
    document.head.appendChild(styleSheet);
}

// ==========================================================
// FUNÇÕES AUXILIARES DE UI
// ==========================================================

function setLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
        if (!btn.dataset.originalText) btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processando...`;
    } else {
        btn.disabled = false;
        if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    }
}

// ==========================================================
// INICIALIZAÇÃO DE FILTROS
// ==========================================================

function initFiltrosCPS() {
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const hoje = new Date();
    const selects = [document.getElementById('cps-filtro-mes-ref'), document.getElementById('cps-hist-filtro-mes-ref')];

    selects.forEach(sel => {
        if (sel && sel.options.length === 0) {
            for (let i = 0; i < 12; i++) {
                const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const txt = `${nomesMeses[d.getMonth()]}/${d.getFullYear()}`;
                sel.add(new Option(txt, val, i === 0, i === 0));
            }
        }
    });

    const selectsSeg = [document.getElementById('cps-filtro-segmento'), document.getElementById('cps-hist-filtro-segmento')];
    const selectsPrest = [document.getElementById('cps-filtro-prestador'), document.getElementById('cps-hist-filtro-prestador')];

    if ((selectsSeg[0] && selectsSeg[0].options.length <= 1) || (selectsSeg[1] && selectsSeg[1].options.length <= 1)) {
        Promise.all([
            fetchComAuth(`${API_BASE_URL}/segmentos`),
            fetchComAuth(`${API_BASE_URL}/index/prestadores`)
        ]).then(async ([resSeg, resPrest]) => {
            if (resSeg.ok) {
                const segs = await resSeg.json();
                selectsSeg.forEach(sel => {
                    if (sel) { sel.innerHTML = '<option value="">Todos</option>'; segs.forEach(s => sel.add(new Option(s.nome, s.id))); }
                });
            }
            if (resPrest.ok) {
                const prests = await resPrest.json();
                selectsPrest.forEach((sel, i) => {
                    if (sel) {
                        sel.innerHTML = '<option value="">Todos</option>';
                        prests.forEach(p => sel.add(new Option(`${p.codigoPrestador} - ${p.prestador}`, p.id)));
                        if (typeof Choices !== 'undefined') {
                            if (i === 0 && !window.choicesCpsPrestador) window.choicesCpsPrestador = new Choices(sel, { searchEnabled: true, itemSelectText: '', shouldSort: false });
                            if (i === 1 && !window.choicesCpsHistPrestador) window.choicesCpsHistPrestador = new Choices(sel, { searchEnabled: true, itemSelectText: '', shouldSort: false });
                        }
                    }
                });
            }
        });
    }
}

// ==========================================================
// CARREGAMENTO E DASHBOARD
// ==========================================================

async function carregarPendenciasCPS() {
    toggleLoader(true, '#cps-pendencias-pane');
    atualizarHeaderKpiCPS();
    try {
        const res = await fetchComAuth(`${API_BASE_URL}/controle-cps`, { headers: { 'X-User-ID': userId } });
        if (!res.ok) throw new Error('Erro ao buscar pendências.');
        window.dadosCpsGlobais = await res.json();
        renderizarAcordeonCPS(window.dadosCpsGlobais, 'accordionPendenciasCPS', 'msg-sem-pendencias-cps', true);
    } catch (error) {
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#cps-pendencias-pane');
    }
}

async function carregarHistoricoCPS(append = false) {
    toggleLoader(true, '#cps-historico-pane');
    const btn = document.getElementById('btn-carregar-mais-historico-cps');
    if (btn) btn.disabled = true;

    if (!append) {
        window.cpsHistDataFim = new Date();
        window.cpsHistDataInicio = new Date();
        window.cpsHistDataInicio.setDate(window.cpsHistDataFim.getDate() - 30);
        window.dadosCpsHistorico = [];
        const acc = document.getElementById('accordionHistoricoCPS');
        if (acc) acc.innerHTML = '';
    }

    const params = new URLSearchParams({
        inicio: window.cpsHistDataInicio.toISOString().split('T')[0],
        fim: window.cpsHistDataFim.toISOString().split('T')[0],
        segmentoId: document.getElementById('cps-hist-filtro-segmento')?.value || '',
        prestadorId: document.getElementById('cps-hist-filtro-prestador')?.value || ''
    });

    try {
        const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/historico?${params}`, { headers: { 'X-User-ID': userId } });
        if (!res.ok) throw new Error('Erro ao buscar histórico.');
        const novos = await res.json();

        if (novos.length === 0 && append) mostrarToast("Sem mais registros.", "warning");

        window.dadosCpsHistorico = append ? [...window.dadosCpsHistorico, ...novos] : novos;
        renderizarAcordeonCPS(window.dadosCpsHistorico, 'accordionHistoricoCPS', 'msg-sem-historico-cps', false);

    } catch (error) {
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#cps-historico-pane');
        if (btn) btn.disabled = false;
    }
}

async function atualizarHeaderKpiCPS() {
    const els = document.querySelectorAll('.kpi-cps-total-mes-value');
    if (!els.length) return;
    
    const mesVal = document.getElementById('cps-filtro-mes-ref')?.value;
    if (!mesVal) return;

    const [ano, mes] = mesVal.split('-');
    const params = new URLSearchParams({
        inicio: `${ano}-${mes}-01`,
        fim: `${ano}-${mes}-${new Date(ano, mes, 0).getDate()}`,
        segmentoId: document.getElementById('cps-filtro-segmento')?.value || '',
        prestadorId: document.getElementById('cps-filtro-prestador')?.value || ''
    });

    try {
        const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/dashboard?${params}`, { headers: { 'X-User-ID': userId } });
        if (res.ok) {
            const d = await res.json();
            const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

            document.querySelectorAll('.kpi-cps-total-mes-value').forEach(e => e.textContent = fmt(d.valorTotal));
            document.querySelectorAll('.kpi-cps-total-adiantado-value').forEach(e => e.textContent = fmt(d.valorTotalAdiantado));
            document.querySelectorAll('.kpi-cps-total-confirmado-value').forEach(e => e.textContent = fmt(d.valorTotalConfirmado));
            document.querySelectorAll('.kpi-cps-total-pendente-value').forEach(e => e.textContent = fmt(d.valorTotalPendente));
            document.querySelectorAll('.kpi-cps-total-pago-value').forEach(e => e.textContent = fmt(d.valorTotalPago));
            document.querySelectorAll('.kpi-cps-qtd-itens-value').forEach(e => e.textContent = d.quantidadeItens || 0);
        }
    } catch (e) { console.error("Erro dashboard CPS:", e); }
}

// ==========================================================
// RENDERIZAÇÃO
// ==========================================================

function renderizarAcordeonCPS(lista, containerId, msgVazioId, isPendencia) {
    const container = document.getElementById(containerId);
    const msgDiv = document.getElementById(msgVazioId);
    if (!container) return;
    container.innerHTML = '';

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

    // Filtragem de visibilidade
    if (isPendencia) {
        lista = lista.filter(l => {
            if (['COORDINATOR', 'MANAGER'].includes(userRole)) return l.statusPagamento === 'EM_ABERTO';
            if (userRole === 'CONTROLLER') return ['FECHADO', 'ALTERACAO_SOLICITADA', 'SOLICITACAO_ADIANTAMENTO'].includes(l.statusPagamento);
            return true;
        });
    }

    if (!lista || lista.length === 0) {
        if (msgDiv) msgDiv.classList.remove('d-none');
        return;
    }
    if (msgDiv) msgDiv.classList.add('d-none');

    const grupos = lista.reduce((acc, l) => {
        const id = l.os?.id || 0;
        if (!acc[id]) {
            acc[id] = { 
                os: l.os?.os, projeto: l.os?.projeto, 
                totalCps: l.valorCps || 0, totalPago: l.totalPago || 0,
                totalAdiantado: 0, totalConfirmado: 0, itens: [] 
            };
        }
        acc[id].totalAdiantado += parseFloat(l.valorAdiantamento) || 0;
        
        if (['FECHADO', 'ALTERACAO_SOLICITADA', 'PAGO', 'CONCLUIDO'].includes(l.statusPagamento)) {
            acc[id].totalConfirmado += parseFloat(l.valorPagamento || l.valor) || 0;
        }
        
        acc[id].itens.push(l);
        return acc;
    }, {});

    const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    Object.values(grupos).forEach((grp, idx) => {
        const uid = `cps-${isPendencia ? 'pend' : 'hist'}-${idx}`;
        grp.itens.sort((a, b) => (a.statusPagamento === 'EM_ABERTO' ? -1 : 1));

        let showHeaderCheck = false;
        if (isPendencia) {
            if (userRole === 'ADMIN') showHeaderCheck = true;
            else if (['COORDINATOR', 'MANAGER'].includes(userRole) && grp.itens.some(i => i.statusPagamento === 'EM_ABERTO')) showHeaderCheck = true;
            else if (userRole === 'CONTROLLER' && grp.itens.some(i => ['FECHADO', 'ALTERACAO_SOLICITADA', 'SOLICITACAO_ADIANTAMENTO'].includes(i.statusPagamento))) showHeaderCheck = true;
        }

        const checkHtml = showHeaderCheck ? `<div class="position-absolute top-50 start-0 translate-middle-y ms-3 check-container-header" style="z-index: 5;"><input class="form-check-input cps-select-all shadow-sm" type="checkbox" data-target-body="collapse-${uid}"></div>` : '';
        const pl = showHeaderCheck ? 'ps-5' : 'ps-3';

        const headerHtml = `
            <div class="header-content w-100">
                <div class="header-title-wrapper">
                    <span class="header-title-project">${grp.projeto || '-'}</span>
                    <span class="header-title-os">${grp.os || '-'}</span>
                </div>
                <div class="header-kpi-wrapper d-flex gap-3">
                    <div class="header-kpi"><span class="kpi-label">TOTAL CPS</span><span class="kpi-value">${fmt(grp.totalCps)}</span></div>
                    <div class="header-kpi"><span class="kpi-label text-primary">CONFIRMADO</span><span class="kpi-value text-primary">${fmt(grp.totalConfirmado)}</span></div>
                    <div class="header-kpi"><span class="kpi-label text-warning">ADIANTADO</span><span class="kpi-value text-warning">${fmt(grp.totalAdiantado)}</span></div>
                    <div class="header-kpi"><span class="kpi-label text-success">PAGO</span><span class="kpi-value text-success">${fmt(grp.totalPago)}</span></div>
                </div>
            </div>`;

        const linhas = grp.itens.map(l => {
            let btns = `<button class="btn btn-sm btn-outline-info me-1" title="Ver" onclick="verComentarios(${l.id})"><i class="bi bi-eye"></i></button>`;
            let showRowCheck = false;

            const isConfirmado = l.statusPagamento === 'FECHADO' || l.statusPagamento === 'ALTERACAO_SOLICITADA';
            const isAdiantado = (parseFloat(l.valorAdiantamento) || 0) > 0;
            const isPago = l.statusPagamento === 'PAGO' || l.statusPagamento === 'CONCLUIDO';

            let rowClass = isPago ? 'table-success' : (isConfirmado ? 'table-primary-light' : (isAdiantado ? 'table-warning' : ''));

            if (isPendencia) {
                // --- LÓGICA CORRIGIDA AQUI ---
                if (['COORDINATOR', 'MANAGER', 'ADMIN'].includes(userRole) && l.statusPagamento === 'EM_ABERTO') {
                    // Removemos o 'if (!isAdiantado)' que bloqueava as ações
                    btns += `<button class="btn btn-sm btn-outline-success me-1" title="Fechar" onclick="abrirModalCpsValor(${l.id}, 'fechar')"><i class="bi bi-check-circle"></i></button>`;
                    btns += `<button class="btn btn-sm btn-outline-primary me-1" title="Adiantar" onclick="abrirModalSolicitarAdiantamento(${l.id}, ${l.valor}, ${l.valorAdiantamento || 0})"><i class="bi bi-cash-stack"></i></button>`;
                    btns += `<button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="abrirModalCpsValor(${l.id}, 'recusar')"><i class="bi bi-x-circle"></i></button>`;
                    showRowCheck = true;
                } 
                else if (['CONTROLLER', 'ADMIN'].includes(userRole)) {
                    if (l.statusPagamento === 'SOLICITACAO_ADIANTAMENTO') {
                        btns += `<button class="btn btn-sm btn-outline-success me-1" onclick="aprovarAdiantamento(${l.id}, ${l.valorSolicitadoAdiantamento})"><i class="bi bi-check-lg"></i></button>`;
                        btns += `<button class="btn btn-sm btn-outline-danger" onclick="recusarAdiantamento(${l.id})"><i class="bi bi-x-lg"></i></button>`;
                        showRowCheck = true;
                    } else if (isConfirmado) {
                        btns += `<button class="btn btn-sm btn-outline-danger" onclick="abrirModalCpsRecusarController(${l.id})"><i class="bi bi-arrow-counterclockwise"></i></button>`;
                        showRowCheck = true;
                    }
                }
            }

            const checkTd = showRowCheck ? `<td><input type="checkbox" class="form-check-input cps-check" data-id="${l.id}" data-status="${l.statusPagamento}"></td>` : (isPendencia ? '<td></td>' : '');

            return `
            <tr class="${rowClass}">
                ${checkTd}
                <td class="text-center bg-transparent">${btns}</td>
                <td class="bg-transparent"><span class="badge text-bg-secondary">${(l.statusPagamento || '').replace(/_/g, ' ')}</span></td>
                <td class="bg-transparent">${l.dataAtividade || '-'}</td>
                <td class="bg-transparent fw-bold text-primary">${l.dataCompetencia || '-'}</td>
                <td class="bg-transparent">${l.detalhe?.site || '-'}</td>
                <td class="bg-transparent">${l.detalhe?.lpu?.nomeLpu || '-'}</td>
                <td class="bg-transparent">${l.prestador?.nome || '-'}</td>
                <td class="bg-transparent">${l.manager?.nome || '-'}</td>
                <td class="bg-transparent fw-bold text-end">${fmt(l.valorPagamento || l.valor)}</td>
            </tr>`;
        }).join('');

        container.insertAdjacentHTML('beforeend', `
        <div class="accordion-item border mb-2">
            <h2 class="accordion-header position-relative" id="heading-${uid}">
                ${checkHtml}
                <button class="accordion-button collapsed ${pl}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uid}">
                    ${headerHtml}
                </button>
            </h2>
            <div id="collapse-${uid}" class="accordion-collapse collapse">
                <div class="accordion-body p-0">
                    <div class="table-responsive">
                        <table class="table mb-0 align-middle small table-hover">
                            <thead class="table-light"><tr>${isPendencia ? '<th><i class="bi bi-check-all"></i></th>' : ''}<th class="text-center">Ações</th><th>Status</th><th>Data</th><th>Comp.</th><th>Site</th><th>Item</th><th>Prestador</th><th>Gestor</th><th class="text-end">Valor</th></tr></thead>
                            <tbody id="tbody-${uid}">${linhas}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`);
    });

    if (isPendencia) {
        registrarEventosCps();
        atualizarBotoesLoteCPS();
        configurarBuscaCps('input-busca-cps-pendencias', 'accordionPendenciasCPS');
    } else {
        configurarBuscaCps('input-busca-cps-historico', 'accordionHistoricoCPS');
    }
}

// ==========================================================
// AÇÕES EM LOTE
// ==========================================================

function registrarEventosCps() {
    document.querySelectorAll('.cps-select-all').forEach(chk => {
        chk.addEventListener('click', e => e.stopPropagation());
        chk.addEventListener('change', e => {
            const target = document.getElementById(e.target.dataset.targetBody);
            const accItem = e.target.closest('.accordion-item');
            if (accItem) e.target.checked ? accItem.classList.add('cps-selected') : accItem.classList.remove('cps-selected');
            if (target) target.querySelectorAll('.cps-check').forEach(c => c.checked = e.target.checked);
            atualizarBotoesLoteCPS();
        });
    });
    document.querySelectorAll('.cps-check').forEach(chk => chk.addEventListener('change', () => atualizarBotoesLoteCPS()));
}

function atualizarBotoesLoteCPS() {
    const selecionados = document.querySelectorAll('.cps-check:checked');
    const qtd = selecionados.length;
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

    let toolbar = document.getElementById('cps-toolbar-lote');
    if (!toolbar) {
        const pane = document.getElementById('cps-pendencias-pane');
        if (pane) {
            toolbar = document.createElement('div');
            toolbar.id = 'cps-toolbar-lote';
            toolbar.className = 'cps-toolbar-floating d-none d-flex justify-content-between align-items-center';
            pane.insertBefore(toolbar, pane.firstChild);
        } else return;
    }

    let temEmAberto = false, temAdiantamento = false, temFechado = false;
    selecionados.forEach(cb => {
        const s = cb.dataset.status;
        if (s === 'EM_ABERTO') temEmAberto = true;
        if (s === 'SOLICITACAO_ADIANTAMENTO') temAdiantamento = true;
        if (['FECHADO', 'ALTERACAO_SOLICITADA'].includes(s)) temFechado = true;
    });

    let htmlBtns = '';

    if (['COORDINATOR', 'MANAGER', 'ADMIN'].includes(userRole)) {
        if (temEmAberto && !temAdiantamento && !temFechado) {
            htmlBtns += `
                <button class="btn btn-sm btn-success me-2" onclick="executarAcaoLote('fechar')"><i class="bi bi-check-circle"></i> Fechar (${qtd})</button>
                <button class="btn btn-sm btn-primary me-2" onclick="executarAcaoLote('solicitarAdiantamento')"><i class="bi bi-cash-stack"></i> Adiantar (${qtd})</button>
                <button class="btn btn-sm btn-danger" onclick="executarAcaoLote('recusarCoord')"><i class="bi bi-x-circle"></i> Recusar (${qtd})</button>`;
        }
    }
    if (['CONTROLLER', 'ADMIN'].includes(userRole)) {
        if (temFechado && !temEmAberto && !temAdiantamento) {
            htmlBtns += `<button class="btn btn-sm btn-success me-2" onclick="executarAcaoLote('pagarController')"><i class="bi bi-cash-coin"></i> Pagar (${qtd})</button>
                         <button class="btn btn-sm btn-danger" onclick="executarAcaoLote('recusarController')"><i class="bi bi-arrow-counterclockwise"></i> Devolver (${qtd})</button>`;
        }
        if (temAdiantamento && !temEmAberto && !temFechado) {
            htmlBtns += `<button class="btn btn-sm btn-success me-2" onclick="executarAcaoLote('pagarAdiantamento')"><i class="bi bi-check-lg"></i> Pagar Adiant. (${qtd})</button>
                         <button class="btn btn-sm btn-danger" onclick="executarAcaoLote('recusarAdiantamento')"><i class="bi bi-x-lg"></i> Recusar Adiant. (${qtd})</button>`;
        }
    }

    if (qtd > 0 && htmlBtns !== '') {
        toolbar.classList.remove('d-none');
        toolbar.innerHTML = `<div><i class="bi bi-check-square-fill text-primary"></i> <strong>${qtd}</strong> selecionados</div><div>${htmlBtns}</div>`;
    } else {
        toolbar.classList.add('d-none');
    }
}

window.executarAcaoLote = function (acao) {
    const ids = Array.from(document.querySelectorAll('.cps-check:checked')).map(c => parseInt(c.dataset.id));
    if (!ids.length) return;

    if (window.modalAlterarValorCPS) window.modalAlterarValorCPS._element.dataset.acaoEmLote = 'true';
    if (window.modalRecusarCPS) window.modalRecusarCPS._element.dataset.acaoEmLote = 'true';

    if (acao === 'fechar') {
        document.getElementById('formAlterarValorCPS').reset();
        document.querySelector('#modalAlterarValorCPS .modal-title').innerHTML = '<i class="bi bi-check-all text-success me-2"></i> Fechar Lote';
        document.getElementById('cpsAcaoCoordenador').value = 'fechar';
        document.getElementById('divCompetenciaCps').style.display = 'block';
        gerarOpcoesCompetencia();
        const valInput = document.getElementById('cpsValorPagamentoInput');
        valInput.value = 'Vários';
        valInput.disabled = true;
        const btn = document.getElementById('btnConfirmarAcaoCPS');
        btn.className = 'btn btn-success';
        btn.textContent = "Confirmar Lote";
        if (window.modalAlterarValorCPS) window.modalAlterarValorCPS.show();
    }
    else if (acao === 'solicitarAdiantamento') {
        const modalEl = document.getElementById('modalSolicitarAdiantamento');
        if (modalEl) {
            modalEl.dataset.acaoEmLote = 'true';
            document.getElementById('adiantamentoValorTotalDisplay').innerText = "Vários Itens";
            document.getElementById('adiantamentoValorJaPagoDisplay').innerText = "-";
            document.getElementById('valorSolicitadoInput').value = '';
            document.getElementById('justificativaAdiantamentoInput').value = '';
            if (window.modalSolicitarAdiantamento) window.modalSolicitarAdiantamento.show();
        }
    }
    else if (acao === 'recusarCoord') {
        const form = document.getElementById('formAlterarValorCPS');
        form.reset();
        document.querySelector('#modalAlterarValorCPS .modal-title').innerHTML = '<i class="bi bi-x-circle text-danger"></i> Recusar Lote';
        document.getElementById('cpsAcaoCoordenador').value = 'recusar';
        document.getElementById('divCompetenciaCps').style.display = 'none';
        document.getElementById('cpsValorPagamentoInput').disabled = true;
        document.getElementById('cpsJustificativaInput').required = true;
        const btn = document.getElementById('btnConfirmarAcaoCPS');
        btn.className = 'btn btn-danger';
        btn.textContent = "Recusar Lote";
        if (window.modalAlterarValorCPS) window.modalAlterarValorCPS.show();
    }
    else if (acao === 'pagarController' || acao === 'pagarAdiantamento') {
        const m = new bootstrap.Modal(document.getElementById('modalConfirmacaoGenerica'));
        document.getElementById('modalGenericoTitulo').innerText = acao === 'pagarController' ? 'Pagar CPS' : 'Pagar Adiantamentos';
        document.getElementById('modalGenericoTexto').innerText = `Confirma o pagamento de ${ids.length} itens selecionados?`;
        
        const btn = document.getElementById('btnGenericoConfirmar');
        const novoBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(novoBtn, btn);
        novoBtn.addEventListener('click', () => {
            const url = acao === 'pagarController' ? '/controle-cps/pagar-lote' : '/lancamentos/pagar-adiantamento-lote';
            const body = acao === 'pagarController' ? { lancamentoIds: ids, controllerId: localStorage.getItem('usuarioId') } : { lancamentoIds: ids, usuarioId: localStorage.getItem('usuarioId') };
            processarAcaoControllerDireta(url, body, m);
        });
        m.show();
    }
    else if (acao === 'recusarController') {
        if (window.modalRecusarCPS) {
            window.modalRecusarCPS._element.dataset.acaoEmLote = 'true';
            document.getElementById('cpsMotivoRecusaInput').value = '';
            window.modalRecusarCPS.show();
        }
    }
    else if (acao === 'recusarAdiantamento') {
        if (window.modalRecusarAdiantamento) {
            document.getElementById('modalRecusarAdiantamento').dataset.acaoEmLote = 'true';
            document.getElementById('motivoRecusaAdiantamento').value = '';
            window.modalRecusarAdiantamento.show();
        }
    }
};

async function processarAcaoControllerDireta(endpoint, body, modalInstance) {
    const btn = document.getElementById('btnGenericoConfirmar');
    setLoading(btn, true);
    try {
        const res = await fetchComAuth(`${API_BASE_URL}${endpoint}`, { method: 'POST', body: JSON.stringify(body) });
        if (res.ok) {
            mostrarToast("Sucesso!", "success");
            if (modalInstance) modalInstance.hide();
            carregarPendenciasCPS();
        } else {
            throw new Error(await res.text());
        }
    } catch (e) { mostrarToast(e.message, "error"); }
    finally { setLoading(btn, false); }
}

// ==========================================================
// HANDLERS UNITÁRIOS E FORMULÁRIOS
// ==========================================================

const formSolAdiant = document.getElementById('formSolicitarAdiantamento');
if (formSolAdiant) {
    formSolAdiant.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnConfirmarSolicitacaoAdiantamento');
        setLoading(btn, true);
        const modalEl = document.getElementById('modalSolicitarAdiantamento');
        const isLote = modalEl.dataset.acaoEmLote === 'true';
        const valor = parseFloat(document.getElementById('valorSolicitadoInput').value.replace(/\./g, '').replace(',', '.'));
        const just = document.getElementById('justificativaAdiantamentoInput').value;
        const uId = localStorage.getItem('usuarioId');

        try {
            if (isLote) {
                const ids = Array.from(document.querySelectorAll('.cps-check:checked')).map(c => c.dataset.id);
                for (const id of ids) {
                    await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}/solicitar-adiantamento`, { method: 'POST', body: JSON.stringify({ valor: valor, usuarioId: uId, justificativa: just }) });
                }
                mostrarToast("Solicitações em lote enviadas!", "success");
            } else {
                const id = document.getElementById('adiantamentoLancamentoId').value;
                const res = await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}/solicitar-adiantamento`, { method: 'POST', body: JSON.stringify({ valor: valor, usuarioId: uId, justificativa: just }) });
                if (!res.ok) throw new Error("Erro na solicitação.");
                mostrarToast("Solicitação enviada!", "success");
            }
            if (window.modalSolicitarAdiantamento) window.modalSolicitarAdiantamento.hide();
            carregarPendenciasCPS();
        } catch (e) { mostrarToast("Erro: " + e.message, "error"); }
        finally { setLoading(btn, false); delete modalEl.dataset.acaoEmLote; }
    });
}

const btnConfRecAdiant = document.getElementById('btnConfirmarRecusaAdiantamento');
if (btnConfRecAdiant) {
    btnConfRecAdiant.addEventListener('click', async () => {
        const modalEl = document.getElementById('modalRecusarAdiantamento');
        const isLote = modalEl.dataset.acaoEmLote === 'true';
        const motivo = document.getElementById('motivoRecusaAdiantamento').value;
        const uId = localStorage.getItem('usuarioId');
        if (!motivo) { alert("Motivo obrigatório"); return; }
        setLoading(btnConfRecAdiant, true);
        try {
            if (isLote) {
                const ids = Array.from(document.querySelectorAll('.cps-check:checked')).map(c => parseInt(c.dataset.id));
                for (const id of ids) {
                    await fetchComAuth(`${API_BASE_URL}/controle-cps/${id}/recusar-adiantamento`, { method: 'POST', body: JSON.stringify({ usuarioId: uId, motivo: motivo }) });
                }
                mostrarToast("Lote recusado!", "success");
            } else {
                const id = document.getElementById('idAdiantamentoRecusar').value;
                const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/${id}/recusar-adiantamento`, { method: 'POST', body: JSON.stringify({ usuarioId: uId, motivo: motivo }) });
                if (!res.ok) throw new Error("Erro");
                mostrarToast("Recusado!", "success");
            }
            if (window.modalRecusarAdiantamento) window.modalRecusarAdiantamento.hide();
            carregarPendenciasCPS();
        } catch (e) { mostrarToast(e.message, "error"); }
        finally { setLoading(btnConfRecAdiant, false); delete modalEl.dataset.acaoEmLote; }
    });
}

const btnAprovarAdiant = document.getElementById('btnConfirmarAprovarAdiantamento');
if (btnAprovarAdiant) {
    btnAprovarAdiant.addEventListener('click', async function () {
        const id = document.getElementById('idAdiantamentoAprovar').value;
        setLoading(this, true);
        toggleLoader(true, '#cps-pendencias-pane');
        try {
            const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/${id}/pagar-adiantamento`, { method: 'POST', body: JSON.stringify({ usuarioId: localStorage.getItem('usuarioId') }) });
            if (!res.ok) throw new Error("Erro ao processar pagamento.");
            mostrarToast("Adiantamento pago!", "success");
            if (window.modalAprovarAdiantamento) window.modalAprovarAdiantamento.hide();
            carregarPendenciasCPS();
        } catch (error) { mostrarToast(error.message, 'error'); }
        finally { toggleLoader(false, '#cps-pendencias-pane'); setLoading(this, false); }
    });
}

const formAlterar = document.getElementById('formAlterarValorCPS');
if (formAlterar) {
    formAlterar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnConfirmarAcaoCPS');
        setLoading(btn, true);
        const isLote = window.modalAlterarValorCPS._element.dataset.acaoEmLote === 'true';
        const acao = document.getElementById('cpsAcaoCoordenador').value;
        const ids = isLote ? Array.from(document.querySelectorAll('.cps-check:checked')).map(c => parseInt(c.dataset.id)) : [parseInt(document.getElementById('cpsLancamentoIdAcao').value)];
        const uId = localStorage.getItem('usuarioId');

        let url = '', body = {};
        if (acao === 'recusar') {
            url = isLote ? '/controle-cps/recusar-lote' : '/controle-cps/recusar';
            body = { lancamentoIds: ids, lancamentoId: ids[0], coordenadorId: uId, justificativa: document.getElementById('cpsJustificativaInput').value };
        } else {
            url = isLote ? '/controle-cps/fechar-lote' : '/controle-cps/fechar';
            const val = parseFloat(document.getElementById('cpsValorPagamentoInput').value.replace(/\./g, '').replace(',', '.'));
            body = { lancamentoIds: ids, lancamentoId: ids[0], coordenadorId: uId, competencia: document.getElementById('cpsCompetenciaInput').value, valorPagamento: isLote ? null : val, justificativa: document.getElementById('cpsJustificativaInput').value };
        }

        try {
            const res = await fetchComAuth(`${API_BASE_URL}${url}`, { method: 'POST', body: JSON.stringify(body) });
            if (res.ok) {
                mostrarToast("Ação realizada!", "success");
                if (window.modalAlterarValorCPS) window.modalAlterarValorCPS.hide();
                carregarPendenciasCPS();
            } else throw new Error((await res.json()).message || "Erro");
        } catch (err) { mostrarToast(err.message, "error"); }
        finally { setLoading(btn, false); }
    });
}

const formRecu = document.getElementById('formRecusarCPS');
if (formRecu) {
    formRecu.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formRecu.querySelector('button[type="submit"]');
        setLoading(btn, true);
        const isLote = window.modalRecusarCPS._element.dataset.acaoEmLote === 'true';
        const ids = isLote ? Array.from(document.querySelectorAll('.cps-check:checked')).map(c => parseInt(c.dataset.id)) : [parseInt(document.getElementById('cpsLancamentoIdRecusar').value)];
        const motivo = document.getElementById('cpsMotivoRecusaInput').value;
        const url = isLote ? '/controle-cps/recusar-controller-lote' : '/controle-cps/recusar-controller';
        const payload = isLote ? { lancamentoIds: ids, controllerId: localStorage.getItem('usuarioId'), motivo: motivo } : { lancamentoId: ids[0], controllerId: localStorage.getItem('usuarioId'), motivo: motivo };

        try {
            const res = await fetchComAuth(`${API_BASE_URL}${url}`, { method: 'POST', body: JSON.stringify(payload) });
            if (res.ok) {
                mostrarToast("Devolvido!", "success");
                if (window.modalRecusarCPS) window.modalRecusarCPS.hide();
                carregarPendenciasCPS();
            } else throw new Error("Erro.");
        } catch (err) { mostrarToast(err.message, "error"); }
        finally { setLoading(btn, false); }
    });
}

// ==========================================================
// HELPERS UNITÁRIOS (Abertura de Modais)
// ==========================================================

window.abrirModalCpsValor = function (id, acao) {
    const l = window.dadosCpsGlobais.find(x => x.id == id);
    if (!l || !window.modalAlterarValorCPS) return;

    document.getElementById('cpsLancamentoIdAcao').value = id;
    document.getElementById('cpsAcaoCoordenador').value = acao;
    window.modalAlterarValorCPS._element.dataset.acaoEmLote = 'false';

    const btn = document.getElementById('btnConfirmarAcaoCPS');
    const inputJust = document.getElementById('cpsJustificativaInput');
    const divComp = document.getElementById('divCompetenciaCps');
    const inputVal = document.getElementById('cpsValorPagamentoInput');
    const role = (localStorage.getItem("role") || "").trim().toUpperCase();

    // --- BLOQUEIO DE EDIÇÃO (CORREÇÃO SOLICITADA) ---
    // O valor do pagamento não pode ser alterado. Em caso de divergência, deve-se recusar o item.
    inputVal.disabled = true;

    document.querySelector('#modalAlterarValorCPS .modal-title').innerText = acao === 'recusar' ? 'Recusar Pagamento' : 'Fechar Pagamento';
    const val = l.valorPagamento !== null ? l.valorPagamento : l.valor;
    inputVal.value = val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    if (acao === 'recusar') {
        btn.className = 'btn btn-danger';
        btn.textContent = "Confirmar Recusa";
        divComp.style.display = 'none';
        document.getElementById('cpsCompetenciaInput').required = false;
        // inputVal.disabled = true; // Já foi desabilitado globalmente acima
        inputJust.required = true;
    } else {
        btn.className = 'btn btn-success';
        btn.textContent = "Confirmar Fechamento";
        divComp.style.display = 'block';
        gerarOpcoesCompetencia();
        document.getElementById('cpsCompetenciaInput').required = true;
        inputJust.required = false;
    }
    window.modalAlterarValorCPS.show();
};

window.abrirModalCpsRecusarController = function (id) {
    document.getElementById('cpsLancamentoIdRecusar').value = id;
    if (window.modalRecusarCPS) {
        window.modalRecusarCPS._element.dataset.acaoEmLote = 'false';
        document.getElementById('cpsMotivoRecusaInput').value = '';
        window.modalRecusarCPS.show();
    }
};

window.abrirModalSolicitarAdiantamento = function (id, valorTotal, valorJaAdiantado) {
    document.getElementById('adiantamentoLancamentoId').value = id;
    document.getElementById('adiantamentoValorTotalDisplay').innerText = (valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('adiantamentoValorJaPagoDisplay').innerText = (valorJaAdiantado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('valorSolicitadoInput').value = '';
    if (window.modalSolicitarAdiantamento) window.modalSolicitarAdiantamento.show();
};

window.aprovarAdiantamento = function (id, valor) {
    document.getElementById('idAdiantamentoAprovar').value = id;
    document.getElementById('displayValorAdiantamento').innerText = (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (window.modalAprovarAdiantamento) {
        delete window.modalAprovarAdiantamento._element.dataset.acaoEmLote;
        window.modalAprovarAdiantamento.show();
    }
};

window.recusarAdiantamento = function (id) {
    document.getElementById('idAdiantamentoRecusar').value = id;
    document.getElementById('motivoRecusaAdiantamento').value = '';
    if (window.modalRecusarAdiantamento) {
        delete window.modalRecusarAdiantamento._element.dataset.acaoEmLote;
        window.modalRecusarAdiantamento.show();
    }
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
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    newInput.addEventListener('keyup', function () {
        const termo = this.value.toLowerCase();
        accordion.querySelectorAll('.accordion-item').forEach(item => {
            const headerText = item.querySelector('.accordion-header').innerText.toLowerCase();
            let visivel = headerText.includes(termo);
            if (!visivel) {
                const linhas = item.querySelectorAll('tbody tr');
                linhas.forEach(tr => {
                    if (tr.innerText.toLowerCase().includes(termo)) { tr.classList.remove('d-none'); visivel = true; }
                    else { tr.classList.add('d-none'); }
                });
            } else { item.querySelectorAll('tbody tr').forEach(tr => tr.classList.remove('d-none')); }
            item.classList.toggle('d-none', !visivel);
        });
    });
}