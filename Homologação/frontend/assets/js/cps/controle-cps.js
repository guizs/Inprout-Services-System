document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS ---
    const API_BASE_URL = 'http://localhost:8080';
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const userId = localStorage.getItem('usuarioId');
    let todosOsLancamentos = []; 

    // Objeto para guardar as instâncias do Choices (para poder atualizar/destruir depois)
    const filterChoices = {};

    // --- FUNÇÃO AUXILIAR: Configura um Select com Choices.js ---
    function configurarSelect(elementId, opcoes, placeholderText = "Selecione...") {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Se já existe uma instância, destrói para recriar limpa
        if (filterChoices[elementId]) {
            filterChoices[elementId].destroy();
        }

        // Cria a instância
        filterChoices[elementId] = new Choices(element, {
            choices: opcoes,
            searchEnabled: true, // Habilita pesquisa em todos
            itemSelectText: '',
            noResultsText: 'Nenhum resultado',
            placeholder: true,
            placeholderValue: placeholderText,
            shouldSort: false, // Mantém a ordem que definimos (especialmente para meses)
            position: 'bottom'
        });
    }

    // --- 1. Carregar Select de Meses (Com Choices) ---
    function carregarSeletorDeMeses() {
        const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        
        const dataAtual = new Date();
        const opcoesMeses = [];

        // Gera o mês atual + 11 anteriores
        for (let i = 0; i < 12; i++) {
            const d = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - i, 1);
            const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const texto = `${nomesMeses[d.getMonth()]}/${d.getFullYear()}`;
            
            opcoesMeses.push({ 
                value: valor, 
                label: texto, 
                selected: i === 0 // Seleciona o primeiro (atual)
            });
        }

        configurarSelect('filtro-mes-ref', opcoesMeses, "Selecione o mês");
    }

    // --- 2. Carregar Opções de Filtros (Segmento, Gestor, Prestador) ---
    async function carregarOpcoesFiltros() {
        try {
            const [segmentosRes, gestoresRes, prestadoresRes] = await Promise.all([
                fetchComAuth(`${API_BASE_URL}/segmentos`),
                fetchComAuth(`${API_BASE_URL}/usuarios/gestores`), 
                fetchComAuth(`${API_BASE_URL}/index/prestadores`)
            ]);

            // A. Segmentos
            if (segmentosRes.ok) {
                const dados = await segmentosRes.json();
                const opcoes = [
                    { value: '', label: 'Todos os Segmentos', selected: true },
                    ...dados.map(s => ({ value: s.id, label: s.nome }))
                ];
                configurarSelect('filtro-segmento', opcoes);
            }

            // B. Gestores (Filtrando apenas MANAGER)
            if (gestoresRes.ok) {
                const dados = await gestoresRes.json();
                const apenasManagers = dados.filter(u => u.role === 'MANAGER');
                const opcoes = [
                    { value: '', label: 'Todos os Gestores', selected: true },
                    ...apenasManagers.map(g => ({ value: g.id, label: g.nome }))
                ];
                configurarSelect('filtro-gestor', opcoes);
            }

            // C. Prestadores (Código - Nome)
            if (prestadoresRes.ok) {
                const dados = await prestadoresRes.json();
                const opcoes = [
                    { value: '', label: 'Todos os Prestadores', selected: true },
                    ...dados.map(p => ({ value: p.id, label: `${p.codigoPrestador} - ${p.prestador}` }))
                ];
                configurarSelect('filtro-prestador', opcoes);
            }

        } catch (e) { 
            console.error("Erro ao carregar filtros", e); 
        }
    }

    // --- 3. Função para ler datas do seletor de mês ---
    function getDatasFiltro() {
        const select = document.getElementById('filtro-mes-ref');
        const valorSelecionado = select ? select.value : null; 
        
        if (!valorSelecionado) {
            const hoje = new Date();
            return {
                inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0],
                fim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
            };
        }

        const [ano, mes] = valorSelecionado.split('-');
        const dataInicio = new Date(ano, mes - 1, 1);
        // Dia 0 do próximo mês = último dia do mês atual
        const dataFim = new Date(ano, mes, 0); 
        
        const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        return { inicio: format(dataInicio), fim: format(dataFim) };
    }

    // --- INICIALIZAÇÃO DOS FILTROS ---
    carregarSeletorDeMeses();
    carregarOpcoesFiltros();
    // Carrega o dashboard assim que a página abre
    carregarDashboard();

    // --- LISTENERS DOS BOTÕES DE FILTRO ---
    const btnFiltrar = document.getElementById('btn-filtrar');
    if(btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            carregarDashboard();
            // Se a aba de histórico estiver ativa, atualiza ela também
            if (tabHistorico.btn.classList.contains('active')) {
                carregarHistorico();
            }
        });
    }

    const btnExportarHistorico = document.getElementById('btn-exportar-historico');
    if(btnExportarHistorico) {
        btnExportarHistorico.addEventListener('click', () => {
            const datas = getDatasFiltro();
            const params = new URLSearchParams({
                inicio: datas.inicio,
                fim: datas.fim,
                segmentoId: document.getElementById('filtro-segmento').value,
                gestorId: document.getElementById('filtro-gestor').value,
                prestadorId: document.getElementById('filtro-prestador').value
            });
            window.open(`${API_BASE_URL}/controle-cps/exportar/historico?${params}&token=${localStorage.getItem('token')}`, '_blank');
        });
    }

    // --- ANIMAÇÃO DO DASHBOARD (Abrir/Fechar) ---
    const collapseElement = document.getElementById('collapseDashboard');
    const collapseIcon = document.getElementById('icon-dashboard');
    if (collapseElement && collapseIcon) {
        collapseElement.addEventListener('show.bs.collapse', () => {
            collapseIcon.classList.remove('bi-chevron-down');
            collapseIcon.classList.add('bi-chevron-up');
        });
        collapseElement.addEventListener('hide.bs.collapse', () => {
            collapseIcon.classList.remove('bi-chevron-up');
            collapseIcon.classList.add('bi-chevron-down');
        });
    }

    // --- VARIÁVEIS DE UI (Abas, Modais) ---
    const tabPendencias = {
        pane: document.getElementById('pendencias-pagamento-pane'),
        btn: document.getElementById('pendencias-pagamento-tab'),
        accordion: document.getElementById('accordionPendencias'),
        msgVazio: document.getElementById('msg-sem-pendencias'),
        loaderId: '#pendencias-pagamento-pane'
    };
    const tabHistorico = {
        pane: document.getElementById('historico-pagamento-pane'),
        btn: document.getElementById('historico-pagamento-tab'),
        accordion: document.getElementById('accordionHistorico'),
        msgVazio: document.getElementById('msg-sem-historico'),
        loaderId: '#historico-pagamento-pane'
    };

    const modalAlterarValorEl = document.getElementById('modalAlterarValorPagamento');
    const modalAlterarValor = modalAlterarValorEl ? new bootstrap.Modal(modalAlterarValorEl) : null;
    const formAlterarValor = document.getElementById('formAlterarValorPagamento');

    const modalRecusarEl = document.getElementById('modalRecusarPagamento');
    const modalRecusar = modalRecusarEl ? new bootstrap.Modal(modalRecusarEl) : null;
    const formRecusar = document.getElementById('formRecusarPagamento');

    const modalComentariosEl = document.getElementById('modalComentarios');
    const modalComentarios = modalComentariosEl ? new bootstrap.Modal(modalComentariosEl) : null;
    const modalComentariosBody = document.getElementById('modalComentariosBody');

    const acoesLoteControllerContainer = document.getElementById('acoes-lote-controller-container');
    const btnPagarSelecionados = document.getElementById('btn-pagar-selecionados');
    const contadorPagamento = document.getElementById('contador-pagamento');

    // --- HELPERS ---
    const get = (obj, path, def = '-') => path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : undefined), obj) || def;
    const formatarData = (d) => (!d || d === '-') ? '-' : d.split('T')[0].split('-').reverse().join('/');
    const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
    const parseDataBrasileira = (dataString) => {
        if (!dataString) return null;
        const [data, hora] = dataString.split(' ');
        if (!data) return null;
        const [dia, mes, ano] = data.split('/');
        if (!dia || !mes || !ano) return null;
        return new Date(`${ano}-${mes}-${dia}T${hora || '00:00:00'}`);
    };
    const togglePaneLoader = (tab, ativo) => {
        const overlay = document.querySelector(tab.loaderId)?.querySelector(".overlay-loader");
        if (overlay) overlay.classList.toggle("d-none", !ativo);
    };
    const formatarStatusPagamento = (s) => {
        const map = { 'EM_ABERTO': 'primary', 'FECHADO': 'info', 'ALTERACAO_SOLICITADA': 'warning', 'PAGO': 'success', 'RECUSADO': 'danger' };
        return `<span class="badge text-bg-${map[s] || 'secondary'}">${(s || '').replace(/_/g, ' ')}</span>`;
    };

    // --- LÓGICA DO DASHBOARD ---
    async function carregarDashboard() {
        // CORREÇÃO DO ID: dash-segmentos-container
        const container = document.getElementById('dash-segmentos-container');
        const kpiTotalEl = document.getElementById('kpi-total-cps');

        container.innerHTML = `<div class="col-12 text-center py-4"><div class="spinner-border text-success" role="status"></div></div>`;
        kpiTotalEl.innerHTML = '...';

        const datas = getDatasFiltro();
        const params = new URLSearchParams({
            inicio: datas.inicio,
            fim: datas.fim,
            segmentoId: document.getElementById('filtro-segmento').value,
            gestorId: document.getElementById('filtro-gestor').value,
            prestadorId: document.getElementById('filtro-prestador').value
        });

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/dashboard?${params}`, {
                headers: { 'X-User-ID': userId }
            });
            if (!response.ok) throw new Error('Erro ao carregar dashboard');
            
            const dados = await response.json();

            // Atualiza valor total
            kpiTotalEl.textContent = formatarMoeda(dados.valorTotal);
            
            container.innerHTML = '';

            // Renderiza cards brancos (grid)
            if (dados.valoresPorSegmento?.length > 0) {
                const segmentIcons = { 'corporativo': 'bi-building', 'decomm': 'bi-tools', 'e2e': 'bi-diagram-3', 'lojas tim': 'bi-shop', 'mw': 'bi-broadcast-pin', 'rede externa b2b': 'bi-hdd-network', 'tim celular': 'bi-phone', 'tim celular - ihs': 'bi-phone-vibrate' };
                
                dados.valoresPorSegmento.forEach(seg => {
                    const nome = seg.segmentoNome || 'Não Identificado';
                    const iconClass = segmentIcons[nome.toLowerCase()] || 'bi-bar-chart-steps';
                    
                    container.insertAdjacentHTML('beforeend', `
                        <div class="segment-card">
                            <i class="bi ${iconClass}"></i>
                            <div>${nome}</div>
                            <span>${formatarMoeda(seg.valorTotal)}</span>
                        </div>`);
                });
            } else {
                container.innerHTML = `<div class="col-12 text-center text-muted py-3"><small>Nenhum dado encontrado para o período.</small></div>`;
            }
        } catch (e) {
            console.error(e);
            container.innerHTML = `<div class="alert alert-danger w-100">Erro ao carregar dados.</div>`;
            kpiTotalEl.textContent = "R$ 0,00";
        }
    }

    // --- CARREGAMENTO DAS LISTAS (TABELAS) ---
    
    async function carregarFilaPendencias() {
        togglePaneLoader(tabPendencias, true);
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/controle-cps`, { headers: { 'X-User-ID': userId } });
            todosOsLancamentos = await response.json();
            renderizarAcordeonPendencias(todosOsLancamentos);
            
            // Controla visibilidade do botão de lote para o Controller
            const cardHeader = acoesLoteControllerContainer.closest('.card-header');
            cardHeader.classList.toggle('d-none', todosOsLancamentos.length === 0);
            
        } catch (e) {
            tabPendencias.msgVazio.innerHTML = e.message;
            tabPendencias.msgVazio.classList.remove('d-none');
        } finally {
            togglePaneLoader(tabPendencias, false);
            atualizarEstadoAcoesLote();
        }
    }

    function renderizarAcordeonPendencias(lancamentos) {
        const container = tabPendencias.accordion;
        container.innerHTML = '';
        if (!lancamentos.length) return tabPendencias.msgVazio.classList.remove('d-none');
        tabPendencias.msgVazio.classList.add('d-none');

        const grupos = lancamentos.reduce((acc, l) => {
            const id = get(l, 'os.id');
            if (!acc[id]) acc[id] = { id, os: get(l, 'os.os'), projeto: get(l, 'os.projeto'), totalOs: get(l, 'totalOs', 0), totalPago: get(l, 'totalPago', 0), totalCps: get(l, 'valorCps', 0), totalMat: get(l, 'os.custoTotalMateriais', 0), totalPagar: 0, itens: [] };
            acc[id].totalPagar += parseFloat(get(l, 'valorPagamento') !== '-' ? get(l, 'valorPagamento') : get(l, 'valor')) || 0;
            acc[id].itens.push(l);
            return acc;
        }, {});

        const isController = ['CONTROLLER', 'ADMIN'].includes(userRole);
        let idx = 0;
        
        for (const grp of Object.values(grupos)) {
            const perc = grp.totalOs > 0 ? ((grp.totalCps + grp.totalMat) / grp.totalOs * 100).toFixed(2) : 0;
            const uniqueId = `os-pendente-${idx++}`;
            const checkboxHead = isController ? `<div class="position-absolute top-50 start-0 translate-middle-y ms-3" style="z-index:5"><input class="form-check-input selecionar-todos-acordeon shadow-sm" type="checkbox" data-target-body="collapse-${uniqueId}" style="cursor:pointer;margin:0"></div>` : '';
            
            const rows = grp.itens.map(l => {
                const valOp = get(l, 'valor', 0);
                const valPg = get(l, 'valorPagamento', valOp);
                const destaque = valOp !== valPg ? 'text-danger fw-bold' : '';
                const checkRow = isController ? `<td><div class="form-check d-flex justify-content-center"><input type="checkbox" class="form-check-input linha-checkbox-pagamento" data-id="${l.id}"></div></td>` : '';
                
                return `<tr class="${l.statusPagamento === 'ALTERACAO_SOLICITADA' ? 'table-warning' : (l.statusPagamento === 'FECHADO' ? 'table-info' : '')}">
                    ${checkRow}<td class="text-center">${gerarBotoesAcao(l)}</td>
                    <td>${formatarStatusPagamento(l.statusPagamento)}</td><td>${formatarData(l.dataAtividade)}</td>
                    <td>${get(l, 'detalhe.site')}</td><td>${get(l, 'os.segmento.nome')}</td><td>${get(l, 'os.projeto')}</td>
                    <td title="${get(l, 'detalhe.lpu.nomeLpu')}">${get(l, 'detalhe.lpu.codigoLpu')}</td>
                    <td>${get(l, 'prestador.nome')}</td><td>${get(l, 'manager.nome')}</td>
                    <td class="text-center ${destaque}">${formatarMoeda(valPg)}</td><td><small class="text-muted">${get(l, 'detalhe.key')}</small></td>
                </tr>`;
            }).join('');

            container.insertAdjacentHTML('beforeend', `
                <div class="accordion-item border mb-3 shadow-sm" style="border-radius:12px; overflow:hidden">
                    <h2 class="accordion-header position-relative" id="heading-${uniqueId}">
                        ${checkboxHead}
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                            <div class="header-content w-100 ${isController ? 'ps-5' : ''}">
                                <div class="header-title-wrapper"><span class="header-title-project">${grp.projeto}</span><span class="header-title-os">${grp.os}</span></div>
                                <div class="header-kpi-wrapper">
                                    <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(grp.totalOs)}</span></div>
                                    <div class="header-kpi"><span class="kpi-label text-success">Já Pago</span><span class="kpi-value text-success">${formatarMoeda(grp.totalPago)}</span></div>
                                    <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(grp.totalCps)}</span></div>
                                    <div class="header-kpi"><span class="kpi-label">Material</span><span class="kpi-value">${formatarMoeda(grp.totalMat)}</span></div>
                                    <div class="header-kpi"><span class="kpi-label">% Exec.</span><span class="kpi-value text-primary">${perc}%</span></div>
                                    <div class="header-kpi ms-3 border-start ps-3"><span class="kpi-label">A Pagar (Fila)</span><span class="kpi-value text-warning">${formatarMoeda(grp.totalPagar)}</span></div>
                                </div>
                                <span class="badge bg-secondary header-badge align-self-center ms-3">${grp.itens.length} item(s)</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse-${uniqueId}" class="accordion-collapse collapse"><div class="accordion-body p-0"><div class="table-responsive"><table class="table table-hover mb-0 align-middle" style="font-size:0.9rem">
                        <thead><tr>${isController ? '<th class="text-center" style="width:50px"><i class="bi bi-check-all"></i></th>' : ''}<th class="text-center">Ações</th><th>Status Pag.</th><th>Data Ativ.</th><th>Site</th><th>Segmento</th><th>Projeto</th><th>LPU</th><th>Prestador</th><th>Gestor</th><th class="text-center">Valor a Pagar</th><th>KEY</th></tr></thead>
                        <tbody>${rows}</tbody></table></div></div></div>
                </div>`);
        }
    }

    async function carregarHistorico() {
        togglePaneLoader(tabHistorico, true);
        const datas = getDatasFiltro();
        const params = new URLSearchParams({ inicio: datas.inicio, fim: datas.fim, segmentoId: document.getElementById('filtro-segmento').value, gestorId: document.getElementById('filtro-gestor').value, prestadorId: document.getElementById('filtro-prestador').value });
        try {
            const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/historico?${params}`, { headers: { 'X-User-ID': userId } });
            renderizarAcordeonHistorico(await res.json());
        } finally { togglePaneLoader(tabHistorico, false); }
    }

    function renderizarAcordeonHistorico(lancamentos) {
        const container = tabHistorico.accordion;
        container.innerHTML = '';
        if (!lancamentos.length) return tabHistorico.msgVazio.classList.remove('d-none');
        tabHistorico.msgVazio.classList.add('d-none');

        const grupos = lancamentos.reduce((acc, l) => {
            const id = get(l, 'os.id');
            if (!acc[id]) acc[id] = { id, os: get(l, 'os.os'), projeto: get(l, 'os.projeto'), totalOs: get(l, 'totalOs', 0), totalPagoLista: 0, totalCps: get(l, 'valorCps', 0), totalMat: get(l, 'os.custoTotalMateriais', 0), itens: [] };
            acc[id].totalPagoLista += parseFloat(get(l, 'valorPagamento')) || 0;
            acc[id].itens.push(l);
            return acc;
        }, {});

        let idx = 0;
        for (const grp of Object.values(grupos)) {
            const uniqueId = `os-historico-${idx++}`;
            const rows = grp.itens.map(l => `
                <tr><td class="text-center"><button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${l.id}"><i class="bi bi-eye"></i></button></td>
                <td>${formatarStatusPagamento(l.statusPagamento)}</td><td>${formatarData(l.dataAtividade)}</td>
                <td>${get(l, 'detalhe.site')}</td><td>${get(l, 'os.segmento.nome')}</td><td>${get(l, 'os.projeto')}</td>
                <td title="${get(l, 'detalhe.lpu.nomeLpu')}">${get(l, 'detalhe.lpu.codigoLpu')}</td>
                <td>${get(l, 'prestador.nome')}</td><td>${get(l, 'manager.nome')}</td>
                <td class="text-center ${l.valor !== l.valorPagamento ? 'text-primary fw-bold' : ''}">${formatarMoeda(l.valorPagamento)}</td>
                <td><small class="text-muted">${get(l, 'detalhe.key')}</small></td></tr>`).join('');

            container.insertAdjacentHTML('beforeend', `
                <div class="accordion-item border mb-3 shadow-sm" style="border-radius:12px; overflow:hidden">
                    <h2 class="accordion-header" id="heading-${uniqueId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                            <div class="header-content w-100">
                                <div class="header-title-wrapper"><span class="header-title-project">${grp.projeto}</span><span class="header-title-os">${grp.os}</span></div>
                                <div class="header-kpi-wrapper">
                                    <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(grp.totalOs)}</span></div>
                                    <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(grp.totalCps)}</span></div>
                                    <div class="header-kpi"><span class="kpi-label">Material</span><span class="kpi-value">${formatarMoeda(grp.totalMat)}</span></div>
                                    <div class="header-kpi ms-3 border-start ps-3"><span class="kpi-label text-success">Pago (Nesta Lista)</span><span class="kpi-value text-success">${formatarMoeda(grp.totalPagoLista)}</span></div>
                                </div>
                                <span class="badge bg-secondary header-badge align-self-center ms-3">${grp.itens.length} item(s)</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse-${uniqueId}" class="accordion-collapse collapse"><div class="accordion-body p-0"><div class="table-responsive"><table class="table table-hover mb-0 align-middle" style="font-size:0.9rem">
                        <thead><tr><th class="text-center">Ações</th><th>Status Pag.</th><th>Data Ativ.</th><th>Site</th><th>Segmento</th><th>Projeto</th><th>LPU</th><th>Prestador</th><th>Gestor</th><th class="text-center">Valor Pago</th><th>KEY</th></tr></thead>
                        <tbody>${rows}</tbody></table></div></div></div>
                </div>`);
        }
    }

    function gerarBotoesAcao(lanc) {
        let html = `<button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${lanc.id}"><i class="bi bi-eye"></i></button>`;
        const s = lanc.statusPagamento;
        if (['COORDINATOR', 'ADMIN'].includes(userRole)) {
            if (s === 'EM_ABERTO') html += ` <button class="btn btn-sm btn-outline-success btn-fechar-pagamento" data-id="${lanc.id}"><i class="bi bi-check-circle"></i></button>`;
            if (s === 'FECHADO') html += ` <button class="btn btn-sm btn-outline-warning btn-solicitar-alteracao" data-id="${lanc.id}"><i class="bi bi-pencil-square"></i></button>`;
        }
        if (['CONTROLLER', 'ADMIN'].includes(userRole) && (s === 'FECHADO' || s === 'ALTERACAO_SOLICITADA')) {
            html += ` <button class="btn btn-sm btn-outline-danger btn-devolver-pagamento" data-id="${lanc.id}"><i class="bi bi-arrow-counterclockwise"></i></button>`;
        }
        return html;
    }

    function atualizarEstadoAcoesLote() {
        if (!acoesLoteControllerContainer) return;
        const checks = document.querySelectorAll('.linha-checkbox-pagamento:checked');
        acoesLoteControllerContainer.classList.toggle('d-none', checks.length === 0);
        contadorPagamento.textContent = checks.length;
        if (checks.length > 0) {
            const aptos = Array.from(checks).every(cb => {
                const l = todosOsLancamentos.find(i => i.id == cb.dataset.id);
                return l && (l.statusPagamento === 'FECHADO' || l.statusPagamento === 'ALTERACAO_SOLICITADA');
            });
            btnPagarSelecionados.disabled = !aptos;
        }
    }

    // Listeners de Ação (Abrem Modais)
    document.getElementById('cpsPagamentoTabContent').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.closest('tr')?.dataset.id;
        if (!id) return;

        if (btn.classList.contains('btn-fechar-pagamento')) {
            abrirModalValor(id, 'fechar', 'success', 'bi-check-circle', 'Fechar Pagamento');
        } else if (btn.classList.contains('btn-solicitar-alteracao')) {
            abrirModalValor(id, 'solicitar-alteracao', 'warning', 'bi-send', 'Solicitar Alteração');
        } else if (btn.classList.contains('btn-devolver-pagamento')) {
            formRecusar.reset(); document.getElementById('lancamentoIdRecusar').value = id; modalRecusar.show();
        } else if (btn.classList.contains('btn-ver-historico')) {
            // Busca e exibe comentários
            fetchComAuth(`${API_BASE_URL}/lancamentos/${id}`, { headers: { 'X-User-ID': userId } })
                .then(r => r.json()).then(l => {
                    modalComentariosBody.innerHTML = (l.comentarios || []).sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora)).map(c => `<div class="card mb-2"><div class="card-header small"><b>${c.autor.nome}</b> - ${new Date(c.dataHora).toLocaleString()}</div><div class="card-body py-2">${c.texto}</div></div>`).join('') || '<p class="text-center text-muted">Sem comentários.</p>';
                    modalComentarios.show();
                });
        }
    });

    function abrirModalValor(id, acao, corBtn, iconBtn, textoBtn) {
        formAlterarValor.reset();
        document.getElementById('lancamentoIdAcao').value = id;
        document.getElementById('acaoCoordenador').value = acao;
        const l = todosOsLancamentos.find(x => x.id == id);
        document.getElementById('valorPagamentoInput').value = (l.valorPagamento || l.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const btn = document.getElementById('btnConfirmarAcaoValor');
        btn.className = `btn btn-${corBtn}`;
        btn.innerHTML = `<i class="bi ${iconBtn} me-1"></i> ${textoBtn}`;
        modalAlterarValor.show();
    }

    // Submits dos Modais (Lógica mantida, apenas compactada)
    formAlterarValor.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnConfirmarAcaoValor');
        setButtonLoading(btn, true);
        const payload = {
            lancamentoId: document.getElementById('lancamentoIdAcao').value,
            acao: document.getElementById('acaoCoordenador').value,
            coordenadorId: userId,
            valorPagamento: parseFloat(document.getElementById('valorPagamentoInput').value.replace(/\./g, '').replace(',', '.')),
            justificativa: document.getElementById('justificativaPagamentoInput').value
        };
        try {
            const ep = payload.acao === 'fechar' ? '/controle-cps/fechar' : '/controle-cps/solicitar-alteracao';
            const res = await fetchComAuth(API_BASE_URL + ep, { method: 'POST', body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).message);
            modalAlterarValor.hide(); carregarFilaPendencias();
        } catch (err) { alert(err.message); } finally { setButtonLoading(btn, false); }
    });

    formRecusar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnConfirmarRecusa');
        setButtonLoading(btn, true);
        const payload = {
            lancamentoId: document.getElementById('lancamentoIdRecusar').value,
            controllerId: userId,
            motivo: document.getElementById('justificativaRecusaInput').value
        };
        try {
            const res = await fetchComAuth(API_BASE_URL + '/controle-cps/recusar-controller', { method: 'POST', body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).message);
            modalRecusar.hide(); carregarFilaPendencias();
        } catch (err) { alert(err.message); } finally { setButtonLoading(btn, false); }
    });

    btnPagarSelecionados.addEventListener('click', async () => {
        const ids = Array.from(document.querySelectorAll('.linha-checkbox-pagamento:checked')).map(c => c.dataset.id);
        setButtonLoading(btnPagarSelecionados, true);
        try {
            const res = await fetchComAuth(API_BASE_URL + '/controle-cps/pagar-lote', { method: 'POST', body: JSON.stringify({ lancamentoIds: ids, controllerId: userId }) });
            if (!res.ok) throw new Error((await res.json()).message);
            carregarFilaPendencias();
        } catch (err) { alert(err.message); } finally { setButtonLoading(btnPagarSelecionados, false); }
    });

    // Eventos de Tab e Checkbox
    tabPendencias.pane.addEventListener('change', (e) => {
        if (e.target.classList.contains('selecionar-todos-acordeon')) {
            const body = document.getElementById(e.target.dataset.targetBody);
            body.querySelectorAll('.linha-checkbox-pagamento').forEach(c => c.checked = e.target.checked);
        }
        atualizarEstadoAcoesLote();
    });
    
    document.querySelectorAll('#cpsPagamentoTab .nav-link').forEach(t => t.addEventListener('show.bs.tab', e => {
        if (e.target.id === 'pendencias-pagamento-tab') carregarFilaPendencias();
    }));

    // Inicializa
    carregarFilaPendencias();
});