// ==========================================================
// LÓGICA ESPECÍFICA DA ABA DE DOCUMENTAÇÃO (CORRIGIDO v3.0)
// ==========================================================

let chartCarteiraInstance = null;

async function initDocumentacaoTab() {
    // 1. Carrega o combo de documentistas (apenas se for ADMIN/CONTROLLER)
    // Precisamos definir essa função antes de chamar ou garantir que ela exista no arquivo.
    if (typeof carregarComboDocumentistas === 'function') {
        await carregarComboDocumentistas();
    }

    // Listener dos filtros de status (Radio Buttons)
    document.querySelectorAll('input[name="filtroDocStatus"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            handleFiltroChange(e.target.value);
        });
    });

    // Botão Atualizar
    document.getElementById('btn-atualizar-docs')?.addEventListener('click', async () => {
        // Usa o loader global
        toggleLoader(true, '#minhas-docs-pane');
        try {
            // Verifica qual usuário está selecionado no filtro (ou o logado)
            const selectDoc = document.getElementById('filtro-documentista-carteira');
            const userId = (selectDoc && selectDoc.value) ? selectDoc.value : localStorage.getItem('usuarioId');

            // Atualiza Dashboard Global (se a função existir no main.js)
            if (typeof carregarDashboardEBadges === 'function') {
                await carregarDashboardEBadges(); 
            }
            
            // Atualiza Carteira (Gráfico e Valores)
            await carregarCarteiraDoc();

            // Recarrega a lista de lançamentos
            // Nota: O endpoint de carteira as vezes traz apenas totais. 
            // Se você precisar da LISTA de itens, garanta que está buscando a lista correta.
            // Aqui assumimos que o 'carregarDashboardEBadges' ou lógica similar popula 'window.minhasDocsPendentes'
            // Se não, você pode forçar uma busca aqui:
            // const res = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${userId}`);
            
            // Reseta para o filtro 'TODOS' ao atualizar visualmente
            const filtroTodos = document.getElementById('filtroDocTodos');
            if (filtroTodos) filtroTodos.checked = true;
            
            filtrarERenderizarDocs();

        } catch (error) {
            console.error(error);
        } finally {
            toggleLoader(false, '#minhas-docs-pane');
        }
    });

    // Carregamento inicial
    carregarCarteiraDoc();
    filtrarERenderizarDocs(); 
}

/**
 * Carrega a lista de usuários 'DOCUMENTIST' no select para o ADMIN filtrar
 */
async function carregarComboDocumentistas() {
    const role = localStorage.getItem('userRole');
    const container = document.getElementById('container-filtro-documentista');
    const select = document.getElementById('filtro-documentista-carteira');

    // Se não tiver permissão ou os elementos não existirem, aborta
    if (!['ADMIN', 'CONTROLLER', 'MANAGER'].includes(role)) {
        return;
    }
    if (!container || !select) return;

    container.classList.remove('d-none'); // Mostra o filtro

    try {
        // Busca usuários
        const response = await fetchComAuth(`${API_BASE_URL}/usuarios`); 
        const usuarios = await response.json();

        // Filtra Documentistas
        const documentistas = usuarios.filter(u => u.role === 'DOCUMENTIST');

        // Limpa e popula o select
        select.innerHTML = '<option value="">Minha Carteira (Padrão)</option>';
        documentistas.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.nome || doc.email;
            select.appendChild(option);
        });

        // Listener: Ao trocar o documentista, simula o clique no botão Atualizar
        select.addEventListener('change', () => {
            const btnAtualizar = document.getElementById('btn-atualizar-docs');
            if (btnAtualizar) btnAtualizar.click();
        });

    } catch (e) {
        console.error("Erro ao carregar combo de documentistas", e);
    }
}

/**
 * Controla a mudança de filtros de STATUS (Pendente, Em Análise, Histórico)
 */
async function handleFiltroChange(filtro) {
    toggleLoader(true, '#minhas-docs-pane');

    try {
        if (filtro === 'HISTORICO') {
            await carregarHistoricoDocs();
        } else {
            // Usa a lista que já está em memória (Pendentes e Em Análise)
            filtrarERenderizarDocs();
        }
    } catch (e) {
        console.error("Erro ao filtrar", e);
    } finally {
        toggleLoader(false, '#minhas-docs-pane');
    }
}

/**
 * Busca o histórico dos últimos 2 meses
 */
async function carregarHistoricoDocs() {
    // Verifica filtro de documentista
    const selectDoc = document.getElementById('filtro-documentista-carteira');
    const userId = (selectDoc && selectDoc.value) ? selectDoc.value : localStorage.getItem('usuarioId');
    
    // Datas: Hoje e 2 meses atrás
    const fim = new Date().toISOString().split('T')[0];
    const inicioDate = new Date();
    inicioDate.setMonth(inicioDate.getMonth() - 2);
    const inicio = inicioDate.toISOString().split('T')[0];

    try {
        const url = `${API_BASE_URL}/lancamentos/documentacao/historico-lista?usuarioId=${userId}&inicio=${inicio}&fim=${fim}`;
        
        const response = await fetchComAuth(url);
        const historico = await response.json();
        
        // Filtra apenas os finalizados para exibir na tabela de histórico
        const historicoDoc = historico.filter(l => 
            l.statusDocumentacao === 'FINALIZADO' || 
            l.statusDocumentacao === 'FINALIZADO_COM_RESSALVA'
        );
        
        renderizarTabelaDocsVisual(historicoDoc);
        
    } catch (error) {
        console.error("Erro ao carregar histórico", error);
        mostrarToast("Erro ao buscar histórico.", "error");
    }
}

/**
 * Carrega os valores da carteira (Dashboard Financeiro da Aba)
 */
async function carregarCarteiraDoc() {
    let userId = localStorage.getItem('usuarioId');

    // SELETOR DE DOCUMENTISTA (Para Admin/Controller)
    const selectDoc = document.getElementById('filtro-documentista-carteira');
    if (selectDoc && selectDoc.value) {
        userId = selectDoc.value;
    }

    if (!userId) return;

    try {
        const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${userId}`);
        const carteira = await response.json();

        // Atualiza Cards de Valores
        if (document.getElementById('doc-carteira-previsto')) document.getElementById('doc-carteira-previsto').innerText = formatarMoeda(carteira.totalPrevisto);
        if (document.getElementById('doc-carteira-finalizado')) document.getElementById('doc-carteira-finalizado').innerText = formatarMoeda(carteira.totalFinalizado);
        if (document.getElementById('doc-carteira-total')) document.getElementById('doc-carteira-total').innerText = formatarMoeda(carteira.totalGeral);

        renderizarGraficoCarteira(carteira.historicoMensal);
    } catch (error) { console.error(error); }
}

/**
 * Filtra a lista global `window.minhasDocsPendentes` e renderiza
 */
function filtrarERenderizarDocs() {
    let listaCompleta = window.minhasDocsPendentes || [];
    
    // 1. Filtra pelo Documentista Selecionado (se houver filtro ativo e a lista tiver essa info)
    const selectDoc = document.getElementById('filtro-documentista-carteira');
    if (selectDoc && selectDoc.value) {
        const idAlvo = selectDoc.value;
        // Filtra itens onde item.documentista.id == idAlvo (ou item.documentistaId)
        listaCompleta = listaCompleta.filter(l => {
            // Verifica estrutura do objeto (pode vir como objeto ou id direto)
            const docId = l.documentista ? l.documentista.id : l.documentistaId;
            return String(docId) === String(idAlvo);
        });
    } else {
        // Se NÃO tem filtro selecionado e sou ADMIN, talvez eu queira ver MINHA carteira ou TUDO?
        // Se a lógica padrão for "Minha Carteira", mantemos.
        // Se o Admin não tiver carteira, a lista pode vir vazia, o que é correto.
        // Se quiser ver TUDO quando vazio, não fazemos filtro extra aqui.
    }

    // 2. Filtra pelo Status (Radio Buttons)
    const filtroEl = document.querySelector('input[name="filtroDocStatus"]:checked');
    const filtro = filtroEl ? filtroEl.value : 'TODOS';

    // Se for histórico, a função handleFiltroChange já cuidou disso.
    if (filtro === 'HISTORICO') return;

    let listaFiltrada = listaCompleta;

    if (filtro === 'EM_ANALISE') {
        listaFiltrada = listaCompleta.filter(l => l.statusDocumentacao === 'EM_ANALISE');
    } else if (filtro === 'PENDENTE_RECEBIMENTO') {
        listaFiltrada = listaCompleta.filter(l => l.statusDocumentacao === 'PENDENTE_RECEBIMENTO');
    }

    renderizarTabelaDocsVisual(listaFiltrada);
}

function renderizarTabelaDocsVisual(lista) {
    const tbody = document.getElementById('tbody-minhas-docs');
    const msgVazio = document.getElementById('msg-sem-docs');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        if (msgVazio) msgVazio.classList.remove('d-none');
        if (msgVazio) msgVazio.classList.add('d-block');
        return;
    } else {
        if (msgVazio) msgVazio.classList.add('d-none');
        if (msgVazio) msgVazio.classList.remove('d-block');
    }

    lista.forEach(l => {
        const slaInfo = calcularSlaVisual(l.dataPrazoDoc);

        // Item (LPU ou OS)
        let itemLpuContent = '-';
        if (l.detalhe) {
            const lpuObj = l.detalhe.lpu || {};
            const lpuCodigo = lpuObj.codigoLpu || lpuObj.nomeLpu || '';
            const objeto = l.detalhe.objetoContratado || '';
            const textoFinal = lpuCodigo ? `${lpuCodigo} - ${objeto}` : objeto;
            itemLpuContent = `<span class="fw-bold text-dark" title="${objeto}">${textoFinal}</span>`;
        } else if (l.os) {
            itemLpuContent = `<span class="fw-bold">${l.os.os}</span>`;
        }

        const valorDoc = l.valorDocumentista != null ? l.valorDocumentista : 0;
        const responsavelNome = l.documentistaNome || (l.documentista ? l.documentista.nome : '-') || (l.manager ? l.manager.nome : '-');

        // Status Badge
        let statusBadge = '';
        if (l.statusDocumentacao === 'PENDENTE_RECEBIMENTO') {
            statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> Aguardando Envio</span>`;
        } else if (l.statusDocumentacao === 'EM_ANALISE') {
            statusBadge = `<span class="badge bg-primary"><i class="bi bi-search"></i> Em Análise</span>`;
        } else if (l.statusDocumentacao === 'FINALIZADO') {
            statusBadge = `<span class="badge bg-success"><i class="bi bi-check-all"></i> Finalizado</span>`;
        } else {
            statusBadge = `<span class="badge bg-secondary">${l.statusDocumentacao}</span>`;
        }

        // Botões de Ação
        let botoes = '';
        // Mostra ações se estiver EM_ANALISE
        if (l.statusDocumentacao === 'EM_ANALISE') {
            botoes = `
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-success btn-finalizar-doc" data-id="${l.id}" title="Aprovar Documentação">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-devolver-doc" data-id="${l.id}" title="Devolver ao Gestor">
                        <i class="bi bi-arrow-return-left"></i>
                    </button>
                </div>
            `;
        } else {
            botoes = `<span class="text-muted small">-</span>`;
        }

        const tr = `
            <tr>
                <td class="text-center align-middle">${botoes}</td>
                <td class="text-center align-middle">${statusBadge}</td>
                <td class="align-middle text-truncate" style="max-width: 350px;">${itemLpuContent}</td>
                <td class="align-middle"><span class="badge bg-light text-dark border">${l.tipoDocumentacaoNome || 'Não Def.'}</span></td>
                <td class="text-center align-middle">${slaInfo.html}</td>
                <td class="fw-bold text-end text-secondary align-middle">${formatarMoeda(valorDoc)}</td>
                <td class="align-middle text-center"><div class="d-flex align-items-center justify-content-center"><i class="bi bi-person-circle text-secondary me-2"></i><span class="small">${responsavelNome}</span></div></td>
                <td class="align-middle text-start"><span class="small text-muted">${l.assuntoEmail || '-'}</span></td>
            </tr>
        `;
        tbody.innerHTML += tr;
    });

    attachDocButtonListeners();
}

function calcularSlaVisual(dataPrazo) {
    if (!dataPrazo) return { html: '<span class="text-muted">-</span>' };
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(dataPrazo); prazo.setHours(0, 0, 0, 0);
    if (isNaN(prazo.getTime())) return { html: `<span class="text-muted">${dataPrazo}</span>` };

    const diffTime = prazo - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let classe = 'bg-success';
    let icone = 'bi-calendar-check';
    let texto = typeof formatarData === 'function' ? formatarData(dataPrazo) : prazo.toLocaleDateString('pt-BR');

    if (diffDays < 0) { classe = 'bg-danger'; icone = 'bi-exclamation-triangle'; }
    else if (diffDays === 0) { classe = 'bg-warning text-dark'; icone = 'bi-alarm'; texto = 'Hoje'; }
    else if (diffDays <= 2) { classe = 'bg-info text-dark'; }

    return { html: `<span class="badge ${classe}" title="Prazo: ${texto}"><i class="bi ${icone}"></i> ${texto}</span>` };
}

// Listeners dos botões da tabela
function attachDocButtonListeners() {
    // Devolver (Abre Modal)
    document.querySelectorAll('.btn-devolver-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            abrirModalDevolverDoc(id);
        });
    });
    // O botão de finalizar (.btn-finalizar-doc) é tratado globalmente no main.js
}

// Modal de Devolução
function abrirModalDevolverDoc(id) {
    const modalEl = document.getElementById('modalRecusarLancamento');
    const form = document.getElementById('formRecusarLancamento');
    const inputId = document.getElementById('recusarLancamentoId');
    const txtMotivo = document.getElementById('motivoRecusa');
    const modalTitle = document.getElementById('modalRecusarLabel');

    if (modalEl) {
        if (modalEl.parentElement !== document.body) document.body.appendChild(modalEl);

        inputId.value = id;
        if (txtMotivo) txtMotivo.value = '';
        if (modalTitle) modalTitle.innerHTML = '<i class="bi bi-arrow-return-left text-danger me-2"></i>Devolver Documentação';
        if (txtMotivo) txtMotivo.placeholder = "Motivo da devolução...";

        form.dataset.tipoRecusa = 'DOCUMENTACAO';

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

// Handler do Formulário de Recusa
document.getElementById('formRecusarLancamento')?.addEventListener('submit', async function (e) {
    if (this.dataset.tipoRecusa !== 'DOCUMENTACAO') return; 

    e.preventDefault();
    const id = document.getElementById('recusarLancamentoId').value;
    const motivo = document.getElementById('motivoRecusa').value;
    const userId = localStorage.getItem('usuarioId');

    const modalEl = document.getElementById('modalRecusarLancamento');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    toggleLoader(true, '#minhas-docs-pane');

    try {
        const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}/documentacao/devolver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: userId, motivo: motivo })
        });

        if (response.ok) {
            mostrarToast("Documentação devolvida ao gestor.", "success");
            const btnAtualizar = document.getElementById('btn-atualizar-docs');
            if (btnAtualizar) btnAtualizar.click();
        } else {
            throw new Error("Erro ao devolver.");
        }
    } catch (error) {
        mostrarToast(error.message || "Erro na comunicação.", "error");
    } finally {
        toggleLoader(false, '#minhas-docs-pane');
    }
});

function renderizarGraficoCarteira(dadosMensais) {
    const ctx = document.getElementById('graficoCarteiraDoc');
    if (!ctx) return;

    // Prepara dados para o Chart.js
    const labels = dadosMensais.map(d => d.mesAno); 
    const valoresPrevistos = dadosMensais.map(d => d.valorPrevisto);
    const valoresFinalizados = dadosMensais.map(d => d.valorFinalizado);

    if (chartCarteiraInstance) {
        chartCarteiraInstance.destroy();
    }

    chartCarteiraInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Finalizado',
                    data: valoresFinalizados,
                    backgroundColor: '#198754',
                    borderRadius: 4
                },
                {
                    label: 'A Receber',
                    data: valoresPrevistos,
                    backgroundColor: '#ffc107',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatarMoeda(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, display: false }
            }
        }
    });
}