document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Configuração de Visibilidade por Role ---
    configurarVisibilidadePorRole();

    // --- 2. Inicialização dos Listeners de Abas ---
    const tabElements = document.querySelectorAll('#aprovacoesTab .nav-link');
    tabElements.forEach(tabEl => {
        tabEl.addEventListener('show.bs.tab', function (event) {
            const targetPaneId = event.target.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetPaneId);

            if (targetPaneId === '#atividades-pane') {
                renderizarAcordeonPendencias(window.todasPendenciasAtividades);
            } else if (targetPaneId === '#materiais-pane') {
                renderizarTabelaPendentesMateriais();
            } else if (targetPaneId === '#complementares-pane') {
                renderizarTabelaPendentesComplementares(window.todasPendenciasComplementares);
            }
            // Abas de Histórico e CPS
            else if (targetPaneId === '#historico-atividades-pane') {
                if (targetPane.dataset.loaded !== 'true') carregarDadosHistoricoAtividades().finally(() => { targetPane.dataset.loaded = 'true'; });
            } else if (targetPaneId === '#historico-materiais-pane') {
                if (targetPane.dataset.loaded !== 'true') carregarDadosHistoricoMateriais().finally(() => { targetPane.dataset.loaded = 'true'; });
            } else if (targetPaneId === '#historico-complementares-pane') {
                if (targetPane.dataset.loaded !== 'true') carregarDadosHistoricoComplementares().finally(() => { targetPane.dataset.loaded = 'true'; });
            } else if (targetPaneId === '#cps-pendencias-pane') {
                initFiltrosCPS();
                carregarPendenciasCPS();
            } else if (targetPaneId === '#cps-historico-pane') {
                initFiltrosCPS();
                carregarHistoricoCPS();
            }
        });
    });

    // --- 3. Carregamento Inicial (Dashboard) ---
    const primeiraAba = document.querySelector('#aprovacoesTab .nav-link.active');
    if (primeiraAba) {
        const targetPaneId = primeiraAba.getAttribute('data-bs-target');
        toggleLoader(true, targetPaneId);
        
        carregarDashboardEBadges().finally(() => {
            toggleLoader(false, targetPaneId);
            // Renderiza a aba ativa com os dados frescos
            if (targetPaneId === '#atividades-pane') renderizarAcordeonPendencias(window.todasPendenciasAtividades);
            if (targetPaneId === '#materiais-pane') renderizarTabelaPendentesMateriais();
            if (targetPaneId === '#complementares-pane') renderizarTabelaPendentesComplementares(window.todasPendenciasComplementares);
        });
    }

    // --- 4. Listeners para Ações em Lote (Atividades) ---
    const accordionPendencias = document.getElementById('accordion-pendencias');
    if (accordionPendencias) {
        // Seleção de linhas
        accordionPendencias.addEventListener('change', (e) => {
            if (e.target.classList.contains('linha-checkbox')) {
                // Atualiza estilo da linha
                const tr = e.target.closest('tr');
                if(tr) e.target.checked ? tr.classList.add('table-active') : tr.classList.remove('table-active');
                atualizarEstadoAcoesLote();
            } else if (e.target.classList.contains('selecionar-todos-acordeon')) {
                // Selecionar Todos do Grupo
                const isChecked = e.target.checked;
                const targetBodyId = e.target.dataset.targetBody;
                document.querySelectorAll(`#${targetBodyId} .linha-checkbox`).forEach(cb => {
                    cb.checked = isChecked;
                    const tr = cb.closest('tr');
                    if(tr) isChecked ? tr.classList.add('table-active') : tr.classList.remove('table-active');
                });
                atualizarEstadoAcoesLote();
            }
        });
        // Bloqueio de propagação de clique
        accordionPendencias.addEventListener('click', (e) => {
            if (e.target.closest('.check-container-header')) e.stopPropagation();
        });
    }

    // Botões de Ação em Lote (Atividades)
    document.getElementById('btn-aprovar-selecionados')?.addEventListener('click', () => {
        if(modalAprovar) { modalAprovar._element.dataset.acaoEmLote = 'true'; aprovarLancamento(null); }
    });
    document.getElementById('btn-recusar-selecionados')?.addEventListener('click', () => {
         const checkboxes = document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked');
         if(checkboxes.length === 0) return;
         
         const firstId = checkboxes[0].dataset.id;
         const lanc = window.todosOsLancamentosGlobais.find(l => l.id == firstId);
         
         if ((userRole === 'CONTROLLER' || userRole === 'ADMIN') && (lanc.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO' || lanc.situacaoAprovacao === 'PRAZO_VENCIDO')) {
             if(modalComentar) { modalComentar._element.dataset.acaoEmLote = 'true'; recusarPrazoController(null); }
         } else {
             if(modalRecusar) { modalRecusar._element.dataset.acaoEmLote = 'true'; recusarLancamento(null); }
         }
    });

    // --- 5. Listeners para CPS ---
    const accordionCPS = document.getElementById('accordionPendenciasCPS');
    if (accordionCPS) {
        accordionCPS.addEventListener('change', (e) => {
            if (e.target.classList.contains('cps-check')) {
                // Lógica de atualização dos botões de lote CPS está em aprovacoes-cps.js
                // Mas precisamos chamar a função. Vamos garantir que ela seja acessível ou usar evento customizado.
                if (typeof atualizarBotoesLoteCPS === 'function') atualizarBotoesLoteCPS();
            } else if (e.target.classList.contains('cps-select-all')) {
                const isChecked = e.target.checked;
                const targetBodyId = e.target.dataset.targetBody;
                document.querySelectorAll(`#${targetBodyId} .cps-check`).forEach(cb => cb.checked = isChecked);
                if (typeof atualizarBotoesLoteCPS === 'function') atualizarBotoesLoteCPS();
            }
        });
        accordionCPS.addEventListener('click', (e) => {
            if (e.target.closest('.check-container-header') || e.target.classList.contains('cps-select-all')) e.stopPropagation();
        });
    }

    // Listeners dos Botões de Ação CPS (Lote)
    document.getElementById('btn-fechar-selecionados-cps')?.addEventListener('click', () => {
        document.getElementById('cpsAcaoCoordenador').value = 'fechar';
        modalAlterarValorCPS._element.dataset.acaoEmLote = 'true';
        // ... (configuração visual do modal, ver código original)
        // Simplificando aqui, a lógica completa de UI deve estar em aprovacoes-cps.js ou aqui
        const modalTitle = document.querySelector('#modalAlterarValorCPS .modal-title');
        const btnConfirmar = document.getElementById('btnConfirmarAcaoCPS');
        const divCompetencia = document.getElementById('divCompetenciaCps');
        const inputValor = document.getElementById('cpsValorPagamentoInput');
        const inputJustificativa = document.getElementById('cpsJustificativaInput');

        modalTitle.innerHTML = '<i class="bi bi-check-all text-success me-2"></i>Fechar Lote';
        btnConfirmar.className = 'btn btn-success';
        btnConfirmar.textContent = "Confirmar Fechamento em Lote";
        divCompetencia.style.display = 'block';
        gerarOpcoesCompetencia();
        document.getElementById('cpsCompetenciaInput').required = true;
        inputValor.disabled = true; 
        inputValor.value = 'Manter Original';
        inputJustificativa.required = false;
        inputJustificativa.placeholder = "Observação para o lote (opcional)...";
        modalAlterarValorCPS.show();
    });

    // --- 6. Listeners de Submit dos Modais ---
    
    // Aprovar Lançamento (Individual/Lote)
    document.getElementById('btnConfirmarAprovacao')?.addEventListener('click', async function() {
        const isLote = modalAprovar._element.dataset.acaoEmLote === 'true';
        const ids = isLote 
            ? Array.from(document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked')).map(cb => cb.dataset.id)
            : [document.getElementById('aprovarLancamentoId').value];
        
        if (ids.length === 0) return;
        
        // Determina endpoint
        const lanc = window.todosOsLancamentosGlobais.find(l => l.id == ids[0]);
        let endpoint = '';
        if (lanc.situacaoAprovacao === 'PENDENTE_COORDENADOR') endpoint = '/lancamentos/lote/coordenador-aprovar';
        else if (lanc.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO') endpoint = '/lancamentos/lote/prazo/aprovar';
        else endpoint = '/lancamentos/lote/controller-aprovar';

        setButtonLoading(this, true);
        try {
            await fetchComAuth(`${API_BASE_URL}${endpoint}`, { method: 'POST', body: JSON.stringify({ lancamentoIds: ids, aprovadorId: userId }) });
            mostrarToast("Aprovado com sucesso!", "success");
            modalAprovar.hide();
            await carregarDashboardEBadges();
            renderizarAcordeonPendencias(window.todasPendenciasAtividades);
        } catch(e) { mostrarToast(e.message, 'error'); } 
        finally { setButtonLoading(this, false); delete modalAprovar._element.dataset.acaoEmLote; }
    });

    // Outros submits (Recusar, Comentar, etc) devem ser migrados da mesma forma.
    
    // --- 7. Inicialização do Scroll de Abas ---
    initScrollAbas();
});

function configurarVisibilidadePorRole() {
    // Mesma lógica do arquivo original para esconder/mostrar abas e botões
    const navs = ['nav-item-minhas-pendencias', 'nav-item-lancamentos', 'nav-item-pendentes', 'nav-item-paralisados', 'nav-item-historico'];
    navs.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'block'; });

    // Regras específicas (Manager, Coordinator, Controller)
    if (userRole === 'MANAGER') {
        ['atividades-tab', 'materiais-tab', 'complementares-tab', 'cps-pendencias-tab', 'cps-historico-tab'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.parentElement.style.display = 'none'; }
        });
        // Ativa histórico
        const histTab = document.getElementById('historico-atividades-tab');
        if(histTab) new bootstrap.Tab(histTab).show();
    }
}

function atualizarEstadoAcoesLote() {
    const checkboxes = document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked');
    const container = document.getElementById('acoes-lote-container');
    if (!container) return;
    
    container.classList.toggle('d-none', checkboxes.length === 0);
    if (checkboxes.length > 0) {
        document.getElementById('contador-aprovacao').textContent = checkboxes.length;
        document.getElementById('contador-recusa').textContent = checkboxes.length;
        document.getElementById('contador-prazo').textContent = checkboxes.length;
        
        // Verifica se pode mostrar os botões (mesmo status)
        const ids = Array.from(checkboxes).map(c => c.dataset.id);
        const lancs = window.todosOsLancamentosGlobais.filter(l => ids.includes(String(l.id)));
        const status = lancs[0]?.situacaoAprovacao;
        const allSame = lancs.every(l => l.situacaoAprovacao === status);
        
        const btns = ['btn-aprovar-selecionados', 'btn-recusar-selecionados', 'btn-solicitar-prazo-selecionados'];
        btns.forEach(id => document.getElementById(id).style.display = 'none');
        
        if (allSame) {
            // Lógica de exibição de botões baseada no status e role (igual ao original)
            if (['COORDINATOR', 'ADMIN'].includes(userRole) && status === 'PENDENTE_COORDENADOR') {
                btns.forEach(id => document.getElementById(id).style.display = 'inline-block');
            } else if (['CONTROLLER', 'ADMIN'].includes(userRole)) {
                if (status === 'PENDENTE_CONTROLLER') {
                    document.getElementById('btn-aprovar-selecionados').style.display = 'inline-block';
                    document.getElementById('btn-recusar-selecionados').style.display = 'inline-block';
                }
            }
        }
    }
}

function initScrollAbas() {
    const tabsList = document.getElementById('aprovacoesTab');
    const btnLeft = document.getElementById('btnScrollLeft');
    const btnRight = document.getElementById('btnScrollRight');
    if(tabsList && btnLeft && btnRight) {
        btnLeft.addEventListener('click', () => tabsList.scrollBy({ left: -300, behavior: 'smooth' }));
        btnRight.addEventListener('click', () => tabsList.scrollBy({ left: 300, behavior: 'smooth' }));
    }
}