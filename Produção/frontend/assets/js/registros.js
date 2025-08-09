document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

    const API_BASE_URL = 'http://3.128.248.3:8080';
    let todasAsLinhas = [];

    const get = (obj, path, defaultValue = 'N/A') => path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : defaultValue), obj);
    const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : 'N/A';

    const colunasPorRole = {
        'MANAGER': [
            "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU",
            "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO",
            "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA",
            "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR",
            "DATA ATIVIDADE", "DATA CRIAÇÃO OS"
        ],
        'DEFAULT': [
            "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM",
            "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO",
            "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO",
            "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO",
            "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR",
            "VALOR", "GESTOR", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO",
            "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS",
        ]
    };

    const headers = colunasPorRole[userRole] || colunasPorRole['DEFAULT'];

    const dataMapping = {
        "OS": (os) => get(os, 'os'),
        "SITE": (os) => get(os, 'site'),
        "CONTRATO": (os) => get(os, 'contrato'),
        "SEGMENTO": (os) => get(os, 'segmento.nome'),
        "PROJETO": (os) => get(os, 'projeto'),
        "GESTOR TIM": (os) => get(os, 'gestorTim'),
        "REGIONAL": (os) => get(os, 'regional'),
        "LOTE": (os) => get(os, 'lote'),
        "BOQ": (os) => get(os, 'boq'),
        "PO": (os) => get(os, 'po'),
        "ITEM": (os) => get(os, 'item'),
        "OBJETO CONTRATADO": (os) => get(os, 'objetoContratado'),
        "UNIDADE": (os) => get(os, 'unidade'),
        "QUANTIDADE": (os) => get(os, 'quantidade'),
        "VALOR TOTAL OS": (os, lpuItem, formatarMoeda) => formatarMoeda(get(os, 'valorTotal', null)),
        "OBSERVAÇÕES": (os) => get(os, 'observacoes'),
        "DATA PO": (os) => get(os, 'dataPo'),
        "LPU": (os, lpuItem) => lpuItem ? `${get(lpuItem.lpu, 'codigo')}` : 'N/A',
        "VISTORIA": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.vistoria'),
        "PLANO VISTORIA": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.planoVistoria'),
        "DESMOBILIZAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.desmobilizacao'),
        "PLANO DESMOBILIZAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.planoDesmobilizacao'),
        "INSTALAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.instalacao'),
        "PLANO INSTALAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.planoInstalacao'),
        "ATIVAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.ativacao'),
        "PLANO ATIVAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.planoAtivacao'),
        "DOCUMENTAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.documentacao'),
        "PLANO DOCUMENTAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.planoDocumentacao'),
        "ETAPA GERAL": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.etapa.nomeGeral'),
        "ETAPA DETALHADA": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.etapa.nomeDetalhado'),
        "STATUS": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.status'),
        "SITUAÇÃO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.situacao'),
        "DETALHE DIÁRIO": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.detalheDiario'),
        "CÓD. PRESTADOR": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.prestador.codigo'),
        "PRESTADOR": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.prestador.nome'),
        "VALOR LPU": (os, lpuItem, formatarMoeda) => formatarMoeda(get(lpuItem, 'ultimoLancamento.valor', null)),
        "GESTOR": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.manager.nome'),
        "DATA ATIVIDADE": (os, lpuItem) => get(lpuItem, 'ultimoLancamento.dataAtividade'),
        "FATURAMENTO": (os) => get(os, 'faturamento'),
        "SOLICIT ID FAT": (os) => get(os, 'solitIdFat'),
        "RECEB ID FAT": (os) => get(os, 'recebIdFat'),
        "ID FATURAMENTO": (os) => get(os, 'idFaturamento'),
        "DATA FAT INPROUT": (os) => get(os, 'dataFatInprout'),
        "SOLICIT FS PORTAL": (os) => get(os, 'solitFsPortal'),
        "DATA FS": (os) => get(os, 'dataFs'),
        "NUM FS": (os) => get(os, 'numFs'),
        "GATE": (os) => get(os, 'gate'),
        "GATE ID": (os) => get(os, 'gateId'),
        "DATA CRIAÇÃO OS": (os) => get(os, 'dataCriacao')
    };

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

            // --- INÍCIO DA CORREÇÃO ---
            // Filtra os dados aqui no frontend, antes de renderizar.
            const userSegmentos = JSON.parse(localStorage.getItem('segmentos')) || [];
            let osDataFiltrada = osData;

            if (['MANAGER', 'COORDINATOR'].includes(userRole)) {
                if (userSegmentos.length > 0) {
                    osDataFiltrada = osData.filter(os =>
                        os.segmento && userSegmentos.includes(os.segmento.id)
                    );
                } else {
                    osDataFiltrada = []; // Se não tiver segmentos, a lista fica vazia.
                }
            }
            // --- FIM DA CORREÇÃO ---

            todasAsLinhas = [];
            osDataFiltrada.forEach(os => { // Usa a lista já filtrada
                if (os.lpus && os.lpus.length > 0) {
                    os.lpus.forEach(itemLpu => {
                        todasAsLinhas.push({ os: os, lpuItem: itemLpu });
                    });
                } else {
                    todasAsLinhas.push({ os: os, lpuItem: null });
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
            const { os, lpuItem } = linhaData;
            const tr = document.createElement('tr');

            const celulas = headers.map(header => {
                const func = dataMapping[header];
                return func ? func(os, lpuItem, formatarMoeda) : 'N/A';
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
                return (os.os?.toLowerCase().includes(termoBusca) || os.site?.toLowerCase().includes(termoBusca) || os.contrato?.toLowerCase().includes(termoBusca));
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

            // Cria um FormData para enviar o arquivo
            const formData = new FormData();
            formData.append('file', file);

            try {
                // Envia o arquivo para o novo endpoint
                const response = await fetch(`${API_BASE_URL}/os/importar`, {
                    method: 'POST',
                    // Não precisa de 'Content-Type', o navegador define automaticamente para multipart/form-data
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Falha ao importar o arquivo.');
                }

                const successMessage = await response.text();
                mostrarToast(successMessage, 'success');

                // Recarrega a página ou a tabela para mostrar os novos dados
                await inicializarPagina();

            } catch (error) {
                console.error('Erro na importação:', error);
                mostrarToast(error.message, 'error');
            } finally {
                btnImportar.disabled = false;
                btnImportar.innerHTML = `<i class="bi bi-file-earmark-excel me-1"></i> Importar`;
                importFileInput.value = ''; // Limpa o input de arquivo
            }
        });
    }

    function excelDateToJSDate(excelDate) {
        if (excelDate instanceof Date) {
            const ano = excelDate.getFullYear();
            const mes = String(excelDate.getMonth() + 1).padStart(2, '0');
            const dia = String(excelDate.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        }
        if (typeof excelDate === 'number') {
            const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            const ano = date.getFullYear();
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const dia = String(date.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        }
        return null;
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
                const { os, lpuItem } = linhaData;
                const formatarMoedaCSV = (valor) => (valor || valor === 0) ? valor.toString().replace('.', ',') : '';

                const row = csvHeaders.map(header => {
                    const func = dataMapping[header];
                    return func ? func(os, lpuItem, formatarMoedaCSV) : '';
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