// ==========================================================
// LÓGICA ESPECÍFICA DA ABA DE DOCUMENTAÇÃO (CORRIGIDO)
// ==========================================================

let chartCarteiraInstance = null;

async function initDocumentacaoTab() {
    // Listener dos filtros
    document.querySelectorAll('input[name="filtroDocStatus"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            handleFiltroChange(e.target.value);
        });
    });

    await carregarComboDocumentistas();

    // Botão Atualizar (Leve ajuste para pegar o ID correto)
    document.getElementById('btn-atualizar-docs')?.addEventListener('click', async () => {
        toggleLoader(true, '#minhas-docs-pane');
        try {
            // Lógica para definir QUAL ID buscar
            const selectDoc = document.getElementById('filtro-documentista-carteira');
            const userIdReal = localStorage.getItem('usuarioId');
            // Se tiver selecionado alguém no combo, usa ele. Senão, usa o logado.
            const targetId = (selectDoc && selectDoc.value) ? selectDoc.value : userIdReal;

            await carregarDashboardEBadges(); 
            
            // Passamos o targetId para carregarCarteiraDoc (precisa atualizar a assinatura da função ou ela ler o DOM)
            await carregarCarteiraDoc(); 

            // Recarrega a lista
            const res = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${targetId}`);
            // ... resto do código igual ...
            
            // IMPORTANTE: Se o endpoint `carteira` retornar apenas valores e não a lista de itens pendentes,
            // você precisará garantir que `window.minhasDocsPendentes` seja atualizado com os itens DO OUTRO usuário.
            // O ideal é que o `carregarDashboardEBadges` trate isso ou você busque a lista explicitamente aqui.

        } catch (error) {
             console.error(error);
        } finally {
            toggleLoader(false, '#minhas-docs-pane');
        }
    });

    carregarCarteiraDoc();
    filtrarERenderizarDocs(); // Renderiza inicial
}

/**
 * Controla a mudança de filtros (Incluindo Histórico)
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
    const userId = localStorage.getItem('usuarioId');

    // Datas: Hoje e 2 meses atrás
    const fim = new Date().toISOString().split('T')[0];
    const inicioDate = new Date();
    inicioDate.setMonth(inicioDate.getMonth() - 2);
    const inicio = inicioDate.toISOString().split('T')[0];

    try {
        // --- CORREÇÃO AQUI ---
        // Mudamos para o novo endpoint específico de documentação
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

async function carregarCarteiraDoc() {
    let userId = localStorage.getItem('usuarioId');

    // VERIFICAÇÃO NOVA:
    const selectDoc = document.getElementById('filtro-documentista-carteira');
    if (selectDoc && selectDoc.value) {
        userId = selectDoc.value; // Usa o ID do documentista selecionado
    }

    if (!userId) return;

    try {
        const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${userId}`);
        const carteira = await response.json();

        // Atualiza os Cards (Valores)
        if (document.getElementById('doc-carteira-previsto')) document.getElementById('doc-carteira-previsto').innerText = formatarMoeda(carteira.totalPrevisto);
        if (document.getElementById('doc-carteira-finalizado')) document.getElementById('doc-carteira-finalizado').innerText = formatarMoeda(carteira.totalFinalizado);
        if (document.getElementById('doc-carteira-total')) document.getElementById('doc-carteira-total').innerText = formatarMoeda(carteira.totalGeral);

        renderizarGraficoCarteira(carteira.historicoMensal);
    } catch (error) { console.error(error); }
}

function filtrarERenderizarDocs() {
    let listaCompleta = window.minhasDocsPendentes || [];
    
    // FILTRO NOVO: Se tiver documentista selecionado, filtra a lista global por ele
    const selectDoc = document.getElementById('filtro-documentista-carteira');
    if (selectDoc && selectDoc.value) {
        // Filtra os itens onde o documentista.id seja igual ao selecionado
        listaCompleta = listaCompleta.filter(l => l.documentista && String(l.documentista.id) === String(selectDoc.value));
    }
    
    const filtroEl = document.querySelector('input[name="filtroDocStatus"]:checked');
    const filtro = filtroEl ? filtroEl.value : 'TODOS';

    // Se for histórico, a função handleFiltroChange já cuidou disso. 
    // Aqui cuidamos dos filtros de memória.
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
        return;
    } else {
        if (msgVazio) msgVazio.classList.add('d-none');
    }

    lista.forEach(l => {
        const slaInfo = calcularSlaVisual(l.dataPrazoDoc);

        // Item (LPU)
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
        const responsavelNome = l.documentistaNome || (l.manager ? l.manager.nome : '-');

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
        // Só mostra ações se estiver EM_ANALISE (ou conforme regra de negócio)
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

    // NOTA: O listener de aprovar (.btn-finalizar-doc) está no arquivo aprovacoes-main.js 
    // como listener global (document.addEventListener), então não precisa ser readicionado aqui.
}

// Função de Confirmação de Aprovação (Exemplo)
async function confirmarAprovacaoDoc(id) {
    const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}/documentacao/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assuntoEmail: 'Finalizado via Sistema' })
    });
    if (response.ok) {
        mostrarToast("Documentação finalizada!", "success");
        // Recarrega
        document.getElementById('btn-atualizar-docs').click();
    } else {
        mostrarToast("Erro ao finalizar.", "error");
    }
}

// Modal de Devolução
function abrirModalDevolverDoc(id) {
    const modalEl = document.getElementById('modalRecusarLancamento');
    const form = document.getElementById('formRecusarLancamento');
    const inputId = document.getElementById('recusarLancamentoId');
    const txtMotivo = document.getElementById('motivoRecusa');
    const modalTitle = document.getElementById('modalRecusarLabel');

    // Configura o modal para "Documentação"
    if (modalEl) {
        // Z-Index fix
        if (modalEl.parentElement !== document.body) document.body.appendChild(modalEl);

        inputId.value = id;
        if (txtMotivo) txtMotivo.value = '';
        if (modalTitle) modalTitle.innerHTML = '<i class="bi bi-arrow-return-left text-danger me-2"></i>Devolver Documentação';
        if (txtMotivo) txtMotivo.placeholder = "Motivo da devolução (Ex: Foto ilegível, documento incorreto...)";

        // Importante: Define o tipo para o handler do formulário saber o que fazer
        form.dataset.tipoRecusa = 'DOCUMENTACAO';

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

// Handler do Formulário de Recusa (Você deve ter isso em algum lugar global ou adicionar aqui)
// Adicione este listener APENAS SE AINDA NÃO EXISTIR no aprovacoes-main.js
document.getElementById('formRecusarLancamento')?.addEventListener('submit', async function (e) {
    if (this.dataset.tipoRecusa !== 'DOCUMENTACAO') return; // Deixa outros handlers cuidarem se não for doc

    e.preventDefault();
    const id = document.getElementById('recusarLancamentoId').value;
    const motivo = document.getElementById('motivoRecusa').value;
    const userId = localStorage.getItem('usuarioId');

    // Fecha modal
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
            // Atualiza a tabela
            document.getElementById('btn-atualizar-docs').click();
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
    const labels = dadosMensais.map(d => d.mesAno); // Ex: "09/2023"
    const valoresPrevistos = dadosMensais.map(d => d.valorPrevisto);
    const valoresFinalizados = dadosMensais.map(d => d.valorFinalizado);

    // Destrói gráfico anterior se existir para não sobrepor
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
                    backgroundColor: '#198754', // Verde Success
                    borderRadius: 4
                },
                {
                    label: 'A Receber',
                    data: valoresPrevistos,
                    backgroundColor: '#ffc107', // Amarelo Warning
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

    async function carregarComboDocumentistas() {
        const role = localStorage.getItem('userRole');
        const container = document.getElementById('container-filtro-documentista');
        const select = document.getElementById('filtro-documentista-carteira');

        // Só exibe para ADMIN, CONTROLLER ou MANAGER
        if (!['ADMIN', 'CONTROLLER', 'MANAGER'].includes(role)) {
            return;
        }

        if (container) container.classList.remove('d-none');

        try {
            // Busca todos os usuários (assumindo que existe este endpoint)
            // Se tiver um endpoint específico de documentistas, melhor ainda.
            const response = await fetchComAuth(`${API_BASE_URL}/usuarios`);
            const usuarios = await response.json();

            // Filtra apenas quem é DOCUMENTIST
            const documentistas = usuarios.filter(u => u.role === 'DOCUMENTIST');

            if (select) {
                // Limpa mantendo a opção padrão
                select.innerHTML = '<option value="">Minha Carteira (Visão Padrão)</option>';

                documentistas.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.nome || doc.email;
                    select.appendChild(option);
                });

                // Listener para recarregar tudo ao mudar o documentista
                select.addEventListener('change', async () => {
                    toggleLoader(true, '#minhas-docs-pane');
                    await carregarDashboardEBadges(); // Atualiza contadores globais
                    await carregarCarteiraDoc();     // Atualiza gráfico e cards de valores
                    // Atualiza a lista filtrada
                    const idSelecionado = select.value || localStorage.getItem('usuarioId');

                    // Recarrega a lista específica do usuário selecionado
                    const res = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${idSelecionado}`);
                    const dados = await res.json();

                    document.getElementById('btn-atualizar-docs')?.click();
                });
            }
        } catch (e) {
            console.error("Erro ao carregar documentistas", e);
        }
    }
}