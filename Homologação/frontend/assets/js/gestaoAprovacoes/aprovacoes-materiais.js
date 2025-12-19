// ==========================================================
// LÓGICA DE APROVAÇÃO DE MATERIAIS
// ==========================================================

let selecionadosMateriais = [];

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
    const acoesLoteContainer = document.getElementById('acoes-lote-container');

    if (!tbody || !thead) return;

    // Resetar seleção ao renderizar
    selecionadosMateriais = [];
    atualizarUISelecao();

    // Verifica se usuário pode ver checkboxes (apenas Coordenador ou Admin/Controller dependendo da regra)
    // Pela sua regra atual, Coordenador vê pendentes coordenador.
    const podeAprovar = (userRole === 'COORDINATOR' || userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'CONTROLLER');

    // Cabeçalho com Checkbox "Selecionar Todos"
    thead.innerHTML = `
        <tr>
            ${podeAprovar ? '<th class="text-center"><input type="checkbox" id="check-all-materiais" onclick="toggleAllMateriais(this)"></th>' : ''}
            <th class="text-center">Ações Individuais</th>
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

    const solicitacoes = window.todasPendenciasMateriais || [];
    tbody.innerHTML = '';

    if (solicitacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="text-center text-muted">Nenhuma pendência de material.</td></tr>`;
        if (acoesLoteContainer) acoesLoteContainer.classList.add('d-none');
        return;
    }

    solicitacoes.forEach(s => {
        const item = s.itens[0];
        if (!item) return;
        const tr = document.createElement('tr');

        let acoesHtml = '';
        let statusBadgeClass = 'text-bg-secondary';
        let statusTexto = s.status ? s.status.replace(/_/g, ' ') : 'N/A';
        let checkboxHtml = '';

        // Definição de Cores e botões individuais (mantendo lógica original)
        if (s.status === 'PENDENTE_COORDENADOR') statusBadgeClass = 'text-bg-info';
        else if (s.status === 'PENDENTE_CONTROLLER') statusBadgeClass = 'text-bg-warning';

        const statusHtml = `<span class="badge rounded-pill ${statusBadgeClass}">${statusTexto}</span>`;

        // Lógica de visualização de botões e Checkbox baseada no status e role
        let rowHabilitadaParaLote = false;

        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            if (s.status === 'PENDENTE_CONTROLLER') {
                acoesHtml = getBotoesAcao(s.id);
                rowHabilitadaParaLote = false; // Focando no pedido do Coordenador primeiro, mas pode habilitar aqui se quiser
            } else {
                acoesHtml = `<span class="text-muted small">Aguardando Coord.</span>`;
            }
        } else if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
            if (s.status === 'PENDENTE_COORDENADOR') {
                acoesHtml = getBotoesAcao(s.id);
                rowHabilitadaParaLote = true;
            } else {
                acoesHtml = `<span class="text-muted small">Em análise</span>`;
            }
        }

        // Renderiza checkbox apenas se a linha for "aprovável" pelo usuário atual
        if (podeAprovar) {
            if (rowHabilitadaParaLote) {
                checkboxHtml = `<td class="text-center"><input type="checkbox" class="form-check-input check-material-item" value="${s.id}" onchange="toggleMaterialItem(${s.id})"></td>`;
            } else {
                checkboxHtml = `<td class="text-center"><input type="checkbox" class="form-check-input" disabled></td>`;
            }
        }

        tr.innerHTML = `
            ${checkboxHtml}
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

function getBotoesAcao(id) {
    return `<button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarMaterial(${id})"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarMaterial(${id})"><i class="bi bi-x-lg"></i></button>`;
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

// --- LÓGICA DE SELEÇÃO E LOTE ---

function toggleAllMateriais(source) {
    const checkboxes = document.querySelectorAll('.check-material-item');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
        atualizarArraySelecao(cb.value, cb.checked);
    });
    atualizarUISelecao();
}

function toggleMaterialItem(id) {
    // O array é atualizado onchange direto no input ou podemos varrer aqui
    // Vamos garantir a sincronia varrendo os marcados
    const checkbox = document.querySelector(`.check-material-item[value="${id}"]`);
    atualizarArraySelecao(id, checkbox.checked);
    atualizarUISelecao();
}

function atualizarArraySelecao(id, checked) {
    id = parseInt(id);
    if (checked) {
        if (!selecionadosMateriais.includes(id)) selecionadosMateriais.push(id);
    } else {
        selecionadosMateriais = selecionadosMateriais.filter(item => item !== id);
    }
}

function atualizarUISelecao() {
    const container = document.getElementById('acoes-lote-container');
    const contador = document.getElementById('contador-selecionados');

    if (!container) return;

    if (selecionadosMateriais.length > 0) {
        container.classList.remove('d-none');
        if (contador) contador.innerText = `${selecionadosMateriais.length} selecionados`;
    } else {
        container.classList.add('d-none');
    }
}

// --- FUNÇÕES DE API PARA LOTE ---

async function aprovarLoteMateriais() {
    if (selecionadosMateriais.length === 0) return;

    if (!confirm(`Confirma a aprovação de ${selecionadosMateriais.length} solicitações?`)) return;

    toggleLoader(true, '#materiais-pane');

    try {
        const body = {
            ids: selecionadosMateriais,
            aprovadorId: userId,
            observacao: null
        };

        // Define a URL baseada na Role (se futuramente implementar Controller também)
        let endpoint = '';
        if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
            endpoint = `${API_BASE_URL}/solicitacoes/coordenador/aprovar-lote`;
        } else {
            // Caso queira implementar para controller depois
            throw new Error("Aprovação em lote disponível apenas para Coordenadores no momento.");
        }

        const response = await fetchComAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error("Erro ao processar aprovação em lote.");

        mostrarToast("Solicitações aprovadas com sucesso!", "success");
        await carregarDadosMateriais(); // Recarrega a tabela

    } catch (error) {
        console.error(error);
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#materiais-pane');
    }
}

async function rejeitarLoteMateriais() {
    if (selecionadosMateriais.length === 0) return;

    const motivo = prompt("Digite o motivo para rejeitar as solicitações selecionadas:");
    if (motivo === null) return; // Cancelou
    if (!motivo.trim()) {
        mostrarToast("O motivo é obrigatório para rejeição.", "warning");
        return;
    }

    toggleLoader(true, '#materiais-pane');

    try {
        const body = {
            ids: selecionadosMateriais,
            aprovadorId: userId,
            observacao: motivo
        };

        let endpoint = '';
        if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
            endpoint = `${API_BASE_URL}/solicitacoes/coordenador/rejeitar-lote`;
        } else {
            throw new Error("Rejeição em lote disponível apenas para Coordenadores no momento.");
        }

        const response = await fetchComAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error("Erro ao processar rejeição em lote.");

        mostrarToast("Solicitações rejeitadas com sucesso!", "success");
        await carregarDadosMateriais();

    } catch (error) {
        console.error(error);
        mostrarToast(error.message, 'error');
    } finally {
        toggleLoader(false, '#materiais-pane');
    }
}