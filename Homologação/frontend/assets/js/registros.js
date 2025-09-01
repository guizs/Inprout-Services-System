document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const API_BASE_URL = 'http://3.128.248.3:8080';
    let isImportCancelled = false;
    let todasAsLinhas = [];

    // Variáveis de estado para a paginação
    let paginaAtual = 1;
    let linhasPorPagina = 100;
    let linhasFiltradasCache = []; // Cache para a lista filtrada

    // Funções utilitárias
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
        return dataStr.split(' ')[0];
    };

    // Definição das colunas da tabela
    const colunasPorRole = {
        'MANAGER': ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "SITUAÇÃO", "DATA ATIVIDADE", "DATA CRIAÇÃO OS", "KEY"],
        'DEFAULT': ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO", "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "SITUAÇÃO", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS", "KEY"]
    };
    const headers = colunasPorRole[userRole] || colunasPorRole['DEFAULT'];

    // Mapeamento de dados
    const dataMapping = {
        "OS": (linha) => get(linha, 'os.os'), "SITE": (linha) => get(linha, 'detalhe.site'),
        "CONTRATO": (linha) => get(linha, 'detalhe.contrato'), "SEGMENTO": (linha) => get(linha, 'os.segmento.nome'),
        "PROJETO": (linha) => get(linha, 'os.projeto'), "GESTOR TIM": (linha) => get(linha, 'os.gestorTim'),
        "REGIONAL": (linha) => get(linha, 'detalhe.regional'), "LPU": (linha) => get(linha, 'detalhe.lpu.codigoLpu'),
        "LOTE": (linha) => get(linha, 'detalhe.lote'), "BOQ": (linha) => get(linha, 'detalhe.boq'),
        "PO": (linha) => get(linha, 'detalhe.po'), "ITEM": (linha) => get(linha, 'detalhe.item'),
        "OBJETO CONTRATADO": (linha) => get(linha, 'detalhe.lpu.nomeLpu'), "UNIDADE": (linha) => get(linha, 'detalhe.unidade'),
        "QUANTIDADE": (linha) => get(linha, 'detalhe.quantidade'), "VALOR TOTAL OS": (linha) => formatarMoeda(get(linha, 'detalhe.valorTotal')),
        "OBSERVAÇÕES": (linha) => get(linha, 'detalhe.observacoes'), "DATA PO": (linha) => get(linha, 'detalhe.dataPo'),
        "VISTORIA": (linha) => get(linha, 'ultimoLancamento.vistoria'), "PLANO VISTORIA": (linha) => get(linha, 'ultimoLancamento.planoVistoria'),
        "DESMOBILIZAÇÃO": (linha) => get(linha, 'ultimoLancamento.desmobilizacao'), "PLANO DESMOBILIZAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoDesmobilizacao'),
        "INSTALAÇÃO": (linha) => get(linha, 'ultimoLancamento.instalacao'), "PLANO INSTALAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoInstalacao'),
        "ATIVAÇÃO": (linha) => get(linha, 'ultimoLancamento.ativacao'), "PLANO ATIVAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoAtivacao'),
        "DOCUMENTAÇÃO": (linha) => get(linha, 'ultimoLancamento.documentacao'), "PLANO DOCUMENTAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoDocumentacao'),
        "ETAPA GERAL": (linha) => {
            const etapa = get(linha, 'ultimoLancamento.etapa', null);
            return etapa ? `${etapa.codigoGeral} - ${etapa.nomeGeral}` : '-';
        },
        "ETAPA DETALHADA": (linha) => {
            const etapa = get(linha, 'ultimoLancamento.etapa', null);
            return etapa ? `${etapa.indiceDetalhado} - ${etapa.nomeDetalhado}` : '-';
        },
        "STATUS": (linha) => get(linha, 'ultimoLancamento.status'), "DETALHE DIÁRIO": (linha) => get(linha, 'ultimoLancamento.detalheDiario'),
        "CÓD. PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.codigo'), "PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.nome'),
        "VALOR": (linha) => formatarMoeda(get(linha, 'ultimoLancamento.valor')), "GESTOR": (linha) => get(linha, 'ultimoLancamento.manager.nome'),
        "SITUAÇÃO": (linha) => get(linha, 'ultimoLancamento.situacao'), "DATA ATIVIDADE": (linha) => get(linha, 'ultimoLancamento.dataAtividade'),
        "FATURAMENTO": (linha) => get(linha, 'detalhe.faturamento'), "SOLICIT ID FAT": (linha) => get(linha, 'detalhe.solitIdFat'),
        "RECEB ID FAT": (linha) => get(linha, 'detalhe.recebIdFat'), "ID FATURAMENTO": (linha) => get(linha, 'detalhe.idFaturamento'),
        "DATA FAT INPROUT": (linha) => get(linha, 'detalhe.dataFatInprout'), "SOLICIT FS PORTAL": (linha) => get(linha, 'detalhe.solitFsPortal'),
        "DATA FS": (linha) => get(linha, 'detalhe.dataFs'), "NUM FS": (linha) => get(linha, 'detalhe.numFs'),
        "GATE": (linha) => get(linha, 'detalhe.gate'), "GATE ID": (linha) => get(linha, 'detalhe.gateId'),
        "DATA CRIAÇÃO OS": (linha) => formatarData(get(linha, 'os.dataCriacao')), "KEY": (linha) => get(linha, 'detalhe.key')
    };

    async function inicializarPagina() {
        const tableHead = document.getElementById('registros-table-head');
        const tableBody = document.getElementById('registros-table-body');

        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tableBody.innerHTML = `
            <tr>
                <td colspan="${headers.length}" class="text-center p-5">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2 text-muted">Buscando registros...</p>
                </td>
            </tr>`;

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

            renderizarTabelaComFiltro();

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center text-danger">Erro ao carregar dados. Verifique o console.</td></tr>`;
        }
    }

    function renderizarTabela(linhas) {
        const tableBody = document.getElementById('registros-table-body');
        const paginationInfo = document.getElementById('pagination-info');
        tableBody.innerHTML = '';

        const totalLinhas = linhas.length;
        const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(totalLinhas / linhasPorPagina);
        paginaAtual = Math.max(1, Math.min(paginaAtual, totalPaginas));

        const inicio = linhasPorPagina === 'all' ? 0 : (paginaAtual - 1) * linhasPorPagina;
        const fim = linhasPorPagina === 'all' ? totalLinhas : inicio + linhasPorPagina;
        const linhasDaPagina = linhas.slice(inicio, fim);

        if (linhasDaPagina.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Nenhum registro encontrado.</td></tr>`;
            paginationInfo.textContent = 'Mostrando 0 de 0';
            atualizarBotoesPaginacao(1);
            return;
        }

        const frag = document.createDocumentFragment();
        linhasDaPagina.forEach(linhaData => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                const func = dataMapping[header];
                const valor = func ? func(linhaData) : '-';
                td.innerHTML = valor;

                if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(header)) {
                    td.classList.add('status-cell');
                    if (valor === 'OK') td.classList.add('status-ok');
                    else if (valor === 'NOK') td.classList.add('status-nok');
                    else if (valor === 'N/A') td.classList.add('status-na');
                }

                if (["FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID"].includes(header)) {
                    td.classList.add('faturamento-col');
                }

                tr.appendChild(td);
            });
            frag.appendChild(tr);
        });
        tableBody.appendChild(frag);

        paginationInfo.textContent = `Página ${paginaAtual} de ${totalPaginas} (Mostrando ${linhasDaPagina.length} de ${totalLinhas} registros)`;
        atualizarBotoesPaginacao(totalPaginas);
    }

    function renderizarTabelaComFiltro() {
        paginaAtual = 1;
        const termoBusca = document.getElementById('searchInput').value.toLowerCase().trim();
        linhasFiltradasCache = termoBusca
            ? todasAsLinhas.filter(linhaData => {
                const textoPesquisavel = [
                    get(linhaData, 'os.os', ''), get(linhaData, 'detalhe.site', ''),
                    get(linhaData, 'detalhe.contrato', ''), get(linhaData, 'os.projeto', ''),
                    get(linhaData, 'detalhe.lpu.nomeLpu', ''), get(linhaData, 'detalhe.lpu.codigoLpu', '')
                ].join(' ').toLowerCase();
                return textoPesquisavel.includes(termoBusca);
            })
            : todasAsLinhas;
        renderizarTabela(linhasFiltradasCache);
    }

    function atualizarBotoesPaginacao(totalPaginas) {
        document.getElementById('btnPrimeiraPagina').disabled = paginaAtual <= 1;
        document.getElementById('btnPaginaAnterior').disabled = paginaAtual <= 1;
        document.getElementById('btnProximaPagina').disabled = paginaAtual >= totalPaginas;
        document.getElementById('btnUltimaPagina').disabled = paginaAtual >= totalPaginas;
    }

    // --- FUNÇÃO DE PAGINAÇÃO CORRIGIDA ---
    function adicionarListenersPaginacao() {
        document.getElementById('rowsPerPage').addEventListener('change', (e) => {
            const valor = e.target.value;
            linhasPorPagina = valor === 'all' ? 'all' : parseInt(valor, 10);
            renderizarTabela(linhasFiltradasCache); // Renderiza a lista já filtrada
        });
        document.getElementById('btnPrimeiraPagina').addEventListener('click', () => {
            paginaAtual = 1;
            renderizarTabela(linhasFiltradasCache);
        });
        document.getElementById('btnPaginaAnterior').addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarTabela(linhasFiltradasCache);
            }
        });
        document.getElementById('btnProximaPagina').addEventListener('click', () => {
            const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(linhasFiltradasCache.length / linhasPorPagina);
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarTabela(linhasFiltradasCache);
            }
        });
        document.getElementById('btnUltimaPagina').addEventListener('click', () => {
            const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(linhasFiltradasCache.length / linhasPorPagina);
            paginaAtual = totalPaginas;
            renderizarTabela(linhasFiltradasCache);
        });
    }

    const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
    if (btnDownloadTemplate) {
        btnDownloadTemplate.addEventListener('click', () => {
            const templateFilePath = '../assets/templates/template_importacao_os.xlsx';
            const link = document.createElement('a');
            link.href = templateFilePath;
            link.setAttribute('download', 'template_importacao_os.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // --- LÓGICA DE IMPORTAÇÃO CORRIGIDA ---
    const btnImportar = document.getElementById('btnImportar');
    const importFileInput = document.getElementById('importFile');

    if (btnImportar && importFileInput) {
        const modalProgressoEl = document.getElementById('modalProgressoImportacao');
        const modalProgresso = new bootstrap.Modal(modalProgressoEl);
        const textoProgresso = document.getElementById('textoProgressoImportacao');
        const barraProgresso = document.getElementById('barraProgressoImportacao');
        const errosContainer = document.getElementById('errosImportacaoContainer');
        const listaErros = document.getElementById('listaErrosImportacao');
        const btnFecharProgresso = document.getElementById('btnFecharProgressoImportacao');
        const btnCancelarImportacao = document.getElementById('btnCancelarImportacao');

        // Adiciona o listener para o botão de cancelar
        btnCancelarImportacao.addEventListener('click', () => {
            isImportCancelled = true;
            textoProgresso.textContent = "Cancelando importação...";
        });

        // --- INÍCIO DA CORREÇÃO ---
        // Adiciona o listener de clique no botão "Importar" para abrir a janela de seleção de arquivo
        btnImportar.addEventListener('click', () => {
            importFileInput.click();
        });
        // --- FIM DA CORREÇÃO ---

        importFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            isImportCancelled = false;
            textoProgresso.textContent = 'Lendo arquivo...';
            barraProgresso.style.width = '0%';
            barraProgresso.textContent = '0%';
            errosContainer.classList.add('d-none');
            listaErros.innerHTML = '';
            btnFecharProgresso.disabled = true;
            btnCancelarImportacao.classList.remove('d-none');
            modalProgresso.show();

            try {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet);

                if (rows.length === 0) throw new Error("A planilha está vazia.");

                let linhasProcessadas = 0;
                let errosGerais = [];
                const TAMANHO_LOTE = 100;

                for (let i = 0; i < rows.length; i += TAMANHO_LOTE) {
                    if (isImportCancelled) {
                        textoProgresso.textContent = 'Importação cancelada pelo usuário.';
                        break;
                    }

                    const lote = rows.slice(i, i + TAMANHO_LOTE);
                    const response = await fetch(`${API_BASE_URL}/os/importar-lote`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(lote)
                    });

                    if (response.status === 207) {
                        const errosDoLote = await response.json();
                        errosGerais.push(...errosDoLote.map(e => `Linha (aprox.) ${i + 1}: ${e}`));
                    } else if (!response.ok) {
                        throw new Error(`Erro no servidor ao processar o lote a partir da linha ${i + 1}.`);
                    }

                    linhasProcessadas += lote.length;
                    const porcentagem = Math.round((linhasProcessadas / rows.length) * 100);
                    barraProgresso.style.width = `${porcentagem}%`;
                    barraProgresso.textContent = `${porcentagem}%`;
                    textoProgresso.textContent = `Processando... ${linhasProcessadas} de ${rows.length} linhas concluídas.`;
                }

                if (!isImportCancelled) {
                    if (errosGerais.length > 0) {
                        textoProgresso.textContent = `Importação concluída com ${errosGerais.length} erro(s).`;
                        errosContainer.classList.remove('d-none');
                        listaErros.innerHTML = errosGerais.map(e => `<li class="list-group-item list-group-item-danger">${e}</li>`).join('');
                    } else {
                        textoProgresso.textContent = 'Importação concluída com sucesso!';
                    }
                }

                await inicializarPagina();

            } catch (error) {
                console.error('Erro na importação:', error);
                textoProgresso.textContent = 'Erro Crítico na Importação!';
                errosContainer.classList.remove('d-none');
                listaErros.innerHTML = `<li class="list-group-item list-group-item-danger">${error.message}</li>`;
            } finally {
                btnFecharProgresso.disabled = false;
                btnCancelarImportacao.classList.add('d-none');
                importFileInput.value = '';
            }
        });
    }

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        const modalProgressoEl = document.getElementById('modalProgressoExportacao');
        const modalProgresso = new bootstrap.Modal(modalProgressoEl);
        const textoProgresso = document.getElementById('textoProgresso');
        const barraProgresso = document.getElementById('barraProgresso');

        const atualizarProgresso = (processados, total) => {
            const porcentagem = total > 0 ? Math.round((processados / total) * 100) : 0;
            textoProgresso.textContent = `Processando linha ${processados} de ${total}...`;
            barraProgresso.style.width = `${porcentagem}%`;
            barraProgresso.textContent = `${porcentagem}%`;
            barraProgresso.setAttribute('aria-valuenow', porcentagem);
        };

        const processarEmLotes = (dados, tamanhoLote, callback) => {
            return new Promise(resolve => {
                let indice = 0;
                function processarLote() {
                    const fim = Math.min(indice + tamanhoLote, dados.length);
                    for (let i = indice; i < fim; i++) {
                        callback(dados[i]);
                    }
                    indice = fim;
                    atualizarProgresso(indice, dados.length);

                    if (indice < dados.length) {
                        setTimeout(processarLote, 0);
                    } else {
                        resolve();
                    }
                }
                processarLote();
            });
        };

        btnExportar.addEventListener('click', async () => {
            const linhasParaExportar = todasAsLinhas;
            if (linhasParaExportar.length === 0) {
                mostrarToast('Não há dados para exportar.', 'error');
                return;
            }

            modalProgresso.show();
            atualizarProgresso(0, linhasParaExportar.length);

            try {
                const csvHeaders = headers;
                const csvRows = [];

                await processarEmLotes(linhasParaExportar, 200, (linhaData) => {
                    const row = csvHeaders.map(header => {
                        const func = dataMapping[header];
                        let cell = func ? func(linhaData) : '';
                        if (typeof cell === 'number') {
                            cell = cell.toString().replace('.', ',');
                        }
                        return cell;
                    });
                    const rowString = row.map(cell => {
                        const cellStr = String(cell).replace(/(\r\n|\n|\r)/gm, " ").trim();
                        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
                            return `"${cellStr.replace(/"/g, '""')}"`;
                        }
                        return cellStr;
                    }).join(';');
                    csvRows.push(rowString);
                });

                textoProgresso.textContent = 'Gerando arquivo...';

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

            } catch (error) {
                console.error("Erro durante a exportação:", error);
                mostrarToast('Ocorreu um erro ao gerar o arquivo de exportação.', 'error');
            } finally {
                setTimeout(() => modalProgresso.hide(), 1000);
            }
        });
    }

    if (userRole === 'MANAGER') {
        const containerBotoes = document.getElementById('botoes-acao');
        if (containerBotoes) {
            containerBotoes.classList.add('d-none');
        }
    }

    inicializarPagina();
    document.getElementById('searchInput').addEventListener('input', renderizarTabelaComFiltro);
    adicionarListenersPaginacao();
});