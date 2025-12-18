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
    try {
        // Usa o endpoint novo que criamos no Backend
        const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/documentacao/carteira?usuarioId=${userId}`);
        const carteira = await response.json();

        // 1. Atualiza Cards
        document.getElementById('doc-carteira-previsto').innerText = formatarMoeda(carteira.totalPrevisto);
        document.getElementById('doc-carteira-finalizado').innerText = formatarMoeda(carteira.totalFinalizado);
        document.getElementById('doc-carteira-total').innerText = formatarMoeda(carteira.totalGeral);

        // 2. Renderiza Gráfico
        renderizarGraficoCarteira(carteira.historicoMensal);

    } catch (error) {
        console.error("Erro ao carregar carteira:", error);
        mostrarToast("Não foi possível carregar os dados financeiros.", "error");
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
                legend: { display: false }, // Esconde legenda pra economizar espaço
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
                y: { stacked: true, display: false } // Esconde eixo Y pra ficar limpo
            }
        }
    });
}

/**
 * Aplica o filtro de status selecionado e desenha a tabela
 */
function filtrarERenderizarDocs() {
    const listaCompleta = window.minhasDocsPendentes || [];
    const filtro = document.querySelector('input[name="filtroDocStatus"]:checked').value;

    let listaFiltrada = listaCompleta;

    if (filtro === 'EM_ANALISE') {
        listaFiltrada = listaCompleta.filter(l => l.statusDocumentacao === 'EM_ANALISE');
    } else if (filtro === 'PENDENTE_RECEBIMENTO') {
        listaFiltrada = listaCompleta.filter(l => l.statusDocumentacao === 'PENDENTE_RECEBIMENTO');
    }
    // Se for 'TODOS', não filtra nada (mostra tudo que é pendente)

    renderizarTabelaDocsVisual(listaFiltrada);
}

/**
 * Renderiza o HTML da tabela
 */
function renderizarTabelaDocsVisual(lista) {
    const tbody = document.getElementById('tbody-minhas-docs');
    const msgVazio = document.getElementById('msg-sem-docs'); // O elemento que estava faltando

    // Se não achar a tabela, para tudo para não dar erro
    if (!tbody) return;

    tbody.innerHTML = '';

    // Verifica se a lista está vazia
    if (lista.length === 0) {
        // Só tenta remover a classe se o elemento existir
        if (msgVazio) {
            msgVazio.classList.remove('d-none');
        }
        return;
    } else {
        // Só tenta adicionar a classe se o elemento existir
        if (msgVazio) {
            msgVazio.classList.add('d-none');
        }
    }

    lista.forEach(l => {
        // Cálculo do SLA (Visual)
        const slaInfo = calcularSlaVisual(l.dataPrazoDoc);

        // Definição do Badge de Status
        let statusBadge = '';
        if (l.statusDocumentacao === 'PENDENTE_RECEBIMENTO') {
            statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> Aguardando Envio</span>`;
        } else if (l.statusDocumentacao === 'EM_ANALISE') {
            statusBadge = `<span class="badge bg-primary"><i class="bi bi-search"></i> Em Análise</span>`;
        } else {
            statusBadge = `<span class="badge bg-secondary">${l.statusDocumentacao}</span>`;
        }

        // Botões de Ação
        let botoes = '';
        if (l.statusDocumentacao === 'EM_ANALISE') {
            botoes = `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success btn-finalizar-doc" data-id="${l.id}" title="Finalizar/Aprovar">
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
                    <div class="d-flex flex-column">
                        <span class="fw-bold text-dark">${l.os ? l.os.os : 'N/A'}</span>
                        <small class="text-muted" style="font-size: 0.75rem;">ID: ${l.id}</small>
                    </div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">
                        ${l.tipoDocumentacaoNome || 'Não Def.'}
                    </span>
                </td>
                <td class="text-center">
                    ${slaInfo.html}
                </td>
                <td class="fw-bold text-end text-secondary">${formatarMoeda(l.valor)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle text-secondary me-2"></i>
                        <span class="small">${l.manager ? l.manager.nome : '-'}</span>
                    </div>
                </td>
                <td><span class="small text-muted">${l.assuntoEmail || '-'}</span></td>
            </tr>
        `;
        tbody.innerHTML += tr;
    });

    // Reata listeners dos botões recém-criados
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
        classe = 'bg-danger'; // Atrasado
        icone = 'bi-exclamation-triangle';
        texto += ` (${Math.abs(diffDays)}d atraso)`;
    } else if (diffDays === 0) {
        classe = 'bg-warning text-dark'; // Vence hoje
        icone = 'bi-alarm';
        texto = 'Vence Hoje!';
    } else if (diffDays <= 2) {
        classe = 'bg-info text-dark'; // Perto
    }

    return {
        html: `<span class="badge ${classe}" title="Prazo: ${formatarData(dataPrazo)}"><i class="bi ${icone}"></i> ${texto}</span>`
    };
}

function attachDocButtonListeners() {
    // Finalizar (Já existia no main.js, mas vamos reforçar aqui ou deixar lá)
    // O main.js captura via 'document.addEventListener', então não precisamos reatar se usarmos delegação.
    // Mas para o botão "Devolver" (Novo), precisamos criar a lógica.

    document.querySelectorAll('.btn-devolver-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            abrirModalDevolverDoc(id);
        });
    });
}

function abrirModalDevolverDoc(id) {
    // Reutiliza o modal de Recusa genérico, mas adapta os textos
    const modalEl = document.getElementById('modalRecusarLancamento'); // Usando o modal de recusa existente
    const form = document.getElementById('formRecusarLancamento');
    const inputId = document.getElementById('recusarLancamentoId');
    const txtMotivo = document.getElementById('motivoRecusa');
    const modalTitle = document.getElementById('modalRecusarLabel');

    if (modalEl) {
        inputId.value = id;
        txtMotivo.value = '';
        modalTitle.innerHTML = '<i class="bi bi-arrow-return-left text-danger me-2"></i>Devolver Documentação';
        txtMotivo.placeholder = "Motivo da devolução (Ex: Foto ilegível, documento errado...)";

        // Marcamos um flag no form para o main.js saber que é uma recusa de DOC
        form.dataset.tipoRecusa = 'DOCUMENTACAO';

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}