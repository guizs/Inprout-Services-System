document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:8080';
    const gateSelect = document.getElementById('gateSelect');
    const btnFiltrarGate = document.getElementById('btnFiltrarGate');
    
    const kpiValorFaturado = document.getElementById('kpi-valor-faturado');
    const kpiValorAntecipado = document.getElementById('kpi-valor-antecipado');
    
    const tableThead = document.getElementById('thead-gate-report');
    const tableTbody = document.getElementById('tbody-gate-report');
    const tableTfoot = document.getElementById('tfoot-gate-report');

    // Mapeamento dos cabeçalhos das colunas
    const colunasRelatorio = [
        { key: 'segmentoNome', label: 'Segmento' },
        { key: 'naoIniciado', label: 'Não Iniciado' },
        { key: 'paralisado', label: 'Paralisado' },
        { key: 'emAndamentoSemPO', label: 'Em Andamento (S/ PO)' },
        { key: 'emAndamentoComPO', label: 'Em Andamento (C/ PO)' },
        { key: 'totalEmAndamento', label: 'Total Andamento' },
        { key: 'finalizadoSemPO', label: 'Finalizado (S/ PO)' },
        { key: 'finalizadoComPO', label: 'Finalizado (C/ PO)' },
        { key: 'totalFinalizado', label: 'Total Finalizado' },
        { key: 'idSolicitado', label: 'ID Solicitado' },
        { key: 'idRecebido', label: 'ID Recebido/Faturado' },
        { key: 'previsao', label: 'Previsão' }
    ];

    // Função para formatar moeda (depende do global.js, mas é bom ter local)
    const formatarMoeda = (valor) => {
        if (typeof valor !== 'number') valor = 0;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    // Função para carregar os GATEs no select
    async function carregarSelectGates() {
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/gates`);
            if (!response.ok) throw new Error('Falha ao carregar GATEs.');
            const gates = await response.json();

            gateSelect.innerHTML = '<option value="" selected disabled>Selecione um GATE</option>';
            gates.forEach(gate => {
                const dataInicio = gate.dataInicio.split('-').reverse().join('/');
                const dataFim = gate.dataFim.split('-').reverse().join('/');
                const option = new Option(
                    `${gate.nome} (${dataInicio} - ${dataFim})`,
                    gate.id
                );
                gateSelect.add(option);
            });

        } catch (error) {
            console.error(error);
            mostrarToast(error.message, 'error');
            gateSelect.innerHTML = '<option value="" selected disabled>Erro ao carregar GATEs</option>';
        }
    }

    // Função para buscar e renderizar o relatório
    async function gerarRelatorio() {
        const gateId = gateSelect.value;
        if (!gateId) {
            mostrarToast('Por favor, selecione um GATE.', 'error');
            return;
        }

        toggleLoader(true);
        tableTbody.innerHTML = `<tr><td colspan="${colunasRelatorio.length}" class="text-center p-4">Carregando relatório...</td></tr>`;
        tableThead.innerHTML = '';
        tableTfoot.innerHTML = '';
        kpiValorFaturado.textContent = '...';
        kpiValorAntecipado.textContent = '...';

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/gates/${gateId}/report`);
            if (!response.ok) throw new Error('Falha ao gerar relatório.');
            const data = await response.json();

            // 1. Renderizar KPIs
            kpiValorFaturado.textContent = formatarMoeda(data.valorTotalFaturado);
            kpiValorAntecipado.textContent = formatarMoeda(data.valorTotalAntecipado);

            // 2. Renderizar Cabeçalho da Tabela
            tableThead.innerHTML = `
                <tr>
                    ${colunasRelatorio.map(col => `<th>${col.label}</th>`).join('')}
                </tr>
            `;

            // 3. Renderizar Corpo da Tabela
            const linhas = data.linhasDoRelatorio;
            if (linhas.length === 0) {
                tableTbody.innerHTML = `<tr><td colspan="${colunasRelatorio.length}" class="text-center p-4 text-muted">Nenhum dado encontrado para este GATE.</td></tr>`;
                toggleLoader(false);
                return;
            }

            // Objeto para armazenar os totais de cada coluna
            const totais = {};
            colunasRelatorio.forEach(col => {
                if(col.key !== 'segmentoNome') totais[col.key] = 0;
            });

            // Monta o HTML do corpo e calcula os totais
            let tbodyHtml = '';
            linhas.forEach(linha => {
                tbodyHtml += '<tr>';
                colunasRelatorio.forEach(col => {
                    const valor = linha[col.key];
                    if (col.key === 'segmentoNome') {
                        tbodyHtml += `<td><strong>${valor}</strong></td>`;
                    } else {
                        tbodyHtml += `<td>${formatarMoeda(valor)}</td>`;
                        totais[col.key] += valor;
                    }
                });
                tbodyHtml += '</tr>';
            });
            tableTbody.innerHTML = tbodyHtml;

            // 4. Renderizar Rodapé (Totais)
            let tfootHtml = '<tr class="table-group-divider fw-bold">';
            colunasRelatorio.forEach(col => {
                if (col.key === 'segmentoNome') {
                    tfootHtml += `<td>TOTAL GERAL</td>`;
                } else {
                    tfootHtml += `<td>${formatarMoeda(totais[col.key])}</td>`;
                }
            });
            tfootHtml += '</tr>';
            tableTfoot.innerHTML = tfootHtml;

        } catch (error) {
            console.error(error);
            mostrarToast(error.message, 'error');
            tableTbody.innerHTML = `<tr><td colspan="${colunasRelatorio.length}" class="text-center p-4 text-danger">${error.message}</td></tr>`;
        } finally {
            toggleLoader(false);
        }
    }

    // --- Inicialização ---
    btnFiltrarGate.addEventListener('click', gerarRelatorio);
    carregarSelectGates();
});