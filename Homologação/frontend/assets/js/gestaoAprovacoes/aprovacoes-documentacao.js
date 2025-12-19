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

    // Botão Atualizar
    document.getElementById('btn-atualizar-docs')?.addEventListener('click', async () => {
        // Usa o loader global
        toggleLoader(true, '#minhas-docs-pane');
        try {
            await carregarDashboardEBadges();
            await carregarCarteiraDoc();

            // Recarrega a lista padrão (pendentes/em análise)
            const userId = localStorage.getItem('usuarioId');
            const res = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${userId}`);
            // Nota: Se houver um endpoint específico de lista, use-o aqui. 
            // Assumindo que o main.js popula 'window.minhasDocsPendentes', vamos apenas re-renderizar.

            // Reseta para o filtro 'TODOS' ao atualizar
            document.getElementById('filtroDocTodos').checked = true;
            renderizarTabelaDocsVisual(window.minhasDocsPendentes || []);

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
    // ... (Mantenha sua função de gráfico igual, não mudou) ...
    // Apenas certifique-se de não quebrar o código existente
    const userId = localStorage.getItem('usuarioId');
    if (!userId) return;
    try {
        const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${userId}`);
        const carteira = await response.json();

        if (document.getElementById('doc-carteira-previsto')) document.getElementById('doc-carteira-previsto').innerText = formatarMoeda(carteira.totalPrevisto);
        if (document.getElementById('doc-carteira-finalizado')) document.getElementById('doc-carteira-finalizado').innerText = formatarMoeda(carteira.totalFinalizado);
        if (document.getElementById('doc-carteira-total')) document.getElementById('doc-carteira-total').innerText = formatarMoeda(carteira.totalGeral);

        renderizarGraficoCarteira(carteira.historicoMensal);
    } catch (error) { console.error(error); }
}

function filtrarERenderizarDocs() {
    const listaCompleta = window.minhasDocsPendentes || [];
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
    // Aprovar
    document.querySelectorAll('.btn-finalizar-doc').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault(); 
            e.stopPropagation();
            const id = this.dataset.id;

            // UI Loading no botão
            const icon = this.querySelector('i');
            const originalIcon = icon.className;
            icon.className = 'spinner-border spinner-border-sm';
            this.disabled = true;

            // Loading na tela toda
            toggleLoader(true, '#minhas-docs-pane');

            try {
                this.disabled = true;
                await confirmarAprovacaoDoc(id);
            } catch (err) {
                console.error(err);
                icon.className = originalIcon;
                this.disabled = false;
            } finally {
                // O loader é fechado dentro da função de confirmação ou aqui se der erro
                toggleLoader(false, '#minhas-docs-pane');
            }
        });
    });

    // Devolver (Abre Modal)
    document.querySelectorAll('.btn-devolver-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            abrirModalDevolverDoc(id);
        });
    });
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
}