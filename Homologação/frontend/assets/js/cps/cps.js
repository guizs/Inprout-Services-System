document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO E ELEMENTOS DO DOM ---
    const API_URL = 'http://localhost:8080/lancamentos/cps/relatorio';
    const TOKEN = localStorage.getItem('token');

    const kpiTotalValueEl = document.getElementById('kpi-total-value');
    const segmentGridContainer = document.getElementById('segment-grid-container');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterBtn = document.getElementById('filterBtn');
    const tableTabs = document.getElementById('table-tabs');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    const segmentSelectFilter = document.getElementById('segment-select-filter');

    let fullData = {};
    let currentTableView = 'lancamentos';

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    function formatDateToISO(dateStr) {
        const [dia, mes, ano] = dateStr.split('/');
        return `${ano}-${mes}-${dia}`;
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

        if (currentTableView === 'lancamentos') {
            // Cabeçalho com TODAS as colunas que você solicitou
            tableHead.innerHTML = `
                <tr>
                    <th>DATA ATIVIDADE</th>
                    <th>OS</th>
                    <th>SITE</th>
                    <th>CONTRATO</th>
                    <th>SEGMENTO</th>
                    <th>PROJETO</th>
                    <th>GESTOR TIM</th>
                    <th>REGIONAL</th>
                    <th>LOTE</th>
                    <th>BOQ</th>
                    <th>PO</th>
                    <th>ITEM</th>
                    <th>OBJETO CONTRATADO</th>
                    <th>UNIDADE</th>
                    <th>QUANTIDADE</th>
                    <th>VALOR TOTAL</th>
                    <th>OBSERVAÇÕES</th>
                    <th>DATA PO</th>
                    <th>LPU</th>
                    <th>EQUIPE</th>
                    <th>VISTORIA</th>
                    <th>PLANO DE VISTORIA</th>
                    <th>DESMOBILIZAÇÃO</th>
                    <th>PLANO DE DESMOBILIZAÇÃO</th>
                    <th>INSTALAÇÃO</th>
                    <th>PLANO DE INSTALAÇÃO</th>
                    <th>ATIVAÇÃO</th>
                    <th>PLANO DE ATIVAÇÃO</th>
                    <th>DOCUMENTAÇÃO</th>
                    <th>PLANO DE DOCUMENTAÇÃO</th>
                    <th>ETAPA GERAL</th>
                    <th>ETAPA DETALHADA</th>
                    <th>STATUS</th>
                    <th>SITUAÇÃO</th>
                    <th>DETALHE DIÁRIO</th>
                    <th>CÓD. PRESTADOR</th>
                    <th>PRESTADOR</th>
                    <th>VALOR</th>
                    <th>GESTOR</th>
                </tr>`;

            const lancamentos = dataToRender.lancamentosDetalhados;
            if (lancamentos && lancamentos.length > 0) {
                lancamentos.forEach(lanc => {
                    // Células correspondentes a cada cabeçalho
                    tableBody.innerHTML += `
                        <tr>
                            <td>${lanc.dataAtividade || 'N/A'}</td>
                            <td>${lanc.os || 'N/A'}</td>
                            <td>${lanc.site || 'N/A'}</td>
                            <td>${lanc.contrato || 'N/A'}</td>
                            <td>${lanc.segmento || 'N/A'}</td>
                            <td>${lanc.projeto || 'N/A'}</td>
                            <td>${lanc.gestorTim || 'N/A'}</td>
                            <td>${lanc.regional || 'N/A'}</td>
                            <td>${lanc.lote || 'N/A'}</td>
                            <td>${lanc.boq || 'N/A'}</td>
                            <td>${lanc.po || 'N/A'}</td>
                            <td>${lanc.item || 'N/A'}</td>
                            <td>${lanc.objetoContratado || 'N/A'}</td>
                            <td>${lanc.unidade || 'N/A'}</td>
                            <td>${lanc.quantidade || 'N/A'}</td>
                            <td>${formatCurrency(lanc.valorTotal)}</td>
                            <td>${lanc.observacoes || 'N/A'}</td>
                            <td>${lanc.dataPo || 'N/A'}</td>
                            <td>${lanc.lpu || 'N/A'}</td>
                            <td>${lanc.equipe || 'N/A'}</td>
                            <td>${lanc.vistoria || 'N/A'}</td>
                            <td>${lanc.planoDeVistoria || 'N/A'}</td>
                            <td>${lanc.desmobilizacao || 'N/A'}</td>
                            <td>${lanc.planoDeDesmobilizacao || 'N/A'}</td>
                            <td>${lanc.instalacao || 'N/A'}</td>
                            <td>${lanc.planoDeInstalacao || 'N/A'}</td>
                            <td>${lanc.ativacao || 'N/A'}</td>
                            <td>${lanc.planoDeAtivacao || 'N/A'}</td>
                            <td>${lanc.documentacao || 'N/A'}</td>
                            <td>${lanc.planoDeDocumentacao || 'N/A'}</td>
                            <td>${lanc.etapaGeral || 'N/A'}</td>
                            <td>${lanc.etapaDetalhada || 'N/A'}</td>
                            <td>${lanc.status || 'N/A'}</td>
                            <td>${lanc.situacao || 'N/A'}</td>
                            <td>${lanc.detalheDiario || 'N/A'}</td>
                            <td>${lanc.codPrestador || 'N/A'}</td>
                            <td>${lanc.prestador || 'N/A'}</td>
                            <td>${formatCurrency(lanc.valor)}</td>
                            <td>${lanc.gestor || 'N/A'}</td>
                        </tr>`;
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="39" class="text-center text-muted p-4">Nenhum lançamento encontrado para o filtro selecionado.</td></tr>`;
            }
        } else if (currentTableView === 'prestadores') {
            // A tabela de prestadores continua a mesma
            tableHead.innerHTML = `<tr><th>Prestador</th><th>Qtd. Lançamentos</th><th>Valor Total a Pagar</th></tr>`;
            const prestadores = dataToRender.consolidadoPorPrestador;
            if (prestadores && prestadores.length > 0) {
                prestadores.forEach(prest => {
                    tableBody.innerHTML += `<tr><td>${prest.prestadorNome}</td><td>${prest.totalLancamentos}</td><td>${formatCurrency(prest.valorTotal)}</td></tr>`;
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted p-4">Nenhum prestador encontrado para o filtro selecionado.</td></tr>`;
            }
        }

        syncColumnWidths();
    }

    // --- LÓGICA DE DADOS ---

    async function fetchData() {
        let startDate = startDateInput.value;
        let endDate = endDateInput.value;

        // se tiver no formato brasileiro (com "/"), converte pra ISO
        if (startDate.includes('/')) startDate = formatDateToISO(startDate);
        if (endDate.includes('/')) endDate = formatDateToISO(endDate);

        if (!startDate || !endDate) {
            mostrarToast('Por favor, selecione as datas de início e fim.', 'error');
            return;
        }

        if (typeof toggleLoader === 'function') toggleLoader(true);
        try {
            const response = await fetch(`${API_URL}?dataInicio=${startDate}&dataFim=${endDate}`, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
            if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

            fullData = await response.json();

            kpiTotalValueEl.textContent = formatCurrency(fullData.valorTotalGeral || 0);
            renderSegmentCards(fullData.valoresPorSegmento);
            renderSegmentFilter(fullData.valoresPorSegmento || []);
            renderTable(segmentSelectFilter.value);

        } catch (error) {
            console.error("Falha ao buscar dados do CPS:", error);
            mostrarToast('Não foi possível carregar os dados. Tente novamente mais tarde.', 'error');
            kpiTotalValueEl.textContent = formatCurrency(0);
            segmentGridContainer.innerHTML = '<p class="text-muted w-100 text-center">Não foi possível carregar os dados.</p>';
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger p-4">Erro ao carregar dados.</td></tr>`;
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    function filterDataBySegment(data, segmento) {
        if (!segmento || segmento === 'todos' || !data.lancamentosDetalhados) {
            return data;
        }

        const filteredLancamentos = data.lancamentosDetalhados.filter(l => l.segmento === segmento);

        const prestadorMap = new Map();
        filteredLancamentos.forEach(l => {
            const prestadorNome = l.prestador?.nome || 'Não identificado';
            const prestador = prestadorMap.get(prestadorNome) || { prestadorNome: prestadorNome, totalLancamentos: 0, valorTotal: 0 };
            prestador.totalLancamentos++;
            prestador.valorTotal += l.valor;
            prestadorMap.set(prestadorNome, prestador);
        });

        return {
            ...data,
            lancamentosDetalhados: filteredLancamentos,
            consolidadoPorPrestador: Array.from(prestadorMap.values())
        };
    }

    // --- INICIALIZAÇÃO E EVENTOS ---

    function init() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        startDateInput.value = firstDay;
        endDateInput.value = lastDay;

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

        segmentSelectFilter.addEventListener('change', (e) => {
            renderTable(e.target.value);
        });

        fetchData();
    }

    // --- FUNÇÕES UTILITÁRIAS ---
    const formatCurrency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    const formatDate = dateStr => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : 'N/A';

    init();
});