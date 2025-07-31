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
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Carregando Ordens de Serviço...</td></tr>';

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
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhuma Ordem de Serviço encontrada.</td></tr>';
            return;
        }

        osList.forEach(os => {
            const osRow = document.createElement('tr');
            osRow.className = 'os-row fw-bold';
            osRow.dataset.osId = os.id;
            osRow.setAttribute('title', 'Clique para expandir'); // Dica para o usuário

            const cellIcon = osRow.insertCell();
            cellIcon.innerHTML = '<i class="bi bi-chevron-right"></i>';

            const cellOsInfo = osRow.insertCell();
            cellOsInfo.colSpan = 7;
            cellOsInfo.textContent = `Ordem de Serviço: ${os.os} (Contrato: ${os.contrato.numero})`;

            tableBody.appendChild(osRow);
        });

    } catch (error) {
        console.error('Falha ao carregar as Ordens de Serviço:', error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erro ao carregar dados. Verifique a API.</td></tr>`;
    }
}

/**
 * Mostra ou esconde as linhas de LPU para uma determinada OS.
 * @param {string} osId - O ID da OS que foi clicada.
 * @param {HTMLElement} osRow - O elemento <tr> da OS.
 */
async function toggleLpuRows(osId, osRow) {
    const icon = osRow.querySelector('i');
    const isExpanded = osRow.classList.contains('expanded');

    // Se já estiver expandido, apenas recolhe
    if (isExpanded) {
        osRow.classList.remove('expanded');
        icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
        // Remove todas as linhas de LPU associadas a esta OS
        document.querySelectorAll(`.lpu-row[data-os-parent='${osId}']`).forEach(row => row.remove());
        return;
    }

    // Marca como expandido e muda o ícone
    osRow.classList.add('expanded');
    icon.classList.replace('bi-chevron-right', 'bi-chevron-down');

    // Exibe uma linha de "carregando"
    const loadingRow = insertLoadingRow(osRow, 8);

    try {
        // **Endpoint que precisaremos criar no back-end**
        const response = await fetch(`${API_BASE_URL}/os/${osId}/lpu-lancamentos`, {
             headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.statusText}`);
        }
        const lpuData = await response.json();
        loadingRow.remove(); // Remove o "carregando"

        if (lpuData.length === 0) {
            const emptyRow = osRow.insertAdjacentElement('afterend', document.createElement('tr'));
            emptyRow.className = `lpu-row text-muted`;
            emptyRow.dataset.osParent = osId;
            emptyRow.innerHTML = `<td colspan="8" class="text-center fst-italic">Nenhuma LPU associada a esta OS.</td>`;
            return;
        }
        
        // Adiciona as linhas de LPU
        lpuData.reverse().forEach(item => { // .reverse() para inserir na ordem correta
            const lpuRow = document.createElement('tr');
            lpuRow.className = 'lpu-row';
            lpuRow.dataset.osParent = osId; // Vincula a linha filha à linha pai

            // O `item` deve conter o objeto da LPU e o objeto do último lançamento (ou null)
            const lpu = item.lpu;
            const lancamento = item.ultimoLancamento;

            lpuRow.innerHTML = `
                <td></td> <td>${lpu.lpu}</td>
                <td>${lpu.item || ''}</td>
                <td>${lpu.descricao || ''}</td>
                <td>${lancamento ? lancamento.etapaDetalhadaNome : ''}</td>

                <td>${lancamento ? lancamento.status : ''}</td>
                <td>${lancamento ? lancamento.situacao : ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" title="Novo Lançamento">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" title="Ver Histórico">
                        <i class="bi bi-clock-history"></i>
                    </button>
                </td>
            `;
            osRow.insertAdjacentElement('afterend', lpuRow);
        });

    } catch (error) {
        console.error(`Falha ao buscar LPUs para a OS ${osId}:`, error);
        loadingRow.remove();
        const errorRow = insertErrorRow(osRow, 8, "Falha ao carregar LPUs.");
        errorRow.dataset.osParent = osId;
    }
}

// --- Funções Utilitárias ---

function insertLoadingRow(afterElement, colspan) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="${colspan}" class="text-center fst-italic">Carregando...</td>`;
    afterElement.insertAdjacentElement('afterend', row);
    return row;
}

function insertErrorRow(afterElement, colspan, message) {
    const row = document.createElement('tr');
    row.className = 'lpu-row';
    row.innerHTML = `<td colspan="${colspan}" class="text-center text-danger">${message}</td>`;
    afterElement.insertAdjacentElement('afterend', row);
    return row;
}