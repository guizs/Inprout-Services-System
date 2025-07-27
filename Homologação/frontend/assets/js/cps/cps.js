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
    
    // ==================================================================
    // >>>>> FUNÇÃO ATUALIZADA PARA EXIBIR COLUNAS DETALHADAS <<<<<
    // ==================================================================
    function renderTable(segmentoFiltro = 'todos') {
        // A função filterDataBySegment agora é mais robusta
        const dataToRender = filterDataBySegment(fullData, segmentoFiltro);

        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (currentTableView === 'lancamentos') {
            // Novas colunas, como solicitado
            tableHead.innerHTML = `
                <tr>
                    <th>OS</th>
                    <th>Site</th>
                    <th>Regional</th>
                    <th>LPU</th>
                    <th>Etapa</th>
                    <th>Prestador</th>
                    <th>Data Atividade</th>
                    <th>Valor</th>
                </tr>`;
            
            const lancamentos = dataToRender.lancamentosDetalhados;
            if (lancamentos && lancamentos.length > 0) {
                lancamentos.forEach(lanc => {
                    // Acessando os dados aninhados com segurança usando optional chaining (?.)
                    tableBody.innerHTML += `
                        <tr>
                            <td>${lanc.os?.os || 'N/A'}</td>
                            <td>${lanc.os?.site || 'N/A'}</td>
                            <td>${lanc.os?.regional || 'N/A'}</td>
                            <td>${lanc.lpu?.codigo || 'N/A'}</td>
                            <td>${lanc.etapa?.nomeGeral || 'N/A'}</td>
                            <td>${lanc.prestador?.nome || 'N/A'}</td>
                            <td>${formatDate(lanc.dataAtividade)}</td>
                            <td>${formatCurrency(lanc.valor)}</td>
                        </tr>`;
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Nenhum lançamento encontrado para o filtro selecionado.</td></tr>`;
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
                tableBody.innerHTML = `<tr><td colspan="3" class="text-center">Nenhum prestador encontrado para o filtro selecionado.</td></tr>`;
            }
        }
    }

    // --- LÓGICA DE DADOS ---

    async function fetchData() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (!startDate || !endDate) return;

        try {
            const response = await fetch(`${API_URL}?dataInicio=${startDate}&dataFim=${endDate}`, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
            if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
            
            fullData = await response.json();
            
            kpiTotalValueEl.textContent = formatCurrency(fullData.valorTotalGeral || 0);
            renderSegmentCards(fullData.valoresPorSegmento);
            renderSegmentFilter(fullData.valoresPorSegmento || []);
            renderTable();
            
        } catch (error) {
            console.error("Falha ao buscar dados do CPS:", error);
            kpiTotalValueEl.textContent = formatCurrency(0);
            segmentGridContainer.innerHTML = '<p class="text-muted w-100 text-center">Não foi possível carregar os dados.</p>';
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Erro ao carregar dados.</td></tr>`;
        }
    }
    
    function filterDataBySegment(data, segmento) {
        if (!segmento || segmento === 'todos' || !data.lancamentosDetalhados) {
            return data;
        }
        
        // CORRIGIDO: Acessa o nome do segmento dentro do objeto os
        const filteredLancamentos = data.lancamentosDetalhados.filter(l => l.os?.segmento?.nome === segmento);
        
        // Recalcula o consolidado por prestador com base nos lançamentos filtrados
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
            if (e.target.tagName === 'A') {
                tableTabs.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                currentTableView = e.target.dataset.tableView;
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
    const formatDate = dateStr => dateStr ? dateStr.split(' ')[0].split('-').reverse().join('/') : '';
    
    init();
});