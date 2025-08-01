document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:8080';
    let todasAsLinhas = []; // Guarda os dados formatados para a tabela

    // Lista completa de cabeçalhos para a tabela unificada
    const headers = [
        "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LOTE", "BOQ", "PO", "ITEM",
        "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "LPU", "EQUIPE", "VISTORIA",
        "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO",
        "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR LPU", "GESTOR", "DATA ATIVIDADE", "FATURAMENTO",
        "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLIC FS PORTAL", "DATA FS", "NUM FS",
        "GATE", "GATE ID", "DATA CRIAÇÃO OS",
    ];

    /**
     * Função principal que carrega os dados e inicializa a página.
     */
    async function inicializarPagina() {
        const tableHead = document.getElementById('registros-table-head');
        const tableBody = document.getElementById('registros-table-body');
        
        // 1. Renderiza o cabeçalho da tabela uma única vez
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Carregando dados...</td></tr>`;

        try {
            // 2. Busca todos os dados das OS da API
            const response = await fetch(`${API_BASE_URL}/os`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
            
            const osData = await response.json();
            
            // 3. Processa os dados para criar a estrutura da tabela plana
            todasAsLinhas = []; // Limpa antes de preencher
            osData.forEach(os => {
                if (os.lpus && os.lpus.length > 0) {
                    os.lpus.forEach(itemLpu => {
                        todasAsLinhas.push({ os: os, lpuItem: itemLpu });
                    });
                } else {
                    // Adiciona uma linha mesmo que não haja LPU, para a OS aparecer no relatório
                    todasAsLinhas.push({ os: os, lpuItem: null });
                }
            });

            // 4. Renderiza a tabela com todos os dados
            renderizarTabela(todasAsLinhas);

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center text-danger">Erro ao carregar dados. Verifique a API.</td></tr>`;
        }
    }

    /**
     * Renderiza o corpo da tabela com base nos dados fornecidos.
     * @param {Array} linhasParaRenderizar - Array de objetos contendo {os, lpuItem}.
     */
    function renderizarTabela(linhasParaRenderizar) {
        const tableBody = document.getElementById('registros-table-body');
        tableBody.innerHTML = '';

        if (linhasParaRenderizar.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Nenhum registro encontrado.</td></tr>`;
            return;
        }
        
        // Funções auxiliares para formatação
        const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : 'N/A';
        const get = (obj, path, defaultValue = 'N/A') => path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : defaultValue), obj);

        linhasParaRenderizar.forEach(linhaData => {
            const { os, lpuItem } = linhaData;
            const lpu = lpuItem ? lpuItem.lpu : null;
            const lancamento = lpuItem ? lpuItem.ultimoLancamento : null;

            const tr = document.createElement('tr');
            
            // Mapeia os dados para as células na ordem correta dos headers
            const celulas = [
                get(os, 'os'), get(os, 'site'), get(os, 'contrato'), get(os, 'segmento.nome'), get(os, 'projeto'),
                get(os, 'gestorTim'), get(os, 'regional'), get(os, 'lote'), get(os, 'boq'), get(os, 'po'), get(os, 'item'),
                get(os, 'objetoContratado'), get(os, 'unidade'), get(os, 'quantidade'), formatarMoeda(get(os, 'valorTotal', null)),
                get(os, 'observacoes'), get(os, 'dataPo'), lpu ? `${get(lpu, 'codigo')} - ${get(lpu, 'nome')}` : 'N/A',
                get(lancamento, 'equipe'), get(lancamento, 'vistoria'), get(lancamento, 'instalacao'), get(lancamento, 'ativacao'),
                get(lancamento, 'documentacao'), get(lancamento, 'etapa.nomeGeral'), get(lancamento, 'etapa.nomeDetalhado'),
                get(lancamento, 'status'), get(lancamento, 'situacao'), get(lancamento, 'detalheDiario'),
                get(lancamento, 'prestador.codigo'), get(lancamento, 'prestador.nome'), formatarMoeda(get(lancamento, 'valor', null)),
                get(lancamento, 'manager.nome'), get(lancamento, 'dataAtividade'), get(os, 'faturamento'), get(os, 'solitIdFat'),
                get(os, 'recebIdFat'), get(os, 'idFaturamento'), get(os, 'dataFatInprout'), get(os, 'solitFsPortal'),
                get(os, 'dataFs'), get(os, 'numFs'), get(os, 'gate'), get(os, 'gateId'), get(os, 'dataCriacao')
            ];

            tr.innerHTML = celulas.map(celula => `<td>${celula}</td>`).join('');
            tableBody.appendChild(tr);
        });
    }

    /**
     * Filtra a tabela com base no termo de busca.
     */
    function adicionarListenerDeBusca() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function() {
            const termoBusca = this.value.toLowerCase().trim();

            if (!termoBusca) {
                renderizarTabela(todasAsLinhas); // Mostra tudo se a busca estiver vazia
                return;
            }

            const linhasFiltradas = todasAsLinhas.filter(linhaData => {
                const os = linhaData.os;
                // Busca nos campos principais da OS
                return (
                    os.os?.toLowerCase().includes(termoBusca) ||
                    os.site?.toLowerCase().includes(termoBusca) ||
                    os.contrato?.toLowerCase().includes(termoBusca)
                );
            });

            renderizarTabela(linhasFiltradas);
        });
    }

    // Inicializa a página e a funcionalidade de busca
    inicializarPagina();
    adicionarListenerDeBusca();
});