document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const API_BASE_URL = 'http://localhost:8080';
    let todasAsLinhas = [];

    // --- FUNÇÕES UTILITÁRIAS CORRIGIDAS ---
    const get = (obj, path, defaultValue = '-') => {
        const value = path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : undefined), obj);
        return value !== undefined ? value : defaultValue;
    };
    const formatarMoeda = (valor) => {
        if (valor === null || valor === undefined || isNaN(Number(valor))) {
            return '-';
        }
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };
    const formatarData = (dataStr) => {
        if (!dataStr) return '-';
        // A data já vem no formato dd/MM/yyyy HH:mm:ss, então pegamos só a parte da data
        return dataStr.split(' ')[0];
    };

    // Definição das colunas da tabela
    const colunasPorRole = {
        'MANAGER': ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "DATA ATIVIDADE", "DATA CRIAÇÃO OS", "KEY"],
        'DEFAULT': ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS", "KEY"]
    };
    const headers = colunasPorRole[userRole] || colunasPorRole['DEFAULT'];

    // Mapeamento de dados corrigido para a nova estrutura
    const dataMapping = {
        "OS": (linha) => get(linha, 'os.os'),
        "SITE": (linha) => get(linha, 'detalhe.site'),
        "CONTRATO": (linha) => get(linha, 'detalhe.contrato'),
        "SEGMENTO": (linha) => get(linha, 'os.segmento.nome'),
        "PROJETO": (linha) => get(linha, 'os.projeto'),
        "GESTOR TIM": (linha) => get(linha, 'os.gestorTim'),
        "REGIONAL": (linha) => get(linha, 'detalhe.regional'),
        "LOTE": (linha) => get(linha, 'detalhe.lote'),
        "BOQ": (linha) => get(linha, 'detalhe.boq'),
        "PO": (linha) => get(linha, 'detalhe.po'),
        "ITEM": (linha) => get(linha, 'detalhe.item'),
        "OBJETO CONTRATADO": (linha) => get(linha, 'detalhe.lpu.nomeLpu'),
        "UNIDADE": (linha) => get(linha, 'detalhe.unidade'),
        "QUANTIDADE": (linha) => get(linha, 'detalhe.quantidade'),
        "VALOR TOTAL OS": (linha) => formatarMoeda(get(linha, 'detalhe.valorTotal')),
        "OBSERVAÇÕES": (linha) => get(linha, 'detalhe.observacoes'),
        "DATA PO": (linha) => get(linha, 'detalhe.dataPo'),
        "LPU": (linha) => get(linha, 'detalhe.lpu.codigoLpu'),
        "ETAPA GERAL": (linha) => get(linha, 'ultimoLancamento.etapa.nomeGeral'),
        "ETAPA DETALHADA": (linha) => get(linha, 'ultimoLancamento.etapa.nomeDetalhado'),
        "STATUS": (linha) => get(linha, 'ultimoLancamento.status'),
        "SITUAÇÃO": (linha) => get(linha, 'ultimoLancamento.situacao'),
        "DETALHE DIÁRIO": (linha) => get(linha, 'ultimoLancamento.detalheDiario'),
        "CÓD. PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.codigo'),
        "PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.nome'),
        "VALOR": (linha) => formatarMoeda(get(linha, 'ultimoLancamento.valor')),
        "GESTOR": (linha) => get(linha, 'ultimoLancamento.manager.nome'),
        "DATA ATIVIDADE": (linha) => get(linha, 'ultimoLancamento.dataAtividade'),
        "FATURAMENTO": (linha) => get(linha, 'detalhe.faturamento'),
        "SOLICIT ID FAT": (linha) => get(linha, 'detalhe.solitIdFat'),
        "RECEB ID FAT": (linha) => get(linha, 'detalhe.recebIdFat'),
        "ID FATURAMENTO": (linha) => get(linha, 'detalhe.idFaturamento'),
        "DATA FAT INPROUT": (linha) => get(linha, 'detalhe.dataFatInprout'),
        "SOLICIT FS PORTAL": (linha) => get(linha, 'detalhe.solitFsPortal'),
        "DATA FS": (linha) => get(linha, 'detalhe.dataFs'),
        "NUM FS": (linha) => get(linha, 'detalhe.numFs'),
        "GATE": (linha) => get(linha, 'detalhe.gate'),
        "GATE ID": (linha) => get(linha, 'detalhe.gateId'),
        "DATA CRIAÇÃO OS": (linha) => formatarData(get(linha, 'os.dataCriacao')),
        "KEY": (linha) => get(linha, 'detalhe.key')
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

            if (!response.ok) throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            
            const osData = await response.json();

            const userSegmentos = JSON.parse(localStorage.getItem('segmentos')) || [];
            let osDataFiltrada = osData;

            if (['MANAGER', 'COORDINATOR'].includes(userRole)) {
                osDataFiltrada = (userSegmentos.length > 0)
                    ? osData.filter(os => os.segmento && userSegmentos.includes(os.segmento.id))
                    : [];
            }

            todasAsLinhas = [];
            osDataFiltrada.forEach(os => {
                const osInfo = { ...os, detalhes: undefined };
                if (os.detalhes && os.detalhes.length > 0) {
                    os.detalhes.forEach(detalhe => {
                        todasAsLinhas.push({
                            os: osInfo,
                            detalhe: detalhe,
                            ultimoLancamento: detalhe.ultimoLancamento
                        });
                    });
                } else {
                    todasAsLinhas.push({ os: osInfo, detalhe: null, ultimoLancamento: null });
                }
            });

            renderizarTabela(todasAsLinhas);

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center text-danger">Erro ao carregar dados. Verifique o console.</td></tr>`;
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
            const tr = document.createElement('tr');
            const celulas = headers.map(header => {
                const func = dataMapping[header];
                const valor = func ? func(linhaData) : '-';
                return `<td>${valor}</td>`;
            });
            tr.innerHTML = celulas.join('');
            tableBody.appendChild(tr);
        });
    }

    // --- FUNÇÃO DE BUSCA CORRIGIDA ---
    function adicionarListenerDeBusca() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function () {
            const termoBusca = this.value.toLowerCase().trim();
            if (!termoBusca) {
                renderizarTabela(todasAsLinhas);
                return;
            }
            const linhasFiltradas = todasAsLinhas.filter(linhaData => {
                const textoPesquisavel = [
                    get(linhaData, 'os.os', ''),
                    get(linhaData, 'detalhe.site', ''),
                    get(linhaData, 'detalhe.contrato', ''),
                    get(linhaData, 'os.projeto', ''),
                    get(linhaData, 'detalhe.lpu.nomeLpu', ''),
                    get(linhaData, 'detalhe.lpu.codigoLpu', '')
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
                mostrarToast('Não há dados para exportar.', 'error');
                return;
            }
            const csvHeaders = headers;
            const csvRows = todasAsLinhas.map(linhaData => {
                const row = csvHeaders.map(header => {
                    const func = dataMapping[header];
                    let cell = func ? func(linhaData) : '';
                    if (typeof cell === 'number') {
                        cell = cell.toString().replace('.', ',');
                    }
                    return cell;
                });
                return row.map(cell => {
                    const cellStr = String(cell).replace(/(\r\n|\n|\r)/gm, " ").trim();
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
    }

    if (userRole === 'MANAGER') {
        const containerBotoes = document.getElementById('botoes-acao');
        if (containerBotoes) {
            containerBotoes.classList.add('d-none');
        }
    }

    inicializarPagina();
    adicionarListenerDeBusca();
});