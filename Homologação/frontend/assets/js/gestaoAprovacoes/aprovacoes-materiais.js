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

        // Removida a chamada para popularFiltroSegmento()

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

        renderizarTabelaHistoricoMateriais();
    } catch (error) {
        console.error("Erro ao carregar dados de histórico de materiais:", error);
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#historico-materiais-pane');
    }
}

function renderizarTabelaPendentesMateriais() {
    const tbody = document.getElementById('tbody-pendentes-materiais');
    const thead = document.getElementById('thead-pendentes-materiais');

    if (!tbody || !thead) return;

    // Cabeçalho fixo
    thead.innerHTML = `
        <tr>
            <th class="text-center">Ações</th>
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
            <th class="text-center">Status</th>
        </tr>
    `;

    // REMOVIDA A LEITURA DO FILTRO. Exibe tudo direto.
    const solicitacoes = window.todasPendenciasMateriais || [];

    tbody.innerHTML = '';

    if (solicitacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">Nenhuma pendência de material.</td></tr>`;
        return;
    }

    solicitacoes.forEach(s => {
        const item = s.itens[0];
        if (!item) return;
        const tr = document.createElement('tr');

        let acoesHtml = '';
        let statusBadgeClass = 'text-bg-secondary';
        let statusTexto = s.status ? s.status.replace(/_/g, ' ') : 'N/A';

        if (s.status === 'PENDENTE_COORDENADOR') statusBadgeClass = 'text-bg-info';
        else if (s.status === 'PENDENTE_CONTROLLER') statusBadgeClass = 'text-bg-warning';

        const statusHtml = `<span class="badge rounded-pill ${statusBadgeClass}">${statusTexto}</span>`;

        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            if (s.status === 'PENDENTE_CONTROLLER') {
                acoesHtml = `<button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarMaterial(${s.id})"><i class="bi bi-check-lg"></i></button>
                             <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarMaterial(${s.id})"><i class="bi bi-x-lg"></i></button>`;
            } else {
                acoesHtml = `<span class="text-muted" style="font-size: 0.8rem;">Aguardando Coord.</span>`;
            }
        } else if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
            if (s.status === 'PENDENTE_COORDENADOR') {
                acoesHtml = `<button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarMaterial(${s.id})"><i class="bi bi-check-lg"></i></button>
                             <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarMaterial(${s.id})"><i class="bi bi-x-lg"></i></button>`;
            } else {
                acoesHtml = `<span class="text-muted" style="font-size: 0.8rem;">Em análise</span>`;
            }
        }

        tr.innerHTML = `
            <td class="text-center">${acoesHtml}</td>
            <td>${new Date(s.dataSolicitacao).toLocaleString('pt-BR')}</td>
            <td>${s.nomeSolicitante || 'N/A'}</td>
            <td>${s.os.os}</td>
            <td>${s.os.segmento ? s.os.segmento.nome : 'N/A'}</td>
            <td>${s.lpu.codigoLpu}</td>
            <td>${item.material.descricao}</td>
            <td class="text-center">${item.material.unidadeMedida}</td>
            <td class="text-center">${item.quantidadeSolicitada}</td>
            <td class="text-center">${item.material.saldoFisico}</td>
            <td>${s.justificativa || ''}</td>
            <td class="text-center">${statusHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarTabelaHistoricoMateriais() {
    const tbody = document.getElementById('tbody-historico-materiais');
    if (!tbody) return;

    // Remove filtros se houver (conforme solicitado anteriormente)
    const solicitacoes = window.todosHistoricoMateriais || [];

    const thead = tbody.previousElementSibling;

    // Cabeçalho da Tabela de Histórico
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
        <th>Justificativa / Histórico</th> 
    </tr>`;
    tbody.innerHTML = '';

    if (!solicitacoes || solicitacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="text-center text-muted">Nenhum histórico encontrado.</td></tr>`;
        return;
    }

    solicitacoes.sort((a, b) => {
        const dateA = new Date(a.dataAcaoController || a.dataAcaoCoordenador || a.dataSolicitacao);
        const dateB = new Date(b.dataAcaoController || b.dataAcaoCoordenador || b.dataSolicitacao);
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

        // Monta o texto de justificativa + comentários
        let textoHistorico = s.justificativa || '';
        
        // Se houver comentários (vindos do novo DTO), adiciona-os
        if (s.comentarios && s.comentarios.length > 0) {
            if (textoHistorico) textoHistorico += '\n\n';
            s.comentarios.forEach(c => {
                const dataComentario = new Date(c.dataHora).toLocaleDateString('pt-BR');
                textoHistorico += `[${dataComentario} - ${c.autor}]: ${c.texto}\n`;
            });
        }
        if (!textoHistorico) textoHistorico = '-';

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
        <td data-label="Justificativa" style="white-space: pre-wrap; font-size: 0.85rem; min-width: 200px;">${textoHistorico}</td>
    `;
        tbody.appendChild(tr);
    });
}