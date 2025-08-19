document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

    const API_BASE_URL = 'http://3.128.248.3:8080';
    let todasAsLinhas = [];

    const get = (obj, path, defaultValue = 'N/A') => path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : defaultValue), obj);
    const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : 'N/A';

    // ===================================================================
    //  MUDANÇA 1: Adicionar a coluna "KEY" nos cabeçalhos
    // ===================================================================
    const colunasPorRole = {
        'MANAGER': [
            "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", // <-- KEY ADICIONADA AQUI
            "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO",
            "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA",
            "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR",
            "DATA ATIVIDADE", "DATA CRIAÇÃO OS", "KEY",
        ],
        'DEFAULT': [
            "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", // <-- KEY ADICIONADA AQUI
            "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO",
            "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO",
            "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO",
            "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR",
            "VALOR", "GESTOR", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO",
            "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS", "KEY",
        ]
    };
    const headers = colunasPorRole[userRole] || colunasPorRole['DEFAULT'];

    const dataMapping = {
        // Campos da OS
        "OS": (os, detalheItem) => get(os, 'os'),
        "SEGMENTO": (os, detalheItem) => get(os, 'segmento.nome'),
        "PROJETO": (os, detalheItem) => get(os, 'projeto'),
        "GESTOR TIM": (os, detalheItem) => get(os, 'gestorTim'),
        "DATA CRIAÇÃO OS": (os, detalheItem) => get(os, 'dataCriacao'),

        // Campos do Detalhe
        "SITE": (os, detalheItem) => get(detalheItem, 'site'),
        "CONTRATO": (os, detalheItem) => get(detalheItem, 'contrato'),
        "REGIONAL": (os, detalheItem) => get(detalheItem, 'regional'),
        "LOTE": (os, detalheItem) => get(detalheItem, 'lote'),
        "BOQ": (os, detalheItem) => get(detalheItem, 'boq'),
        "PO": (os, detalheItem) => get(detalheItem, 'po'),
        "ITEM": (os, detalheItem) => get(detalheItem, 'item'),
        "OBJETO CONTRATADO": (os, detalheItem) => get(detalheItem, 'objetoContratado'),
        "UNIDADE": (os, detalheItem) => get(detalheItem, 'unidade'),
        "QUANTIDADE": (os, detalheItem) => get(detalheItem, 'quantidade'),
        "VALOR TOTAL OS": (os, detalheItem, formatarMoeda) => formatarMoeda(get(detalheItem, 'valorTotal', null)),
        "OBSERVAÇÕES": (os, detalheItem) => get(detalheItem, 'observacoes'),
        "DATA PO": (os, detalheItem) => get(detalheItem, 'dataPo'),
        "FATURAMENTO": (os, detalheItem) => get(detalheItem, 'faturamento'),
        "SOLICIT ID FAT": (os, detalheItem) => get(detalheItem, 'solitIdFat'),
        "RECEB ID FAT": (os, detalheItem) => get(detalheItem, 'recebIdFat'),
        "ID FATURAMENTO": (os, detalheItem) => get(detalheItem, 'idFaturamento'),
        "DATA FAT INPROUT": (os, detalheItem) => get(detalheItem, 'dataFatInprout'),
        "SOLICIT FS PORTAL": (os, detalheItem) => get(detalheItem, 'solitFsPortal'),
        "DATA FS": (os, detalheItem) => get(detalheItem, 'dataFs'),
        "NUM FS": (os, detalheItem) => get(detalheItem, 'numFs'),
        "GATE": (os, detalheItem) => get(detalheItem, 'gate'),
        "GATE ID": (os, detalheItem) => get(detalheItem, 'gateId'),
        "KEY": (os, detalheItem) => get(detalheItem, 'key'),

        // ===================================================================
        //  MUDANÇA 3: Corrigir o caminho para o código da LPU
        // ===================================================================
        "LPU": (os, detalheItem) => get(detalheItem, 'lpu.codigo'), // <-- CORRIGIDO de 'lpu.codigoLpu' para 'lpu.codigo'

        // Campos do Lançamento
        "VISTORIA": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.vistoria'),
        "PLANO VISTORIA": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.planoVistoria'),
        "DESMOBILIZAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.desmobilizacao'),
        "PLANO DESMOBILIZAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.planoDesmobilizacao'),
        "INSTALAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.instalacao'),
        "PLANO INSTALAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.planoInstalacao'),
        "ATIVAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.ativacao'),
        "PLANO ATIVAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.planoAtivacao'),
        "DOCUMENTAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.documentacao'),
        "PLANO DOCUMENTAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.planoDocumentacao'),
        "ETAPA GERAL": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.etapa.nomeGeral'),
        "ETAPA DETALHADA": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.etapa.nomeDetalhado'),
        "STATUS": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.status'),
        "SITUAÇÃO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.situacao'),
        "DETALHE DIÁRIO": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.detalheDiario'),
        "CÓD. PRESTADOR": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.prestador.codigo'),
        "PRESTADOR": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.prestador.nome'),
        "VALOR": (os, detalheItem, formatarMoeda) => formatarMoeda(get(detalheItem, 'ultimoLancamento.valor', null)),
        "GESTOR": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.manager.nome'),
        "DATA ATIVIDADE": (os, detalheItem) => get(detalheItem, 'ultimoLancamento.dataAtividade'),
    };

    // NENHUMA MUDANÇA NECESSÁRIA DAQUI PARA BAIXO
    // As funções restantes já estão preparadas para lidar com a nova estrutura

    async function inicializarPagina() {
        const tableHead = document.getElementById('registros-table-head');
        const tableBody = document.getElementById('registros-table-body');

        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Carregando dados...</td></tr>`;

        try {
            const response = await fetch(`${API_BASE_URL}/os`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);

            const osData = await response.json();
            
            const userSegmentos = JSON.parse(localStorage.getItem('segmentos')) || [];
            let osDataFiltrada = osData;

            if (['MANAGER', 'COORDINATOR'].includes(userRole)) {
                if (userSegmentos.length > 0) {
                    osDataFiltrada = osData.filter(os =>
                        os.segmento && userSegmentos.includes(os.segmento.id)
                    );
                } else {
                    osDataFiltrada = [];
                }
            }
            
            todasAsLinhas = [];
            osDataFiltrada.forEach(os => {
                if (os.detalhes && os.detalhes.length > 0) {
                    os.detalhes.forEach(detalhe => {
                        todasAsLinhas.push({ os: os, detalheItem: detalhe });
                    });
                } else {
                    todasAsLinhas.push({ os: os, detalheItem: null });
                }
            });

            renderizarTabela(todasAsLinhas);

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
        }
    }

    function renderizarTabela(linhasParaRenderizar) {
        const tableBody = document.getElementById('registros-table-body');
        tableBody.innerHTML = '';

        if (linhasParaRenderizar.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Nenhum registro encontrado.</td></tr>`;
            return;
        }

        linhasParaRenderizar.forEach(linhaData => {
            const { os, detalheItem } = linhaData;
            const tr = document.createElement('tr');

            const celulas = headers.map(header => {
                const func = dataMapping[header];
                return func ? func(os, detalheItem, formatarMoeda) : 'N/A';
            });

            tr.innerHTML = celulas.map(celula => `<td>${celula}</td>`).join('');
            tableBody.appendChild(tr);
        });
    }

    function adicionarListenerDeBusca() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function () {
            const termoBusca = this.value.toLowerCase().trim();
            if (!termoBusca) {
                renderizarTabela(todasAsLinhas);
                return;
            }
            const linhasFiltradas = todasAsLinhas.filter(linhaData => {
                const os = linhaData.os;
                const detalhe = linhaData.detalheItem;
                const textoPesquisavel = [
                    os.os,
                    os.projeto,
                    os.segmento?.nome,
                    detalhe?.site,
                    detalhe?.contrato,
                    detalhe?.lpu?.nome, // Corrigido para nome
                    detalhe?.lpu?.codigo, // Corrigido para codigo
                    detalhe?.key // Adicionada a busca pela KEY
                ].join(' ').toLowerCase();

                return textoPesquisavel.includes(termoBusca);
            });
            renderizarTabela(linhasFiltradas);
        });
    }

    const btnImportar = document.getElementById('btnImportar');
    const importFileInput = document.getElementById('importFile');

    if (btnImportar) {
        btnImportar.addEventListener('click', () => {
            importFileInput.click();
        });
    }

    if (importFileInput) {
        importFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            btnImportar.disabled = true;
            btnImportar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Importando...`;
            
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${API_BASE_URL}/os/importar`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Falha ao importar o arquivo.');
                }

                const successMessage = await response.text();
                mostrarToast(successMessage, 'success');
                await inicializarPagina();

            } catch (error) {
                console.error('Erro na importação:', error);
                mostrarToast(error.message, 'error');
            } finally {
                btnImportar.disabled = false;
                btnImportar.innerHTML = `<i class="bi bi-file-earmark-excel me-1"></i> Importar`;
                importFileInput.value = '';
            }
        });
    }

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            if (todasAsLinhas.length === 0) {
                if (typeof mostrarToast === 'function') {
                    mostrarToast('Não há dados para exportar.', 'error');
                } else {
                    alert('Não há dados para exportar.');
                }
                return;
            }

            const csvHeaders = headers;
            const csvRows = todasAsLinhas.map(linhaData => {
                const { os, detalheItem } = linhaData;
                const formatarMoedaCSV = (valor) => (valor || valor === 0) ? valor.toString().replace('.', ',') : '';

                const row = csvHeaders.map(header => {
                    const func = dataMapping[header];
                    return func ? func(os, detalheItem, formatarMoedaCSV) : '';
                });

                return row.map(cell => {
                    const cellStr = String(cell);
                    if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                }).join(';');
            });

            const csvContent = [csvHeaders.join(';'), ...csvRows].join('\n');

            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'relatorio_registros.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        if (userRole === 'MANAGER') {
            const containerBotoes = document.getElementById('botoes-acao');
            if (containerBotoes) {
                containerBotoes.classList.add('d-none');
            }
        }
    }

    inicializarPagina();
    adicionarListenerDeBusca();
});