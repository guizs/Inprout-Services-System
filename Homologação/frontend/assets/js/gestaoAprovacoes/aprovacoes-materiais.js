// ==========================================================
// LÓGICA DE APROVAÇÃO DE MATERIAIS
// ==========================================================

let selecionadosMateriais = [];
window.aprovarLoteMateriais = aprovarLoteMateriais;
window.rejeitarLoteMateriais = rejeitarLoteMateriais;
window.confirmarAprovacaoLoteMateriais = confirmarAprovacaoLoteMateriais;
window.confirmarRejeicaoLoteMateriais = confirmarRejeicaoLoteMateriais;

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
    const acoesLoteContainer = document.getElementById('acoes-lote-materiais-container');

    if (!tbody || !thead) return;

    // Resetar seleção ao renderizar
    selecionadosMateriais = [];

    // Força a atualização da UI para garantir que os botões sumam ao recarregar
    if (acoesLoteContainer) acoesLoteContainer.classList.add('d-none');

    const podeAprovar = (userRole === 'COORDINATOR' || userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'CONTROLLER');

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

        if (s.status === 'PENDENTE_COORDENADOR') statusBadgeClass = 'text-bg-info';
        else if (s.status === 'PENDENTE_CONTROLLER') statusBadgeClass = 'text-bg-warning';

        const statusHtml = `<span class="badge rounded-pill ${statusBadgeClass}">${statusTexto}</span>`;

        let rowHabilitadaParaLote = false;

        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            if (s.status === 'PENDENTE_CONTROLLER') {
                acoesHtml = getBotoesAcao(s.id);
                rowHabilitadaParaLote = false;
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

        if (podeAprovar) {
            if (rowHabilitadaParaLote) {
                // CORREÇÃO AQUI: Passamos 'this' para a função toggleMaterialItem
                checkboxHtml = `<td class="text-center"><input type="checkbox" class="form-check-input check-material-item" value="${s.id}" onchange="toggleMaterialItem(this, ${s.id})"></td>`;
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

    const solicitacoes = window.todosHistoricoMateriais || [];
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

        let textoHistorico = s.justificativa || '';

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

// Expor funções globalmente para serem acessadas pelo HTML (Evita erro "not defined")
window.toggleAllMateriais = toggleAllMateriais;
window.toggleMaterialItem = toggleMaterialItem;
window.aprovarLoteMateriais = aprovarLoteMateriais;
window.rejeitarLoteMateriais = rejeitarLoteMateriais;

function toggleAllMateriais(source) {
    console.log("Selecionar todos:", source.checked);
    const checkboxes = document.querySelectorAll('.check-material-item');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
        // Pega o ID direto do value
        atualizarArraySelecao(cb.value, cb.checked);
    });
    atualizarUISelecao();
}

// Atualizado para receber o elemento 'source' (this) e evitar busca falha no DOM
function toggleMaterialItem(source, id) {
    console.log(`Toggle Item ID: ${id}, Checked: ${source.checked}`);
    atualizarArraySelecao(id, source.checked);
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
    const container = document.getElementById('acoes-lote-materiais-container');
    const contador = document.getElementById('contador-selecionados');

    console.log("Atualizando UI. Selecionados:", selecionadosMateriais.length);

    if (!container) {
        console.error("Container de ações em lote não encontrado!");
        return;
    }

    if (selecionadosMateriais.length > 0) {
        // 1. Remove a classe que esconde
        container.classList.remove('d-none');
        
        // 2. FORÇA o display flex via estilo direto (Isso garante que apareça)
        container.style.display = 'flex';
        container.style.alignItems = 'center'; // Alinha verticalmente o texto e botões
        
        if (contador) contador.innerText = `${selecionadosMateriais.length} selecionados`;
    } else {
        // Esconde novamente
        container.classList.add('d-none');
        container.style.display = 'none'; 
    }
}

// --- FUNÇÕES DE API PARA LOTE ---

function aprovarLoteMateriais() {
    if (selecionadosMateriais.length === 0) return;

    // Atualiza o texto do modal com a quantidade
    const spanQtd = document.getElementById('qtd-aprovar-materiais');
    if (spanQtd) spanQtd.innerText = selecionadosMateriais.length;

    // Abre o modal do Bootstrap
    const modalEl = document.getElementById('modalAprovarLoteMateriais');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

async function confirmarAprovacaoLoteMateriais() {
    // Fecha o modal
    const modalEl = document.getElementById('modalAprovarLoteMateriais');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    toggleLoader(true, '#materiais-pane');

    try {
        const body = {
            ids: selecionadosMateriais,
            aprovadorId: userId,
            observacao: null
        };

        let endpoint = '';
        if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
            endpoint = `${API_BASE_URL}/solicitacoes/coordenador/aprovar-lote`;
        } else {
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

function rejeitarLoteMateriais() {
    if (selecionadosMateriais.length === 0) return;

    // Atualiza quantidade e limpa o campo de texto
    const spanQtd = document.getElementById('qtd-rejeitar-materiais');
    if (spanQtd) spanQtd.innerText = selecionadosMateriais.length;
    
    document.getElementById('motivoRejeicaoLoteMateriais').value = '';

    // Abre o modal
    const modalEl = document.getElementById('modalRejeitarLoteMateriais');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// 4. Função chamada ao clicar em "Confirmar" DENTRO do modal de Rejeição
async function confirmarRejeicaoLoteMateriais() {
    const motivo = document.getElementById('motivoRejeicaoLoteMateriais').value;

    if (!motivo || !motivo.trim()) {
        mostrarToast("O motivo é obrigatório para rejeição.", "warning");
        return;
    }

    // Fecha o modal
    const modalEl = document.getElementById('modalRejeitarLoteMateriais');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

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