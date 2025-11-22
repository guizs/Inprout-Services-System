document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS ---
    const API_BASE_URL = 'http://localhost:8080';
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const userId = localStorage.getItem('usuarioId');
    let todosOsLancamentos = []; // Cache dos dados da fila de pendências

    // Abas
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

    // Modais
    const modalAlterarValorEl = document.getElementById('modalAlterarValorPagamento');
    const modalAlterarValor = modalAlterarValorEl ? new bootstrap.Modal(modalAlterarValorEl) : null;
    const formAlterarValor = document.getElementById('formAlterarValorPagamento');

    const modalRecusarEl = document.getElementById('modalRecusarPagamento');
    const modalRecusar = modalRecusarEl ? new bootstrap.Modal(modalRecusarEl) : null;
    const formRecusar = document.getElementById('formRecusarPagamento');

    const modalComentariosEl = document.getElementById('modalComentarios');
    const modalComentarios = modalComentariosEl ? new bootstrap.Modal(modalComentariosEl) : null;
    const modalComentariosBody = document.getElementById('modalComentariosBody');

    // Ações em Lote (Controller)
    const acoesLoteControllerContainer = document.getElementById('acoes-lote-controller-container');
    const btnPagarSelecionados = document.getElementById('btn-pagar-selecionados');
    const contadorPagamento = document.getElementById('contador-pagamento');

    // --- FUNÇÕES AUXILIARES ---
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

    /**
     * Cabeçalho da tabela para a fila de Pendências (SIMPLIFICADO).
     */
    function getTheadPendencias() {
        const isController = (userRole === 'CONTROLLER' || userRole === 'ADMIN');
        return `
            <thead class="sticky-top">
                <tr>
                    ${isController ? '<th><input type="checkbox" class="form-check-input selecionar-todos-os" title="Selecionar todos desta OS"></th>' : ''}
                    <th>Ações</th>
                    <th>Status Pag.</th>
                    <th>Data Ativ.</th>
                    <th>Site</th>
                    <th>Segmento</th>
                    <th>Projeto</th>
                    <th>LPU</th>
                    <th>Prestador</th>
                    <th>Gestor</th>
                    <th>Valor a Pagar</th> <th>KEY</th>
                </tr>
            </thead>
        `;
    }

    /**
     * Cabeçalho da tabela para a fila de Histórico (SIMPLIFICADO).
     */
    function getTheadHistorico() {
        return `
            <thead class="sticky-top">
                <tr>
                    <th>Ações</th>
                    <th>Status Pag.</th>
                    <th>Data Ativ.</th>
                    <th>Site</th>
                    <th>Segmento</th>
                    <th>Projeto</th>
                    <th>LPU</th>
                    <th>Prestador</th>
                    <th>Gestor</th>
                    <th>Valor a Pagar</th> <th>KEY</th>
                </tr>
            </thead>
        `;
    }

    /**
     * Renderiza o acordeão de Pendências de Pagamento.
     */
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
                    // Dados Financeiros
                    totalOs: get(lanc, 'totalOs', 0),
                    totalCps: get(lanc, 'valorCps', 0),
                    custoMaterial: get(lanc, 'os.custoTotalMateriais', 0),
                    totalPago: get(lanc, 'totalPago', 0), // Novo valor vindo do Backend
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

            // Cálculos de Porcentagem
            const totalOs = dadosGrupo.totalOs;
            const totalCps = dadosGrupo.totalCps;
            const totalMat = dadosGrupo.custoMaterial;
            const percentual = totalOs > 0 ? ((totalCps + totalMat) / totalOs) * 100 : 0;

            // Checkbox do Cabeçalho (SÓ para Controller/Admin)
            const checkboxHeader = isController
                ? `<div class="form-check me-3 check-container-header" onclick="event.stopPropagation();">
                        <input class="form-check-input selecionar-todos-acordeon" type="checkbox" data-target-body="collapse-${uniqueId}">
                   </div>`
                : '';

            // KPI HTML do Cabeçalho (Com o novo campo "Já Pago")
            const kpiHTML = `
            <div class="header-kpi-wrapper">
                <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(totalOs)}</span></div>
                <div class="header-kpi"><span class="kpi-label text-success">Já Pago</span><span class="kpi-value text-success">${formatarMoeda(dadosGrupo.totalPago)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(totalCps)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Material</span><span class="kpi-value">${formatarMoeda(totalMat)}</span></div>
                <div class="header-kpi"><span class="kpi-label">% Exec.</span><span class="kpi-value text-primary">${percentual.toFixed(2)}%</span></div>
                <div class="header-kpi ms-3 border-start ps-3"><span class="kpi-label">A Pagar (Fila)</span><span class="kpi-value text-warning">${formatarMoeda(dadosGrupo.totalPagarGrupo)}</span></div>
            </div>`;

            // Gera as linhas da tabela interna
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
                        <td class="text-end ${destaqueValor}">${formatarMoeda(valorPagamento)}</td>
                        <td><small class="text-muted">${get(lanc, 'detalhe.key')}</small></td>
                    </tr>
                `;
            }).join('');

            // Monta o Acordeão Final
            // NOTA: Removido 'data-bs-parent="#accordionPendencias"' para permitir múltiplos abertos
            const accordionItemHtml = `
                <div class="accordion-item border mb-3 shadow-sm" style="border-radius: 12px; overflow: hidden;">
                    <h2 class="accordion-header" id="heading-${uniqueId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                            <div class="header-content w-100">
                                ${checkboxHeader}
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

    /**
     * Renderiza o acordeão de Histórico de Pagamentos.
     */
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
            const osKey = get(lanc, 'os.os', 'Sem OS');
            if (!acc[osKey]) {
                acc[osKey] = {
                    lancamentos: [],
                    projeto: get(lanc, 'os.projeto', '-'),
                    segmento: get(lanc, 'os.segmento.nome', '-')
                };
            }
            acc[osKey].lancamentos.push(lanc);
            return acc;
        }, {});

        const theadHtml = getTheadHistorico();
        let index = 0;

        for (const [os, dadosGrupo] of Object.entries(grupos)) {
            const osId = `os-historico-${index}`;
            const totalItens = dadosGrupo.lancamentos.length;

            const tbodyHtml = dadosGrupo.lancamentos.map(lanc => {
                const valorOperacional = get(lanc, 'valor', 0);
                const valorPagamento = get(lanc, 'valorPagamento', valorOperacional);
                let destaqueValor = (valorOperacional !== valorPagamento) ? 'text-danger fw-bold' : '';

                return `
                    <tr data-id="${lanc.id}">
                        <td data-label="Ações"><button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${lanc.id}"><i class="bi bi-eye"></i></button></td>
                        <td data-label="Status Pag.">${formatarStatusPagamento(lanc.statusPagamento)}</td>
                        <td data-label="Data Ativ.">${formatarData(get(lanc, 'dataAtividade'))}</td>
                        <td data-label="Site">${get(lanc, 'detalhe.site')}</td>
                        <td data-label="Segmento">${get(lanc, 'os.segmento.nome')}</td>
                        <td data-label="Projeto">${get(lanc, 'os.projeto')}</td>
                        <td data-label="LPU">${get(lanc, 'detalhe.lpu.nomeLpu')}</td>
                        <td data-label="Prestador">${get(lanc, 'prestador.nome')}</td>
                        <td data-label="Gestor">${get(lanc, 'manager.nome')}</td>
                        <td data-label="Valor a Pagar" class="${destaqueValor}">${formatarMoeda(valorPagamento)}</td>
                        <td data-label="KEY">${get(lanc, 'detalhe.key')}</td>
                    </tr>
                `;
            }).join('');

            const accordionItemHtml = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading-${osId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${osId}">
                             <div class="d-flex justify-content-between w-100 pe-3">
                                <span><i class="bi bi-file-earmark-text me-2"></i><strong>OS: ${os}</strong></span>
                                <span class="text-muted d-none d-md-inline">Projeto: ${dadosGrupo.projeto}</span>
                                <span class="text-muted d-none d-lg-inline">Segmento: ${dadosGrupo.segmento}</span>
                                <span class="badge text-bg-secondary">${totalItens} item(s)</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse-${osId}" class="accordion-collapse collapse" data-bs-parent="#accordionHistorico">
                        <div class="accordion-body p-0">
                            <div class="table-responsive-vertical custom-scroll">
                                <table class="table modern-table table-hover align-middle mb-0">
                                    ${theadHtml}
                                    <tbody>
                                        ${tbodyHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            accordionContainer.innerHTML += accordionItemHtml;
            index++;
        }
    }

    /**
     * Gera os botões de ação corretos com base na Role e no Status do Lançamento.
     */
    function gerarBotoesAcao(lanc) {
        let acoesHtml = `<button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${lanc.id}" title="Ver Histórico"><i class="bi bi-eye"></i></button>`;
        const status = lanc.statusPagamento;

        if (userRole === 'COORDINATOR' || userRole === 'ADMIN') {
            // ... lógica existente do coordenador ...
            if (status === 'EM_ABERTO') {
                acoesHtml += ` <button class="btn btn-sm btn-outline-success btn-fechar-pagamento" data-id="${lanc.id}" title="Fechar para Pagamento"><i class="bi bi-check-circle"></i></button>`;
                acoesHtml += ` <button class="btn btn-sm btn-outline-danger btn-recusar-pagamento" data-id="${lanc.id}" title="Recusar Pagamento"><i class="bi bi-x-circle"></i></button>`;
            }
            if (status === 'FECHADO') {
                acoesHtml += ` <button class="btn btn-sm btn-outline-warning btn-solicitar-alteracao" data-id="${lanc.id}" title="Solicitar Alteração"><i class="bi bi-pencil-square"></i></button>`;
            }
        }

        // --- NOVA LÓGICA PARA O CONTROLLER ---
        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            // O Controller pode devolver itens que estão na fila dele (FECHADO ou ALTERACAO_SOLICITADA)
            if (status === 'FECHADO' || status === 'ALTERACAO_SOLICITADA') {
                acoesHtml += ` <button class="btn btn-sm btn-outline-danger btn-devolver-pagamento" data-id="${lanc.id}" title="Reprovar/Devolver ao Coordenador"><i class="bi bi-arrow-counterclockwise"></i></button>`;
            }
        }

        return acoesHtml;
    }

    // --- FUNÇÕES DE CARREGAMENTO DE DADOS ---

    async function carregarFilaPendencias() {
        togglePaneLoader(tabPendencias, true);
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/controle-cps`, {
                headers: { 'X-User-ID': userId }
            });
            if (!response.ok) throw new Error('Falha ao carregar fila de pagamentos.');
            todosOsLancamentos = await response.json();

            renderizarAcordeonPendencias(todosOsLancamentos);

            // Mostra/Esconde o cabeçalho do card (que contém o botão de lote)
            const cardHeader = acoesLoteControllerContainer.closest('.card-header');
            if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                cardHeader.classList.toggle('d-none', todosOsLancamentos.length === 0);
            } else {
                // Esconde para Coordenador se não houver itens, ou se o botão de lote não for necessário
                cardHeader.classList.toggle('d-none', todosOsLancamentos.length === 0);
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
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/historico`, {
                headers: { 'X-User-ID': userId }
            });
            if (!response.ok) throw new Error('Falha ao carregar histórico de pagamentos.');
            const historico = await response.json();
            renderizarAcordeonHistorico(historico);
        } catch (error) {
            console.error(error);
            mostrarToast(error.message, 'error');
            tabHistorico.msgVazio.innerHTML = error.message;
            tabHistorico.msgVazio.classList.remove('d-none', 'text-muted');
            tabHistorico.msgVazio.classList.add('text-danger');
        } finally {
            togglePaneLoader(tabHistorico, false);
        }
    }

    // --- FUNÇÕES DE AÇÃO (MODAIS E API) ---

    // MODAL SIMPLIFICADO
    function abrirModalAcaoCoordenador(lancId, acao) {
        const lancamento = todosOsLancamentos.find(l => l.id == lancId);
        if (!lancamento) {
            mostrarToast('Erro: Lançamento não encontrado.', 'error');
            return;
        }

        formAlterarValor.reset();
        document.getElementById('lancamentoIdAcao').value = lancId;
        document.getElementById('acaoCoordenador').value = acao;

        // Pega o valor da atividade (original) como fallback
        const valorOperacional = get(lancamento, 'valor', 0);
        // Pega o valor de pagamento atual, ou o original se aquele for nulo
        const valorPagamentoAtual = get(lancamento, 'valorPagamento', valorOperacional);

        // Seta APENAS o valor de pagamento
        document.getElementById('valorPagamentoInput').value = valorPagamentoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',');

        const modalTitle = document.getElementById('modalAlterarValorLabel');
        const helpText = document.getElementById('justificativaHelpText');
        const btnConfirmar = document.getElementById('btnConfirmarAcaoValor');

        if (acao === 'fechar') {
            modalTitle.innerHTML = '<i class="bi bi-check-circle me-2"></i>Fechar para Pagamento';
            helpText.textContent = 'Justificativa é obrigatória se o valor for alterado.';
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
        if (!lancamento) {
            mostrarToast('Erro: Lançamento não encontrado.', 'error');
            return;
        }
        formRecusar.reset();
        document.getElementById('lancamentoIdRecusar').value = lancId;
        modalRecusar.show();
    }

    async function abrirModalHistorico(lancId) {
        let lancamento = todosOsLancamentos.find(l => l.id == lancId);

        if (!lancamento) {
            try {
                // Busca o lançamento individual se não estiver na lista de pendências
                const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/${lancId}`, {
                    headers: { 'X-User-ID': userId }
                });
                if (response.ok) {
                    lancamento = await response.json();
                } else {
                    throw new Error('Lançamento não encontrado no histórico.');
                }
            } catch (error) {
                console.error("Erro ao buscar lançamento individual:", error);
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
                        <div class="card-body">
                            <p class="card-text">${comentario.texto}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
        modalComentarios.show();
    }

    // SUBMISSÃO DO MODAL DE ALTERAÇÃO (Nenhuma mudança necessária)
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
            const response = await fetchComAuth(API_BASE_URL + endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Erro ao processar ação.');

            mostrarToast('Ação registrada com sucesso!', 'success');
            modalAlterarValor.hide();
            await carregarFilaPendencias(); // Recarrega a fila de pendências

        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            setButtonLoading(btnConfirmar, false);
        }
    });

    // SUBMISSÃO DO MODAL DE RECUSA (Nenhuma mudança necessária)
    formRecusar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnConfirmar = document.getElementById('btnConfirmarRecusa');
        const actionType = formRecusar.dataset.actionType; // Pega o tipo de ação

        const payload = {
            lancamentoId: document.getElementById('lancamentoIdRecusar').value,
            // Se for controller, usa o ID dele, senão do coordenador (userId funciona para ambos)
            coordenadorId: userId,
            controllerId: userId, // Para o endpoint novo
            justificativa: document.getElementById('justificativaRecusaInput').value.trim(),
            motivo: document.getElementById('justificativaRecusaInput').value.trim(), // Para o endpoint novo
            valorPagamento: 0
        };

        let endpoint = '/controle-cps/recusar'; // Padrão (Coordenador)
        if (actionType === 'controller_reject') {
            endpoint = '/controle-cps/recusar-controller';
        }

        setButtonLoading(btnConfirmar, true, 'Processando...');
        try {
            const response = await fetchComAuth(API_BASE_URL + endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Erro ao processar.');

            mostrarToast(actionType === 'controller_reject' ? 'Item devolvido ao Coordenador!' : 'Pagamento recusado.', 'success');
            modalRecusar.hide();
            await carregarFilaPendencias();

        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            setButtonLoading(btnConfirmar, false);
            delete formRecusar.dataset.actionType; // Limpa o estado
            // Reseta o modal para o estado padrão (Coordenador)
            document.getElementById('modalRecusarPagamentoLabel').innerHTML = '<i class="bi bi-x-circle-fill me-2"></i>Recusar Pagamento';
            document.getElementById('btnConfirmarRecusa').innerHTML = 'Confirmar Recusa';
        }
    });

    // AÇÃO EM LOTE DO CONTROLLER (Nenhuma mudança necessária)
    btnPagarSelecionados.addEventListener('click', async () => {
        const idsSelecionados = Array.from(document.querySelectorAll('.linha-checkbox-pagamento:checked')).map(cb => cb.dataset.id);

        if (idsSelecionados.length === 0) {
            mostrarToast('Nenhum item selecionado para pagamento.', 'warning');
            return;
        }

        const payload = {
            lancamentoIds: idsSelecionados,
            controllerId: userId
        };

        setButtonLoading(btnPagarSelecionados, true, 'Pagando...');
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/pagar-lote`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Erro ao processar pagamento em lote.');

            mostrarToast(`${idsSelecionados.length} item(s) marcado(s) como PAGO!`, 'success');
            await carregarFilaPendencias(); // Recarrega a fila de pendências

            tabHistorico.pane.dataset.loaded = 'false'; // Força recarga do histórico

        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            setButtonLoading(btnPagarSelecionados, false);
            atualizarEstadoAcoesLote();
        }
    });

    /**
     * Atualiza a visibilidade e contagem dos botões de ação em lote
     */
    function atualizarEstadoAcoesLote() {
        if (!acoesLoteControllerContainer) return;
        if (userRole !== 'CONTROLLER' && userRole !== 'ADMIN') {
            acoesLoteControllerContainer.classList.add('d-none');
            return;
        }

        const checkboxes = document.querySelectorAll('.linha-checkbox-pagamento:checked');
        const total = checkboxes.length;

        acoesLoteControllerContainer.classList.toggle('d-none', total === 0);
        contadorPagamento.textContent = total;

        if (total > 0) {
            // Verifica se todos os selecionados estão aptos (FECHADO ou ALTERACAO_SOLICITADA)
            const todosAptos = Array.from(checkboxes).every(cb => {
                const lanc = todosOsLancamentos.find(l => l.id == cb.dataset.id);
                return lanc && (lanc.statusPagamento === 'FECHADO' || lanc.statusPagamento === 'ALTERACAO_SOLICITADA');
            });
            btnPagarSelecionados.disabled = !todosAptos;
            if (!todosAptos) {
                btnPagarSelecionados.title = 'Apenas itens com status FECHADO ou ALTERACAO SOLICITADA podem ser pagos.';
            } else {
                btnPagarSelecionados.title = 'Marcar todos os selecionados como PAGOS.';
            }
        }
    }

    function abrirModalRecusarController(lancId) {
        const lancamento = todosOsLancamentos.find(l => l.id == lancId);
        if (!lancamento) return;

        formRecusar.reset();
        document.getElementById('lancamentoIdRecusar').value = lancId;

        // Muda o título e o botão para indicar que é uma ação do Controller
        document.getElementById('modalRecusarPagamentoLabel').innerHTML = '<i class="bi bi-arrow-counterclockwise me-2"></i>Devolver ao Coordenador';
        document.getElementById('btnConfirmarRecusa').innerHTML = 'Confirmar Devolução';

        // Adiciona um atributo para identificar que é ação do controller
        formRecusar.dataset.actionType = 'controller_reject';

        modalRecusar.show();
    }


    // --- INICIALIZAÇÃO E EVENT LISTENERS ---

    // Delegação de eventos para os botões nos acordeões
    document.getElementById('cpsPagamentoTabContent').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const lancId = button.closest('tr')?.dataset.id;

        if (button.classList.contains('btn-fechar-pagamento') && lancId) {
            abrirModalAcaoCoordenador(lancId, 'fechar');
        } else if (button.classList.contains('btn-recusar-pagamento') && lancId) {
            abrirModalRecusar(lancId);
        } else if (button.classList.contains('btn-solicitar-alteracao') && lancId) {
            abrirModalAcaoCoordenador(lancId, 'solicitar-alteracao');
        } else if (button.classList.contains('btn-ver-historico') && lancId) {
            abrirModalHistorico(lancId);
        } else if (button.classList.contains('btn-devolver-pagamento')) {
            // Reutiliza o modal de recusa, mas ajusta o contexto
            abrirModalRecusarController(lancId);
        }
    });

    // Listeners para seleção de linhas (lote) - AGORA DENTRO DO ACORDEÃO
    tabPendencias.pane.addEventListener('change', (e) => {
        const target = e.target;

        if (target.classList.contains('linha-checkbox-pagamento')) {
            // Checkbox de linha individual
            target.closest('tr').classList.toggle('table-active', target.checked);

            // Atualiza o checkbox "selecionar-todos-os" do grupo
            const table = target.closest('table');
            const totalLinhas = table.querySelectorAll('.linha-checkbox-pagamento').length;
            const linhasMarcadas = table.querySelectorAll('.linha-checkbox-pagamento:checked').length;
            const cbTodosOs = table.querySelector('.selecionar-todos-os');

            if (cbTodosOs) {
                cbTodosOs.checked = (totalLinhas === linhasMarcadas);
                cbTodosOs.indeterminate = (linhasMarcadas > 0 && linhasMarcadas < totalLinhas);
            }
        }
        else if (target.classList.contains('selecionar-todos-os')) {
            // Checkbox "selecionar-todos-os" (cabeçalho da tabela interna)
            const isChecked = target.checked;
            const tableBody = target.closest('table').querySelector('tbody');

            tableBody.querySelectorAll('.linha-checkbox-pagamento').forEach(cb => {
                cb.checked = isChecked;
                cb.closest('tr').classList.toggle('table-active', isChecked);
            });
        }

        atualizarEstadoAcoesLote(); // Atualiza o contador global
    });

    // Gatilho para carregar dados ao trocar de aba
    document.querySelectorAll('#cpsPagamentoTab .nav-link').forEach(tabEl => {
        tabEl.addEventListener('show.bs.tab', function (event) {
            const targetPaneId = event.target.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetPaneId);

            if (targetPaneId === '#pendencias-pagamento-pane') {
                carregarFilaPendencias(); // Sempre recarrega a fila de pendências
            } else if (targetPaneId === '#historico-pagamento-pane') {
                if (targetPane.dataset.loaded !== 'true') {
                    carregarHistorico().finally(() => { targetPane.dataset.loaded = 'true'; });
                }
            }
        });
    });

    // Carregamento inicial
    function init() {
        carregarFilaPendencias();
        tabPendencias.pane.dataset.loaded = 'true';
    }

    init();
});