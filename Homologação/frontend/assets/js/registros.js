document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const API_BASE_URL = 'http://localhost:8080';
    let isImportCancelled = false;
    let todasAsLinhas = [];

    // Variáveis de estado para a paginação
    let paginaAtual = 1;
    let linhasPorPagina = 10; // Valor inicial
    let gruposFiltradosCache = []; // Cache para os GRUPOS filtrados
    let osSortDirection = 'asc';

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
    const colunasCompletas = ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO", "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "SITUAÇÃO", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS", "KEY"];
    const colunasPorRole = {
        'MANAGER': colunasCompletas,
        'DEFAULT': colunasCompletas
    };
    const headers = colunasPorRole[userRole] || colunasPorRole['DEFAULT'];

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
        const accordionContainer = document.getElementById('accordion-registros');
        accordionContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2 text-muted">Buscando registros...</p>
            </div>`;

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/os`, {
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
                if (os.detalhes && os.detalhes.length > 0) {
                    const detalhesAtivos = os.detalhes.filter(detalhe => detalhe.statusRegistro !== 'INATIVO');

                    detalhesAtivos.forEach(detalhe => {
                        // --- INÍCIO DA CORREÇÃO ---
                        // Define qual lançamento será usado para exibição na linha
                        let lancamentoParaExibir = detalhe.ultimoLancamento;

                        // SE o backend não retornou um "ultimoLancamento" (caso do legado),
                        // E SE existe uma lista de lançamentos disponíveis...
                        if (!lancamentoParaExibir && detalhe.lancamentos && detalhe.lancamentos.length > 0) {
                            // ...nós encontramos manualmente o lançamento com o maior ID (o mais recente).
                            lancamentoParaExibir = detalhe.lancamentos.reduce((maisRecente, atual) => {
                                return (maisRecente.id > atual.id) ? maisRecente : atual;
                            });
                        }
                        // --- FIM DA CORREÇÃO ---

                        todasAsLinhas.push({
                            os: os,
                            detalhe: detalhe,
                            // Usa o lançamento que definimos acima, garantindo que nunca seja nulo se houver dados.
                            ultimoLancamento: lancamentoParaExibir
                        });
                    });
                } else {
                    todasAsLinhas.push({ os: os, detalhe: null, ultimoLancamento: null });
                }
            });

            const btnSortOS = document.getElementById('btnSortOS');
            if (btnSortOS) {
                btnSortOS.addEventListener('click', () => {
                    // Inverte a direção da ordenação
                    osSortDirection = osSortDirection === 'asc' ? 'desc' : 'asc';

                    // Atualiza o ícone do botão
                    const icon = btnSortOS.querySelector('i');
                    icon.classList.toggle('bi-sort-down', osSortDirection === 'asc');
                    icon.classList.toggle('bi-sort-up-alt', osSortDirection === 'desc');

                    // Chama a função que renderiza a tabela para aplicar a nova ordem
                    renderizarTabelaComFiltro();
                });
            }

            renderizarTabelaComFiltro();

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            accordionContainer.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados. Verifique o console.</div>`;
        }
    }

    /**
     * Gera o HTML completo para um único grupo de OS no acordeão.
     * @param {object} grupo - O objeto do grupo da OS contendo seus dados e linhas.
     * @returns {string} - A string HTML do elemento do acordeão.
     */
    function gerarHtmlParaGrupo(grupo) {
        const uniqueId = grupo.id;

        const valorTotalOS = get(grupo.linhas[0], 'os.detalhes', [])
            .reduce((sum, d) => sum + (d.valorTotal || 0), 0);

        const valorTotalCPS = grupo.linhas
            .flatMap(linha => get(linha, 'detalhe.lancamentos', []))
            .filter(lanc => lanc.situacaoAprovacao === 'APROVADO')
            .reduce((sum, lanc) => sum + (lanc.valor || 0), 0);

        const custoTotalMateriais = get(grupo.linhas[0], 'os.custoTotalMateriais', 0) || 0;
        const percentual = valorTotalOS > 0 ? ((valorTotalCPS + custoTotalMateriais) / valorTotalOS) * 100 : 0;

        let kpiHTML = '';
        if (userRole !== 'MANAGER') {
            kpiHTML = `
            <div class="header-kpi-wrapper">
                <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(valorTotalOS)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(valorTotalCPS)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Total Material</span><span class="kpi-value">${formatarMoeda(custoTotalMateriais)}</span></div>
                <div class="header-kpi"><span class="kpi-label">%</span><span class="kpi-value kpi-percentage">${percentual.toFixed(2)}%</span></div>
            </div>`;
        }

        const headersComAcoes = (userRole === 'ADMIN' || userRole === 'ASSISTANT') ? [...headers, "AÇÕES"] : headers;

        const bodyRowsHTML = grupo.linhas.map(linhaData => {
            const cellsHTML = headersComAcoes.map(header => {
                if (header === "AÇÕES") {
                    const detalheId = get(linhaData, 'detalhe.id', '');
                    let btnEditar = detalheId ? `<button class="btn btn-sm btn-outline-primary btn-edit-detalhe" data-id="${detalheId}" title="Editar Detalhe de Registro (Chave/Segmento)"><i class="bi bi-pencil-fill"></i></button>` : '';
                    const btnExcluir = `<button class="btn btn-sm btn-outline-danger btn-delete-registro" data-id="${detalheId}" title="Excluir Registro"><i class="bi bi-trash-fill"></i></button>`;
                    return `<td><div class="d-flex justify-content-center gap-2">${btnEditar} ${btnExcluir}</div></td>`;
                }
                const func = dataMapping[header];
                const valor = func ? func(linhaData) : '-';
                let classes = '';
                if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(header)) {
                    classes += ' status-cell';
                    if (valor === 'OK') classes += ' status-ok'; else if (valor === 'NOK') classes += ' status-nok'; else if (valor === 'N/A') classes += ' status-na';
                }
                if (header === "DETALHE DIÁRIO") classes += ' detalhe-diario-cell';
                return `<td class="${classes}">${valor}</td>`;
            }).join('');
            return `<tr>${cellsHTML}</tr>`;
        }).join('');

        const headerHTML = `
        <h2 class="accordion-header" id="heading-${uniqueId}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                <div class="header-content">
                    <div class="header-title-wrapper"><span class="header-title-project">${grupo.projeto}</span><span class="header-title-os">${grupo.os}</span></div>
                    ${kpiHTML}
                    <span class="badge bg-primary header-badge">${grupo.linhas.length} itens</span>
                </div>
            </button>
        </h2>`;

        const bodyHTML = `
        <div id="collapse-${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#accordion-registros">
            <div class="accordion-body">
                <div class="table-responsive">
                    <table class="table modern-table table-sm">
                        <thead><tr>${headersComAcoes.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                        <tbody>${bodyRowsHTML}</tbody>
                    </table>
                </div>
            </div>
        </div>`;

        return `<div class="accordion-item" id="accordion-item-${uniqueId}">${headerHTML}${bodyHTML}</div>`;
    }

    function renderizarTabela() {
        const accordionContainer = document.getElementById('accordion-registros');
        const paginationInfo = document.getElementById('pagination-info');
        accordionContainer.innerHTML = '';

        const grupos = gruposFiltradosCache;

        if (grupos.length === 0) {
            accordionContainer.innerHTML = `<div class="text-center p-4 text-muted">Nenhum registro encontrado.</div>`;
            paginationInfo.textContent = 'Mostrando 0 de 0 grupos';
            atualizarBotoesPaginacao(1);
            return;
        }

        const totalGrupos = grupos.length;
        const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(totalGrupos / linhasPorPagina);
        paginaAtual = Math.max(1, Math.min(paginaAtual, totalPaginas));

        const inicio = linhasPorPagina === 'all' ? 0 : (paginaAtual - 1) * linhasPorPagina;
        const fim = linhasPorPagina === 'all' ? totalGrupos : inicio + linhasPorPagina;
        const gruposDaPagina = grupos.slice(inicio, fim);

        const frag = document.createDocumentFragment();

        gruposDaPagina.forEach((grupo, index) => {
            const uniqueId = `${grupo.id}-${index}`;
            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.id = `accordion-item-${uniqueId}`;

            // ===== INÍCIO DA CORREÇÃO E NOVOS CÁLCULOS =====
            // O valor total da OS é a soma do valor de todos os seus detalhes (linhas da planilha).
            const valorTotalOS = get(grupo.linhas[0], 'os.detalhes', [])
                .reduce((sum, d) => sum + (d.valorTotal || 0), 0);

            // O Total CPS agora busca a lista completa de lançamentos que adicionamos no DTO
            const valorTotalCPS = grupo.linhas
                .flatMap(linha => get(linha, 'detalhe.lancamentos', [])) // Busca na nova lista 'lancamentos'
                .filter(lanc => lanc.situacaoAprovacao === 'APROVADO')
                .reduce((sum, lanc) => sum + (lanc.valor || 0), 0);

            // Pega o custo de material diretamente do objeto OS (calculado no backend).
            const custoTotalMateriais = get(grupo.linhas[0], 'os.custoTotalMateriais', 0) || 0;

            // O novo percentual considera tanto o CPS quanto o custo de material.
            const percentual = valorTotalOS > 0 ? ((valorTotalCPS + custoTotalMateriais) / valorTotalOS) * 100 : 0;

            let kpiHTML = '';
            if (userRole !== 'MANAGER') {
                kpiHTML = `
                <div class="header-kpi-wrapper">
                    <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(valorTotalOS)}</span></div>
                    <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(valorTotalCPS)}</span></div>
                    <div class="header-kpi"><span class="kpi-label">Total Material</span><span class="kpi-value">${formatarMoeda(custoTotalMateriais)}</span></div>
                    <div class="header-kpi"><span class="kpi-label">%</span><span class="kpi-value kpi-percentage">${percentual.toFixed(2)}%</span></div>
                </div>`;
            }

            const headerHTML = `
            <h2 class="accordion-header" id="heading-${uniqueId}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                    <div class="header-content">
                        <div class="header-title-wrapper"><span class="header-title-project">${grupo.projeto}</span><span class="header-title-os">${grupo.os}</span></div>
                        ${kpiHTML}
                        <span class="badge bg-primary header-badge">${grupo.linhas.length} itens</span>
                    </div>
                </button>
            </h2>`;

            const headersComAcoes = (userRole === 'ADMIN' || userRole === 'ASSISTANT') ? [...headers, "AÇÕES"] : headers;

            const bodyRowsHTML = grupo.linhas.map(linhaData => {
                const cellsHTML = headersComAcoes.map(header => {
                    if (header === "AÇÕES") {
                        const detalheId = get(linhaData, 'detalhe.id', '');
                        const chave = get(linhaData, 'detalhe.key', '-');
                        const semChave = chave === '-' || chave === '' || chave === null;

                        // [CORREÇÃO 1] Altera a classe do botão de editar para .btn-edit-detalhe
                        // O botão só será renderizado se houver um detalheId
                        let btnEditar = '';
                        if (detalheId) {
                            btnEditar = `<button class="btn btn-sm btn-outline-primary btn-edit-detalhe" data-id="${detalheId}" title="Editar Detalhe de Registro (Chave/Segmento)"><i class="bi bi-pencil-fill"></i></button>`;
                        }

                        const btnExcluir = `<button class="btn btn-sm btn-outline-danger btn-delete-registro" data-id="${detalheId}" title="Excluir Registro"><i class="bi bi-trash-fill"></i></button>`;
                        return `<td><div class="d-flex justify-content-center gap-2">${btnEditar} ${btnExcluir}</div></td>`;
                    }
                    const func = dataMapping[header];
                    const valor = func ? func(linhaData) : '-';
                    let classes = '';
                    if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(header)) {
                        classes += ' status-cell';
                        if (valor === 'OK') classes += ' status-ok'; else if (valor === 'NOK') classes += ' status-nok'; else if (valor === 'N/A') classes += ' status-na';
                    }
                    if (header === "DETALHE DIÁRIO") classes += ' detalhe-diario-cell';
                    return `<td class="${classes}">${valor}</td>`;
                }).join('');
                return `<tr>${cellsHTML}</tr>`;
            }).join('');

            const bodyHTML = `
            <div id="collapse-${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#accordion-registros">
                <div class="accordion-body">
                    <div class="table-responsive">
                        <table class="table modern-table table-sm">
                            <thead><tr>${headersComAcoes.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                            <tbody>${bodyRowsHTML}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;

            item.innerHTML = headerHTML + bodyHTML;
            frag.appendChild(item);
        });

        accordionContainer.appendChild(frag);
        paginationInfo.textContent = `Página ${paginaAtual} de ${totalPaginas} (${totalGrupos} grupos)`;
        atualizarBotoesPaginacao(totalPaginas);
    }

    async function carregarSegmentosESelecionarAtual(segmentoAtualId) {
        const selectSegmento = document.getElementById('selectSegmento');

        try {
            // Reutiliza a lógica de busca de segmentos
            const response = await fetchComAuth(`${API_BASE_URL}/segmentos`);
            if (!response.ok) throw new Error('Falha ao carregar segmentos.');
            const segmentos = await response.json();

            selectSegmento.innerHTML = '<option value="" disabled>Selecione o segmento...</option>';
            segmentos.forEach(seg => {
                const option = document.createElement('option');
                option.value = seg.id;
                option.textContent = seg.nome;
                // Compara o ID de forma frouxa para garantir que a seleção funcione
                if (seg.id == segmentoAtualId) {
                    option.selected = true;
                }
                selectSegmento.appendChild(option);
            });
            // Mantém desabilitado até o toggle ser ativado
            selectSegmento.disabled = true;

        } catch (error) {
            selectSegmento.innerHTML = '<option value="" disabled>Erro ao carregar</option>';
        }
    }

    function renderizarTabelaComFiltro() {
        const termoBusca = document.getElementById('searchInput').value.toLowerCase().trim();
        const linhasFiltradas = termoBusca
            ? todasAsLinhas.filter(linhaData => {
                const textoPesquisavel = [
                    get(linhaData, 'os.os', ''),
                    get(linhaData, 'detalhe.site', ''),
                    get(linhaData, 'detalhe.contrato', ''),
                    get(linhaData, 'os.projeto', ''),
                    get(linhaData, 'detalhe.lpu.nomeLpu', ''),
                    get(linhaData, 'detalhe.lpu.codigoLpu', ''),
                    get(linhaData, 'detalhe.key', '')
                ].join(' ').toLowerCase();
                return textoPesquisavel.includes(termoBusca);
            })
            : todasAsLinhas;

        const agrupado = Object.values(linhasFiltradas.reduce((acc, linha) => {
            const chaveGrupo = `${get(linha, 'os.projeto', 'Sem Projeto')} / ${get(linha, 'os.os', 'Sem OS')}`;
            if (!acc[chaveGrupo]) {
                acc[chaveGrupo] = {
                    linhas: [],
                    projeto: get(linha, 'os.projeto', 'Sem Projeto'),
                    os: get(linha, 'os.os', 'Sem OS'),
                    id: get(linha, 'os.id', 'sem-id')
                };
            }
            acc[chaveGrupo].linhas.push(linha);
            return acc;
        }, {}));

        agrupado.sort((a, b) => {
            const osA = a.os.toLowerCase();
            const osB = b.os.toLowerCase();
            if (osA < osB) {
                return osSortDirection === 'asc' ? -1 : 1;
            }
            if (osA > osB) {
                return osSortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        gruposFiltradosCache = agrupado;
        paginaAtual = 1; // Reseta para a primeira página a cada novo filtro
        renderizarTabela();
    }

    function atualizarBotoesPaginacao(totalPaginas) {
        document.getElementById('btnPrimeiraPagina').disabled = paginaAtual <= 1;
        document.getElementById('btnPaginaAnterior').disabled = paginaAtual <= 1;
        document.getElementById('btnProximaPagina').disabled = paginaAtual >= totalPaginas;
        document.getElementById('btnUltimaPagina').disabled = paginaAtual >= totalPaginas;
    }

    function adicionarListenersPaginacao() {
        document.getElementById('rowsPerPage').addEventListener('change', (e) => {
            const valor = e.target.value;
            linhasPorPagina = valor === 'all' ? 'all' : parseInt(valor, 10);
            paginaAtual = 1; // Volta para a primeira página ao mudar a quantidade de itens
            renderizarTabela();
        });
        document.getElementById('btnPrimeiraPagina').addEventListener('click', () => {
            paginaAtual = 1;
            renderizarTabela();
        });
        document.getElementById('btnPaginaAnterior').addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarTabela();
            }
        });
        document.getElementById('btnProximaPagina').addEventListener('click', () => {
            const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(gruposFiltradosCache.length / linhasPorPagina);
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarTabela();
            }
        });
        document.getElementById('btnUltimaPagina').addEventListener('click', () => {
            const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(gruposFiltradosCache.length / linhasPorPagina);
            paginaAtual = totalPaginas;
            renderizarTabela();
        });
    }

    function adicionarListenersDeAcoes() {
        const accordionContainer = document.getElementById('accordion-registros');

        // [CORREÇÃO 2] Instancia ambos os modais UMA ÚNICA vez na função
        const modalEditarDetalheEl = document.getElementById('modalEditarDetalhe');
        const modalEditarDetalhe = modalEditarDetalheEl ? new bootstrap.Modal(modalEditarDetalheEl) : null;

        const modalConfirmarExclusaoEl = document.getElementById('modalConfirmarExclusao');
        const modalConfirmarExclusao = modalConfirmarExclusaoEl ? new bootstrap.Modal(modalConfirmarExclusaoEl) : null;

        // Listener para editar/excluir
        accordionContainer.addEventListener('click', function (e) {

            // [CORREÇÃO 3] Busca pelo nome da classe corrigida (.btn-edit-detalhe)
            const btnEdit = e.target.closest('.btn-edit-detalhe');
            const btnDelete = e.target.closest('.btn-delete-registro');

            if (btnEdit) {
                e.preventDefault();
                const detalheId = btnEdit.dataset.id;

                if (!detalheId) {
                    mostrarToast("Registro de detalhe não possui ID para edição.", "warning");
                    return;
                }

                const linhaData = todasAsLinhas.find(l => get(l, 'detalhe.id') == detalheId);

                if (modalEditarDetalhe && linhaData) {

                    const formEditarDetalheEl = document.getElementById('formEditarDetalhe');
                    document.getElementById('editDetalheId').value = detalheId;

                    document.getElementById('osValue').value = get(linhaData, 'os.os', 'N/A');

                    const chaveExistente = get(linhaData, 'detalhe.key', '');
                    document.getElementById('novaKeyValue').value = chaveExistente;

                    const segmentoAtualId = get(linhaData, 'os.segmento.id');
                    carregarSegmentosESelecionarAtual(segmentoAtualId);

                    // Armazena valores originais no dataset para comparação
                    formEditarDetalheEl.dataset.originalKey = chaveExistente;
                    formEditarDetalheEl.dataset.originalSegmentoId = segmentoAtualId;

                    // Reseta o estado dos switches e campos
                    document.querySelectorAll('#formEditarDetalhe .toggle-editar').forEach(toggle => {
                        toggle.checked = false;
                        const targetInput = document.querySelector(toggle.dataset.target);
                        if (targetInput) targetInput.disabled = true;
                    });

                    // Desabilita o botão de salvar até que algo seja alterado
                    document.getElementById('btnSalvarDetalhe').disabled = true;

                    // [CORREÇÃO 4] Ação final: mostra o modal de edição
                    modalEditarDetalhe.show();
                } else {
                    mostrarToast("Não foi possível carregar os dados para edição.", "error");
                }
            }

            if (btnDelete) {
                const detalheId = btnDelete.dataset.id;
                document.getElementById('deleteDetalheId').value = detalheId;

                if (modalConfirmarExclusao) {
                    // [CORREÇÃO 5] Ação final: mostra o modal de exclusão (agora que modalConfirmarExclusao é uma instância válida)
                    modalConfirmarExclusao.show();
                }
            }
        });

        // Adiciona o listener para habilitar/desabilitar o botão salvar
        const formEditarDetalheEl = document.getElementById('formEditarDetalhe');
        if (formEditarDetalheEl) {

            formEditarDetalheEl.addEventListener('change', (e) => {
                if (e.target.classList.contains('toggle-editar')) {
                    const toggle = e.target;
                    const targetSelector = toggle.dataset.target;
                    const targetInput = document.querySelector(targetSelector);

                    if (targetInput) {
                        targetInput.disabled = !toggle.checked;

                        // Garante que o evento 'input' seja disparado para reavaliar o botão Salvar
                        const event = new Event('input', { bubbles: true });
                        targetInput.dispatchEvent(event);
                    }
                }
            });

            // Este listener verifica se os toggles estão ativos E se os valores mudaram.
            formEditarDetalheEl.addEventListener('input', () => {
                const originalKey = formEditarDetalheEl.dataset.originalKey || '';
                const originalSegmentoId = formEditarDetalheEl.dataset.originalSegmentoId;

                const currentKey = document.getElementById('novaKeyValue').value;
                const currentSegmentoId = document.getElementById('selectSegmento').value;

                // Verifica se o toggle está ligado E se o valor atual é diferente do original
                const keyChanged = originalKey !== currentKey && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#novaKeyValue"]').checked;
                const segmentoChanged = originalSegmentoId != currentSegmentoId && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#selectSegmento"]').checked;

                // Habilita o botão se qualquer um dos dois for verdadeiro
                document.getElementById('btnSalvarDetalhe').disabled = !(keyChanged || segmentoChanged);
            });

            // Lógica para salvar a nova KEY e Segmento
            formEditarDetalheEl.addEventListener('submit', async function (e) {
                e.preventDefault();
                const detalheId = document.getElementById('editDetalheId').value;
                const btnSalvar = document.getElementById('btnSalvarDetalhe');

                // Pega os valores para comparação
                const originalKey = formEditarDetalheEl.dataset.originalKey || '';
                const originalSegmentoId = formEditarDetalheEl.dataset.originalSegmentoId;

                const currentKey = document.getElementById('novaKeyValue').value;
                const currentSegmentoId = document.getElementById('selectSegmento').value;

                const keyChanged = originalKey !== currentKey && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#novaKeyValue"]').checked;
                const segmentoChanged = originalSegmentoId != currentSegmentoId && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#selectSegmento"]').checked;

                if (!(keyChanged || segmentoChanged)) {
                    mostrarToast('Nenhuma alteração para salvar.', 'warning');
                    return;
                }

                btnSalvar.disabled = true;
                btnSalvar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

                const promises = [];

                // 1. Promessa para atualizar a Key
                if (keyChanged) {
                    promises.push(fetchComAuth(`${API_BASE_URL}/os/detalhe/${detalheId}/key`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: currentKey })
                    }));
                }

                // 2. Promessa para atualizar o Segmento (chama o novo endpoint)
                if (segmentoChanged) {
                    promises.push(fetchComAuth(`${API_BASE_URL}/os/detalhe/${detalheId}/segmento`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ novoSegmentoId: parseInt(currentSegmentoId) })
                    }));
                }

                try {
                    const results = await Promise.all(promises);

                    let allSuccessful = true;
                    let errorMessages = [];

                    for (let i = 0; i < results.length; i++) {
                        const response = results[i];
                        if (!response.ok) {
                            allSuccessful = false;
                            const errorType = (i === 0 && keyChanged) ? "Chave Externa" : "Segmento";
                            let errorMessage = `${errorType}: Erro desconhecido ou de rede.`;
                            try {
                                // Tenta ler a mensagem de erro do backend
                                const errorData = await response.json();
                                errorMessage = `${errorType}: ${errorData.message || 'Erro de validação.'}`;
                            } catch { }
                            errorMessages.push(errorMessage);
                        }
                    }

                    if (allSuccessful) {
                        mostrarToast('Detalhes atualizados com sucesso!', 'success');
                    } else {
                        // Lançar um erro para o bloco catch tratar
                        throw new Error(errorMessages.join(' | '));
                    }

                    if (modalEditarDetalhe) modalEditarDetalhe.hide();
                    await inicializarPagina();

                } catch (error) {
                    mostrarToast(error.message, 'error');
                } finally {
                    btnSalvar.disabled = false;
                    btnSalvar.innerHTML = 'Salvar Alterações';
                }
            });
        }



        // Lógica para confirmar a exclusão (mantida)
        const btnConfirmarExclusaoDefinitivaEl = document.getElementById('btnConfirmarExclusaoDefinitiva');
        if (btnConfirmarExclusaoDefinitivaEl) {
            btnConfirmarExclusaoDefinitivaEl.addEventListener('click', async function () {
                const detalheId = document.getElementById('deleteDetalheId').value;
                const btnConfirmar = this;

                btnConfirmar.disabled = true;
                btnConfirmar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Excluindo...`;
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarExclusao'));

                try {
                    const response = await fetchComAuth(`${API_BASE_URL}/os/detalhe/${detalheId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        let errorMsg = 'Erro ao excluir o registro.';
                        try {
                            const errorData = await response.json();
                            errorMsg = errorData.message || `Erro desconhecido. Status: ${response.status}.`;
                        } catch (e) {
                            const errorText = await response.text();
                            errorMsg = errorText || `Erro de rede/servidor. Status: ${response.status}.`;
                        }
                        throw new Error(errorMsg);
                    }

                    mostrarToast('Registro excluído com sucesso!', 'success');
                    if (modalInstance) modalInstance.hide();
                    await inicializarPagina();

                } catch (error) {
                    console.error("Erro ao excluir o registro:", error);
                    mostrarToast(error.message, 'error');
                } finally {
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = 'Sim, Excluir';
                }
            });
        }
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
        const importLegadoCheckbox = document.getElementById('importLegado');


        btnCancelarImportacao.addEventListener('click', () => {
            isImportCancelled = true;
            textoProgresso.textContent = "Cancelando importação...";
        });

        btnImportar.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const isLegado = importLegadoCheckbox.checked;
            const formData = new FormData();
            formData.append('file', file);

            // Configuração inicial do modal de progresso
            isImportCancelled = false;
            textoProgresso.textContent = 'Enviando arquivo...';
            barraProgresso.style.width = '0%';
            barraProgresso.textContent = '0%';
            errosContainer.classList.add('d-none');
            listaErros.innerHTML = '';
            btnFecharProgresso.disabled = true;
            btnCancelarImportacao.classList.remove('d-none');
            modalProgresso.show();

            try {
                const response = await fetchComAuth(`${API_BASE_URL}/os/importar?legado=${isLegado}`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `Erro no servidor durante a importação.`);
                }

                barraProgresso.style.width = '100%';
                barraProgresso.textContent = '100%';
                textoProgresso.textContent = 'Processando atualizações...';

                // ================== INÍCIO DA NOVA LÓGICA DE ATUALIZAÇÃO ==================
                const updatedOsList = await response.json();

                if (updatedOsList.length > 0) {
                    const updatedOsIds = updatedOsList.map(os => os.id);

                    // 1. Adiciona um feedback visual de "Atualizando..." nos itens que serão modificados
                    updatedOsIds.forEach(id => {
                        const elementoExistente = document.getElementById(`accordion-item-${id}`);
                        if (elementoExistente) {
                            elementoExistente.innerHTML = `<div class="p-4 text-center text-muted"><div class="spinner-border spinner-border-sm text-primary" role="status"></div> Atualizando...</div>`;
                        }
                    });

                    // Pequeno delay para o navegador renderizar o spinner
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // 2. Atualiza o cache de dados global (`todasAsLinhas`)
                    todasAsLinhas = todasAsLinhas.filter(linha => !updatedOsIds.includes(linha.os.id));
                    updatedOsList.forEach(os => {
                        (os.detalhes || []).forEach(detalhe => {
                            todasAsLinhas.push({
                                os: os,
                                detalhe: detalhe,
                                ultimoLancamento: detalhe.ultimoLancamento
                            });
                        });
                    });

                    // 3. Substitui os placeholders pelos novos conteúdos ou adiciona novos itens
                    const accordionContainer = document.getElementById('accordion-registros');
                    updatedOsList.forEach(os => {
                        const grupo = {
                            id: os.id,
                            os: os.os,
                            projeto: os.projeto,
                            linhas: (os.detalhes || []).map(detalhe => ({
                                os: os,
                                detalhe: detalhe,
                                ultimoLancamento: detalhe.ultimoLancamento
                            }))
                        };
                        const novoHtml = gerarHtmlParaGrupo(grupo);
                        const placeholderElement = document.getElementById(`accordion-item-${os.id}`);

                        if (placeholderElement) {
                            placeholderElement.outerHTML = novoHtml; // Substitui o item
                        } else {
                            accordionContainer.insertAdjacentHTML('afterbegin', novoHtml); // Adiciona novo item no topo
                        }
                    });
                }

                // Força a atualização do cache de grupos filtrados para a paginação
                renderizarTabelaComFiltro();
                // ================== FIM DA NOVA LÓGICA DE ATUALIZAÇÃO ==================

                textoProgresso.textContent = 'Importação concluída com sucesso!';

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
            const gruposParaExportar = gruposFiltradosCache;
            if (gruposParaExportar.length === 0) {
                mostrarToast('Não há dados para exportar.', 'error');
                return;
            }

            // Mostra o modal de progresso
            const modalProgressoEl = document.getElementById('modalProgressoExportacao');
            const modalProgresso = new bootstrap.Modal(modalProgressoEl);
            const textoProgresso = document.getElementById('textoProgresso');
            modalProgresso.show();
            textoProgresso.textContent = 'Preparando dados...';

            try {
                // --- INÍCIO DA LÓGICA PARA MÚLTIPLAS ABAS ---

                // 1. Prepara os dados para a Aba de Resumo
                textoProgresso.textContent = 'Gerando aba de resumo...';
                const resumoHeaders = ["Projeto", "OS", "Total OS", "Total CPS Aprovado", "Total Material", "% Concluído"];
                const resumoRows = gruposParaExportar.map(grupo => {
                    // Reutiliza a mesma lógica de cálculo do cabeçalho do acordeão
                    const valorTotalOS = get(grupo.linhas[0], 'os.detalhes', [])
                        .reduce((sum, d) => sum + (d.valorTotal || 0), 0);

                    const valorTotalCPS = grupo.linhas
                        .flatMap(linha => get(linha, 'detalhe.lancamentos', []))
                        .filter(lanc => lanc.situacaoAprovacao === 'APROVADO')
                        .reduce((sum, lanc) => sum + (lanc.valor || 0), 0);

                    const custoTotalMateriais = get(grupo.linhas[0], 'os.custoTotalMateriais', 0) || 0;

                    const percentual = valorTotalOS > 0 ? ((valorTotalCPS + custoTotalMateriais) / valorTotalOS) * 100 : 0;

                    return [
                        grupo.projeto,
                        grupo.os,
                        valorTotalOS,
                        valorTotalCPS,
                        custoTotalMateriais,
                        percentual // O Excel pode formatar como porcentagem
                    ];
                });

                // 2. Prepara os dados para a Aba de Detalhes (lógica que já tínhamos)
                textoProgresso.textContent = 'Gerando aba de detalhes...';
                const detalhesHeaders = headers; // Headers globais da tabela
                const detalhesRows = gruposParaExportar.flatMap(g => g.linhas).map(linhaData => {
                    return detalhesHeaders.map(header => {
                        const func = dataMapping[header];
                        if (!func) return '-';

                        let cellValue = func(linhaData);

                        // Formata para tipos corretos para o Excel
                        if (header.toUpperCase().includes('VALOR')) {
                            const rawValue = get(linhaData, header === 'VALOR' ? 'ultimoLancamento.valor' : 'detalhe.valorTotal', 0) || 0;
                            return rawValue; // Passa como número
                        }
                        if (header.toUpperCase().includes('DATA') || header.toUpperCase().includes('PLANO')) {
                            if (!cellValue) return null;
                            const partes = cellValue.split(' ')[0].split('/');
                            if (partes.length === 3) return new Date(partes[2], partes[1] - 1, partes[0]);
                            return cellValue;
                        }
                        return cellValue;
                    });
                });

                // 3. Cria o arquivo Excel com as duas abas
                textoProgresso.textContent = 'Montando arquivo...';

                // Cria a planilha de Resumo
                const ws_resumo = XLSX.utils.aoa_to_sheet([resumoHeaders, ...resumoRows]);
                ws_resumo['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]; // Larguras customizadas

                // Cria a planilha de Detalhes
                const ws_detalhes = XLSX.utils.aoa_to_sheet([detalhesHeaders, ...detalhesRows]);
                ws_detalhes['!cols'] = detalhesHeaders.map(h => ({ wch: Math.max(15, h.length + 2) })); // Largura automática

                // Cria um novo "livro" (arquivo Excel)
                const wb = XLSX.utils.book_new();

                // Adiciona as duas planilhas ao livro, com seus respectivos nomes
                XLSX.utils.book_append_sheet(wb, ws_resumo, "Resumo OS");
                XLSX.utils.book_append_sheet(wb, ws_detalhes, "Lançamentos Detalhados");

                // 4. Inicia o download do arquivo
                XLSX.writeFile(wb, "relatorio_registros.xlsx");

                // --- FIM DA LÓGICA ---

            } catch (error) {
                console.error("Erro durante a exportação:", error);
                mostrarToast('Ocorreu um erro ao gerar o arquivo de exportação.', 'error');
            } finally {
                setTimeout(() => modalProgresso.hide(), 500);
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
    adicionarListenersDeAcoes();
});