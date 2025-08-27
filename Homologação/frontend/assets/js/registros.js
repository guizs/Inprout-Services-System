document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const API_BASE_URL = 'http://localhost:8080'; // Ajuste se a URL for outra
    let todasAsLinhas = []; // Esta variável vai guardar a lista "achatada" de linhas da tabela

    // Funções utilitárias
    const get = (obj, path, defaultValue = 'N/A') => path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : defaultValue), obj);
    const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : 'N/A';

    // Definição das colunas da tabela (mantido como estava)
    const colunasPorRole = {
        'MANAGER': ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "DATA ATIVIDADE", "DATA CRIAÇÃO OS"],
        'DEFAULT': ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS"]
    };
    const headers = colunasPorRole[userRole] || colunasPorRole['DEFAULT'];

    // ==========================================================
    // ATUALIZAÇÃO 1: Mapeamento de dados para a NOVA estrutura
    // ==========================================================
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
        "OBJETO CONTRATADO": (linha) => get(linha, 'detalhe.objetoContratado'),
        "UNIDADE": (linha) => get(linha, 'detalhe.unidade'),
        "QUANTIDADE": (linha) => get(linha, 'detalhe.quantidade'),
        "VALOR TOTAL OS": (linha) => formatarMoeda(get(linha, 'detalhe.valorTotal')),
        "OBSERVAÇÕES": (linha) => get(linha, 'detalhe.observacoes'),
        "DATA PO": (linha) => get(linha, 'detalhe.dataPo'),
        "LPU": (linha) => `${get(linha, 'detalhe.lpu.codigoLpu')} - ${get(linha, 'detalhe.lpu.nomeLpu')}`,
        "ETAPA GERAL": (linha) => get(linha, 'ultimoLancamento.etapa.nomeGeral', ''),
        "ETAPA DETALHADA": (linha) => get(linha, 'ultimoLancamento.etapa.nomeDetalhado', ''),
        "STATUS": (linha) => get(linha, 'ultimoLancamento.status', ''),
        "SITUAÇÃO": (linha) => get(linha, 'ultimoLancamento.situacao', ''),
        "DETALHE DIÁRIO": (linha) => get(linha, 'ultimoLancamento.detalheDiario', ''),
        "CÓD. PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.codigo', ''),
        "PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.nome', ''),
        "VALOR": (linha) => formatarMoeda(get(linha, 'ultimoLancamento.valor')),
        "GESTOR": (linha) => get(linha, 'ultimoLancamento.manager.nome', ''),
        "DATA ATIVIDADE": (linha) => get(linha, 'ultimoLancamento.dataAtividade', ''),
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
        "DATA CRIAÇÃO OS": (linha) => get(linha, 'os.dataCriacao')
    };

    // ==========================================================
    // ATUALIZAÇÃO 2: Lógica de inicialização para processar a NOVA estrutura
    // ==========================================================
    async function inicializarPagina() {
        const tableHead = document.getElementById('registros-table-head');
        const tableBody = document.getElementById('registros-table-body');

        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Carregando dados...</td></tr>`;

        try {
            const response = await fetch(`${API_BASE_URL}/os`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Erro do servidor:", errorText);
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            }

            const osData = await response.json();

            const userSegmentos = JSON.parse(localStorage.getItem('segmentos')) || [];
            let osDataFiltrada = osData;

            if (['MANAGER', 'COORDINATOR'].includes(userRole)) {
                osDataFiltrada = (userSegmentos.length > 0)
                    ? osData.filter(os => os.segmento && userSegmentos.includes(os.segmento.id))
                    : [];
            }

            // "Achata" a estrutura de dados: cada 'detalhe' de uma OS vira uma linha na tabela
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

    // ==========================================================
    // ATUALIZAÇÃO 3: Renderização da tabela para usar a NOVA estrutura
    // ==========================================================
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
                return func ? func(linhaData) : 'N/A';
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