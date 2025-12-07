// ==========================================================
// LÓGICA DE APROVAÇÃO DE MATERIAIS
// ==========================================================

async function carregarDadosMateriais() {
    const tbodyPendentesMateriais = document.getElementById('tbody-pendentes-materiais');
    if (!tbodyPendentesMateriais) return;
    
    toggleLoader(true, '#materiais-pane');
    
    try {
        const pendentesResponse = await fetchComAuth(`${API_BASE_URL}/solicitacoes/pendentes`, {
            headers: { 'X-User-Role': userRole, 'X-User-ID': userId }
        });
        if (!pendentesResponse.ok) throw new Error('Falha ao carregar pendências de materiais.');
        window.todasPendenciasMateriais = await pendentesResponse.json();

        // Popula filtro se necessário
        const filtro = document.getElementById('filtro-segmento-materiais');
        if (filtro && filtro.options.length <= 1) {
            popularFiltroSegmento();
        }

        renderizarTabelaPendentesMateriais(); 

    } catch (error) {
        console.error("Erro ao carregar dados de materiais:", error);
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#materiais-pane');
    }
}

async function carregarDadosHistoricoMateriais() {
    const tbodyHistoricoMateriais = document.getElementById('tbody-historico-materiais');
    if (!tbodyHistoricoMateriais) return;
    
    toggleLoader(true, '#historico-materiais-pane');
    try {
        const historicoResponse = await fetchComAuth(`${API_BASE_URL}/solicitacoes/historico/${userId}`);
        if (!historicoResponse.ok) throw new Error('Falha ao carregar histórico de materiais.');
        window.todosHistoricoMateriais = await historicoResponse.json();

        const filtro = document.getElementById('filtro-segmento-materiais');
        if (filtro && filtro.options.length <= 1) {
            popularFiltroSegmento();
        }

        renderizarTabelaHistoricoMateriais();
    } catch (error) {
        console.error("Erro ao carregar dados de histórico de materiais:", error);
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#historico-materiais-pane');
    }
}

function popularFiltroSegmento() {
    const filtro = document.getElementById('filtro-segmento-materiais');
    if (!filtro) return;

    const segmentos = new Set();
    (window.todasPendenciasMateriais || []).forEach(s => {
        if (s.os.segmento) segmentos.add(JSON.stringify(s.os.segmento));
    });
    (window.todosHistoricoMateriais || []).forEach(s => {
        if (s.os.segmento) segmentos.add(JSON.stringify(s.os.segmento));
    });

    filtro.innerHTML = '<option value="todos">Todos os Segmentos</option>';

    Array.from(segmentos)
        .map(s => JSON.parse(s))
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .forEach(segmento => {
            const option = new Option(segmento.nome, segmento.id);
            filtro.add(option);
        });
}

function renderizarTabelaPendentesMateriais() {
    const tbody = document.getElementById('tbody-pendentes-materiais');
    if (!tbody) return;

    const filtroSegmento = document.getElementById('filtro-segmento-materiais');
    const filtroId = filtroSegmento ? filtroSegmento.value : 'todos';
    
    const solicitacoes = filtroId === 'todos'
        ? window.todasPendenciasMateriais
        : window.todasPendenciasMateriais.filter(s => s.os.segmento && s.os.segmento.id == filtroId);

    const thead = tbody.previousElementSibling;
    thead.innerHTML = '';
    tbody.innerHTML = '';

    let colunasHtml = `
        <th>Ações</th>
        <th>Data Solicitação</th>
        <th>Solicitante</th>
        <th>OS</th>
        <th>Segmento</th>
        <th>LPU</th>
        <th>Item Solicitado</th>
        <th class="text-center">Unidade</th>
        <th class="text-center">Qtd. Solicitada</th>
        <th class="text-center">Qtd. em Estoque</th>
        <th>Justificativa</th>
    `;
    if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
        colunasHtml += '<th>Status</th>';
    }
    thead.innerHTML = `<tr>${colunasHtml}</tr>`;

    const colspan = userRole === 'CONTROLLER' ? 12 : 11;
    if (!solicitacoes || solicitacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-muted">Nenhuma pendência de material.</td></tr>`;
        return;
    }

    solicitacoes.forEach(s => {
        const item = s.itens[0];
        if (!item) return;

        const tr = document.createElement('tr');
        let acoesHtml = '';
        let statusHtml = '';

        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            if (s.status === 'PENDENTE_CONTROLLER') {
                acoesHtml = `
            <button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarMaterial(${s.id})"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarMaterial(${s.id})"><i class="bi bi-x-lg"></i></button>`;
                statusHtml = `<span class="badge rounded-pill text-bg-warning">PENDENTE CONTROLLER</span>`;
            } else {
                acoesHtml = `—`;
                statusHtml = `<span class="badge rounded-pill text-bg-info">PENDENTE COORDENADOR</span>`;
            }
        } else if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
            acoesHtml = `
        <button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarMaterial(${s.id})"><i class="bi bi-check-lg"></i></button>
        <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarMaterial(${s.id})"><i class="bi bi-x-lg"></i></button>`;
        }

        tr.innerHTML = `
            <td data-label="Ações" class="text-center">${acoesHtml}</td>
            <td data-label="Data">${new Date(s.dataSolicitacao).toLocaleString('pt-BR')}</td>
            <td data-label="Solicitante">${s.nomeSolicitante || 'N/A'}</td>
            <td data-label="OS">${s.os.os}</td>
            <td data-label="Segmento">${s.os.segmento ? s.os.segmento.nome : 'N/A'}</td>
            <td data-label="LPU">${s.lpu.codigoLpu}</td>
            <td data-label="Item Solicitado">${item.material.descricao}</td>
            <td data-label="Unidade" class="text-center">${item.material.unidadeMedida}</td>
            <td data-label="Qtd. Solicitada" class="text-center">${item.quantidadeSolicitada}</td>
            <td data-label="Qtd. em Estoque" class="text-center">${item.material.saldoFisico}</td>
            <td data-label="Justificativa">${s.justificativa || ''}</td>
            ${(userRole === 'CONTROLLER' || userRole === 'ADMIN') ? `<td data-label="Status">${statusHtml}</td>` : ''}
        `;
        tbody.appendChild(tr);
    });
}

function renderizarTabelaHistoricoMateriais() {
    const tbody = document.getElementById('tbody-historico-materiais');
    if (!tbody) return;

    const filtroSegmento = document.getElementById('filtro-segmento-materiais');
    const filtroId = filtroSegmento ? filtroSegmento.value : 'todos';
    
    const solicitacoes = filtroId === 'todos'
        ? window.todosHistoricoMateriais
        : window.todosHistoricoMateriais.filter(s => s.os.segmento && s.os.segmento.id == filtroId);

    const thead = tbody.previousElementSibling;
    thead.innerHTML = `
    <tr>
        <th>Data Ação</th>
        <th>Status</th>
        <th>Data Solicitação</th>
        <th>Solicitante</th>
        <th>OS</th>
        <th>Segmento</th>
        <th>LPU</th>
        <th>Item Solicitado</th>
        <th class="text-center">Unidade</th>
        <th class="text-center">Qtd. Solicitada</th>
        <th>Aprovador</th>
        <th>Motivo Recusa</th>
    </tr>`;
    tbody.innerHTML = '';

    if (!solicitacoes || solicitacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">Nenhum histórico encontrado.</td></tr>`;
        return;
    }

    solicitacoes.sort((a, b) => {
        const dateA = new Date(a.dataAcaoController || a.dataAcaoCoordenador);
        const dateB = new Date(b.dataAcaoController || b.dataAcaoCoordenador);
        return dateB - dateA;
    });

    solicitacoes.forEach(s => {
        const item = s.itens[0];
        if (!item) return;

        const tr = document.createElement('tr');
        const statusBadge = s.status === 'APROVADA'
            ? `<span class="badge bg-success">${s.status}</span>`
            : `<span class="badge bg-danger">${s.status}</span>`;

        const dataAcao = s.dataAcaoController || s.dataAcaoCoordenador;
        const dataAcaoFormatada = dataAcao ? new Date(dataAcao).toLocaleString('pt-BR') : 'Pendente';
        const nomeAprovador = s.nomeAprovadorController || s.nomeAprovadorCoordenador;

        tr.innerHTML = `
        <td data-label="Data Ação">${dataAcaoFormatada}</td>
        <td data-label="Status">${statusBadge}</td>
        <td data-label="Data Solicitação">${new Date(s.dataSolicitacao).toLocaleString('pt-BR')}</td>
        <td data-label="Solicitante">${s.nomeSolicitante || 'N/A'}</td>
        <td data-label="OS">${s.os.os}</td>
        <td data-label="Segmento">${s.os.segmento ? s.os.segmento.nome : 'N/A'}</td>
        <td data-label="LPU">${s.lpu.codigoLpu}</td>
        <td data-label="Item Solicitado">${item.material.descricao}</td>
        <td data-label="Unidade" class="text-center">${item.material.unidadeMedida}</td>
        <td data-label="Qtd. Solicitada" class="text-center">${item.quantidadeSolicitada}</td>
        <td data-label="Aprovador">${nomeAprovador || 'N/A'}</td>
        <td data-label="Motivo Recusa">${s.motivoRecusa || '—'}</td>
    `;
        tbody.appendChild(tr);
    });
}

// Handlers do Modal
window.aprovarMaterial = function(id) {
    if (!modalAprovarMaterial) return;
    const btn = document.getElementById('btnConfirmarAprovacaoMaterial');
    btn.dataset.id = id;
    modalAprovarMaterial.show();
};

window.recusarMaterial = function(id) {
    if (!modalRecusarMaterial) return;
    const form = document.getElementById('formRecusarMaterial');
    form.dataset.id = id;
    form.reset();
    modalRecusarMaterial.show();
};