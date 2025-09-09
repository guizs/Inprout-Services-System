document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO E ELEMENTOS DO DOM ---
    const API_URL = 'http://localhost:8080';
    const TOKEN = localStorage.getItem('token');

    const kpiTotalValueEl = document.getElementById('kpi-total-value');
    const segmentGridContainer = document.getElementById('segment-grid-container');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterBtn = document.getElementById('btn-filter');
    const tableTabs = document.getElementById('table-tabs');
    const tableHead = document.getElementById('table-head');
    const modalAlterarValorEl = document.getElementById('modalAlterarValor');
    const modalAlterarValor = new bootstrap.Modal(modalAlterarValorEl);
    const tableBody = document.getElementById('table-body');
    const segmentSelectFilter = document.getElementById('segment-select-filter');
    const modalAdiantamentoEl = document.getElementById('modalAdiantamento'); // <<< Adicione esta linha
    const modalAdiantamento = new bootstrap.Modal(modalAdiantamentoEl);

    let fullData = {};
    let currentTableView = 'prestadores';

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    function formatDateToISO(dateStr) {
        const [dia, mes, ano] = dateStr.split('/');
        return `${ano}-${mes}-${dia}`;
    }

    flatpickr("#startDate", {
        dateFormat: "d/m/Y", // "d/m/Y" resulta em "dd/mm/aaaa"
        locale: "pt"
    });
    flatpickr("#endDate", {
        dateFormat: "d/m/Y", // "d/m/Y" resulta em "dd/mm/aaaa"
        locale: "pt"
    });

    function toggleLoader(ativo = true) {
        const overlay = document.getElementById("overlay-loader");
        if (overlay) {
            if (ativo) {
                overlay.classList.remove("d-none");
            } else {
                overlay.classList.add("d-none");
            }
        }
    }

    function renderSegmentCards(segmentos) {
        segmentGridContainer.innerHTML = '';
        if (segmentos && segmentos.length > 0) {
            const segmentIcons = {
                'corporativo': 'bi-building', 'decomm': 'bi-tools', 'e2e': 'bi-diagram-3',
                'lojas tim': 'bi-shop', 'mw': 'bi-broadcast-pin', 'rede externa b2b': 'bi-hdd-network',
                'tim celular': 'bi-phone', 'tim celular - ihs': 'bi-phone-vibrate'
            };
            segmentos.forEach(seg => {
                const iconClass = segmentIcons[seg.segmentoNome.toLowerCase()] || 'bi-bar-chart-steps';
                segmentGridContainer.innerHTML += `
                    <div class="segment-card">
                        <i class="bi ${iconClass}"></i><br>${seg.segmentoNome}<br>
                        <span>${formatCurrency(seg.valorTotal)}</span>
                    </div>`;
            });
        } else {
            segmentGridContainer.innerHTML = '<p class="text-muted w-100 text-center">Nenhum valor por segmento no período.</p>';
        }
    }

    function renderSegmentFilter(segmentos) {
        segmentSelectFilter.innerHTML = '<option value="todos" selected>Todos os Segmentos</option>';
        if (segmentos) {
            // Usando o nome do segmento do objeto OS para consistência
            const nomesSegmentos = new Set(segmentos.map(s => s.segmentoNome));
            nomesSegmentos.forEach(nome => {
                segmentSelectFilter.innerHTML += `<option value="${nome}">${nome}</option>`;
            });
        }
    }

    function syncColumnWidths() {
        const headerTable = tableHead.closest('table');
        const bodyTable = tableBody.closest('table');

        // Garante que a tabela do corpo tenha pelo menos uma linha de dados
        if (tableBody.rows.length === 0) {
            return;
        }

        const headerCells = headerTable.querySelector('tr').cells;
        const bodyCells = tableBody.rows[0].cells;

        // Define a largura de cada célula do cabeçalho para corresponder à célula do corpo
        for (let i = 0; i < headerCells.length; i++) {
            if (bodyCells[i]) {
                const bodyCellWidth = bodyCells[i].offsetWidth;
                headerCells[i].style.width = `${bodyCellWidth}px`;
            }
        }
    }

    // ==================================================================
    // >>>>> FUNÇÃO ATUALIZADA PARA EXIBIR COLUNAS DETALHADAS <<<<<
    // ==================================================================
    function renderTable(segmentoFiltro = 'todos') {
        const dataToRender = filterDataBySegment(fullData, segmentoFiltro);

        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (currentTableView === 'prestadores') {
            tableHead.innerHTML = `
            <tr>
                <th>Código do Prestador</th>
                <th>Prestador</th>
                <th>Valor Total</th>
            </tr>`;

            const prestadores = dataToRender.consolidadoPorPrestador || [];
            if (prestadores.length > 0) {
                prestadores.forEach(prest => {
                    const tr = document.createElement('tr');
                    tr.style.cursor = 'pointer';
                    // Adicionamos os dados no dataset para usar no clique
                    tr.dataset.codPrestador = prest.codPrestador; // Corrigido para corresponder ao DTO
                    tr.dataset.nomePrestador = prest.prestadorNome; // Corrigido para corresponder ao DTO
                    tr.innerHTML = `
                    <td>${prest.codPrestador || 'N/A'}</td>
                    <td>${prest.prestadorNome}</td>
                    <td>${formatCurrency(prest.valorTotal)}</td>
                `;
                    tableBody.appendChild(tr);
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted p-4">Nenhum prestador encontrado.</td></tr>`;
            }
        } else if (currentTableView === 'lancamentos') {
            renderLancamentosTable(dataToRender.lancamentosDetalhados || []);
        }
        syncColumnWidths();
    }

    function renderLancamentosTable(lancamentos) {
        const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
        const mostrarAcoes = userRole !== 'COORDINATOR';

        tableHead.innerHTML = `
<tr>
    <th>DATA ATIVIDADE</th> <th>OS</th> <th>SITE</th> <th>CONTRATO</th> <th>SEGMENTO</th>
    <th>PROJETO</th> <th>GESTOR TIM</th> <th>REGIONAL</th> <th>LOTE</th> <th>BOQ</th> <th>PO</th>
    <th>ITEM</th> <th>OBJETO CONTRATADO</th> <th>UNIDADE</th> <th>QTD</th> <th>VALOR TOTAL</th>
    <th>OBSERVAÇÕES</th> <th>DATA PO</th> <th>LPU</th> <th>EQUIPE</th> <th>VISTORIA</th> <th>PLANO DE VISTORIA</th>
    <th>DESMOBILIZAÇÃO</th> <th>PLANO DESMOB.</th> <th>INSTALAÇÃO</th> <th>PLANO INST.</th> <th>ATIVAÇÃO</th>
    <th>PLANO ATIVAÇÃO</th> <th>DOCUMENTAÇÃO</th> <th>PLANO DOC.</th> <th>ETAPA GERAL</th> <th>ETAPA DETALHADA</th>
    <th>STATUS</th> <th>SITUAÇÃO</th> <th>DETALHE DIÁRIO</th> <th>CÓD PRESTADOR</th> <th>PRESTADOR</th>
    <th>VALOR PAGO</th> <th>KEY</th> <th>ADIANTAMENTO</th>
    ${mostrarAcoes ? '<th>AÇÕES</th>' : ''} 
</tr>`;

        tableBody.innerHTML = '';

        if (lancamentos && lancamentos.length > 0) {
            lancamentos.forEach(lanc => {
                const acoesCell = mostrarAcoes ? `
            <td>
                <button class="btn btn-sm btn-outline-primary btn-alterar-valor" data-id="${lanc.id}" title="Alterar Valor Pago">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning btn-adiantamento" data-id="${lanc.id}" title="Registrar Adiantamento">
                    <i class="bi bi-cash-coin"></i>
                </button>
            </td>` : '';

                tableBody.innerHTML += `
        <tr>
            <td>${lanc.dataAtividade || 'N/A'}</td> <td>${lanc.os || 'N/A'}</td> <td>${lanc.site || 'N/A'}</td>
            <td>${lanc.contrato || 'N/A'}</td> <td>${lanc.segmento || 'N/A'}</td> <td>${lanc.projeto || 'N/A'}</td>
            <td>${lanc.gestorTim || 'N/A'}</td> <td>${lanc.regional || 'N/A'}</td> <td>${lanc.lote || 'N/A'}</td>
            <td>${lanc.boq || 'N/A'}</td> <td>${lanc.po || 'N/A'}</td> <td>${lanc.item || 'N/A'}</td>
            <td>${lanc.objetoContratado || 'N/A'}</td> <td>${lanc.unidade || 'N/A'}</td> <td>${lanc.quantidade || 'N/A'}</td>
            <td>${formatCurrency(lanc.valorTotal)}</td> <td>${lanc.observacoes || 'N/A'}</td> <td>${lanc.dataPo || 'N/A'}</td>
            <td>${lanc.lpu || 'N/A'}</td> <td>${lanc.equipe || 'N/A'}</td> <td>${lanc.vistoria || 'N/A'}</td>
            <td>${lanc.planoDeVistoria || 'N/A'}</td> <td>${lanc.desmobilizacao || 'N/A'}</td> <td>${lanc.planoDeDesmobilizacao || 'N/A'}</td>
            <td>${lanc.instalacao || 'N/A'}</td> <td>${lanc.planoDeInstalacao || 'N/A'}</td> <td>${lanc.ativacao || 'N/A'}</td>
            <td>${lanc.planoDeAtivacao || 'N/A'}</td> <td>${lanc.documentacao || 'N/A'}</td> <td>${lanc.planoDeDocumentacao || 'N/A'}</td>
            <td>${lanc.etapaGeral || 'N/A'}</td> <td>${lanc.etapaDetalhada || 'N/A'}</td> <td>${lanc.status || 'N/A'}</td>
            <td>${lanc.situacao || 'N/A'}</td> <td class="detalhe-diario-cell">${lanc.detalheDiario || 'N/A'}</td> <td>${lanc.codPrestador || 'N/A'}</td>
            <td>${lanc.prestador || 'N/A'}</td> <td>${formatCurrency(lanc.valor)}</td>
            <td>${lanc.key || 'N/A'}</td>
            <td class="text-danger fw-bold">${formatCurrency(lanc.valorAdiantamento)}</td>
            ${acoesCell}
        </tr>`;
            });
        } else {
            const colspan = mostrarAcoes ? 40 : 39;
            tableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-muted p-4">Nenhum lançamento encontrado.</td></tr>`;
        }
    }

    // ADICIONE ESTA NOVA FUNÇÃO ABAIXO DA fetchData
    async function alterarValorLancamento(lancamentoId, novoValor) {
        if (typeof toggleLoader === 'function') toggleLoader(true);
        try {
            const response = await fetch(`${API_URL}/lancamentos/${lancamentoId}/valor`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify({ valor: novoValor })
            });

            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.message || 'Falha ao atualizar o valor.');
            }

            mostrarToast('Valor alterado com sucesso!', 'success');
            await fetchData(); // Recarrega TODOS os dados para atualizar os totais

        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    // --- LÓGICA DE DADOS ---
    async function fetchData() {
        // ▼▼▼ CORREÇÃO PRINCIPAL AQUI ▼▼▼
        // Pega os valores de texto ATUAIS dos inputs de data toda vez que a função é chamada
        let startDate = startDateInput.value;
        let endDate = endDateInput.value;
        // ▲▲▲ FIM DA CORREÇÃO ▲▲▲

        // se tiver no formato brasileiro (com "/"), converte pra ISO
        if (startDate.includes('/')) startDate = formatDateToISO(startDate);
        if (endDate.includes('/')) endDate = formatDateToISO(endDate);

        if (!startDate || !endDate) {
            mostrarToast('Por favor, selecione as datas de início e fim.', 'error');
            return;
        }

        const segmentoSelecionadoAnteriormente = segmentSelectFilter.value;

        if (typeof toggleLoader === 'function') toggleLoader(true);
        try {
            const response = await fetch(`${API_URL}/lancamentos/cps/relatorio?dataInicio=${startDate}&dataFim=${endDate}`, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
            if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

            fullData = await response.json();

            // LÓGICA DE CÁLCULO DOS TOTAIS
            const totalBruto = fullData.valorTotalGeral || 0;
            const totalAdiantado = (fullData.lancamentosDetalhados || []).reduce((acc, lanc) => acc + (lanc.valorAdiantamento || 0), 0);
            const totalLiquido = totalBruto - totalAdiantado;

            // Atualiza os KPIs
            const kpiTotalBrutoEl = document.getElementById('kpi-total-bruto');
            const kpiTotalAdiantadoEl = document.getElementById('kpi-total-adiantado');
            const kpiTotalLiquidoEl = document.getElementById('kpi-total-liquido');

            if (kpiTotalBrutoEl) kpiTotalBrutoEl.textContent = formatCurrency(totalBruto);
            if (kpiTotalAdiantadoEl) kpiTotalAdiantadoEl.textContent = formatCurrency(totalAdiantado);
            if (kpiTotalLiquidoEl) kpiTotalLiquidoEl.textContent = formatCurrency(totalLiquido);

            renderSegmentCards(fullData.valoresPorSegmento);
            renderSegmentFilter(fullData.valoresPorSegmento || []);

            segmentSelectFilter.value = segmentoSelecionadoAnteriormente;
            renderTable(segmentSelectFilter.value);

        } catch (error) {
            console.error("Falha ao buscar dados do CPS:", error);
            mostrarToast('Não foi possível carregar os dados. Tente novamente mais tarde.', 'error');
            const kpiTotalBrutoEl = document.getElementById('kpi-total-bruto');
            const kpiTotalAdiantadoEl = document.getElementById('kpi-total-adiantado');
            const kpiTotalLiquidoEl = document.getElementById('kpi-total-liquido');
            if (kpiTotalBrutoEl) kpiTotalBrutoEl.textContent = formatCurrency(0);
            if (kpiTotalAdiantadoEl) kpiTotalAdiantadoEl.textContent = formatCurrency(0);
            if (kpiTotalLiquidoEl) kpiTotalLiquidoEl.textContent = formatCurrency(0);

            segmentGridContainer.innerHTML = '<p class="text-muted w-100 text-center">Não foi possível carregar os dados.</p>';
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger p-4">Erro ao carregar dados.</td></tr>`;
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    async function fetchDetalhesPorPrestador(codPrestador) {
        // Mostra o loader
        if (typeof toggleLoader === 'function') toggleLoader(true);

        try {
            // PASSO 1: Filtra a lista de lançamentos que já está na memória (fullData),
            // em vez de fazer uma nova chamada para a API.
            const lancamentosDoPrestador = fullData.lancamentosDetalhados.filter(
                lanc => lanc.codPrestador === codPrestador
            );

            // PASSO 2: Altera a visualização para a aba de lançamentos, como antes.
            currentTableView = 'lancamentos';
            tableTabs.querySelector('.active').classList.remove('active');
            tableTabs.querySelector('[data-table-view="lancamentos"]').classList.add('active');

            // PASSO 3: Renderiza a tabela apenas com os dados filtrados.
            renderLancamentosTable(lancamentosDoPrestador);
            syncColumnWidths();

        } catch (error) {
            // Este erro seria improvável, mas é mantido por segurança.
            console.error("Falha ao filtrar detalhes do prestador localmente:", error);
            mostrarToast('Ocorreu um erro ao exibir os detalhes.', 'error');
        } finally {
            // Esconde o loader
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    function filterDataBySegment(data, segmento) {
        // Se o filtro for 'todos' ou não houver dados detalhados, retorna os dados originais
        if (!segmento || segmento === 'todos' || !data.lancamentosDetalhados) {
            return data;
        }

        // Filtra os lançamentos detalhados pelo segmento selecionado
        const filteredLancamentos = data.lancamentosDetalhados.filter(l => l.segmento === segmento);

        // Cria um novo mapa para agrupar os valores por prestador
        const prestadorMap = new Map();

        // Itera sobre os lançamentos já filtrados por segmento
        filteredLancamentos.forEach(l => {
            // Usa o 'codPrestador' como a chave única para o agrupamento
            const key = l.codPrestador;
            if (!key) return; // Pula lançamentos que não tenham um código de prestador

            // Busca o prestador no mapa. Se não existir, cria um novo objeto para ele.
            const prestadorData = prestadorMap.get(key) || {
                codPrestador: l.codPrestador, // Garante que o código seja mantido
                prestadorNome: l.prestador || 'Não identificado', // Pega o nome do prestador corretamente
                valorTotal: 0
            };

            // Soma o valor do lançamento atual ao total do prestador
            prestadorData.valorTotal += l.valor;

            // Atualiza o mapa com os dados do prestador
            prestadorMap.set(key, prestadorData);
        });

        // Retorna um novo objeto de dados
        return {
            ...data, // Mantém os dados gerais originais (valorTotalGeral, etc.)
            lancamentosDetalhados: filteredLancamentos, // A lista de lançamentos filtrada por segmento
            consolidadoPorPrestador: Array.from(prestadorMap.values()) // A nova lista de prestadores, consolidada e correta
        };
    }

    // --- INICIALIZAÇÃO E EVENTOS ---

    function init() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Função para formatar a data como dd/mm/yyyy
        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        startDateInput.value = formatDate(firstDay);
        endDateInput.value = formatDate(lastDay);

        filterBtn.addEventListener('click', fetchData);

        tableTabs.addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('a.nav-link');
            if (link) {
                tableTabs.querySelector('.active').classList.remove('active');
                link.classList.add('active');
                currentTableView = link.dataset.tableView;
                renderTable(segmentSelectFilter.value);
            }
        });

        tableBody.addEventListener('click', (e) => {
            const btnAlterar = e.target.closest('.btn-alterar-valor');
            const btnAdiantamento = e.target.closest('.btn-adiantamento');

            if (btnAlterar) {
                const lancamentoId = btnAlterar.dataset.id;
                const linha = btnAlterar.closest('tr');
                const nomePrestador = linha.cells[36].textContent;
                const valorAtual = linha.cells[37].textContent;

                document.getElementById('lancamentoIdAlterar').value = lancamentoId;
                document.getElementById('prestadorInfo').value = nomePrestador;
                document.getElementById('valorAtual').value = valorAtual;
                document.getElementById('novoValor').value = '';

                modalAlterarValor.show();
                return;
            }

            if (btnAdiantamento) {
                const lancamentoId = btnAdiantamento.dataset.id;
                const linha = btnAdiantamento.closest('tr');
                const nomePrestador = linha.cells[36].textContent;

                document.getElementById('lancamentoIdAdiantamento').value = lancamentoId;
                document.getElementById('prestadorInfoAdiantamento').value = nomePrestador;
                document.getElementById('valorAdiantamento').value = '';

                modalAdiantamento.show();
                return;
            }

            const linhaPrestador = e.target.closest('tr[data-cod-prestador]');
            if (linhaPrestador && currentTableView === 'prestadores') {
                const codPrestador = linhaPrestador.dataset.codPrestador;
                fetchDetalhesPorPrestador(codPrestador);
            }
        });

        document.getElementById('formAdiantamento').addEventListener('submit', async (e) => {
            e.preventDefault();
            const lancamentoId = document.getElementById('lancamentoIdAdiantamento').value;
            const valorStr = document.getElementById('valorAdiantamento').value;

            if (valorStr) {
                const valor = parseFloat(valorStr.replace('.', '').replace(',', '.'));
                if (!isNaN(valor) && valor >= 0) {
                    toggleLoader(true);
                    try {
                        const response = await fetch(`${API_URL}/lancamentos/${lancamentoId}/adiantamento`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ valor: valor })
                        });
                        if (!response.ok) throw new Error('Falha ao registrar adiantamento.');

                        mostrarToast('Adiantamento registrado com sucesso!', 'success');
                        await fetchData(); // Recarrega todos os dados para atualizar a tela
                    } catch (error) {
                        mostrarToast(error.message, 'error');
                    } finally {
                        toggleLoader(false);
                        modalAdiantamento.hide();
                    }
                } else {
                    mostrarToast("Valor inválido.", 'error');
                }
            }
        });

        document.getElementById('formAlterarValor').addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o recarregamento da página

            const lancamentoId = document.getElementById('lancamentoIdAlterar').value;
            const novoValorStr = document.getElementById('novoValor').value;

            if (novoValorStr) {
                const novoValor = parseFloat(novoValorStr.replace('.', '').replace(',', '.'));
                if (!isNaN(novoValor) && novoValor >= 0) {
                    alterarValorLancamento(lancamentoId, novoValor);
                    modalAlterarValor.hide(); // Fecha o modal após o envio
                } else {
                    // Você pode usar seu `mostrarToast` aqui também se preferir
                    alert("Valor inválido. Por favor, insira um número válido.");
                }
            }
        });

        fetchData();
    }

    // --- FUNÇÕES UTILITÁRIAS ---
    const formatCurrency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

    init();
});