document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS ---
    const API_BASE_URL = 'http://localhost:8080';
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const userId = localStorage.getItem('usuarioId');
    let todosOsLancamentos = []; // Cache dos dados da fila de pendências

    // --- DATAS PADRÃO (MÊS PASSADO + MÊS ATUAL) ---
    // Isso será usado "hardcoded" para o Dashboard e Pendências
    const hoje = new Date();
    const dataInicioFixa = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1); // 1º dia do mês passado
    const dataFimFixa = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);    // Último dia do mês atual

    // Inicializa os inputs de filtro com datas padrão para o Histórico
    // (Para que o usuário já tenha algo preenchido quando for para a aba de histórico)
    document.getElementById('filtro-data-inicio').valueAsDate = dataInicioFixa;
    document.getElementById('filtro-data-fim').valueAsDate = dataFimFixa;

    carregarOpcoesFiltros();
    inicializarFiltrosData();
    carregarDashboard(); // Carrega inicial

    function inicializarFiltrosData() {
        const hoje = new Date();
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        // Ajusta para string YYYY-MM-DD (formato do input date)
        // O uso do toLocaleString 'sv' (Suécia) é um truque comum para pegar YYYY-MM-DD local
        // Ou fazemos manualmente para garantir zero à esquerda:
        const format = (d) => {
            const ano = d.getFullYear();
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const dia = String(d.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        };

        document.getElementById('filtro-data-inicio').value = format(inicio);

        // Função para alternar visibilidade do filtro de datas
        function toggleFiltrosData(mostrar) {
            const container = document.getElementById('container-filtro-datas');
            if (container) {
                container.style.display = mostrar ? 'block' : 'none';
            }
        }

        // Listener do Botão Filtrar
        document.getElementById('btn-filtrar').addEventListener('click', () => {
            // 1. Atualiza o Dashboard com as novas datas/filtros
            carregarDashboard();

            // 2. Atualiza a lista da aba ativa (Pendências ou Histórico)
            if (tabHistorico.btn.classList.contains('active')) {
                carregarHistorico();
            } else if (tabPendencias.btn.classList.contains('active')) {
                carregarFilaPendencias();
            }
        });

        // ... (código de exportação, abas e modais permanece igual) ...
        // Listener de Exportação
        document.getElementById('btn-exportar-historico').addEventListener('click', () => {
            const params = new URLSearchParams({
                inicio: document.getElementById('filtro-data-inicio').value,
                fim: document.getElementById('filtro-data-fim').value,
                segmentoId: document.getElementById('filtro-segmento').value,
                gestorId: document.getElementById('filtro-gestor').value,
                prestadorId: document.getElementById('filtro-prestador').value
            });
            window.open(`${API_BASE_URL}/controle-cps/exportar/historico?${params}&token=${localStorage.getItem('token')}`, '_blank');
        });

        // Abas e Modais (Cópia do código anterior)
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

        // --- FUNÇÕES AUXILIARES (iguais) ---
        const get = (obj, path, defaultValue = '-') => {
            if (obj === null || obj === undefined) return defaultValue;
            const value = path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : undefined), obj);
            return value !== undefined ? value : defaultValue;
        };
        const formatarData = (dataStr) => {
            if (!dataStr || dataStr === '-') return '-';
            return dataStr.split('T')[0].split('-').reverse().join('/');
        };
        const formatarMoeda = (valor) => {
            if (valor === null || valor === undefined || isNaN(Number(valor))) return 'R$ 0,00';
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
        };
        const parseDataBrasileira = (dataString) => {
            if (!dataString) return null;
            const [data, hora] = dataString.split(' ');
            if (!data) return null;
            const [dia, mes, ano] = data.split('/');
            if (!dia || !mes || !ano) return null;
            return new Date(`${ano}-${mes}-${dia}T${hora || '00:00:00'}`);
        };

        function togglePaneLoader(tab, ativo = true) {
            const container = document.querySelector(tab.loaderId);
            if (container) {
                const overlay = container.querySelector(".overlay-loader");
                if (overlay) overlay.classList.toggle("d-none", !ativo);
            }
        }

        function formatarStatusPagamento(status) {
            if (!status) return `<span class="badge text-bg-secondary">N/A</span>`;
            const statusLimpo = status.replace(/_/g, ' ');
            let cor = 'secondary';
            switch (status) {
                case 'EM_ABERTO': cor = 'primary'; break;
                case 'FECHADO': cor = 'info'; break;
                case 'ALTERACAO_SOLICITADA': cor = 'warning'; break;
                case 'PAGO': cor = 'success'; break;
                case 'RECUSADO': cor = 'danger'; break;
            }
            return `<span class="badge text-bg-${cor}">${statusLimpo}</span>`;
        }

        function setButtonLoading(button, isLoading, text = 'Salvando...') {
            if (!button) return;
            button.disabled = isLoading;
            if (isLoading) {
                button.dataset.originalText = button.innerHTML;
                button.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${text}`;
            } else {
                button.innerHTML = button.dataset.originalText || 'Confirmar';
            }
        }

        // --- FUNÇÕES DE RENDERIZAÇÃO (ACORDEÃO) ---
        // (Mantive as funções getTheadPendencias, getTheadHistorico, renderizarAcordeonPendencias e renderizarAcordeonHistorico idênticas, pois o layout delas não muda)
        function getTheadPendencias() {
            const isController = (userRole === 'CONTROLLER' || userRole === 'ADMIN');
            return `
        <thead>
            <tr>
                ${isController ? '<th class="text-center" style="width: 50px;"><i class="bi bi-check-all"></i></th>' : ''}
                <th class="text-center">Ações</th>
                <th>Status Pag.</th>
                <th>Data Ativ.</th>
                <th>Site</th>
                <th>Segmento</th>
                <th>Projeto</th>
                <th title="LPU e Descrição">LPU</th>
                <th>Prestador</th>
                <th>Gestor</th>
                <th class="text-center">Valor a Pagar</th> <th>KEY</th>
            </tr>
        </thead>
    `;
        }

        function getTheadHistorico() {
            return `
        <thead>
            <tr>
                <th class="text-center">Ações</th>
                <th>Status Pag.</th>
                <th>Data Ativ.</th>
                <th>Site</th>
                <th>Segmento</th>
                <th>Projeto</th>
                <th title="LPU e Descrição">LPU</th>
                <th>Prestador</th>
                <th>Gestor</th>
                <th class="text-center">Valor Pago</th> <th>KEY</th>
            </tr>
        </thead>
    `;
        }

        function renderizarAcordeonPendencias(lancamentos) {
            const accordionContainer = tabPendencias.accordion;
            const msgVazio = tabPendencias.msgVazio;

            accordionContainer.innerHTML = '';
            if (!lancamentos || lancamentos.length === 0) {
                msgVazio.classList.remove('d-none');
                return;
            }
            msgVazio.classList.add('d-none');

            // 1. Agrupar lançamentos por OS
            const grupos = lancamentos.reduce((acc, lanc) => {
                const osId = get(lanc, 'os.id');
                if (!acc[osId]) {
                    acc[osId] = {
                        id: osId,
                        os: get(lanc, 'os.os', 'Sem OS'),
                        projeto: get(lanc, 'os.projeto', '-'),
                        segmento: get(lanc, 'os.segmento.nome', '-'),
                        totalOs: get(lanc, 'totalOs', 0),
                        totalCps: get(lanc, 'valorCps', 0),
                        custoMaterial: get(lanc, 'os.custoTotalMateriais', 0),
                        totalPago: get(lanc, 'totalPago', 0),
                        lancamentos: [],
                        totalPagarGrupo: 0
                    };
                }
                const valorPagar = get(lanc, 'valorPagamento') !== '-' ? get(lanc, 'valorPagamento') : get(lanc, 'valor');
                acc[osId].totalPagarGrupo += parseFloat(valorPagar) || 0;
                acc[osId].lancamentos.push(lanc);
                return acc;
            }, {});

            const theadHtml = getTheadPendencias();
            const isController = (userRole === 'CONTROLLER' || userRole === 'ADMIN');

            let index = 0;
            for (const [osId, dadosGrupo] of Object.entries(grupos)) {
                const uniqueId = `os-pendente-${index}`;
                const totalItens = dadosGrupo.lancamentos.length;
                const totalOs = dadosGrupo.totalOs;
                const totalCps = dadosGrupo.totalCps;
                const totalMat = dadosGrupo.custoMaterial;
                const percentual = totalOs > 0 ? ((totalCps + totalMat) / totalOs) * 100 : 0;

                const checkboxHtml = isController
                    ? `<div class="position-absolute top-50 start-0 translate-middle-y ms-3" style="z-index: 5;">
                        <input class="form-check-input selecionar-todos-acordeon shadow-sm" type="checkbox" 
                               data-target-body="collapse-${uniqueId}" 
                               style="cursor: pointer; margin: 0;">
                   </div>`
                    : '';

                const paddingContentClass = isController ? 'ps-5' : '';

                const kpiHTML = `
            <div class="header-kpi-wrapper">
                <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(totalOs)}</span></div>
                <div class="header-kpi"><span class="kpi-label text-success">Já Pago</span><span class="kpi-value text-success">${formatarMoeda(dadosGrupo.totalPago)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(totalCps)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Material</span><span class="kpi-value">${formatarMoeda(totalMat)}</span></div>
                <div class="header-kpi"><span class="kpi-label">% Exec.</span><span class="kpi-value text-primary">${percentual.toFixed(2)}%</span></div>
                <div class="header-kpi ms-3 border-start ps-3"><span class="kpi-label">A Pagar (Fila)</span><span class="kpi-value text-warning">${formatarMoeda(dadosGrupo.totalPagarGrupo)}</span></div>
            </div>`;

                const tbodyHtml = dadosGrupo.lancamentos.map(lanc => {
                    const trClass = [];
                    if (lanc.statusPagamento === 'ALTERACAO_SOLICITADA') trClass.push('table-warning');
                    else if (lanc.statusPagamento === 'FECHADO') trClass.push('table-info');
                    const valorOperacional = get(lanc, 'valor', 0);
                    const valorPagamento = get(lanc, 'valorPagamento', valorOperacional);
                    const destaqueValor = (valorOperacional !== valorPagamento) ? 'text-danger fw-bold' : '';
                    const acoesHtml = gerarBotoesAcao(lanc);
                    const checkboxHtml = isController
                        ? `<td><div class="form-check d-flex justify-content-center"><input type="checkbox" class="form-check-input linha-checkbox-pagamento" data-id="${lanc.id}"></div></td>`
                        : '';

                    return `
                    <tr data-id="${lanc.id}" class="${trClass.join(' ')}">
                        ${checkboxHtml}
                        <td class="text-center">${acoesHtml}</td>
                        <td>${formatarStatusPagamento(lanc.statusPagamento)}</td>
                        <td>${formatarData(get(lanc, 'dataAtividade'))}</td>
                        <td>${get(lanc, 'detalhe.site')}</td>
                        <td>${get(lanc, 'os.segmento.nome')}</td>
                        <td>${get(lanc, 'os.projeto')}</td>
                        <td title="${get(lanc, 'detalhe.lpu.nomeLpu')}">${get(lanc, 'detalhe.lpu.codigoLpu')}</td>
                        <td>${get(lanc, 'prestador.nome')}</td>
                        <td>${get(lanc, 'manager.nome')}</td>
                        <td class="text-center ${destaqueValor}">${formatarMoeda(valorPagamento)}</td>
                        <td><small class="text-muted">${get(lanc, 'detalhe.key')}</small></td>
                    </tr>
                `;
                }).join('');

                const accordionItemHtml = `
                <div class="accordion-item border mb-3 shadow-sm" style="border-radius: 12px; overflow: hidden;">
                    <h2 class="accordion-header position-relative" id="heading-${uniqueId}">
                        ${checkboxHtml}
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                            <div class="header-content w-100 ${paddingContentClass}">
                                <div class="header-title-wrapper">
                                    <span class="header-title-project">${dadosGrupo.projeto}</span>
                                    <span class="header-title-os">${dadosGrupo.os}</span>
                                </div>
                                ${kpiHTML}
                                <span class="badge bg-secondary header-badge align-self-center ms-3">${totalItens} item(s)</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse-${uniqueId}" class="accordion-collapse collapse">
                        <div class="accordion-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0 align-middle" style="font-size: 0.9rem;">
                                    ${theadHtml}
                                    <tbody>${tbodyHtml}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
                accordionContainer.insertAdjacentHTML('beforeend', accordionItemHtml);
                index++;
            }
        }

        function renderizarAcordeonHistorico(lancamentos) {
            const accordionContainer = tabHistorico.accordion;
            const msgVazio = tabHistorico.msgVazio;

            accordionContainer.innerHTML = '';
            if (!lancamentos || lancamentos.length === 0) {
                msgVazio.classList.remove('d-none');
                return;
            }
            msgVazio.classList.add('d-none');

            const grupos = lancamentos.reduce((acc, lanc) => {
                const osId = get(lanc, 'os.id');
                if (!acc[osId]) {
                    acc[osId] = {
                        id: osId,
                        os: get(lanc, 'os.os', 'Sem OS'),
                        projeto: get(lanc, 'os.projeto', '-'),
                        segmento: get(lanc, 'os.segmento.nome', '-'),
                        totalOs: get(lanc, 'totalOs', 0),
                        totalCps: get(lanc, 'valorCps', 0),
                        custoMaterial: get(lanc, 'os.custoTotalMateriais', 0),
                        lancamentos: [],
                        totalPagoHistorico: 0
                    };
                }
                const valorPago = get(lanc, 'valorPagamento') !== '-' ? get(lanc, 'valorPagamento') : get(lanc, 'valor');
                acc[osId].totalPagoHistorico += parseFloat(valorPago) || 0;
                acc[osId].lancamentos.push(lanc);
                return acc;
            }, {});

            const theadHtml = getTheadHistorico();
            let index = 0;
            for (const [osId, dadosGrupo] of Object.entries(grupos)) {
                const uniqueId = `os-historico-${index}`;
                const totalItens = dadosGrupo.lancamentos.length;

                const kpiHTML = `
        <div class="header-kpi-wrapper">
            <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(dadosGrupo.totalOs)}</span></div>
            <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(dadosGrupo.totalCps)}</span></div>
            <div class="header-kpi"><span class="kpi-label">Material</span><span class="kpi-value">${formatarMoeda(dadosGrupo.custoMaterial)}</span></div>
            <div class="header-kpi ms-3 border-start ps-3">
                <span class="kpi-label text-success">Pago (Filtro)</span>
                <span class="kpi-value text-success">${formatarMoeda(dadosGrupo.totalPagoHistorico)}</span>
            </div>
        </div>`;

                const tbodyHtml = dadosGrupo.lancamentos.map(lanc => {
                    const valorOperacional = get(lanc, 'valor', 0);
                    const valorPagamento = get(lanc, 'valorPagamento', valorOperacional);
                    const destaqueValor = (valorOperacional !== valorPagamento) ? 'text-primary fw-bold' : '';
                    const acoesHtml = `<button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${lanc.id}" title="Ver Histórico de Comentários"><i class="bi bi-eye"></i></button>`;

                    return `
                    <tr data-id="${lanc.id}">
                        <td class="text-center">${acoesHtml}</td>
                        <td>${formatarStatusPagamento(lanc.statusPagamento)}</td>
                        <td>${formatarData(get(lanc, 'dataAtividade'))}</td>
                        <td>${get(lanc, 'detalhe.site')}</td>
                        <td>${get(lanc, 'os.segmento.nome')}</td>
                        <td>${get(lanc, 'os.projeto')}</td>
                        <td title="${get(lanc, 'detalhe.lpu.nomeLpu')}">${get(lanc, 'detalhe.lpu.codigoLpu')}</td>
                        <td>${get(lanc, 'prestador.nome')}</td>
                        <td>${get(lanc, 'manager.nome')}</td>
                        <td class="text-center ${destaqueValor}">${formatarMoeda(valorPagamento)}</td>
                        <td><small class="text-muted">${get(lanc, 'detalhe.key')}</small></td>
                    </tr>
                `;
                }).join('');

                const accordionItemHtml = `
            <div class="accordion-item border mb-3 shadow-sm" style="border-radius: 12px; overflow: hidden;">
                <h2 class="accordion-header" id="heading-${uniqueId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                        <div class="header-content w-100">
                            <div class="header-title-wrapper">
                                <span class="header-title-project">${dadosGrupo.projeto}</span>
                                <span class="header-title-os">${dadosGrupo.os}</span>
                            </div>
                            ${kpiHTML}
                            <span class="badge bg-secondary header-badge align-self-center ms-3">${totalItens} item(s)</span>
                        </div>
                    </button>
                </h2>
                <div id="collapse-${uniqueId}" class="accordion-collapse collapse">
                    <div class="accordion-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0 align-middle" style="font-size: 0.9rem;">
                                ${theadHtml}
                                <tbody>${tbodyHtml}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
                accordionContainer.insertAdjacentHTML('beforeend', accordionItemHtml);
                index++;
            }
        }

        async function carregarOpcoesFiltros() {
            try {
                const [segmentos, gestores, prestadores] = await Promise.all([
                    fetchComAuth(`${API_BASE_URL}/segmentos`),
                    fetchComAuth(`${API_BASE_URL}/usuarios/gestores`),
                    fetchComAuth(`${API_BASE_URL}/index/prestadores`)
                ]);

                if (segmentos.ok) preencherSelect('filtro-segmento', await segmentos.json(), 'id', 'nome');
                if (gestores.ok) preencherSelect('filtro-gestor', await gestores.json(), 'id', 'nome');
                if (prestadores.ok) preencherSelect('filtro-prestador', await prestadores.json(), 'id', 'prestador');

            } catch (e) { console.error("Erro ao carregar filtros", e); }
        }

        function preencherSelect(id, dados, keyId, keyLabel) {
            const select = document.getElementById(id);
            select.innerHTML = '<option value="">Todos</option>';
            dados.forEach(item => {
                select.innerHTML += `<option value="${item[keyId]}">${item[keyLabel]}</option>`;
            });
        }

        // --- CORREÇÃO NOVO MÉTODO: carregarDashboard com datas fixas ---
        async function carregarDashboard() {
            const container = document.getElementById('dash-segmentos-container');

            // Pega as datas diretamente dos inputs
            // Isso permite que você mude para o mês passado e clique em "Atualizar" para ver os dados antigos
            const inicio = document.getElementById('filtro-data-inicio').value;
            const fim = document.getElementById('filtro-data-fim').value;

            const params = new URLSearchParams({
                inicio: inicio,
                fim: fim,
                segmentoId: document.getElementById('filtro-segmento').value,
                gestorId: document.getElementById('filtro-gestor').value,
                prestadorId: document.getElementById('filtro-prestador').value
            });

            // Loader simples
            container.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                <span class="ms-2 text-muted small">Atualizando indicadores...</span>
            </div>`;

            try {
                const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/dashboard?${params}`, {
                    headers: { 'X-User-ID': userId }
                });

                if (!response.ok) throw new Error('Erro ao carregar dashboard');

                const dados = await response.json();
                container.innerHTML = '';

                // 1. Card Total Geral (Destaque Principal)
                const cardTotalHtml = `
            <div class="col-md-3">
                <div class="card h-100 border-0 shadow-sm p-3 position-relative overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center position-relative z-1">
                        <div>
                            <p class="text-uppercase fw-bold text-muted mb-1" style="font-size: 0.7rem;">Total Pago (Período)</p>
                            <h4 class="mb-0 fw-bold text-primary">${formatarMoeda(dados.valorTotal)}</h4>
                        </div>
                        <div class="bg-primary bg-opacity-10 text-primary rounded-3 p-3 d-flex align-items-center justify-content-center">
                            <i class="bi bi-wallet2 fs-4"></i>
                        </div>
                    </div>
                </div>
            </div>`;
                container.insertAdjacentHTML('beforeend', cardTotalHtml);

                // 2. Cards por Segmento (Estilo Compacto)
                if (dados.valoresPorSegmento && dados.valoresPorSegmento.length > 0) {
                    dados.valoresPorSegmento.forEach(seg => {
                        const cardSegHtml = `
                    <div class="col-md-3">
                        <div class="card h-100 border-0 shadow-sm p-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-uppercase fw-bold text-muted mb-1" style="font-size: 0.7rem;">${seg.segmentoNome}</p>
                                    <h5 class="mb-0 fw-bold text-dark">${formatarMoeda(seg.valorTotal)}</h5>
                                </div>
                                <div class="bg-success bg-opacity-10 text-success rounded-circle p-2" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-graph-up-arrow small"></i>
                                </div>
                            </div>
                        </div>
                    </div>`;
                        container.insertAdjacentHTML('beforeend', cardSegHtml);
                    });
                } else {
                    container.innerHTML = `
                 <div class="col-12">
                    <div class="alert alert-light text-center text-muted border py-2 small">
                        <i class="bi bi-info-circle me-2"></i>Sem pagamentos no período selecionado.
                    </div>
                 </div>`;
                }

            } catch (error) {
                console.error(error);
                container.innerHTML = `<div class="alert alert-danger w-100 py-2 small">Erro ao carregar dados.</div>`;
            }
        }

        function gerarBotoesAcao(lanc) {
            // (Mesma lógica de botões de antes)
            let acoesHtml = `<button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${lanc.id}" title="Ver Histórico"><i class="bi bi-eye"></i></button>`;
            const status = lanc.statusPagamento;

            if (userRole === 'COORDINATOR' || userRole === 'ADMIN') {
                if (status === 'EM_ABERTO') {
                    acoesHtml += ` <button class="btn btn-sm btn-outline-success btn-fechar-pagamento" data-id="${lanc.id}" title="Confirmar Valor / Fechar Pagamento"><i class="bi bi-check-circle"></i></button>`;
                }
                if (status === 'FECHADO') {
                    acoesHtml += ` <button class="btn btn-sm btn-outline-warning btn-solicitar-alteracao" data-id="${lanc.id}" title="Alterar Valor"><i class="bi bi-pencil-square"></i></button>`;
                }
            }

            if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                if (status === 'FECHADO' || status === 'ALTERACAO_SOLICITADA') {
                    acoesHtml += ` <button class="btn btn-sm btn-outline-danger btn-devolver-pagamento" data-id="${lanc.id}" title="Reprovar/Devolver ao Coordenador"><i class="bi bi-arrow-counterclockwise"></i></button>`;
                }
            }
            return acoesHtml;
        }

        async function carregarFilaPendencias() {
            togglePaneLoader(tabPendencias, true);
            try {
                const response = await fetchComAuth(`${API_BASE_URL}/controle-cps`, {
                    headers: { 'X-User-ID': userId }
                });
                if (!response.ok) throw new Error('Falha ao carregar fila de pagamentos.');
                todosOsLancamentos = await response.json();

                // Aplica filtros locais (Segmento/Gestor/Prestador) sobre a lista já carregada
                const filtroSeg = document.getElementById('filtro-segmento').value;
                const filtroGest = document.getElementById('filtro-gestor').value;
                const filtroPrest = document.getElementById('filtro-prestador').value;

                let pendenciasFiltradas = todosOsLancamentos.filter(l => {
                    if (filtroSeg && l.os.segmento.id != filtroSeg) return false;
                    if (filtroGest && l.manager.id != filtroGest) return false;
                    if (filtroPrest && l.prestador.id != filtroPrest) return false;
                    return true;
                });

                renderizarAcordeonPendencias(pendenciasFiltradas);

                const cardHeader = acoesLoteControllerContainer.closest('.card-header');
                if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                    cardHeader.classList.toggle('d-none', pendenciasFiltradas.length === 0);
                } else {
                    cardHeader.classList.toggle('d-none', pendenciasFiltradas.length === 0);
                }

            } catch (error) {
                console.error(error);
                mostrarToast(error.message, 'error');
                tabPendencias.msgVazio.innerHTML = error.message;
                tabPendencias.msgVazio.classList.remove('d-none', 'text-muted');
                tabPendencias.msgVazio.classList.add('text-danger');
            } finally {
                togglePaneLoader(tabPendencias, false);
                atualizarEstadoAcoesLote();
            }
        }

        async function carregarHistorico() {
            togglePaneLoader(tabHistorico, true);

            // Captura valores dos inputs de data (que agora estarão visíveis)
            const params = new URLSearchParams({
                inicio: document.getElementById('filtro-data-inicio').value,
                fim: document.getElementById('filtro-data-fim').value,
                segmentoId: document.getElementById('filtro-segmento').value,
                gestorId: document.getElementById('filtro-gestor').value,
                prestadorId: document.getElementById('filtro-prestador').value
            });

            try {
                const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/historico?${params}`, {
                    headers: { 'X-User-ID': userId }
                });
                if (!response.ok) throw new Error('Falha ao carregar histórico de pagamentos.');
                const historico = await response.json();
                renderizarAcordeonHistorico(historico);
            } catch (error) {
                // ... tratamento de erro ...
            } finally {
                togglePaneLoader(tabHistorico, false);
            }
        }

        // --- FUNÇÕES DE AÇÃO E MODAIS (Iguais ao anterior) ---
        // ... (abrirModalAcaoCoordenador, abrirModalRecusar, abrirModalHistorico, abrirModalRecusarController, submit dos forms, etc.)
        // (Vou omitir para economizar espaço, mas você deve manter todo o código de lógica de modais que já existia)

        // ... Lógica dos Modais e Botões ...

        function abrirModalAcaoCoordenador(lancId, acao) {
            const lancamento = todosOsLancamentos.find(l => l.id == lancId);
            if (!lancamento) { mostrarToast('Erro: Lançamento não encontrado.', 'error'); return; }
            formAlterarValor.reset();
            document.getElementById('lancamentoIdAcao').value = lancId;
            document.getElementById('acaoCoordenador').value = acao;
            const valorOperacional = get(lancamento, 'valor', 0);
            const valorPagamentoAtual = get(lancamento, 'valorPagamento', valorOperacional);
            document.getElementById('valorPagamentoInput').value = valorPagamentoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',');
            const modalTitle = document.getElementById('modalAlterarValorLabel');
            const helpText = document.getElementById('justificativaHelpText');
            const btnConfirmar = document.getElementById('btnConfirmarAcaoValor');
            if (acao === 'fechar') {
                modalTitle.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmar ou Alterar Valor';
                helpText.textContent = 'Se necessário, ajuste o valor final antes de fechar.';
                btnConfirmar.className = 'btn btn-success';
                btnConfirmar.innerHTML = '<i class="bi bi-check-circle me-1"></i> Fechar Pagamento';
            } else if (acao === 'solicitar-alteracao') {
                modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Solicitar Alteração de Valor';
                helpText.textContent = 'A justificativa é obrigatória para solicitar a alteração.';
                btnConfirmar.className = 'btn btn-warning';
                btnConfirmar.innerHTML = '<i class="bi bi-send me-1"></i> Solicitar Alteração';
            }
            modalAlterarValor.show();
        }

        function abrirModalRecusar(lancId) {
            const lancamento = todosOsLancamentos.find(l => l.id == lancId);
            if (!lancamento) { mostrarToast('Erro: Lançamento não encontrado.', 'error'); return; }
            formRecusar.reset();
            document.getElementById('lancamentoIdRecusar').value = lancId;
            modalRecusar.show();
        }

        async function abrirModalHistorico(lancId) {
            let lancamento = todosOsLancamentos.find(l => l.id == lancId);
            if (!lancamento) {
                try {
                    const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/${lancId}`, { headers: { 'X-User-ID': userId } });
                    if (response.ok) { lancamento = await response.json(); }
                    else { throw new Error('Lançamento não encontrado no histórico.'); }
                } catch (error) {
                    modalComentariosBody.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
                    modalComentarios.show();
                    return;
                }
            }
            if (!lancamento || !lancamento.comentarios || lancamento.comentarios.length === 0) {
                modalComentariosBody.innerHTML = '<p class="text-center text-muted">Nenhum histórico de comentários encontrado para este lançamento.</p>';
            } else {
                const comentariosOrdenados = [...lancamento.comentarios].sort((a, b) => parseDataBrasileira(b.dataHora) - parseDataBrasileira(a.dataHora));
                modalComentariosBody.innerHTML = comentariosOrdenados.map(comentario => {
                    const dataFormatada = comentario.dataHora ? new Date(parseDataBrasileira(comentario.dataHora)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
                    return `
                    <div class="card mb-3">
                        <div class="card-header bg-light d-flex justify-content-between align-items-center small">
                            <strong><i class="bi bi-person-circle me-2"></i>${get(comentario, 'autor.nome', 'Sistema')}</strong>
                            <span class="text-muted">${dataFormatada}</span>
                        </div>
                        <div class="card-body"><p class="card-text">${comentario.texto}</p></div>
                    </div>`;
                }).join('');
            }
            modalComentarios.show();
        }

        formAlterarValor.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnConfirmar = document.getElementById('btnConfirmarAcaoValor');
            const payload = {
                lancamentoId: document.getElementById('lancamentoIdAcao').value,
                acao: document.getElementById('acaoCoordenador').value,
                coordenadorId: userId,
                valorPagamento: parseFloat(document.getElementById('valorPagamentoInput').value.replace(/\./g, '').replace(',', '.')) || 0,
                justificativa: document.getElementById('justificativaPagamentoInput').value.trim()
            };
            const endpoint = (payload.acao === 'fechar') ? '/controle-cps/fechar' : '/controle-cps/solicitar-alteracao';
            setButtonLoading(btnConfirmar, true, 'Salvando...');
            try {
                const response = await fetchComAuth(API_BASE_URL + endpoint, { method: 'POST', body: JSON.stringify(payload) });
                if (!response.ok) throw new Error((await response.json()).message || 'Erro ao processar ação.');
                mostrarToast('Ação registrada com sucesso!', 'success');
                modalAlterarValor.hide();
                await carregarFilaPendencias();
                carregarDashboard(); // Atualiza Dashboard
            } catch (error) { mostrarToast(error.message, 'error'); } finally { setButtonLoading(btnConfirmar, false); }
        });

        formRecusar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnConfirmar = document.getElementById('btnConfirmarRecusa');
            const actionType = formRecusar.dataset.actionType;
            const payload = {
                lancamentoId: document.getElementById('lancamentoIdRecusar').value,
                coordenadorId: userId, controllerId: userId,
                justificativa: document.getElementById('justificativaRecusaInput').value.trim(),
                motivo: document.getElementById('justificativaRecusaInput').value.trim(),
                valorPagamento: 0
            };
            let endpoint = '/controle-cps/recusar';
            if (actionType === 'controller_reject') { endpoint = '/controle-cps/recusar-controller'; }
            setButtonLoading(btnConfirmar, true, 'Processando...');
            try {
                const response = await fetchComAuth(API_BASE_URL + endpoint, { method: 'POST', body: JSON.stringify(payload) });
                if (!response.ok) throw new Error((await response.json()).message || 'Erro ao processar.');
                mostrarToast(actionType === 'controller_reject' ? 'Item devolvido ao Coordenador!' : 'Pagamento recusado.', 'success');
                modalRecusar.hide();
                await carregarFilaPendencias();
                carregarDashboard(); // Atualiza Dashboard
            } catch (error) { mostrarToast(error.message, 'error'); } finally {
                setButtonLoading(btnConfirmar, false); delete formRecusar.dataset.actionType;
                document.getElementById('modalRecusarPagamentoLabel').innerHTML = '<i class="bi bi-x-circle-fill me-2"></i>Recusar Pagamento';
                document.getElementById('btnConfirmarRecusa').innerHTML = 'Confirmar Recusa';
            }
        });

        btnPagarSelecionados.addEventListener('click', async () => {
            const idsSelecionados = Array.from(document.querySelectorAll('.linha-checkbox-pagamento:checked')).map(cb => cb.dataset.id);
            if (idsSelecionados.length === 0) { mostrarToast('Nenhum item selecionado para pagamento.', 'warning'); return; }
            const payload = { lancamentoIds: idsSelecionados, controllerId: userId };
            setButtonLoading(btnPagarSelecionados, true, 'Pagando...');
            try {
                const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/pagar-lote`, { method: 'POST', body: JSON.stringify(payload) });
                if (!response.ok) throw new Error((await response.json()).message || 'Erro ao processar pagamento em lote.');
                mostrarToast(`${idsSelecionados.length} item(s) marcado(s) como PAGO!`, 'success');
                await carregarFilaPendencias();
                carregarDashboard(); // Atualiza Dashboard
                tabHistorico.pane.dataset.loaded = 'false';
            } catch (error) { mostrarToast(error.message, 'error'); } finally { setButtonLoading(btnPagarSelecionados, false); atualizarEstadoAcoesLote(); }
        });

        function atualizarEstadoAcoesLote() {
            if (!acoesLoteControllerContainer) return;
            if (userRole !== 'CONTROLLER' && userRole !== 'ADMIN') { acoesLoteControllerContainer.classList.add('d-none'); return; }
            const checkboxes = document.querySelectorAll('.linha-checkbox-pagamento:checked');
            const total = checkboxes.length;
            acoesLoteControllerContainer.classList.toggle('d-none', total === 0);
            contadorPagamento.textContent = total;
            if (total > 0) {
                const todosAptos = Array.from(checkboxes).every(cb => {
                    const lanc = todosOsLancamentos.find(l => l.id == cb.dataset.id);
                    return lanc && (lanc.statusPagamento === 'FECHADO' || lanc.statusPagamento === 'ALTERACAO_SOLICITADA');
                });
                btnPagarSelecionados.disabled = !todosAptos;
                btnPagarSelecionados.title = !todosAptos ? 'Apenas itens com status FECHADO ou ALTERACAO SOLICITADA podem ser pagos.' : 'Marcar todos os selecionados como PAGOS.';
            }
        }

        function abrirModalRecusarController(lancId) {
            const lancamento = todosOsLancamentos.find(l => l.id == lancId);
            if (!lancamento) return;
            formRecusar.reset();
            document.getElementById('lancamentoIdRecusar').value = lancId;
            document.getElementById('modalRecusarPagamentoLabel').innerHTML = '<i class="bi bi-arrow-counterclockwise me-2"></i>Devolver ao Coordenador';
            document.getElementById('btnConfirmarRecusa').innerHTML = 'Confirmar Devolução';
            formRecusar.dataset.actionType = 'controller_reject';
            modalRecusar.show();
        }

        document.getElementById('cpsPagamentoTabContent').addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            const lancId = button.closest('tr')?.dataset.id;
            if (button.classList.contains('btn-fechar-pagamento') && lancId) { abrirModalAcaoCoordenador(lancId, 'fechar'); }
            else if (button.classList.contains('btn-recusar-pagamento') && lancId) { abrirModalRecusar(lancId); }
            else if (button.classList.contains('btn-solicitar-alteracao') && lancId) { abrirModalAcaoCoordenador(lancId, 'solicitar-alteracao'); }
            else if (button.classList.contains('btn-ver-historico') && lancId) { abrirModalHistorico(lancId); }
            else if (button.classList.contains('btn-devolver-pagamento')) { abrirModalRecusarController(lancId); }
        });

        document.getElementById('accordionPendencias').addEventListener('click', (e) => {
            if (e.target.closest('.check-container-header')) { e.stopPropagation(); }
        });

        tabPendencias.pane.addEventListener('change', (e) => {
            const target = e.target;
            if (target.classList.contains('linha-checkbox-pagamento')) {
                target.closest('tr').classList.toggle('table-active', target.checked);
                const accordionItem = target.closest('.accordion-item');
                const headerCheckbox = accordionItem.querySelector('.selecionar-todos-acordeon');
                if (headerCheckbox) {
                    const totalLinhas = accordionItem.querySelectorAll('.linha-checkbox-pagamento').length;
                    const linhasMarcadas = accordionItem.querySelectorAll('.linha-checkbox-pagamento:checked').length;
                    headerCheckbox.checked = (totalLinhas === linhasMarcadas && totalLinhas > 0);
                    headerCheckbox.indeterminate = (linhasMarcadas > 0 && linhasMarcadas < totalLinhas);
                }
            } else if (target.classList.contains('selecionar-todos-acordeon')) {
                const isChecked = target.checked;
                const targetId = target.dataset.targetBody;
                const targetBody = document.getElementById(targetId);
                if (targetBody) {
                    targetBody.querySelectorAll('.linha-checkbox-pagamento').forEach(cb => {
                        cb.checked = isChecked;
                        cb.closest('tr').classList.toggle('table-active', isChecked);
                    });
                }
            }
            atualizarEstadoAcoesLote();
        });

        document.querySelectorAll('#cpsPagamentoTab .nav-link').forEach(tabEl => {
            tabEl.addEventListener('show.bs.tab', function (event) {
                const targetPaneId = event.target.getAttribute('data-bs-target');
                const targetPane = document.querySelector(targetPaneId);

                // LOGICA DE VISIBILIDADE DO FILTRO DE DATA
                if (targetPaneId === '#historico-pagamento-pane') {
                    toggleFiltrosData(true); // Mostra data
                    if (targetPane.dataset.loaded !== 'true') {
                        carregarHistorico().finally(() => { targetPane.dataset.loaded = 'true'; });
                    }
                } else {
                    toggleFiltrosData(false); // Esconde data (Pendências)
                    carregarFilaPendencias();
                }
            });
        });

        // Inicialização
        function init() {
            carregarFilaPendencias();
            tabPendencias.pane.dataset.loaded = 'true';
            // Garante que começa com filtros de data escondidos (pois começa na aba Pendências)
            toggleFiltrosData(false);
        }

        init();
    });