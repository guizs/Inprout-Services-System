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
        thead: document.getElementById('thead-pendencias-pagamento'),
        tbody: document.getElementById('tbody-pendencias-pagamento'),
        loaderId: '#pendencias-pagamento-pane'
    };
    const tabHistorico = {
        pane: document.getElementById('historico-pagamento-pane'),
        btn: document.getElementById('historico-pagamento-tab'),
        thead: document.getElementById('thead-historico-pagamento'),
        tbody: document.getElementById('tbody-historico-pagamento'),
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
    
    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    /**
     * Define os cabeçalhos das tabelas.
     */
    function inicializarCabecalhos() {
        const colunas = [
            "Ações", "Status Pagamento", "Data Atividade", "OS", "Site", "Segmento",
            "Projeto", "LPU", "Cód. Prestador", "Prestador", "Gestor",
            "Valor Operacional", "Valor a Pagar", "KEY"
        ];
        
        // Checkbox para Controller na fila de pendências
        const colunasPendencias = [
            (userRole === 'CONTROLLER' || userRole === 'ADMIN') ? '<th><input type="checkbox" class="form-check-input" id="selecionar-todos-pagamento"></th>' : '',
            ...colunas
        ].filter(Boolean).map(c => c.startsWith('<th') ? c : `<th>${c}</th>`).join('');

        tabPendencias.thead.innerHTML = `<tr>${colunasPendencias}</tr>`;
        
        // Cabeçalho do Histórico (sem checkbox)
        const colunasHistorico = colunas.map(c => `<th>${c}</th>`).join('');
        tabHistorico.thead.innerHTML = `<tr>${colunasHistorico}</tr>`;
    }

    /**
     * Renderiza a tabela de Pendências de Pagamento.
     */
    function renderizarTabelaPendencias(lancamentos) {
        const tbody = tabPendencias.tbody;
        tbody.innerHTML = '';

        if (!lancamentos || lancamentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="15" class="text-center text-muted p-4">Nenhuma pendência de pagamento encontrada.</td></tr>`;
            return;
        }

        lancamentos.forEach(lanc => {
            const tr = document.createElement('tr');
            tr.dataset.id = lanc.id;
            
            // Adiciona classes de destaque
            if(lanc.statusPagamento === 'ALTERACAO_SOLICITADA') {
                tr.classList.add('table-warning'); // Destaque para alteração
            } else if (lanc.statusPagamento === 'FECHADO') {
                 tr.classList.add('table-info'); // Destaque para "Pronto para Pagar"
            }

            const valorOperacional = get(lanc, 'valor', 0);
            const valorPagamento = get(lanc, 'valorPagamento', 0);
            let destaqueValor = '';
            if (valorOperacional !== valorPagamento) {
                destaqueValor = 'text-danger fw-bold';
            }

            const acoesHtml = gerarBotoesAcao(lanc);
            const checkboxHtml = (userRole === 'CONTROLLER' || userRole === 'ADMIN') 
                ? `<td><input type="checkbox" class="form-check-input linha-checkbox-pagamento" data-id="${lanc.id}"></td>` 
                : '';

            tr.innerHTML = `
                ${checkboxHtml}
                <td data-label="Ações">${acoesHtml}</td>
                <td data-label="Status Pagamento">${formatarStatusPagamento(lanc.statusPagamento)}</td>
                <td data-label="Data Atividade">${formatarData(get(lanc, 'dataAtividade'))}</td>
                <td data-label="OS">${get(lanc, 'os.os')}</td>
                <td data-label="Site">${get(lanc, 'detalhe.site')}</td>
                <td data-label="Segmento">${get(lanc, 'os.segmento.nome')}</td>
                <td data-label="Projeto">${get(lanc, 'os.projeto')}</td>
                <td data-label="LPU">${get(lanc, 'detalhe.lpu.nomeLpu')}</td>
                <td data-label="Cód. Prestador">${get(lanc, 'prestador.codigo')}</td>
                <td data-label="Prestador">${get(lanc, 'prestador.nome')}</td>
                <td data-label="Gestor">${get(lanc, 'manager.nome')}</td>
                <td data-label="Valor Operacional">${formatarMoeda(valorOperacional)}</td>
                <td data-label="Valor a Pagar" class="${destaqueValor}">${formatarMoeda(valorPagamento)}</td>
                <td data-label="KEY">${get(lanc, 'detalhe.key')}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    /**
     * Renderiza a tabela de Histórico de Pagamentos.
     */
    function renderizarTabelaHistorico(lancamentos) {
        const tbody = tabHistorico.tbody;
        tbody.innerHTML = '';

        if (!lancamentos || lancamentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="14" class="text-center text-muted p-4">Nenhum histórico de pagamento encontrado.</td></tr>`;
            return;
        }

        lancamentos.forEach(lanc => {
            const tr = document.createElement('tr');
            const valorOperacional = get(lanc, 'valor', 0);
            const valorPagamento = get(lanc, 'valorPagamento', 0);
            let destaqueValor = (valorOperacional !== valorPagamento) ? 'text-danger fw-bold' : '';

            tr.innerHTML = `
                <td data-label="Ações"><button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${lanc.id}"><i class="bi bi-eye"></i></button></td>
                <td data-label="Status Pagamento">${formatarStatusPagamento(lanc.statusPagamento)}</td>
                <td data-label="Data Atividade">${formatarData(get(lanc, 'dataAtividade'))}</td>
                <td data-label="OS">${get(lanc, 'os.os')}</td>
                <td data-label="Site">${get(lanc, 'detalhe.site')}</td>
                <td data-label="Segmento">${get(lanc, 'os.segmento.nome')}</td>
                <td data-label="Projeto">${get(lanc, 'os.projeto')}</td>
                <td data-label="LPU">${get(lanc, 'detalhe.lpu.nomeLpu')}</td>
                <td data-label="Cód. Prestador">${get(lanc, 'prestador.codigo')}</td>
                <td data-label="Prestador">${get(lanc, 'prestador.nome')}</td>
                <td data-label="Gestor">${get(lanc, 'manager.nome')}</td>
                <td data-label="Valor Operacional">${formatarMoeda(valorOperacional)}</td>
                <td data-label="Valor a Pagar" class="${destaqueValor}">${formatarMoeda(valorPagamento)}</td>
                <td data-label="KEY">${get(lanc, 'detalhe.key')}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * Gera os botões de ação corretos com base na Role e no Status do Lançamento.
     */
    function gerarBotoesAcao(lanc) {
        let acoesHtml = `<button class="btn btn-sm btn-outline-info btn-ver-historico" data-id="${lanc.id}" title="Ver Histórico"><i class="bi bi-eye"></i></button>`;
        const status = lanc.statusPagamento;

        if (userRole === 'COORDINATOR' || userRole === 'ADMIN') {
            if (status === 'EM_ABERTO') {
                acoesHtml += ` <button class="btn btn-sm btn-outline-success btn-fechar-pagamento" data-id="${lanc.id}" title="Fechar para Pagamento"><i class="bi bi-check-circle"></i></button>`;
                acoesHtml += ` <button class="btn btn-sm btn-outline-danger btn-recusar-pagamento" data-id="${lanc.id}" title="Recusar Pagamento"><i class="bi bi-x-circle"></i></button>`;
            }
            if (status === 'FECHADO') {
                acoesHtml += ` <button class="btn btn-sm btn-outline-warning btn-solicitar-alteracao" data-id="${lanc.id}" title="Solicitar Alteração"><i class="bi bi-pencil-square"></i></button>`;
            }
        }
        
        // Controller não tem ação de linha (apenas em lote), mas pode ver o histórico
        
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
            
            // Filtra os dados para a aba de pendências
            renderizarTabelaPendencias(todosOsLancamentos);
            
            // Controla a visibilidade das Ações em Lote
            if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                acoesLoteControllerContainer.classList.remove('d-none');
            }
            
        } catch (error) {
            console.error(error);
            mostrarToast(error.message, 'error');
            tabPendencias.tbody.innerHTML = `<tr><td colspan="15" class="text-center text-danger p-4">${error.message}</td></tr>`;
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
            renderizarTabelaHistorico(historico);
        } catch (error) {
            console.error(error);
            mostrarToast(error.message, 'error');
            tabHistorico.tbody.innerHTML = `<tr><td colspan="14" class="text-center text-danger p-4">${error.message}</td></tr>`;
        } finally {
            togglePaneLoader(tabHistorico, false);
        }
    }
    
    // --- FUNÇÕES DE AÇÃO (MODAIS E API) ---

    function abrirModalAcaoCoordenador(lancId, acao) {
        const lancamento = todosOsLancamentos.find(l => l.id == lancId);
        if (!lancamento) {
            mostrarToast('Erro: Lançamento não encontrado.', 'error');
            return;
        }

        formAlterarValor.reset();
        document.getElementById('lancamentoIdAcao').value = lancId;
        document.getElementById('acaoCoordenador').value = acao;
        
        const valorOperacional = get(lancamento, 'valor', 0);
        const valorPagamento = get(lancamento, 'valorPagamento', valorOperacional); // Usa o operacional como fallback

        document.getElementById('valorOperacionalDisplay').value = formatarMoeda(valorOperacional);
        document.getElementById('valorPagamentoInput').value = valorPagamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',');
        
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
    
    function abrirModalHistorico(lancId) {
        const lancamento = todosOsLancamentos.find(l => l.id == lancId) || 
                           (tabHistorico.pane.dataset.loaded === 'true' ? document.getElementById('tbody-historico-pagamento').data.find(l => l.id == lancId) : null); // Tenta buscar no histórico
                           
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
    
    /**
     * Listener para o formulário de Alteração de Valor (Fechar / Solicitar Alteração)
     */
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

    /**
     * Listener para o formulário de Recusa de Pagamento
     */
    formRecusar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnConfirmar = document.getElementById('btnConfirmarRecusa');
        
        const payload = {
            lancamentoId: document.getElementById('lancamentoIdRecusar').value,
            coordenadorId: userId,
            justificativa: document.getElementById('justificativaRecusaInput').value.trim(),
            valorPagamento: 0 // Valor não é relevante para recusa, mas o DTO pode exigir
        };
        
        setButtonLoading(btnConfirmar, true, 'Recusando...');
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/recusar`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Erro ao recusar pagamento.');
            
            mostrarToast('Pagamento recusado com sucesso.', 'success');
            modalRecusar.hide();
            await carregarFilaPendencias(); // Recarrega a fila de pendências
            
            // Força o recarregamento do histórico na próxima visita
            tabHistorico.pane.dataset.loaded = 'false';

        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            setButtonLoading(btnConfirmar, false);
        }
    });

    /**
     * Listener para Ação em Lote do Controller (Pagar)
     */
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
            
            // Força o recarregamento do histórico na próxima visita
            tabHistorico.pane.dataset.loaded = 'false';

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


    // --- INICIALIZAÇÃO E EVENT LISTENERS ---

    // Delegação de eventos para os botões nas tabelas
    document.getElementById('cpsPagamentoTabContent').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const lancId = button.closest('tr')?.dataset.id;
        if (!lancId) return;

        if (button.classList.contains('btn-fechar-pagamento')) {
            abrirModalAcaoCoordenador(lancId, 'fechar');
        } else if (button.classList.contains('btn-recusar-pagamento')) {
            abrirModalRecusar(lancId);
        } else if (button.classList.contains('btn-solicitar-alteracao')) {
            abrirModalAcaoCoordenador(lancId, 'solicitar-alteracao');
        } else if (button.classList.contains('btn-ver-historico')) {
            abrirModalHistorico(lancId);
        }
    });
    
    // Listeners para seleção de linhas (lote)
    tabPendencias.pane.addEventListener('change', (e) => {
        const target = e.target;
        const cbTodos = document.getElementById('selecionar-todos-pagamento');
        
        if (target.classList.contains('linha-checkbox-pagamento')) {
            target.closest('tr').classList.toggle('table-active', target.checked);
            const totalCheckboxes = document.querySelectorAll('.linha-checkbox-pagamento').length;
            const checkedCount = document.querySelectorAll('.linha-checkbox-pagamento:checked').length;
            cbTodos.checked = checkedCount === totalCheckboxes;
            cbTodos.indeterminate = checkedCount > 0 && checkedCount < totalCheckboxes;
        } 
        else if (target.id === 'selecionar-todos-pagamento') {
            const isChecked = target.checked;
            document.querySelectorAll('.linha-checkbox-pagamento').forEach(cb => {
                cb.checked = isChecked;
                cb.closest('tr').classList.toggle('table-active', isChecked);
            });
            cbTodos.indeterminate = false;
        }
        
        atualizarEstadoAcoesLote();
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
        inicializarCabecalhos();
        // Carrega a primeira aba (Pendências)
        carregarFilaPendencias();
        tabPendencias.pane.dataset.loaded = 'true';
    }

    init();
});