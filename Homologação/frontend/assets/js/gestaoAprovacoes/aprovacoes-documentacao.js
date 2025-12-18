// ==========================================================
// LÓGICA ESPECÍFICA DA ABA DE DOCUMENTAÇÃO
// ==========================================================

let chartCarteiraInstance = null;

/**
 * Inicializa a aba de Documentação
 * Chamado pelo aprovacoes-main.js ao entrar na aba
 */
async function initDocumentacaoTab() {

    // 1. Configura os listeners dos filtros (Radio Buttons)
    document.querySelectorAll('input[name="filtroDocStatus"]').forEach(radio => {
        radio.addEventListener('change', () => {
            filtrarERenderizarDocs();
        });
    });

    document.getElementById('btn-atualizar-docs')?.addEventListener('click', async () => {
        toggleLoader(true, '#minhas-docs-pane');
        await carregarDashboardEBadges(); // Recarrega dados globais do main.js
        await carregarCarteiraDoc();     // Recarrega gráfico
        renderizarTabelaDocs(window.minhasDocsPendentes || []);
        toggleLoader(false, '#minhas-docs-pane');
    });

    // 2. Carrega os dados da Carteira (Gráfico e Cards)
    carregarCarteiraDoc();

    // 3. Renderiza a tabela inicial (usando os dados que já estão na memória do main.js)
    filtrarERenderizarDocs();
}

/**
 * Busca dados financeiros e atualiza Cards + Gráfico
 */
async function carregarCarteiraDoc() {
    const userId = localStorage.getItem('usuarioId'); 
    
    try {
        if (!userId) {
            console.warn("Usuário não identificado para carregar carteira.");
            return;
        }

        // Usa o endpoint novo que criamos no Backend
        const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${userId}`);
        const carteira = await response.json();

        // 1. Atualiza Cards
        if(document.getElementById('doc-carteira-previsto'))
            document.getElementById('doc-carteira-previsto').innerText = formatarMoeda(carteira.totalPrevisto);
        
        if(document.getElementById('doc-carteira-finalizado'))
            document.getElementById('doc-carteira-finalizado').innerText = formatarMoeda(carteira.totalFinalizado);
        
        if(document.getElementById('doc-carteira-total'))
            document.getElementById('doc-carteira-total').innerText = formatarMoeda(carteira.totalGeral);

        // 2. Renderiza Gráfico
        renderizarGraficoCarteira(carteira.historicoMensal);

    } catch (error) {
        console.error("Erro ao carregar carteira:", error);
        // Não mostrar erro na tela para não assustar o user se for apenas delay
    }
}

/**
 * Renderiza o gráfico de barras usando Chart.js
 */
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

/**
 * Aplica o filtro de status selecionado e desenha a tabela
 */
function filtrarERenderizarDocs() {
    const listaCompleta = window.minhasDocsPendentes || [];
    const filtroEl = document.querySelector('input[name="filtroDocStatus"]:checked');
    const filtro = filtroEl ? filtroEl.value : 'TODOS';

    let listaFiltrada = listaCompleta;

    if (filtro === 'EM_ANALISE') {
        listaFiltrada = listaCompleta.filter(l => l.statusDocumentacao === 'EM_ANALISE');
    } else if (filtro === 'PENDENTE_RECEBIMENTO') {
        listaFiltrada = listaCompleta.filter(l => l.statusDocumentacao === 'PENDENTE_RECEBIMENTO');
    }

    renderizarTabelaDocsVisual(listaFiltrada);
}

/**
 * Renderiza o HTML da tabela (Versão Corrigida)
 */
function renderizarTabelaDocsVisual(lista) {
    const tbody = document.getElementById('tbody-minhas-docs');
    const msgVazio = document.getElementById('msg-sem-docs');

    if (!tbody) return;

    tbody.innerHTML = '';

    // Verifica se a lista está vazia e mostra mensagem
    if (lista.length === 0) {
        if (msgVazio) msgVazio.classList.remove('d-none');
        return;
    } else {
        if (msgVazio) msgVazio.classList.add('d-none');
    }

    lista.forEach(l => {
        // Cálculo do SLA (Visual)
        const slaInfo = calcularSlaVisual(l.dataPrazoDoc);
        
        // CORREÇÃO 1: Mapeamento do Item LPU
        // Tenta pegar do detalhe (Item + Descrição), senão pega a OS, senão traço
        let itemLpuTexto = '-';
        if (l.detalhe) {
            const itemCode = l.detalhe.item || '';
            const itemDesc = l.detalhe.objetoContratado || '';
            itemLpuTexto = `<span class="fw-bold text-dark">${itemCode}</span><br><span class="small text-muted text-truncate d-inline-block" style="max-width: 200px;" title="${itemDesc}">${itemDesc}</span>`;
        } else if (l.os) {
            itemLpuTexto = `<span class="fw-bold">${l.os.os}</span>`;
        }

        // CORREÇÃO 2: Mapeamento do Responsável (Documentista ou Manager)
        // Prioriza o nome do documentista
        const responsavelNome = l.documentistaNome || (l.manager ? l.manager.nome : '-');

        // Status Badge
        let statusBadge = '';
        if (l.statusDocumentacao === 'PENDENTE_RECEBIMENTO') {
            statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> Aguardando Envio</span>`;
        } else if (l.statusDocumentacao === 'EM_ANALISE') {
            statusBadge = `<span class="badge bg-primary"><i class="bi bi-search"></i> Em Análise</span>`;
        } else {
            statusBadge = `<span class="badge bg-secondary">${l.statusDocumentacao}</span>`;
        }

        // Botões de Ação
        // Adicionei classes específicas para capturar o clique e mostrar loading
        let botoes = '';
        if (l.statusDocumentacao === 'EM_ANALISE') {
            botoes = `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success btn-finalizar-doc" data-id="${l.id}" title="Aprovar Documentação">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-devolver-doc" data-id="${l.id}" title="Devolver/Rejeitar">
                        <i class="bi bi-arrow-return-left"></i>
                    </button>
                </div>
            `;
        } else if (l.statusDocumentacao === 'PENDENTE_RECEBIMENTO') {
            botoes = `<span class="text-muted small fst-italic">Aguardando Gestor</span>`;
        }

        const tr = `
            <tr>
                <td class="text-center">${botoes}</td>
                <td class="text-center">${statusBadge}</td>
                <td>
                    ${itemLpuTexto}
                    <div class="small text-muted mt-1">OS: ${l.os ? l.os.os : 'N/A'} | ID: ${l.id}</div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">
                        ${l.tipoDocumentacaoNome || 'Não Def.'}
                    </span>
                </td>
                <td class="text-center">
                    ${slaInfo.html}
                </td>
                <td class="fw-bold text-end text-secondary">${formatarMoeda(l.valor || 0)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle text-secondary me-2"></i>
                        <span class="small">${responsavelNome}</span>
                    </div>
                </td>
                <td><span class="small text-muted">${l.assuntoEmail || '-'}</span></td>
            </tr>
        `;
        tbody.innerHTML += tr;
    });

    // Reata listeners
    attachDocButtonListeners();
}

function calcularSlaVisual(dataPrazo) {
    if (!dataPrazo) return { html: '<span class="text-muted">-</span>' };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(dataPrazo);
    prazo.setHours(0, 0, 0, 0);

    const diffTime = prazo - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let classe = 'bg-success';
    let icone = 'bi-calendar-check';
    let texto = formatarData(dataPrazo);

    if (diffDays < 0) {
        classe = 'bg-danger'; 
        icone = 'bi-exclamation-triangle';
        texto += ` (${Math.abs(diffDays)}d)`;
    } else if (diffDays === 0) {
        classe = 'bg-warning text-dark';
        icone = 'bi-alarm';
        texto = 'Hoje';
    } else if (diffDays <= 2) {
        classe = 'bg-info text-dark';
    }

    return {
        html: `<span class="badge ${classe}" title="Prazo: ${formatarData(dataPrazo)}"><i class="bi ${icone}"></i> ${texto}</span>`
    };
}

function attachDocButtonListeners() {
    // CORREÇÃO 4: Feedback Visual de Carregamento (Loading)
    // Quando clicar em Aprovar, muda o ícone para um spinner enquanto abre o modal
    document.querySelectorAll('.btn-finalizar-doc').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // O listener global do main.js vai capturar isso também para abrir o modal,
            // aqui só cuidamos da estética para o usuário sentir que funcionou.
            const icon = this.querySelector('i');
            if(icon) {
                icon.classList.remove('bi-check-lg');
                icon.classList.add('spinner-border', 'spinner-border-sm');
                this.disabled = true; // Evita duplo clique
                
                // Restaura o botão após 3 segundos (caso o modal demore ou falhe)
                setTimeout(() => {
                    icon.classList.remove('spinner-border', 'spinner-border-sm');
                    icon.classList.add('bi-check-lg');
                    this.disabled = false;
                }, 3000);
            }
        });
    });

    // Lógica do botão Devolver (Rejeitar)
    document.querySelectorAll('.btn-devolver-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            abrirModalDevolverDoc(id);
        });
    });
}

function abrirModalDevolverDoc(id) {
    const modalEl = document.getElementById('modalRecusarLancamento');
    const form = document.getElementById('formRecusarLancamento');
    const inputId = document.getElementById('recusarLancamentoId');
    const txtMotivo = document.getElementById('motivoRecusa');
    const modalTitle = document.getElementById('modalRecusarLabel');

    if (modalEl) {
        inputId.value = id;
        if(txtMotivo) txtMotivo.value = '';
        if(modalTitle) modalTitle.innerHTML = '<i class="bi bi-arrow-return-left text-danger me-2"></i>Devolver Documentação';
        if(txtMotivo) txtMotivo.placeholder = "Motivo da devolução (Ex: Foto ilegível, documento incorreto...)";

        form.dataset.tipoRecusa = 'DOCUMENTACAO';

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}