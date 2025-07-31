// Define a URL base da sua API
const API_BASE_URL = 'http://localhost:8080';

// Aguarda o conteúdo da página ser totalmente carregado
document.addEventListener('DOMContentLoaded', function() {
    loadOsRecords();
    addEventListeners();
});

/**
 * Adiciona os "escutadores de evento" para a página.
 */
function addEventListeners() {
    const tableBody = document.getElementById('registros-table-body');

    // Usa a delegação de eventos para escutar cliques nas linhas da OS
    tableBody.addEventListener('click', function(event) {
        // Encontra a linha de OS mais próxima que foi clicada
        const osRow = event.target.closest('.os-row');
        if (osRow) {
            const osId = osRow.dataset.osId;
            toggleLpuRows(osId, osRow);
        }
    });
}

/**
 * Busca os dados das Ordens de Serviço na API e as insere na tabela.
 */
async function loadOsRecords() {
    const tableBody = document.getElementById('registros-table-body');
    tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Carregando Ordens de Serviço...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/os`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const osList = await response.json();
        tableBody.innerHTML = '';

        if (osList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Nenhuma Ordem de Serviço encontrada.</td></tr>';
            return;
        }

        osList.forEach(os => {
            const osRow = document.createElement('tr');
            osRow.className = 'os-row fw-bold';
            osRow.dataset.osId = os.id;
            osRow.setAttribute('title', 'Clique para expandir');

            // Célula 1: Ícone
            osRow.innerHTML = `
                <td><i class="bi bi-chevron-right toggle-icon"></i></td>
                <td>Ordem de Serviço: ${os.os} (Contrato: ${os.contrato || 'N/A'})</td>
            `;

            tableBody.appendChild(osRow);
        });

    } catch (error) {
        console.error('Falha ao carregar as Ordens de Serviço:', error);
        tableBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">Erro ao carregar dados. Verifique a API.</td></tr>`;
    }
}

/**
 * Mostra ou esconde a tabela de LPUs para uma determinada OS.
 * @param {string} osId - O ID da OS que foi clicada.
 * @param {HTMLElement} osRow - O elemento <tr> da OS.
 */
async function toggleLpuRows(osId, osRow) {
    const icon = osRow.querySelector('.toggle-icon');
    const detailsRow = document.getElementById(`details-for-os-${osId}`);

    if (detailsRow) {
        detailsRow.remove();
        icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
        osRow.classList.remove('expanded');
        return;
    }

    icon.classList.replace('bi-chevron-right', 'bi-chevron-down');
    osRow.classList.add('expanded');

    const newDetailsRow = document.createElement('tr');
    newDetailsRow.id = `details-for-os-${osId}`;
    newDetailsRow.className = 'lpu-details-container-row';

    const detailsCell = newDetailsRow.insertCell();
    detailsCell.colSpan = 2;
    detailsCell.innerHTML = '<div class="p-3">Carregando LPUs...</div>';
    osRow.after(newDetailsRow);

    try {
        // *** CORREÇÃO APLICADA AQUI: Busca os dados da OS e das LPUs em paralelo ***
        const [osResponse, lpuResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/os/${osId}`),
            fetch(`${API_BASE_URL}/os/${osId}/lpu-lancamentos`)
        ]);

        if (!osResponse.ok || !lpuResponse.ok) {
            throw new Error(`Erro na API`);
        }
        
        const osData = await osResponse.json();
        const lpuData = await lpuResponse.json();
        
        // Passa os dados da OS clicada para a função que constrói a tabela
        const innerTableHTML = buildInnerTable(lpuData, osData);
        detailsCell.innerHTML = `<div class="p-2">${innerTableHTML}</div>`;

    } catch (error) {
        console.error(`Falha ao buscar LPUs para a OS ${osId}:`, error);
        detailsCell.innerHTML = `<div class="p-3 text-center text-danger">Falha ao carregar LPUs.</div>`;
    }
}

/**
 * Constrói o HTML da tabela interna com os dados das LPUs e seus lançamentos.
 * @param {Array} data - A lista de LPU com seus últimos lançamentos.
 * @param {object} os - O objeto da OS principal (pai).
 * @returns {string} O HTML completo da tabela.
 */
function buildInnerTable(data, os) { // Recebe a OS como parâmetro
    const headers = ["STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE", "SEGMENTO", "PROJETO", "LPU", "GESTOR TIM", "REGIONAL", "EQUIPE", "VISTORIA", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "AÇÕES"];
    
    let table = '<div class="table-responsive"><table class="table table-bordered table-sm modern-table">';
    
    table += '<thead><tr>';
    headers.forEach(h => table += `<th>${h}</th>`);
    table += '</tr></thead>';

    table += '<tbody>';
    if (data.length === 0) {
        table += `<tr><td colspan="${headers.length}" class="text-center text-muted">Nenhuma LPU encontrada para esta OS.</td></tr>`;
    } else {
        data.forEach(item => {
            const lpu = item.lpu;
            const lancamento = item.ultimoLancamento;

            const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : '';
            const get = (obj, path, defaultValue = '') => path.split('.').reduce((a, b) => (a && a[b] ? a[b] : defaultValue), obj);

            table += '<tr>';
            // *** CORREÇÃO APLICADA AQUI: Usa o objeto 'os' para os dados da OS ***
            table += `<td><span class="badge rounded-pill text-bg-secondary">${get(lancamento, 'situacaoAprovacao', 'N/A').replace(/_/g, ' ')}</span></td>`;
            table += `<td>${get(lancamento, 'dataAtividade', '')}</td>`;
            table += `<td>${os.os}</td>`; // <-- Dado da OS pai
            table += `<td>${os.site}</td>`; // <-- Dado da OS pai
            table += `<td>${get(os, 'segmento.nome', '')}</td>`; // <-- Dado da OS pai
            table += `<td>${os.projeto}</td>`; // <-- Dado da OS pai
            table += `<td>${lpu.codigoLpu} - ${lpu.nomeLpu}</td>`;
            table += `<td>${os.gestorTim}</td>`; // <-- Dado da OS pai
            table += `<td>${os.regional}</td>`; // <-- Dado da OS pai
            table += `<td>${get(lancamento, 'equipe', '')}</td>`;
            table += `<td>${get(lancamento, 'vistoria', '')}</td>`;
            table += `<td>${get(lancamento, 'instalacao', '')}</td>`;
            table += `<td>${get(lancamento, 'ativacao', '')}</td>`;
            table += `<td>${get(lancamento, 'documentacao', '')}</td>`;
            table += `<td>${get(lancamento, 'etapa.nomeGeral', '')}</td>`;
            table += `<td>${get(lancamento, 'etapa.nomeDetalhado', '')}</td>`;
            table += `<td>${get(lancamento, 'status', '')}</td>`;
            table += `<td>${get(lancamento, 'situacao', '')}</td>`;
            table += `<td>${get(lancamento, 'detalheDiario', '')}</td>`;
            table += `<td>${get(lancamento, 'prestador.codigo', '')}</td>`;
            table += `<td>${get(lancamento, 'prestador.nome', '')}</td>`;
            table += `<td>${formatarMoeda(get(lancamento, 'valor', null))}</td>`;
            table += `<td>${get(lancamento, 'manager.nome', '')}</td>`;
            table += `
                <td>
                    <button class="btn btn-sm btn-outline-primary" title="Novo Lançamento"><i class="bi bi-plus-lg"></i></button>
                    <button class="btn btn-sm btn-outline-secondary" title="Ver Histórico"><i class="bi bi-clock-history"></i></button>
                </td>
            `;
            table += '</tr>';
        });
    }
    table += '</tbody></table></div>';
    return table;
}