document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const API_BASE_URL = 'https://www.inproutservices.com.br/api';
    let isImportCancelled = false;
    let todasAsLinhas = [];

    // Variáveis de estado para a paginação
    let paginaAtual = 1;
    let linhasPorPagina = 10; // Valor inicial
    let gruposFiltradosCache = []; // Cache para os GRUPOS filtrados
    let osSortDirection = 'asc';

    // Funções utilitárias
    const get = (obj, path, defaultValue = '-') => {
        if (obj === null || obj === undefined) {
            return defaultValue;
        }
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
        if (!dataStr || dataStr === '-') return '-'; // <-- CORREÇÃO AQUI
        let dataLimpa = dataStr.split(' ')[0];
        if (dataLimpa.includes('-')) {
            dataLimpa = dataLimpa.split('-').reverse().join('/');
        }
        // Trata datas inválidas ou vazias que o JS pode gerar
        if (dataLimpa === '//' || dataLimpa === 'Invalid Date') return '-'; // <-- CORREÇÃO AQUI
        return dataLimpa;
    };


    // Definição das colunas da tabela
    const colunasCompletas = ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO", "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "SITUAÇÃO", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS", "KEY"];
    const colunasGestor = ["HISTÓRICO", "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "QUANTIDADE", "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO", "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "SITUAÇÃO", "DATA ATIVIDADE", "KEY"];

    const colunasPorRole = {
        'MANAGER': colunasGestor,
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
        "OBSERVAÇÕES": (linha) => get(linha, 'detalhe.observacoes'), "DATA PO": (linha) => formatarData(get(linha, 'detalhe.dataPo')),
        "VISTORIA": (linha) => get(linha, 'ultimoLancamento.vistoria'), "PLANO VISTORIA": (linha) => formatarData(get(linha, 'ultimoLancamento.planoVistoria')),
        "DESMOBILIZAÇÃO": (linha) => get(linha, 'ultimoLancamento.desmobilizacao'), "PLANO DESMOBILIZAÇÃO": (linha) => formatarData(get(linha, 'ultimoLancamento.planoDesmobilizacao')),
        "INSTALAÇÃO": (linha) => get(linha, 'ultimoLancamento.instalacao'), "PLANO INSTALAÇÃO": (linha) => formatarData(get(linha, 'ultimoLancamento.planoInstalacao')),
        "ATIVAÇÃO": (linha) => get(linha, 'ultimoLancamento.ativacao'), "PLANO ATIVAÇÃO": (linha) => formatarData(get(linha, 'ultimoLancamento.planoAtivacao')),
        "DOCUMENTAÇÃO": (linha) => get(linha, 'ultimoLancamento.documentacao'), "PLANO DOCUMENTAÇÃO": (linha) => formatarData(get(linha, 'ultimoLancamento.planoDocumentacao')),
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
        "SITUAÇÃO": (linha) => get(linha, 'ultimoLancamento.situacao'), "DATA ATIVIDADE": (linha) => formatarData(get(linha, 'ultimoLancamento.dataAtividade')),
        "FATURAMENTO": (linha) => get(linha, 'detalhe.faturamento'), "SOLICIT ID FAT": (linha) => get(linha, 'detalhe.solitIdFat'),
        "RECEB ID FAT": (linha) => get(linha, 'detalhe.recebIdFat'), "ID FATURAMENTO": (linha) => get(linha, 'detalhe.idFaturamento'),
        "DATA FAT INPROUT": (linha) => formatarData(get(linha, 'detalhe.dataFatInprout')), "SOLICIT FS PORTAL": (linha) => get(linha, 'detalhe.solitFsPortal'),
        "DATA FS": (linha) => formatarData(get(linha, 'detalhe.dataFs')), "NUM FS": (linha) => get(linha, 'detalhe.numFs'),
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
                // A lógica agora só processa OSs que têm detalhes.
                if (os.detalhes && os.detalhes.length > 0) {
                    // Filtra para manter apenas os detalhes que estão com o status "ATIVO".
                    const detalhesAtivos = os.detalhes.filter(detalhe => detalhe.statusRegistro !== 'INATIVO');

                    // Adicionada uma verificação para garantir que, mesmo após o filtro, ainda existam detalhes a serem exibidos.
                    if (detalhesAtivos.length > 0) {
                        detalhesAtivos.forEach(detalhe => {
                            let lancamentoParaExibir = detalhe.ultimoLancamento;

                            // Se a API não retornou um 'ultimoLancamento' ou se a lista local de lançamentos existe,
                            // aplicamos a lógica de seleção para garantir que o lançamento correto seja exibido.
                            if (!lancamentoParaExibir && detalhe.lancamentos && detalhe.lancamentos.length > 0) {

                                // 1. Tenta encontrar o lançamento operacional mais recente
                                const lancamentosOperacionais = detalhe.lancamentos.filter(l => l.situacaoAprovacao !== 'APROVADO_LEGADO');

                                if (lancamentosOperacionais.length > 0) {
                                    lancamentoParaExibir = lancamentosOperacionais.reduce((maisRecente, atual) => {
                                        return (maisRecente.id > atual.id) ? maisRecente : atual;
                                    });
                                } else {
                                    // 2. Se não houver operacionais, pega o legado mais recente como fallback
                                    lancamentoParaExibir = detalhe.lancamentos.reduce((maisRecente, atual) => {
                                        return (maisRecente.id > atual.id) ? maisRecente : atual;
                                    });
                                }
                            }

                            todasAsLinhas.push({
                                os: os,
                                detalhe: detalhe,
                                ultimoLancamento: lancamentoParaExibir
                            });
                        });
                    }
                }
            });

            const btnSortOS = document.getElementById('btnSortOS');
            if (btnSortOS) {
                btnSortOS.addEventListener('click', () => {
                    osSortDirection = osSortDirection === 'asc' ? 'desc' : 'asc';
                    const icon = btnSortOS.querySelector('i');
                    icon.classList.toggle('bi-sort-down', osSortDirection === 'asc');
                    icon.classList.toggle('bi-sort-up-alt', osSortDirection === 'desc');
                    renderizarTabelaComFiltro();
                });
            }

            renderizarTabelaComFiltro();

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            accordionContainer.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados. Verifique o console.</div>`;
        }
    }

    function gerarHtmlParaGrupo(grupo) {
        const uniqueId = grupo.id;

        const valorTotalOS = get(grupo.linhas[0], 'os.detalhes', [])
            .reduce((sum, d) => sum + (d.valorTotal || 0), 0);

        // --- INÍCIO DA MODIFICAÇÃO ---
        const valorTotalCPS = grupo.linhas
            .flatMap(linha => get(linha, 'detalhe.lancamentos', []))
            // CORRIGIDO: Agora soma APENAS APROVADO e APROVADO_CPS_LEGADO
            .filter(lanc => ['APROVADO', 'APROVADO_CPS_LEGADO'].includes(lanc.situacaoAprovacao))
            .reduce((sum, lanc) => sum + (lanc.valor || 0), 0);
        // --- FIM DA MODIFICAÇÃO ---

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

        // --- INÍCIO DA ALTERAÇÃO ---
        // Adiciona a coluna "HISTÓRICO" dinamicamente
        const headersVisiveis = [...headers];
        if (userRole === 'ADMIN' || userRole === 'ASSISTANT') {
            headersVisiveis.push("AÇÕES");
        }
        headersVisiveis.unshift("HISTÓRICO"); // Adiciona no início
        // --- FIM DA ALTERAÇÃO ---


        const bodyRowsHTML = grupo.linhas.map(linhaData => {
            const cellsHTML = headersVisiveis.map(header => {
                const detalheId = get(linhaData, 'detalhe.id', '');

                // --- INÍCIO DA ALTERAÇÃO ---
                if (header === "HISTÓRICO") {
                    // Adiciona o botão de histórico, passando o ID do detalhe (da linha)
                    // Desabilita se não houver detalheId ou se houver 1 ou menos lançamentos
                    const lancamentosCount = get(linhaData, 'detalhe.lancamentos', []).length;
                    const isDisabled = !detalheId || lancamentosCount <= 1;
                    return `<td><button class="btn btn-sm btn-outline-info btn-historico" data-detalhe-id="${detalheId}" title="Ver Histórico de Lançamentos" ${isDisabled ? 'disabled' : ''}><i class="bi bi-clock-history"></i></button></td>`;
                }
                // --- FIM DA ALTERAÇÃO ---

                if (header === "AÇÕES") {
                    let btnEditar = '';

                    if (userRole === 'ADMIN' || userRole === 'ASSISTANT' || userRole === 'COORDINATOR') {
                        btnEditar = detalheId ? `<button class="btn btn-sm btn-outline-primary btn-edit-detalhe" data-id="${detalheId}" title="Editar Detalhe de Registro"><i class="bi bi-pencil-fill"></i></button>` : '';
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
                        <thead><tr>${headersVisiveis.map(h => `<th>${h}</th>`).join('')}</tr></thead>
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
        gruposDaPagina.forEach(grupo => {
            frag.appendChild(document.createRange().createContextualFragment(gerarHtmlParaGrupo(grupo)));
        });

        accordionContainer.appendChild(frag);
        paginationInfo.textContent = `Página ${paginaAtual} de ${totalPaginas} (${totalGrupos} grupos)`;
        atualizarBotoesPaginacao(totalPaginas);
    }

    async function carregarSegmentosESelecionarAtual(segmentoAtualId) {
        const selectSegmento = document.getElementById('selectSegmento');

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/segmentos`);
            if (!response.ok) throw new Error('Falha ao carregar segmentos.');
            const segmentos = await response.json();

            selectSegmento.innerHTML = '<option value="" disabled>Selecione o segmento...</option>';
            segmentos.forEach(seg => {
                const option = document.createElement('option');
                option.value = seg.id;
                option.textContent = seg.nome;
                if (seg.id == segmentoAtualId) {
                    option.selected = true;
                }
                selectSegmento.appendChild(option);
            });
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
                    id: get(linha, 'os.id', 'sem-id-' + Math.random()) // ID único para o grupo
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
        paginaAtual = 1;
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
            paginaAtual = 1;
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

    function atualizarDadosLocaisEInterface(osId, detalheId, novosDados) {
        // 1. Atualiza a fonte da verdade (todasAsLinhas)
        todasAsLinhas.forEach(linha => {
            // Atualiza dados da OS (afeta todas as linhas do grupo)
            if (linha.os.id == osId) {
                if (novosDados.gestorTim !== null) {
                    linha.os.gestorTim = novosDados.gestorTim;
                }
                if (novosDados.segmentoId !== null && linha.os.segmento) {
                    linha.os.segmento.id = novosDados.segmentoId;
                    linha.os.segmento.nome = novosDados.segmentoNome;
                }
            }

            // Atualiza dados do Detalhe (afeta apenas a linha específica)
            if (linha.detalhe && linha.detalhe.id == detalheId) {
                if (novosDados.key !== null) {
                    linha.detalhe.key = novosDados.key;
                }
            }
        });

        // 2. Encontra e atualiza o grupo no cache de renderização (gruposFiltradosCache)
        const grupoCacheIndex = gruposFiltradosCache.findIndex(g => g.id == osId);
        if (grupoCacheIndex > -1) {
            // Pega o grupo do cache
            let grupoAfetado = gruposFiltradosCache[grupoCacheIndex];

            // Atualiza o array 'linhas' dentro do grupo, buscando os dados frescos do 'todasAsLinhas'
            grupoAfetado.linhas = todasAsLinhas.filter(l => l.os.id == osId);

            // 3. Re-renderiza apenas esse grupo no DOM
            const elementoGrupoNoDOM = document.getElementById(`accordion-item-${osId}`);
            if (elementoGrupoNoDOM) {
                const novoHtmlGrupo = gerarHtmlParaGrupo(grupoAfetado);

                elementoGrupoNoDOM.outerHTML = novoHtmlGrupo;
            }
        }
    }

    function adicionarListenersDeAcoes() {
        const accordionContainer = document.getElementById('accordion-registros');
        const modalEditarDetalheEl = document.getElementById('modalEditarDetalhe');
        const modalEditarDetalhe = modalEditarDetalheEl ? new bootstrap.Modal(modalEditarDetalheEl) : null;
        const modalConfirmarExclusaoEl = document.getElementById('modalConfirmarExclusao');
        const modalConfirmarExclusao = modalConfirmarExclusaoEl ? new bootstrap.Modal(modalConfirmarExclusaoEl) : null;
        const modalHistoricoEl = document.getElementById('modalHistoricoLancamentos');
        const modalHistorico = modalHistoricoEl ? new bootstrap.Modal(modalHistoricoEl) : null;

        accordionContainer.addEventListener('click', function (e) {
            const btnEdit = e.target.closest('.btn-edit-detalhe');
            const btnDelete = e.target.closest('.btn-delete-registro');
            const btnHistorico = e.target.closest('.btn-historico');

            if (btnEdit) {
                e.preventDefault();
                const detalheId = btnEdit.dataset.id;
                const linhaData = todasAsLinhas.find(l => get(l, 'detalhe.id') == detalheId);
                if (modalEditarDetalhe && linhaData) {
                    const formEditarDetalheEl = document.getElementById('formEditarDetalhe');
                    document.getElementById('editDetalheId').value = detalheId;

                    // VVVV --- MODIFICAÇÃO AQUI --- VVVV

                    // 1. Armazena o ID da OS (necessário para o patch do Gestor TIM)
                    const osId = get(linhaData, 'os.id');
                    formEditarDetalheEl.dataset.osId = osId;

                    document.getElementById('osValue').value = get(linhaData, 'os.os', 'N/A');

                    // 2. Popula TODOS os campos (Key, Segmento, Gestor)
                    const chaveExistente = get(linhaData, 'detalhe.key', '');
                    document.getElementById('novaKeyValue').value = chaveExistente;
                    formEditarDetalheEl.dataset.originalKey = chaveExistente;

                    const segmentoAtualId = get(linhaData, 'os.segmento.id');
                    carregarSegmentosESelecionarAtual(segmentoAtualId); // Carrega os segmentos no select
                    formEditarDetalheEl.dataset.originalSegmentoId = segmentoAtualId;

                    const gestorTimExistente = get(linhaData, 'os.gestorTim', '');
                    document.getElementById('novoGestorTimValue').value = gestorTimExistente;
                    formEditarDetalheEl.dataset.originalGestorTim = gestorTimExistente;

                    // 3. Reseta os toggles
                    document.querySelectorAll('#formEditarDetalhe .toggle-editar').forEach(toggle => {
                        toggle.checked = false;
                        const targetInput = document.querySelector(toggle.dataset.target);
                        if (targetInput) targetInput.disabled = true;
                    });
                    document.getElementById('btnSalvarDetalhe').disabled = true;

                    // 4. Controla a visibilidade dos campos por Role
                    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

                    const keyFieldGroup = document.getElementById('novaKeyValue').closest('.mb-3');
                    const segmentoFieldGroup = document.getElementById('selectSegmento').closest('.mb-3');
                    const gestorTimFieldGroup = document.getElementById('novoGestorTimValue').closest('.mb-3');

                    // Esconde todos por padrão
                    if (keyFieldGroup) keyFieldGroup.style.display = 'none';
                    if (segmentoFieldGroup) segmentoFieldGroup.style.display = 'none';
                    if (gestorTimFieldGroup) gestorTimFieldGroup.style.display = 'none';

                    if (userRole === 'ADMIN' || userRole === 'ASSISTANT') {
                        // Admin/Assistant podem editar Segmento, Key e Gestor TIM
                        if (keyFieldGroup) keyFieldGroup.style.display = 'block';
                        if (segmentoFieldGroup) segmentoFieldGroup.style.display = 'block';
                        if (gestorTimFieldGroup) gestorTimFieldGroup.style.display = 'block';
                    } else if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
                        // Coordinator pode editar SOMENTE Gestor TIM
                        if (gestorTimFieldGroup) gestorTimFieldGroup.style.display = 'block';
                    }
                    // ^^^^ --- FIM DA MODIFICAÇÃO --- ^^^^

                    modalEditarDetalhe.show();
                } else {
                    mostrarToast("Não foi possível carregar os dados para edição.", "error");
                }
            }

            if (btnDelete) {
                const detalheId = btnDelete.dataset.id;
                const deleteInput = document.getElementById('deleteOsId');
                if (deleteInput) {
                    // Armazena o ID correto no campo oculto do modal.
                    deleteInput.value = detalheId;
                }
                if (modalConfirmarExclusao) {
                    modalConfirmarExclusao.show();
                }
            }
            if (btnHistorico) {
                e.preventDefault();
                const detalheId = btnHistorico.dataset.detalheId;
                const linhaData = todasAsLinhas.find(l => get(l, 'detalhe.id') == detalheId);

                if (modalHistorico && linhaData && linhaData.detalhe && linhaData.detalhe.lancamentos) {
                    const modalBody = document.getElementById('tbody-historico-lancamentos');
                    const modalTitle = document.getElementById('modalHistoricoLancamentosLabel');

                    modalTitle.innerHTML = `<i class="bi bi-clock-history me-2"></i>Histórico da Linha: ${get(linhaData, 'detalhe.key', '')}`;

                    const lancamentosOrdenados = [...linhaData.detalhe.lancamentos].sort((a, b) => b.id - a.id);

                    if (lancamentosOrdenados.length === 0) {
                        modalBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum lançamento encontrado para esta linha.</td></tr>';
                    } else {
                        modalBody.innerHTML = lancamentosOrdenados.map(lanc => {
                            const etapa = get(lanc, 'etapa', {});
                            return `
                            <tr>
                                <td>${formatarData(get(lanc, 'dataAtividade'))}</td>
                                <td><span class="badge rounded-pill text-bg-info">${get(lanc, 'situacaoAprovacao', '').replace(/_/g, ' ')}</span></td>
                                <td>${get(lanc, 'situacao', '')}</td>
                                <td>${etapa.nomeDetalhado || ''}</td>
                                <td>${get(lanc, 'prestador.nome', '')}</td>
                                <td>${formatarMoeda(get(lanc, 'valor'))}</td>
                                <td>${get(lanc, 'manager.nome', '')}</td>
                            </tr>
                        `;
                        }).join('');
                    }
                    modalHistorico.show();
                } else {
                    mostrarToast("Não foi possível encontrar o histórico para esta linha.", "error");
                }
            }
        });

        const formEditarDetalheEl = document.getElementById('formEditarDetalhe');
        if (formEditarDetalheEl) {
            formEditarDetalheEl.addEventListener('change', (e) => {
                if (e.target.classList.contains('toggle-editar')) {
                    const toggle = e.target;
                    const targetSelector = toggle.dataset.target;
                    const targetInput = document.querySelector(targetSelector);
                    if (targetInput) {
                        targetInput.disabled = !toggle.checked;
                        const event = new Event('input', { bubbles: true });
                        targetInput.dispatchEvent(event);
                    }
                }
            });
            formEditarDetalheEl.addEventListener('input', () => {
                const originalKey = formEditarDetalheEl.dataset.originalKey || '';
                const originalSegmentoId = formEditarDetalheEl.dataset.originalSegmentoId;
                const originalGestorTim = formEditarDetalheEl.dataset.originalGestorTim || '';

                const currentKey = document.getElementById('novaKeyValue').value;
                const currentSegmentoId = document.getElementById('selectSegmento').value;
                const currentGestorTim = document.getElementById('novoGestorTimValue').value;

                const keyChanged = originalKey !== currentKey && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#novaKeyValue"]').checked;
                const segmentoChanged = originalSegmentoId != currentSegmentoId && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#selectSegmento"]').checked;
                const gestorTimChanged = originalGestorTim !== currentGestorTim && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#novoGestorTimValue"]').checked;

                document.getElementById('btnSalvarDetalhe').disabled = !(keyChanged || segmentoChanged || gestorTimChanged);
            });
            formEditarDetalheEl.addEventListener('submit', async function (e) {
                e.preventDefault();
                const detalheId = document.getElementById('editDetalheId').value;
                const osId = formEditarDetalheEl.dataset.osId; // Pega o OS ID
                const btnSalvar = document.getElementById('btnSalvarDetalhe');

                const originalKey = formEditarDetalheEl.dataset.originalKey || '';
                const originalSegmentoId = formEditarDetalheEl.dataset.originalSegmentoId;
                const originalGestorTim = formEditarDetalheEl.dataset.originalGestorTim || '';

                const currentKey = document.getElementById('novaKeyValue').value;
                const currentSegmentoId = document.getElementById('selectSegmento').value;
                const currentGestorTim = document.getElementById('novoGestorTimValue').value;

                const keyChanged = originalKey !== currentKey && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#novaKeyValue"]').checked;
                const segmentoChanged = originalSegmentoId != currentSegmentoId && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#selectSegmento"]').checked;
                const gestorTimChanged = originalGestorTim !== currentGestorTim && document.querySelector('#formEditarDetalhe .toggle-editar[data-target="#novoGestorTimValue"]').checked;

                if (!(keyChanged || segmentoChanged || gestorTimChanged)) {
                    mostrarToast('Nenhuma alteração para salvar.', 'warning');
                    return;
                }

                btnSalvar.disabled = true;
                btnSalvar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

                const promises = [];
                // ... (código que adiciona as promises)
                if (keyChanged) {
                    promises.push(fetchComAuth(`${API_BASE_URL}/os/detalhe/${detalheId}/key`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: currentKey })
                    }));
                }
                if (segmentoChanged) {
                    promises.push(fetchComAuth(`${API_BASE_URL}/os/detalhe/${detalheId}/segmento`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ novoSegmentoId: parseInt(currentSegmentoId) })
                    }));
                }
                if (gestorTimChanged) {
                    promises.push(fetchComAuth(`${API_BASE_URL}/os/${osId}/gestor-tim`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gestorTim: currentGestorTim })
                    }));
                }

                try {
                    const results = await Promise.all(promises);
                    // ... (código de verificação de erros) ...
                    let allSuccessful = true;
                    let errorMessages = [];
                    for (let i = 0; i < results.length; i++) {
                        const response = results[i];
                        if (!response.ok) {
                            allSuccessful = false;
                            let errorType = `Erro ${i + 1}`;
                            try {
                                const reqBody = JSON.parse(promises[i].body); // Note: Acessar .body pode não ser trivial
                                if (reqBody.key) errorType = "Chave Externa";
                                if (reqBody.novoSegmentoId) errorType = "Segmento";
                                if (reqBody.gestorTim) errorType = "Gestor TIM";
                            } catch (e) { }
                            let errorMessage = `${errorType}: Erro desconhecido.`;
                            try { const errorData = await response.json(); errorMessage = `${errorType}: ${errorData.message || 'Erro de validação.'}`; } catch { }
                            errorMessages.push(errorMessage);
                        }
                    }

                    if (allSuccessful) {
                        mostrarToast('Detalhes atualizados com sucesso!', 'success');

                        // --- VVVV INÍCIO DA SUBSTITUIÇÃO VVVV ---

                        // 1. Obter os novos dados que foram salvos
                        const novoGestorTim = gestorTimChanged ? currentGestorTim : null;
                        const novaKey = keyChanged ? currentKey : null;
                        const novoSegmentoId = segmentoChanged ? parseInt(currentSegmentoId) : null;
                        let novoSegmentoNome = null;

                        if (segmentoChanged) {
                            const selectSegmento = document.getElementById('selectSegmento');
                            novoSegmentoNome = selectSegmento.options[selectSegmento.selectedIndex].text;
                        }

                        // 2. Chamar a nova função de atualização em memória
                        atualizarDadosLocaisEInterface(osId, detalheId, {
                            gestorTim: novoGestorTim,
                            key: novaKey,
                            segmentoId: novoSegmentoId,
                            segmentoNome: novoSegmentoNome
                        });


                    } else {
                        throw new Error(errorMessages.join(' | '));
                    }
                    if (modalEditarDetalhe) modalEditarDetalhe.hide();

                } catch (error) {
                    mostrarToast(error.message, 'error');
                } finally {
                    btnSalvar.disabled = false;
                    btnSalvar.innerHTML = 'Salvar Alterações';
                }
            });
        }

        const btnConfirmarExclusaoDefinitivaEl = document.getElementById('btnConfirmarExclusaoDefinitiva');
        if (btnConfirmarExclusaoDefinitivaEl) {
            btnConfirmarExclusaoDefinitivaEl.addEventListener('click', async function () {
                // Pega o ID do detalhe do registro a ser excluído
                const detalheId = document.getElementById('deleteOsId').value;
                const btnConfirmar = this;

                if (!detalheId || detalheId === 'undefined') {
                    mostrarToast("Não foi possível identificar o registro para exclusão.", "error");
                    return;
                }

                btnConfirmar.disabled = true;
                btnConfirmar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Excluindo...`;
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarExclusao'));

                try {
                    // Chama a API para excluir o registro de detalhe específico
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

                    // --- INÍCIO DA NOVA LÓGICA DE ATUALIZAÇÃO ---

                    // 1. Remove o item excluído da lista global 'todasAsLinhas' em memória
                    const indexParaRemover = todasAsLinhas.findIndex(linha => get(linha, 'detalhe.id') == detalheId);
                    if (indexParaRemover > -1) {
                        todasAsLinhas.splice(indexParaRemover, 1);
                    }

                    // 2. Chama a função que re-renderiza a tabela com base nos dados locais atualizados.
                    //    Isso é muito mais rápido pois não faz uma nova chamada à API.
                    renderizarTabelaComFiltro();

                    // --- FIM DA NOVA LÓGICA DE ATUALIZAÇÃO ---

                } catch (error) {
                    console.error("Erro ao excluir o registro:", error);
                    mostrarToast(error.message, 'error');
                    if (modalInstance) modalInstance.hide();
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

            isImportCancelled = false;
            textoProgresso.textContent = 'Iniciando importação...';
            barraProgresso.style.width = '0%';
            barraProgresso.textContent = '0%';
            errosContainer.classList.add('d-none');
            listaErros.innerHTML = '';
            btnFecharProgresso.disabled = true;
            btnCancelarImportacao.classList.remove('d-none');
            modalProgresso.show();

            // --- INÍCIO DA CORREÇÃO ---
            // Damos um pequeno tempo para o modal aparecer e então iniciamos a animação da barra
            setTimeout(() => {
                textoProgresso.textContent = 'Enviando arquivo...';
                barraProgresso.style.width = '40%'; // Avança a barra para um valor intermediário
                barraProgresso.textContent = '40%';
            }, 200); // 200ms de delay
            // --- FIM DA CORREÇÃO ---

            try {
                const response = await fetchComAuth(`${API_BASE_URL}/os/importar?legado=${isLegado}`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    let errorMsg = `Erro no servidor: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || JSON.stringify(errorData);
                    } catch (e) {
                        errorMsg = await response.text();
                    }
                    throw new Error(errorMsg);
                }

                const importResult = await response.json();
                const updatedOsList = importResult.oses;
                const warnings = importResult.warnings;

                if (warnings && warnings.length > 0) {
                    errosContainer.classList.remove('d-none');
                    errosContainer.querySelector('h6').textContent = 'Avisos da Importação:';
                    listaErros.innerHTML = warnings.map(warn => `<li class="list-group-item list-group-item-warning">${warn}</li>`).join('');
                }

                barraProgresso.style.width = '100%';
                barraProgresso.textContent = '100%';
                textoProgresso.textContent = 'Processando atualizações...';

                if (updatedOsList && updatedOsList.length > 0) {
                    // ... (o restante da lógica para atualizar a tabela continua igual)
                    const updatedOsIds = updatedOsList.map(os => os.id);

                    updatedOsIds.forEach(id => {
                        const elementoExistente = document.getElementById(`accordion-item-${id}`);
                        if (elementoExistente) {
                            elementoExistente.innerHTML = `<div class="p-4 text-center text-muted"><div class="spinner-border spinner-border-sm text-primary" role="status"></div> Atualizando...</div>`;
                        }
                    });

                    await new Promise(resolve => setTimeout(resolve, 100));

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
                            placeholderElement.outerHTML = novoHtml;
                        } else {
                            accordionContainer.insertAdjacentHTML('afterbegin', novoHtml);
                        }
                    });
                }

                renderizarTabelaComFiltro();
                textoProgresso.textContent = 'Importação concluída com sucesso!';

            } catch (error) {
                console.error('Erro na importação:', error);
                textoProgresso.textContent = 'Erro Crítico na Importação!';
                errosContainer.classList.remove('d-none');
                errosContainer.querySelector('h6').textContent = 'Ocorreu um erro:';
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
                        .flatMap(linha => get(linha, 'detalhe.lancamentos', [])) // Busca na nova lista 'lancamentos'
                        // A condição agora verifica se o status é 'APROVADO' OU 'APROVADO_LEGADO'
                        .filter(lanc => ['APROVADO'].includes(lanc.situacaoAprovacao))
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