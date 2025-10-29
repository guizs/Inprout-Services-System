document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'https://www.inproutservices.com.br/api';
    const toastElement = document.getElementById('toastMensagem');
    const toastBody = document.getElementById('toastTexto');
    const toast = toastElement ? new bootstrap.Toast(toastElement) : null;
    const searchInput = document.getElementById('searchInput');

    let sortConfig = {
        key: 'dataAtividade', // Coluna padrão para ordenação
        direction: 'desc' // Direção padrão (descendente)
    };

    const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : '';
    const formatarData = (data) => data ? data.split('-').reverse().join('/') : '';

    // INÍCIO DA CORREÇÃO: Definição do dataMapping que estava faltando
    const dataMapping = {
        "STATUS APROVAÇÃO": (lancamento) => (lancamento.situacaoAprovacao || '').replace(/_/g, ' '),
        "DATA ATIVIDADE": (lancamento) => lancamento.dataAtividade || '',
        "OS": (lancamento) => getNestedValue(lancamento, 'os.os'),
        "SITE": (lancamento) => getNestedValue(lancamento, 'detalhe.site'),
        "SEGMENTO": (lancamento) => getNestedValue(lancamento, 'os.segmento.nome'),
        "PROJETO": (lancamento) => getNestedValue(lancamento, 'os.projeto'),
        "LPU": (lancamento) => labelLpu(getNestedValue(lancamento, 'detalhe.lpu')),
        "GESTOR TIM": (lancamento) => getNestedValue(lancamento, 'os.gestorTim'),
        "REGIONAL": (lancamento) => getNestedValue(lancamento, 'detalhe.regional'),
        "VISTORIA": (lancamento) => lancamento.vistoria || 'N/A',
        "PLANO DE VISTORIA": (lancamento) => formatarData(lancamento.planoVistoria),
        "DESMOBILIZAÇÃO": (lancamento) => lancamento.desmobilizacao || 'N/A',
        "PLANO DE DESMOBILIZAÇÃO": (lancamento) => formatarData(lancamento.planoDesmobilizacao),
        "INSTALAÇÃO": (lancamento) => lancamento.instalacao || 'N/A',
        "PLANO DE INSTALAÇÃO": (lancamento) => formatarData(lancamento.planoInstalacao),
        "ATIVAÇÃO": (lancamento) => lancamento.ativacao || 'N/A',
        "PLANO DE ATIVAÇÃO": (lancamento) => formatarData(lancamento.planoAtivacao),
        "DOCUMENTAÇÃO": (lancamento) => lancamento.documentacao || 'N/A',
        "PLANO DE DOCUMENTAÇÃO": (lancamento) => formatarData(lancamento.planoDocumentacao),
        "ETAPA GERAL": (lancamento) => (getNestedValue(lancamento, 'etapa.codigoGeral') && getNestedValue(lancamento, 'etapa.nomeGeral')) ? `${getNestedValue(lancamento, 'etapa.codigoGeral')} - ${getNestedValue(lancamento, 'etapa.nomeGeral')}` : '',
        "ETAPA DETALHADA": (lancamento) => (getNestedValue(lancamento, 'etapa.indiceDetalhado') && getNestedValue(lancamento, 'etapa.nomeDetalhado')) ? `${getNestedValue(lancamento, 'etapa.indiceDetalhado')} - ${getNestedValue(lancamento, 'etapa.nomeDetalhado')}` : '',
        "STATUS": (lancamento) => lancamento.status || '',
        "SITUAÇÃO": (lancamento) => lancamento.situacao || '',
        "DETALHE DIÁRIO": (lancamento) => lancamento.detalheDiario || '',
        "CÓD. PRESTADOR": (lancamento) => getNestedValue(lancamento, 'prestador.codigo'),
        "PRESTADOR": (lancamento) => getNestedValue(lancamento, 'prestador.nome'),
        "VALOR": (lancamento) => formatarMoeda(lancamento.valor),
        "GESTOR": (lancamento) => getNestedValue(lancamento, 'manager.nome'),
        "AÇÃO": () => '' // Coluna de ação não exporta dados
    };
    // FIM DA CORREÇÃO

    function converterDataParaDDMMYYYY(isoDate) {
        if (!isoDate || !isoDate.includes('-')) {
            return isoDate; // Retorna o valor original se for nulo, vazio ou não estiver no formato esperado
        }
        const [ano, mes, dia] = isoDate.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    // Mapeia o texto do cabeçalho para a chave de dados no objeto de lançamento
    const columnKeyMap = {
        "DATA ATIVIDADE": "dataAtividade",
        "OS": "os.os",
        "SITE": "detalhe.site",
        "SEGMENTO": "os.segmento.nome",
        "PROJETO": "os.projeto",
        "PRESTADOR": "prestador.nome",
        "VALOR": "valor",
        "GESTOR": "manager.nome",
        "SITUAÇÃO": "situacao",
        "STATUS APROVAÇÃO": "situacaoAprovacao"
    };

    // Função auxiliar para pegar valores aninhados de um objeto (ex: 'os.projeto')
    const getNestedValue = (obj, path) => {
        if (!path) return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    function mostrarToast(mensagem, tipo = 'success') {
        if (!toast || !toastBody) return;
        toastElement.classList.remove('text-bg-success', 'text-bg-danger');
        if (tipo === 'success') {
            toastElement.classList.add('text-bg-success');
        } else if (tipo === 'error') {
            toastElement.classList.add('text-bg-danger');
        }
        toastBody.textContent = mensagem;
        toast.show();
    }

    function parseDataBrasileira(dataString) {
        if (!dataString) return null;
        // Ex: "21/07/2025 15:04:42"
        const [data, hora] = dataString.split(' ');
        if (!data) return null;
        const [dia, mes, ano] = data.split('/');
        if (!dia || !mes || !ano) return null;
        // O mês em JavaScript é 0-indexado (Janeiro=0), por isso mes-1
        return new Date(`${ano}-${mes}-${dia}T${hora || '00:00:00'}`);
    }

    function labelLpu(lpu) {
        if (!lpu) return '';
        const codigo = lpu.codigo ?? lpu.codigoLpu ?? '';
        const nome = lpu.nome ?? lpu.nomeLpu ?? '';
        return `${codigo}${codigo && nome ? ' - ' : ''}${nome}`;
    }

    function normalizarListaLpus(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw.content)) return raw.content;
        if (Array.isArray(raw.itens)) return raw.itens;
        if (Array.isArray(raw.lista)) return raw.lista;
        return [];
    }

    function toggleLoader(ativo = true) {
        const container = document.querySelector('.content-loader-container');
        if (container) {
            const overlay = container.querySelector("#overlay-loader");
            if (overlay) {
                overlay.classList.toggle("d-none", !ativo);
            }
        }
    }

    function toggleModalLoader(ativo = true) {
        const modalLoader = document.getElementById('modal-overlay-loader');
        if (modalLoader) {
            modalLoader.classList.toggle('d-none', !ativo);
        }
    }

    function configurarVisibilidadePorRole() {
        const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

        const navMinhasPendencias = document.getElementById('nav-item-minhas-pendencias');
        const navLancamentos = document.getElementById('nav-item-lancamentos');
        const navPendentes = document.getElementById('nav-item-pendentes');
        const navParalisados = document.getElementById('nav-item-paralisados');
        const navHistorico = document.getElementById('nav-item-historico');

        const btnNovoLancamento = document.getElementById('btnNovoLancamento');
        const btnSolicitarMaterial = document.getElementById('btnSolicitarMaterial');
        const btnSolicitarComplementar = document.getElementById('btnSolicitarComplementar');
        const btnExportar = document.getElementById('btnExportar'); // Botão de exportar

        // Todos os itens da navegação são visíveis por padrão
        [navMinhasPendencias, navLancamentos, navPendentes, navParalisados, navHistorico].forEach(el => {
            if (el) el.style.display = 'block';
        });

        // Oculta botões de ação específicos por padrão
        [btnNovoLancamento, btnSolicitarMaterial, btnSolicitarComplementar, btnExportar].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Aplica regras de visibilidade para cada cargo
        switch (userRole) {
            case 'MANAGER':
                [btnNovoLancamento, btnSolicitarMaterial, btnSolicitarComplementar].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                break;

            case 'COORDINATOR':
                if (navLancamentos) navLancamentos.style.display = 'none';
                break;

            case 'ADMIN':
            case 'CONTROLLER':
            case 'ASSISTANT':
                [btnNovoLancamento, btnSolicitarMaterial, btnSolicitarComplementar, btnExportar].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                break;

            default:
                break;
        }

        const tabAtiva = document.querySelector('#lancamentosTab .nav-link.active');
        if (!tabAtiva || tabAtiva.parentElement.style.display === 'none') {
            const primeiraAbaVisivel = document.querySelector('#lancamentosTab .nav-item[style*="block"] .nav-link');
            if (primeiraAbaVisivel) {
                new bootstrap.Tab(primeiraAbaVisivel).show();
            }
        }
    }

    const collapseElement = document.getElementById('collapseDashboardCards');
    const collapseIcon = document.querySelector('a[href="#collapseDashboardCards"] i');
    if (collapseElement && collapseIcon) {
        collapseElement.addEventListener('show.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-down', 'bi-chevron-up'));
        collapseElement.addEventListener('hide.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-up', 'bi-chevron-down'));
    }

    const tbodyLancamentos = document.getElementById('tbody-lancamentos');
    const tbodyPendentes = document.getElementById('tbody-pendentes');
    const tbodyHistorico = document.getElementById('tbody-historico');
    const tbodyMinhasPendencias = document.getElementById('tbody-minhas-pendencias');
    const tbodyParalisados = document.getElementById('tbody-paralisados');
    const notificacaoPendencias = document.getElementById('notificacao-pendencias');
    let filtrosAtivos = { periodo: null, status: null, osId: null };
    let todosLancamentos = [];

    const colunasPrincipais = ["STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE", "SEGMENTO", "PROJETO", "LPU", "GESTOR TIM", "REGIONAL", "VISTORIA", "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DE DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO DE INSTALAÇÃO", "ATIVAÇÃO", "PLANO DE ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DE DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR"];
    const colunasLancamentos = [...colunasPrincipais.filter(c => c !== "STATUS APROVAÇÃO"), "AÇÃO"];
    const colunasMinhasPendencias = colunasLancamentos;
    const colunasHistorico = [...colunasPrincipais, "AÇÃO"];

    function renderizarCabecalho(colunas, theadElement) {
        if (!theadElement) return;
        let headerHTML = '<tr>';
        colunas.forEach(textoColuna => {
            const sortKey = columnKeyMap[textoColuna];
            if (sortKey) {
                const isSorted = sortConfig.key === sortKey;
                const iconClass = isSorted ? (sortConfig.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up';
                headerHTML += `<th class="sortable" data-sort-key="${sortKey}">${textoColuna} <i class="bi ${iconClass}"></i></th>`;
            } else {
                headerHTML += `<th>${textoColuna}</th>`;
            }
        });
        headerHTML += '</tr>';
        theadElement.innerHTML = headerHTML;
    }

    function renderizarCardsDashboard(lancamentos) {
        const hoje = new Date().toLocaleDateString('pt-BR');
        const statusPendenteAprovacao = ['PENDENTE_COORDENADOR', 'AGUARDANDO_EXTENSAO_PRAZO', 'PENDENTE_CONTROLLER'];
        const statusRecusado = ['RECUSADO_COORDENADOR', 'RECUSADO_CONTROLLER'];

        const totalLancamentosHoje = lancamentos.filter(l => l.situacaoAprovacao === 'RASCUNHO' && l.dataAtividade === hoje).length;
        const totalPendentesAprovacao = lancamentos.filter(l => statusPendenteAprovacao.includes(l.situacaoAprovacao)).length;
        const totalRecusados = lancamentos.filter(l => statusRecusado.includes(l.situacaoAprovacao)).length;
        const projetosAtivos = new Set();
        lancamentos.forEach(l => {
            if (l.situacao !== 'Paralisado' && l.situacao !== 'Finalizado' && l.os && l.detalhe && l.detalhe.lpu) {
                const chaveProjeto = `${l.os.id}-${l.detalhe.lpu.id}`;
                projetosAtivos.add(chaveProjeto);
            }
        });
        const totalEmAndamento = projetosAtivos.size;
        const totalParalisadas = getProjetosParalisados().length;
        const totalFinalizadasHoje = lancamentos.filter(l => l.situacao === 'Finalizado' && l.dataAtividade === hoje).length;

        document.getElementById('card-lancamentos-hoje').textContent = totalLancamentosHoje;
        document.getElementById('card-pendentes-aprovacao').textContent = totalPendentesAprovacao;
        document.getElementById('card-recusados').textContent = totalRecusados;
        document.getElementById('card-em-andamento').textContent = totalEmAndamento;
        document.getElementById('card-paralisadas').textContent = totalParalisadas;
        document.getElementById('card-finalizadas-hoje').textContent = totalFinalizadasHoje;
    }

    function aplicarEstiloStatus(cell, statusText) {
        if (!statusText) return;
        cell.classList.add('status-cell');
        const statusUpper = statusText.toUpperCase();
        if (statusUpper === 'OK') cell.classList.add('status-ok');
        else if (statusUpper === 'NOK') cell.classList.add('status-nok');
        else if (statusUpper === 'N/A') cell.classList.add('status-na');
    }

    function renderizarTabela(dados, tbodyElement, colunas) {
        if (!tbodyElement) return;
        tbodyElement.innerHTML = '';

        if (!dados || dados.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = colunas.length;
            td.textContent = 'Nenhum lançamento encontrado.';
            td.className = 'text-center text-muted p-4';
            tr.appendChild(td);
            tbodyElement.appendChild(tr);
            return;
        }

        const projetosFinalizados = new Set();
        todosLancamentos.forEach(l => {
            if (l.situacao === 'Finalizado' && l.os && l.detalhe && l.detalhe.lpu) {
                const chaveProjeto = `${l.os.id}-${l.detalhe.lpu.id}`;
                projetosFinalizados.add(chaveProjeto);
            }
        });

        const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : '';
        const formatarData = (data) => data ? data.split('-').reverse().join('/') : '';
        const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

        const frag = document.createDocumentFragment();

        dados.forEach(lancamento => {
            const tr = document.createElement('tr');

            const detalhe = lancamento.detalhe || {};
            const os = lancamento.os || {};
            const lpu = detalhe.lpu || {};
            const etapa = lancamento.etapa || {};
            const prestador = lancamento.prestador || {};
            const manager = lancamento.manager || {};

            const mapaDeCelulas = {
                "DATA ATIVIDADE": lancamento.dataAtividade || '', "OS": os.os || '', "SITE": detalhe.site || '',
                "SEGMENTO": os.segmento ? os.segmento.nome : '', "PROJETO": os.projeto || '', "LPU": labelLpu(lpu),
                "GESTOR TIM": os.gestorTim || '', "REGIONAL": detalhe.regional || '', "VISTORIA": lancamento.vistoria || 'N/A',
                "PLANO DE VISTORIA": formatarData(lancamento.planoVistoria), "DESMOBILIZAÇÃO": lancamento.desmobilizacao || 'N/A',
                "PLANO DE DESMOBILIZAÇÃO": formatarData(lancamento.planoDesmobilizacao), "INSTALAÇÃO": lancamento.instalacao || 'N/A',
                "PLANO DE INSTALAÇÃO": formatarData(lancamento.planoInstalacao), "ATIVAÇÃO": lancamento.ativacao || 'N/A',
                "PLANO DE ATIVAÇÃO": formatarData(lancamento.planoAtivacao), "DOCUMENTAÇÃO": lancamento.documentacao || 'N/A',
                "PLANO DE DOCUMENTAÇÃO": formatarData(lancamento.planoDocumentacao),
                "ETAPA GERAL": (etapa.codigoGeral && etapa.nomeGeral) ? `${etapa.codigoGeral} - ${etapa.nomeGeral}` : '',
                "ETAPA DETALHADA": (etapa.indiceDetalhado && etapa.nomeDetalhado) ? `${etapa.indiceDetalhado} - ${etapa.nomeDetalhado}` : '',
                "STATUS": lancamento.status || '', "SITUAÇÃO": lancamento.situacao || '', "DETALHE DIÁRIO": lancamento.detalheDiario || '',
                "CÓD. PRESTADOR": prestador.codigo || '', "PRESTADOR": prestador.nome || '', "VALOR": formatarMoeda(lancamento.valor),
                "GESTOR": manager.nome || '',
                "STATUS APROVAÇÃO": `<span class="badge rounded-pill text-bg-secondary">${(lancamento.situacaoAprovacao || '').replace(/_/g, ' ')}</span>`
            };

            colunas.forEach(nomeColuna => {
                const td = document.createElement('td');
                td.dataset.label = nomeColuna;

                if (nomeColuna === 'AÇÃO') {
                    let buttonsHtml = '';
                    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
                        if (tbodyElement.id === 'tbody-minhas-pendencias') {
                            buttonsHtml += `<button class="btn btn-sm btn-success btn-reenviar" data-id="${lancamento.id}" title="Corrigir e Reenviar"><i class="bi bi-pencil-square"></i></button>`;
                            buttonsHtml += ` <button class="btn btn-sm btn-danger btn-excluir-lancamento" data-id="${lancamento.id}" title="Excluir Lançamento"><i class="bi bi-trash"></i></button>`;
                        } else if (tbodyElement.id === 'tbody-lancamentos') {
                            buttonsHtml += `<button class="btn btn-sm btn-secondary btn-editar-rascunho" data-id="${lancamento.id}" title="Editar Rascunho"><i class="bi bi-pencil"></i></button>`;
                            buttonsHtml += ` <button class="btn btn-sm btn-danger btn-excluir-lancamento" data-id="${lancamento.id}" title="Excluir Lançamento"><i class="bi bi-trash"></i></button>`;
                        } else if (tbodyElement.id === 'tbody-paralisados' || tbodyElement.id === 'tbody-historico') {
                            const chaveProjetoAtual = `${os.id}-${lpu.id}`;
                            if (!projetosFinalizados.has(chaveProjetoAtual)) {
                                buttonsHtml += `<button class="btn btn-sm btn-warning btn-retomar" data-id="${lancamento.id}" title="Retomar Lançamento"><i class="bi bi-play-circle"></i></button>`;
                            }
                        }
                    }
                    buttonsHtml += ` <button class="btn btn-sm btn-info btn-ver-comentarios" data-id="${lancamento.id}" title="Ver Comentários" data-bs-toggle="modal" data-bs-target="#modalComentarios"><i class="bi bi-chat-left-text"></i></button>`;
                    td.innerHTML = `<div class="btn-group" role="group">${buttonsHtml}</div>`;
                } else {
                    td.innerHTML = mapaDeCelulas[nomeColuna] || '';
                    if (["VISTORIA", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO", "DESMOBILIZAÇÃO"].includes(nomeColuna)) {
                        aplicarEstiloStatus(td, mapaDeCelulas[nomeColuna]);
                    }
                    if (nomeColuna === "DETALHE DIÁRIO") {
                        td.classList.add('detalhe-diario-cell');
                    }
                }
                tr.appendChild(td);
            });
            frag.appendChild(tr);
        });
        tbodyElement.appendChild(frag);
    }

    function getDadosFiltrados() {
        let dadosFiltrados = [...todosLancamentos];
        const termoBusca = searchInput.value.toLowerCase().trim();

        if (termoBusca) {
            dadosFiltrados = dadosFiltrados.filter(l => {
                const textoPesquisavel = [
                    l.os?.os, l.detalhe?.site, l.os?.segmento?.nome, l.os?.projeto,
                    l.detalhe?.lpu?.nomeLpu, l.detalhe?.lpu?.codigoLpu, l.prestador?.nome
                ].join(' ').toLowerCase();
                return textoPesquisavel.includes(termoBusca);
            });
        }

        if (filtrosAtivos.periodo) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            dadosFiltrados = dadosFiltrados.filter(l => {
                const partesData = l.dataAtividade.split('/');
                const dataAtividade = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                if (filtrosAtivos.periodo.start && filtrosAtivos.periodo.end) {
                    return dataAtividade >= filtrosAtivos.periodo.start && dataAtividade <= filtrosAtivos.periodo.end;
                }
                switch (filtrosAtivos.periodo) {
                    case 'hoje': return dataAtividade.getTime() === hoje.getTime();
                    case 'ontem': const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1); return dataAtividade.getTime() === ontem.getTime();
                    case 'semana': const umaSemanaAtras = new Date(hoje); umaSemanaAtras.setDate(hoje.getDate() - 6); return dataAtividade >= umaSemanaAtras;
                    case 'mes': const umMesAtras = new Date(hoje); umMesAtras.setMonth(hoje.getMonth() - 1); return dataAtividade >= umMesAtras;
                    default: return true;
                }
            });
        }

        if (filtrosAtivos.status) {
            dadosFiltrados = dadosFiltrados.filter(l => l.situacaoAprovacao === filtrosAtivos.status);
        }

        if (filtrosAtivos.osId) {
            dadosFiltrados = dadosFiltrados.filter(l => l.os.id == filtrosAtivos.osId);
        }

        return dadosFiltrados;
    }

    async function carregarLancamentos() {
        toggleLoader(true);
        try {
            const response = await fetchComAuth('https://www.inproutservices.com.br/api/lancamentos');
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            const lancamentosDaApi = await response.json();
            todosLancamentos = filtrarLancamentosParaUsuario(lancamentosDaApi);
            renderizarCardsDashboard(todosLancamentos);
            popularFiltroOS();
            renderizarTodasAsTabelas();
        } catch (error) {
            console.error('Falha ao buscar lançamentos:', error);
            mostrarToast('Falha ao carregar dados do servidor.', 'error');
        } finally {
            toggleLoader(false);
        }
    }

    function renderizarTodasAsTabelas() {
        const dadosParaExibir = getDadosFiltrados();
        const comparer = (a, b) => {
            let valA = getNestedValue(a, sortConfig.key);
            let valB = getNestedValue(b, sortConfig.key);
            const isDate = sortConfig.key.toLowerCase().includes('data');
            const isValue = sortConfig.key.toLowerCase().includes('valor');
            if (isDate) { valA = valA ? parseDataBrasileira(valA) : new Date(0); valB = valB ? parseDataBrasileira(valB) : new Date(0); }
            else if (isValue) { valA = Number(valA) || 0; valB = Number(valB) || 0; }
            if (typeof valA === 'string') { return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); }
            else { return sortConfig.direction === 'asc' ? valA - valB : valB - valA; }
        };

        const statusPendentes = ['PENDENTE_COORDENADOR', 'AGUARDANDO_EXTENSAO_PRAZO', 'PENDENTE_CONTROLLER'];
        const statusRejeitados = ['RECUSADO_COORDENADOR', 'RECUSADO_CONTROLLER'];
        const rascunhos = dadosParaExibir.filter(l => l.situacaoAprovacao === 'RASCUNHO').sort(comparer);
        const pendentesAprovacao = dadosParaExibir.filter(l => statusPendentes.includes(l.situacaoAprovacao)).sort(comparer);
        const minhasPendencias = dadosParaExibir.filter(l => statusRejeitados.includes(l.situacaoAprovacao)).sort(comparer);
        const historico = dadosParaExibir.filter(l => !['RASCUNHO', ...statusPendentes, ...statusRejeitados].includes(l.situacaoAprovacao)).sort(comparer);
        const paralisados = getProjetosParalisados().sort(comparer);

        inicializarCabecalhos();
        renderizarTabela(rascunhos, tbodyLancamentos, colunasLancamentos);
        renderizarTabela(pendentesAprovacao, tbodyPendentes, colunasPrincipais);
        renderizarTabela(minhasPendencias, tbodyMinhasPendencias, colunasMinhasPendencias);
        renderizarTabela(historico, tbodyHistorico, colunasHistorico);
        renderizarTabela(paralisados, tbodyParalisados, colunasMinhasPendencias);

        if (notificacaoPendencias) {
            notificacaoPendencias.textContent = minhasPendencias.length;
            notificacaoPendencias.style.display = minhasPendencias.length > 0 ? '' : 'none';
        }
    }

    function adicionarListenersDeOrdenacao() {
        const theads = document.querySelectorAll('.tab-pane thead');
        theads.forEach(thead => {
            thead.addEventListener('click', (e) => {
                const header = e.target.closest('th.sortable');
                if (!header) return;
                const key = header.dataset.sortKey;
                if (sortConfig.key === key) {
                    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortConfig.key = key;
                    sortConfig.direction = 'desc';
                }
                renderizarTodasAsTabelas();
            });
        });
    }

    const modalAdicionarEl = document.getElementById('modalAdicionar');
    const modalAdicionar = modalAdicionarEl ? new bootstrap.Modal(modalAdicionarEl) : null;

    if (modalAdicionarEl) {
        const formAdicionar = document.getElementById('formAdicionar');
        const modalTitle = document.getElementById('modalAdicionarLabel');
        const submitButton = document.getElementById('btnSubmitAdicionar');

        const selectOS = document.getElementById('osId');
        const selectProjeto = document.getElementById('projetoId');
        const selectPrestador = document.getElementById('prestadorId');
        const selectEtapaGeral = document.getElementById('etapaGeralSelect');
        const selectEtapaDetalhada = document.getElementById('etapaDetalhadaId');
        const selectStatus = document.getElementById('status');
        const lpuContainer = document.getElementById('lpuContainer');

        let todasAsOS = [];
        let todasAsEtapas = [];
        let todosOsPrestadores = [];

        formAdicionar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitter = e.submitter || document.activeElement;
            const acao = submitter.dataset.acao;
            const editingId = formAdicionar.dataset.editingId;

            const osLpuDetalheIdCorreto = formAdicionar.dataset.osLpuDetalheId || document.getElementById('lpuId').value;

            const payload = {
                managerId: localStorage.getItem('usuarioId'),
                osId: selectOS.value,
                prestadorId: selectPrestador.value,
                etapaDetalhadaId: selectEtapaDetalhada.value,
                dataAtividade: converterDataParaDDMMYYYY(document.getElementById('dataAtividade').value),
                vistoria: document.getElementById('vistoria').value,
                planoVistoria: converterDataParaDDMMYYYY(document.getElementById('planoVistoria').value) || null,
                desmobilizacao: document.getElementById('desmobilizacao').value,
                planoDesmobilizacao: converterDataParaDDMMYYYY(document.getElementById('planoDesmobilizacao').value) || null,
                instalacao: document.getElementById('instalacao').value,
                planoInstalacao: converterDataParaDDMMYYYY(document.getElementById('planoInstalacao').value) || null,
                ativacao: document.getElementById('ativacao').value,
                planoAtivacao: converterDataParaDDMMYYYY(document.getElementById('planoAtivacao').value) || null,
                documentacao: document.getElementById('documentacao').value,
                planoDocumentacao: converterDataParaDDMMYYYY(document.getElementById('planoDocumentacao').value) || null,
                status: selectStatus.value,
                situacao: document.getElementById('situacao').value,
                detalheDiario: document.getElementById('detalheDiario').value,
                valor: parseFloat(document.getElementById('valor').value.replace(/\./g, '').replace(',', '.')) || 0,
                situacaoAprovacao: acao === 'enviar' ? 'PENDENTE_COORDENADOR' : 'RASCUNHO',
                osLpuDetalheId: osLpuDetalheIdCorreto
            };

            const url = editingId ? `https://www.inproutservices.com.br/api/lancamentos/${editingId}` : 'https://www.inproutservices.com.br/api/lancamentos';
            const method = editingId ? 'PUT' : 'POST';

            try {
                toggleModalLoader(true);
                const response = await fetchComAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) {
                    let errorMsg = 'Erro desconhecido no servidor.';
                    try { const errorData = await response.json(); errorMsg = errorData.message || JSON.stringify(errorData); }
                    catch (e) { errorMsg = await response.text(); }
                    throw new Error(errorMsg);
                }
                mostrarToast('Lançamento salvo com sucesso!', 'success');
                modalAdicionar.hide();
                await carregarLancamentos();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleModalLoader(false);
            }
        });

        async function carregarEPopularLPU(osId) {
            const selectLPU = document.getElementById('lpuId');
            if (!osId) {
                lpuContainer.classList.add('d-none');
                selectLPU.innerHTML = '';
                return;
            }

            lpuContainer.classList.remove('d-none');
            selectLPU.innerHTML = '<option>Carregando LPUs...</option>';
            selectLPU.disabled = true;

            try {
                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a LPU...</option>';
                const response = await fetchComAuth(`https://www.inproutservices.com.br/api/os/${osId}`);
                if (!response.ok) throw new Error('Falha ao buscar detalhes da OS.');
                const osData = await response.json();
                const lpusParaExibir = osData.detalhes;

                if (lpusParaExibir && lpusParaExibir.length > 0) {
                    lpusParaExibir.forEach(item => {
                        const lpu = item.lpu || item;
                        const quantidade = item.quantidade || 'N/A';
                        const key = item.key || 'N/A';
                        const codigo = lpu.codigoLpu || lpu.codigo || '';
                        const nome = lpu.nomeLpu || lpu.nome || '';
                        const label = `${codigo} - ${nome} | Qtd: ${quantidade} | Key: ${key}`;
                        const value = item.id;
                        selectLPU.add(new Option(label, value));
                    });
                }

                if (selectLPU.options.length <= 1) {
                    selectLPU.innerHTML = '<option value="" disabled>Nenhuma LPU encontrada.</option>';
                } else {
                    selectLPU.disabled = false;
                }
            } catch (error) {
                mostrarToast(error.message, 'error');
                lpuContainer.classList.add('d-none');
            }
        }

        selectOS.addEventListener('change', async (e) => {
            const osId = e.target.value;
            const os = todasAsOS.find(os => os.id == osId);
            if (os && selectProjeto.value !== os.projeto) {
                selectProjeto.value = os.projeto;
            }
            preencherCamposOS(osId);
            await carregarEPopularLPU(osId);
        });

        selectProjeto.addEventListener('change', async (e) => {
            const projeto = e.target.value;
            const primeiraOSDoProjeto = todasAsOS.find(os => os.projeto === projeto);
            if (primeiraOSDoProjeto) {
                selectOS.value = primeiraOSDoProjeto.id;
                selectOS.dispatchEvent(new Event('change'));
            }
        });

        async function popularSelect(selectElement, url, valueField, textFieldFormatter) {
            try {
                const response = await fetchComAuth(url);
                if (!response.ok) throw new Error(`Falha ao carregar dados: ${response.statusText}`);
                const data = await response.json();

                if (selectElement.id.includes('prestadorId') && typeof Choices !== 'undefined') {
                    if (selectElement.choices) selectElement.choices.destroy();
                    selectElement.innerHTML = '';
                    const choices = new Choices(selectElement, { searchEnabled: true, placeholder: true, placeholderValue: 'Busque pelo nome ou código...', itemSelectText: '', noResultsText: 'Nenhum resultado' });
                    const choicesData = data.map(item => ({ value: item[valueField], label: textFieldFormatter(item) }));
                    choices.setChoices(choicesData, 'value', 'label', false);
                    selectElement.choices = choices;
                } else {
                    selectElement.innerHTML = `<option value="" selected disabled>Selecione...</option>`;
                    data.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item[valueField];
                        option.textContent = textFieldFormatter(item);
                        selectElement.appendChild(option);
                    });
                }
                return data;
            } catch (error) {
                console.error(`Erro ao popular o select #${selectElement.id}:`, error);
                selectElement.innerHTML = `<option value="" selected disabled>Erro ao carregar</option>`;
                return [];
            }
        }

        function preencherCamposOS(osId) {
            const osSelecionada = todasAsOS.find(os => os.id == osId);
            if (osSelecionada) {
                document.getElementById('site').value = osSelecionada.detalhes?.[0]?.site || '';
                document.getElementById('segmento').value = osSelecionada.segmento?.nome || '';
                document.getElementById('projeto').value = osSelecionada.projeto || '';
                document.getElementById('contrato').value = osSelecionada.detalhes?.[0]?.contrato || '';
                document.getElementById('gestorTim').value = osSelecionada.gestorTim || '';
                document.getElementById('regional').value = osSelecionada.detalhes?.[0]?.regional || '';
            }
        }

        async function carregarDadosParaModal() {
            if (todasAsOS.length === 0) {
                try {
                    const usuarioId = localStorage.getItem('usuarioId');
                    if (!usuarioId) throw new Error('ID do usuário não encontrado.');
                    const response = await fetchComAuth(`https://www.inproutservices.com.br/api/os/por-usuario/${usuarioId}`);
                    if (!response.ok) throw new Error('Falha ao carregar Ordens de Serviço.');
                    todasAsOS = await response.json();
                    const projetosUnicos = [...new Set(todasAsOS.map(os => os.projeto))];
                    selectProjeto.innerHTML = `<option value="" selected disabled>Selecione...</option>`;
                    projetosUnicos.forEach(projeto => {
                        selectProjeto.add(new Option(projeto, projeto));
                    });
                    selectOS.innerHTML = `<option value="" selected disabled>Selecione...</option>`;
                    todasAsOS.forEach(item => {
                        selectOS.add(new Option(item.os, item.id));
                    });
                } catch (error) {
                    console.error('Erro ao popular selects de OS/Projeto:', error);
                }
            }
            if (!todosOsPrestadores || todosOsPrestadores.length === 0) {
                todosOsPrestadores = await popularSelect(selectPrestador, 'https://www.inproutservices.com.br/api/index/prestadores/ativos', 'id', item => `${item.codigoPrestador} - ${item.prestador}`);
            }
            if (todasAsEtapas.length === 0) {
                todasAsEtapas = await popularSelect(selectEtapaGeral, 'https://www.inproutservices.com.br/api/index/etapas', 'id', item => `${item.codigo} - ${item.nome}`);
            }
        }

        async function abrirModalParaEdicao(lancamento, editingId) {
            const formAdicionar = document.getElementById('formAdicionar');
            const modalTitle = document.getElementById('modalAdicionarLabel');
            const btnSubmitPadrao = document.getElementById('btnSubmitAdicionar');
            const btnSalvarRascunho = document.getElementById('btnSalvarRascunho');
            const btnSalvarEEnviar = document.getElementById('btnSalvarEEnviar');
            const dataAtividadeInput = document.getElementById('dataAtividade');
            const lpuContainer = document.getElementById('lpuContainer');
            const selectProjeto = document.getElementById('projetoId');
            const selectOS = document.getElementById('osId');
            const selectLPU = document.getElementById('lpuId');
            const selectEtapaGeral = document.getElementById('etapaGeralSelect');

            // CORREÇÃO: Usar a instância do modal que já existe no escopo, em vez de criar uma nova.
            // const modalAdicionar = new bootstrap.Modal(document.getElementById('modalAdicionar'));

            await carregarDadosParaModal();
            formAdicionar.reset();
            if (editingId) { formAdicionar.dataset.editingId = editingId; }
            else { delete formAdicionar.dataset.editingId; }
            if (lancamento.detalhe && lancamento.detalhe.id) { formAdicionar.dataset.osLpuDetalheId = lancamento.detalhe.id; }
            else { delete formAdicionar.dataset.osLpuDetalheId; }

            if (lpuContainer) lpuContainer.classList.add('d-none');
            if (selectProjeto) selectProjeto.disabled = true;
            if (btnSubmitPadrao) btnSubmitPadrao.style.display = 'none';
            if (btnSalvarRascunho) btnSalvarRascunho.style.display = 'none';
            if (btnSalvarEEnviar) btnSalvarEEnviar.style.display = 'none';

            if (editingId) {
                if (lancamento.situacaoAprovacao === 'RASCUNHO') {
                    if (modalTitle) modalTitle.innerHTML = `<i class="bi bi-pencil"></i> Editar Rascunho #${lancamento.id}`;
                    if (btnSalvarRascunho) btnSalvarRascunho.style.display = 'inline-block';
                    if (btnSalvarEEnviar) btnSalvarEEnviar.style.display = 'inline-block';
                } else {
                    if (modalTitle) modalTitle.innerHTML = `<i class="bi bi-pencil-square"></i> Editar Lançamento #${editingId}`;
                    if (btnSubmitPadrao) {
                        btnSubmitPadrao.style.display = 'inline-block';
                        btnSubmitPadrao.innerHTML = `<i class="bi bi-send-check"></i> Salvar e Reenviar`;
                    }
                }
                if (dataAtividadeInput) dataAtividadeInput.value = lancamento.dataAtividade ? lancamento.dataAtividade.split('/').reverse().join('-') : '';
            } else {
                if (modalTitle) modalTitle.innerHTML = `<i class="bi bi-play-circle"></i> Retomar Lançamento (Novo)`;
                if (btnSubmitPadrao) {
                    btnSubmitPadrao.style.display = 'inline-block';
                    btnSubmitPadrao.innerHTML = `<i class="bi bi-check-circle"></i> Criar Lançamento`;
                }
                if (dataAtividadeInput) dataAtividadeInput.value = new Date().toISOString().split('T')[0];
            }

            if (lancamento.os && lancamento.os.projeto && selectProjeto) {
                selectProjeto.value = lancamento.os.projeto;
            }
            document.getElementById('detalheDiario').value = lancamento.detalheDiario || '';
            document.getElementById('valor').value = (lancamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            document.getElementById('situacao').value = lancamento.situacao || '';
            ['vistoria', 'desmobilizacao', 'instalacao', 'ativacao', 'documentacao'].forEach(k => {
                const el = document.getElementById(k);
                if (el) el.value = lancamento[k] || 'N/A';
            });
            ['planoVistoria', 'planoDesmobilizacao', 'planoInstalacao', 'planoAtivacao', 'planoDocumentacao'].forEach(k => {
                const el = document.getElementById(k);
                if (el && lancamento[k]) el.value = lancamento[k].split('/').reverse().join('-');
            });
            if (lancamento.os && lancamento.os.id && selectOS) {
                selectOS.value = lancamento.os.id;
                preencherCamposOS(lancamento.os.id);
            }

            if (selectLPU) selectLPU.innerHTML = '';
            if (lancamento.detalhe && lancamento.detalhe.lpu) {
                const lpu = lancamento.detalhe.lpu;
                if (selectLPU) {
                    selectLPU.add(new Option(labelLpu(lpu), lpu.id));
                    selectLPU.value = lpu.id;
                }
                if (lpuContainer) lpuContainer.classList.remove('d-none');
            }
            if (selectOS) selectOS.disabled = true;
            if (selectLPU) selectLPU.disabled = true;

            const selectPrestadorEl = document.getElementById('prestadorId');
            if (selectPrestadorEl) {
                if (selectPrestadorEl.choices) {
                    selectPrestadorEl.choices.destroy();
                }
                const prestadores = await fetchComAuth('https://www.inproutservices.com.br/api/index/prestadores/ativos').then(res => res.json());
                const choices = new Choices(selectPrestadorEl, { searchEnabled: true, placeholder: true, placeholderValue: 'Digite para buscar o prestador...', itemSelectText: '', noResultsText: 'Nenhum resultado', });
                const choicesData = prestadores.map(item => ({ value: item.id, label: `${item.codigoPrestador} - ${item.prestador}` }));
                choices.setChoices(choicesData, 'value', 'label', false);
                selectPrestadorEl.choices = choices;

                if (lancamento.prestador?.id) {
                    setTimeout(() => { selectPrestadorEl.choices.setChoiceByValue(String(lancamento.prestador.id)); }, 100);
                }
            }

            if (lancamento.etapa && lancamento.etapa.id && selectEtapaGeral) {
                const etapaGeralPai = todasAsEtapas.find(eg => eg.codigo === lancamento.etapa.codigoGeral);
                if (etapaGeralPai) {
                    selectEtapaGeral.value = etapaGeralPai.id;
                    await popularDropdownsDependentes(etapaGeralPai.id, lancamento.etapa.id, lancamento.status);
                }
            } else if (selectEtapaGeral) {
                selectEtapaGeral.value = '';
                await popularDropdownsDependentes('', null, null);
            }

            modalAdicionar.show();
        }

        modalAdicionarEl.addEventListener('show.bs.modal', async () => {
            if (!formAdicionar.dataset.editingId) {
                await carregarDadosParaModal();
                modalTitle.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar Nova Atividade';
                document.getElementById('btnSubmitAdicionar').style.display = 'none';
                document.getElementById('btnSalvarRascunho').style.display = 'inline-block';
                btnSalvarRascunho.dataset.acao = 'rascunho';
                document.getElementById('btnSalvarEEnviar').style.display = 'inline-block';
                btnSalvarEEnviar.dataset.acao = 'enviar';
                selectOS.disabled = false;
                selectProjeto.disabled = false;
                document.getElementById('dataAtividade').disabled = false;
            }
        });

        modalAdicionarEl.addEventListener('hidden.bs.modal', () => {
            formAdicionar.reset();
            delete formAdicionar.dataset.editingId;
            delete formAdicionar.dataset.osLpuDetalheId;
            selectEtapaDetalhada.innerHTML = '<option value="" selected disabled>Primeiro, selecione a etapa geral</option>';
            selectEtapaDetalhada.disabled = true;
            selectStatus.innerHTML = '<option value="" selected disabled>Primeiro, selecione a etapa detalhada</option>';
            selectStatus.disabled = true;
            selectOS.disabled = false;
            selectProjeto.disabled = false;
            lpuContainer.classList.add('d-none');
            document.getElementById('lpuId').innerHTML = '';
        });

        document.body.addEventListener('click', async (e) => {
            const reenviarBtn = e.target.closest('.btn-reenviar, .btn-editar-rascunho, .btn-retomar');
            const comentariosBtn = e.target.closest('.btn-ver-comentarios');
            const submeterBtn = e.target.closest('.btn-submeter-agora');
            const addComplementarBtn = e.target.closest('.btn-add-complementar');

            if (reenviarBtn) {
                const originalContent = reenviarBtn.innerHTML;
                try {
                    reenviarBtn.disabled = true;
                    reenviarBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
                    const lancamentoId = reenviarBtn.dataset.id;
                    const lancamento = todosLancamentos.find(l => l.id == lancamentoId);
                    if (lancamento) {
                        const isRetomar = reenviarBtn.classList.contains('btn-retomar');
                        await abrirModalParaEdicao(lancamento, isRetomar ? null : lancamento.id);
                    } else {
                        throw new Error('Lançamento não encontrado.');
                    }
                } catch (error) {
                    console.error("Erro ao preparar modal:", error);
                    mostrarToast(error.message, 'error');
                } finally {
                    reenviarBtn.disabled = false;
                    reenviarBtn.innerHTML = originalContent;
                }
            } else if (comentariosBtn) {
                const lancamento = todosLancamentos.find(l => l.id == comentariosBtn.dataset.id);
                if (lancamento) exibirComentarios(lancamento);
                else mostrarToast('Lançamento não encontrado.', 'error');
            } else if (submeterBtn) {
                const lancamentoId = submeterBtn.dataset.id;
                const btnConfirmar = document.getElementById('btnConfirmarSubmissao');
                btnConfirmar.dataset.lancamentoId = lancamentoId;
                const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmarSubmissao'));
                modalConfirmacao.show();
            }
            else if (e.target.closest('.btn-excluir-lancamento')) {
                const btnExcluir = e.target.closest('.btn-excluir-lancamento');
                const lancamentoId = btnExcluir.dataset.id;
                document.getElementById('deleteLancamentoId').value = lancamentoId;
                const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmarExclusaoLancamento'));
                modalConfirmacao.show();
            }
        });

        // ==========================================================
        // >>>>> INÍCIO DA CORREÇÃO DA LÓGICA DE "PARALISADOS" <<<<<
        // ==========================================================
        function getProjetosParalisados() {
            const ultimosLancamentosPorProjeto = new Map();

            // 1. Encontra o lançamento mais recente para cada "projeto" (item da OS)
            todosLancamentos.forEach(l => {
                if (l.detalhe && l.detalhe.id) { // Usa o ID do detalhe como chave única do projeto
                    const chaveProjeto = l.detalhe.id;
                    if (!ultimosLancamentosPorProjeto.has(chaveProjeto) || l.id > ultimosLancamentosPorProjeto.get(chaveProjeto).id) {
                        ultimosLancamentosPorProjeto.set(chaveProjeto, l);
                    }
                }
            });

            // 2. Filtra o mapa para retornar apenas os lançamentos cuja situação é 'Paralisado'
            const lancamentosParalisados = [];
            for (const ultimoLancamento of ultimosLancamentosPorProjeto.values()) {
                if (ultimoLancamento.situacao === 'Paralisado') {
                    lancamentosParalisados.push(ultimoLancamento);
                }
            }

            return lancamentosParalisados;
        }
        // ==========================================================
        // >>>>> FIM DA CORREÇÃO DA LÓGICA DE "PARALISADOS" <<<<<
        // ==========================================================

        document.getElementById('btnConfirmarExclusaoLancamentoDefinitiva')?.addEventListener('click', async function (e) {
            const confirmButton = e.currentTarget;
            const id = document.getElementById('deleteLancamentoId').value;
            if (!id) return;
            const originalContent = confirmButton.innerHTML;
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarExclusaoLancamento'));
            try {
                confirmButton.disabled = true;
                confirmButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Excluindo...`;
                const resposta = await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}`, { method: 'DELETE' });
                if (!resposta.ok) {
                    let errorMsg = 'Erro ao excluir o lançamento.';
                    try { const errorData = await resposta.json(); errorMsg = errorData.message || errorMsg; }
                    catch (e) { errorMsg = await resposta.text(); }
                    throw new Error(errorMsg);
                }
                mostrarToast('Lançamento excluído com sucesso!', 'success');
                await carregarLancamentos();
            } catch (error) {
                console.error('Erro na exclusão do lançamento:', error);
                mostrarToast(error.message, 'error');
            } finally {
                confirmButton.disabled = false;
                confirmButton.innerHTML = originalContent;
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        });

        document.getElementById('btnConfirmarSubmissao').addEventListener('click', async function (e) {
            const confirmButton = e.currentTarget;
            const id = confirmButton.dataset.lancamentoId;
            if (!id) return;
            const originalContent = confirmButton.innerHTML;
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarSubmissao'));
            try {
                confirmButton.disabled = true;
                confirmButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Enviando...`;
                const resposta = await fetchComAuth(`https://www.inproutservices.com.br/api/lancamentos/${id}/submeter`, { method: 'POST' });
                if (!resposta.ok) {
                    const erroData = await resposta.json();
                    throw new Error(erroData.message || 'Erro ao submeter.');
                }
                mostrarToast('Lançamento submetido com sucesso!', 'success');
                await carregarLancamentos();
                renderizarTodasAsTabelas();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                confirmButton.disabled = false;
                confirmButton.innerHTML = originalContent;
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        });

        async function popularDropdownsDependentes(etapaGeralId, etapaDetalhadaIdSelecionada = null, statusSelecionado = null) {
            const selectEtapaDetalhada = document.getElementById('etapaDetalhadaId');
            const selectStatus = document.getElementById('status');
            const etapaSelecionada = todasAsEtapas.find(etapa => etapa.id == etapaGeralId);

            selectEtapaDetalhada.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectStatus.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectEtapaDetalhada.disabled = true;
            selectStatus.disabled = true;

            if (etapaSelecionada && etapaSelecionada.etapasDetalhadas && etapaSelecionada.etapasDetalhadas.length > 0) {
                etapaSelecionada.etapasDetalhadas.forEach(detalhe => {
                    selectEtapaDetalhada.add(new Option(`${detalhe.indice} - ${detalhe.nome}`, detalhe.id));
                });
                selectEtapaDetalhada.disabled = false;

                if (etapaDetalhadaIdSelecionada) {
                    selectEtapaDetalhada.value = etapaDetalhadaIdSelecionada;
                    const etapaDetalhada = etapaSelecionada.etapasDetalhadas.find(ed => ed.id == etapaDetalhadaIdSelecionada);
                    if (etapaDetalhada && etapaDetalhada.status && etapaDetalhada.status.length > 0) {
                        etapaDetalhada.status.forEach(statusValue => {
                            selectStatus.add(new Option(statusValue, statusValue));
                        });
                        selectStatus.disabled = false;
                        if (statusSelecionado) {
                            selectStatus.value = statusSelecionado;
                        }
                    }
                }
            }
        }

        selectEtapaGeral.addEventListener('change', (e) => popularDropdownsDependentes(e.target.value, null, null));
        selectEtapaDetalhada.addEventListener('change', (e) => {
            const etapaGeralId = selectEtapaGeral.value;
            popularDropdownsDependentes(etapaGeralId, e.target.value, null);
        });
    }

    function exibirComentarios(lancamento) {
        const modalBody = document.getElementById('modalComentariosBody');
        const modalTitle = document.getElementById('modalComentariosLabel');
        modalTitle.textContent = `Comentários do Lançamento`;
        modalBody.innerHTML = '';

        if (!lancamento.comentarios || lancamento.comentarios.length === 0) {
            modalBody.innerHTML = '<p class="text-muted text-center">Nenhum comentário para este lançamento.</p>';
            return;
        }

        const comentariosOrdenados = [...lancamento.comentarios].sort((a, b) => {
            const parseDate = (str) => {
                const [date, time] = str.split(' ');
                const [day, month, year] = date.split('/');
                const [hour, minute] = time.split(':');
                return new Date(year, month - 1, day, hour, minute);
            };
            return parseDate(b.dataHora) - parseDate(a.dataHora);
        });

        comentariosOrdenados.forEach(comentario => {
            const comentarioCard = document.createElement('div');
            comentarioCard.className = 'card mb-3';
            const partes = comentario.dataHora.split(' ');
            const dataPartes = partes[0].split('/');
            const tempoPartes = partes[1].split(':');
            const dataValida = new Date(dataPartes[2], dataPartes[1] - 1, dataPartes[0], tempoPartes[0], tempoPartes[1]);
            const dataFormatada = dataValida.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            comentarioCard.innerHTML = `
                <div class="card-header bg-light d-flex justify-content-between align-items-center small">
                    <strong><i class="bi bi-person-circle me-2"></i>${comentario.autor.nome}</strong>
                    <span class="text-muted">${dataFormatada}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">${comentario.texto}</p>
                </div>
            `;
            modalBody.appendChild(comentarioCard);
        });
    }

    const filtroDataCustomEl = document.getElementById('filtroDataCustom');
    const filtroStatusEl = document.getElementById('filtroStatusAprovacao');
    const filtroOsEl = document.getElementById('filtroOS');
    const btnLimparFiltros = document.getElementById('limparFiltros');

    const calendario = flatpickr(filtroDataCustomEl, {
        mode: "range", dateFormat: "d/m/Y", locale: "pt",
        onClose: function (selectedDates) {
            if (selectedDates.length === 2) {
                filtrosAtivos.periodo = { start: selectedDates[0], end: selectedDates[1] };
                renderizarTodasAsTabelas();
            }
        }
    });

    function popularFiltroOS() {
        const osUnicas = [...new Map(todosLancamentos.map(l => [l.os.id, l.os])).values()]
            .sort((a, b) => a.os.localeCompare(b.os));
        osUnicas.forEach(os => filtroOsEl.add(new Option(os.os, os.id)));
    }

    document.querySelector('.dropdown-menu.p-3').addEventListener('click', (e) => {
        if (e.target.matches('[data-filter="periodo"]')) {
            filtrosAtivos.periodo = e.target.dataset.value;
            calendario.clear();
            renderizarTodasAsTabelas();
        }
    });

    filtroStatusEl.addEventListener('change', (e) => {
        filtrosAtivos.status = e.target.value;
        renderizarTodasAsTabelas();
    });

    filtroOsEl.addEventListener('change', (e) => {
        filtrosAtivos.osId = e.target.value;
        renderizarTodasAsTabelas();
    });

    btnLimparFiltros.addEventListener('click', () => {
        filtrosAtivos = { periodo: null, status: null, osId: null };
        calendario.clear();
        filtroStatusEl.value = "";
        filtroOsEl.value = "";
        searchInput.value = "";
        renderizarTodasAsTabelas();
    });

    searchInput.addEventListener('input', () => {
        renderizarTodasAsTabelas();
    });

    // ==========================================================
    // SEÇÃO 4: LÓGICA DO MODAL DE SOLICITAÇÃO DE MATERIAL
    // ==========================================================
    const modalSolicitarMaterialEl = document.getElementById('modalSolicitarMaterial');
    if (modalSolicitarMaterialEl) {
        const modalSolicitarMaterial = new bootstrap.Modal(modalSolicitarMaterialEl);
        const formSolicitacao = document.getElementById('formSolicitarMaterial');
        const selectOS = document.getElementById('osSolicitacao');
        const selectLPU = document.getElementById('lpuSolicitacao');
        const listaItensContainer = document.getElementById('listaItens');
        const btnAdicionarItem = document.getElementById('btnAdicionarItem');
        let todosOsMateriais = [];

        const popularSelectMateriais = (selectElement) => {
            selectElement.innerHTML = '<option value="" selected disabled>Carregando...</option>';
            if (todosOsMateriais.length === 0) {
                fetchComAuth('https://www.inproutservices.com.br/api/materiais')
                    .then(res => res.json())
                    .then(data => {
                        todosOsMateriais = data;
                        preencherOpcoes(selectElement);
                    })
                    .catch(err => {
                        console.error("Erro ao buscar materiais:", err);
                        selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
                    });
            } else {
                preencherOpcoes(selectElement);
            }
        };

        const preencherOpcoes = (selectElement) => {
            selectElement.innerHTML = '<option value="" selected disabled>Selecione o material...</option>';
            todosOsMateriais.forEach(material => {
                const option = new Option(`${material.empresa} - ${material.codigo} - ${material.descricao}`, material.codigo);
                selectElement.add(option);
            });
        };

        modalSolicitarMaterialEl.addEventListener('show.bs.modal', async () => {
            formSolicitacao.reset();
            listaItensContainer.innerHTML = `
            <div class="row g-2 align-items-center mb-2 item-row">
              <div class="col-md"><select class="form-select material-select" required><option selected disabled value="">Selecione...</option></select></div>
              <div class="col-md-3"><input type="number" class="form-control quantidade-input" placeholder="Qtde." min="1" value="1" required></div>
              <div class="col-md-auto"><button type="button" class="btn btn-outline-danger btn-sm btn-remover-item" title="Remover Item" disabled><i class="bi bi-trash"></i></button></div>
            </div>`;
            selectLPU.innerHTML = '<option value="" selected disabled>Selecione a OS primeiro...</option>';
            selectLPU.disabled = true;
            popularSelectMateriais(listaItensContainer.querySelector('.material-select'));

            try {
                const usuarioId = localStorage.getItem('usuarioId');
                if (!usuarioId) {
                    throw new Error('ID do usuário não encontrado para filtrar as OSs.');
                }
                const response = await fetchComAuth(`https://www.inproutservices.com.br/api/os/por-usuario/${usuarioId}`);
                const oss = await response.json();
                selectOS.innerHTML = '<option value="" selected disabled>Selecione a OS...</option>';
                oss.forEach(os => {
                    const option = new Option(os.os, os.id);
                    selectOS.add(option);
                });
            } catch (error) {
                console.error("Erro ao buscar OSs:", error);
                selectOS.innerHTML = '<option value="">Erro ao carregar</option>';
            }
        });

        selectOS.addEventListener('change', async (e) => {
            const osId = e.target.value;
            const selectLPU = document.getElementById('lpuSolicitacao');
            selectLPU.disabled = true;
            selectLPU.innerHTML = '<option>Carregando LPUs...</option>';

            if (!osId) {
                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a OS primeiro...</option>';
                return;
            }

            try {
                const response = await fetchComAuth(`https://www.inproutservices.com.br/api/os/${osId}/lpus`);
                if (!response.ok) throw new Error('Falha ao buscar LPUs.');
                const lpus = await response.json();
                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a LPU...</option>';
                if (lpus && lpus.length > 0) {
                    lpus.forEach(lpu => {
                        const option = new Option(labelLpu(lpu), lpu.id);
                        selectLPU.add(option);
                    });
                    selectLPU.disabled = false;
                } else {
                    selectLPU.innerHTML = '<option value="" disabled>Nenhuma LPU encontrada</option>';
                }
            } catch (error) {
                console.error("Erro ao buscar LPUs:", error);
                selectLPU.innerHTML = '<option value="">Erro ao carregar</option>';
            }
        });

        btnAdicionarItem.addEventListener('click', () => {
            const novoItemRow = listaItensContainer.firstElementChild.cloneNode(true);
            const newSelect = novoItemRow.querySelector('.material-select');
            novoItemRow.querySelector('.quantidade-input').value = 1;
            const btnRemover = novoItemRow.querySelector('.btn-remover-item');
            btnRemover.disabled = false;
            listaItensContainer.appendChild(novoItemRow);
            popularSelectMateriais(newSelect);
        });

        listaItensContainer.addEventListener('click', (e) => {
            if (e.target.closest('.btn-remover-item')) {
                e.target.closest('.item-row').remove();
            }
        });

        formSolicitacao.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btnEnviarSolicitacao');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Enviando...`;
            const itens = [];
            document.querySelectorAll('#listaItens .item-row').forEach(row => {
                const codigoMaterial = row.querySelector('.material-select').value;
                const quantidade = row.querySelector('.quantidade-input').value;
                if (codigoMaterial && quantidade) {
                    itens.push({ codigoMaterial, quantidade: parseFloat(quantidade) });
                }
            });

            const payload = {
                idSolicitante: localStorage.getItem('usuarioId'),
                osId: selectOS.value,
                lpuId: selectLPU.value,
                justificativa: document.getElementById('justificativaSolicitacao').value,
                itens: itens
            };

            try {
                const response = await fetchComAuth('https://www.inproutservices.com.br/api/solicitacoes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error('Falha ao criar solicitação. Verifique o console para detalhes.');
                }
                mostrarToast('Solicitação enviada com sucesso!', 'success');
                modalSolicitarMaterial.hide();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="bi bi-send me-1"></i> Enviar Solicitação';
            }
        });
    }

    // ==========================================================
    // SEÇÃO 5: LÓGICA DO NOVO MODAL - SOLICITAR COMPLEMENTAR
    // ==========================================================
    const modalSolicitarComplementarEl = document.getElementById('modalSolicitarComplementar');
    if (modalSolicitarComplementarEl) {
        const modalSolicitarComplementar = new bootstrap.Modal(modalSolicitarComplementarEl);
        const form = document.getElementById('formSolicitarComplementar');
        const selectOS = document.getElementById('osIdComplementar');
        const selectProjeto = document.getElementById('projetoIdComplementar');
        const selectLPU = document.getElementById('lpuIdComplementar');
        let todasAsOS = []; // Cache para as OSs do usuário

        modalSolicitarComplementarEl.addEventListener('show.bs.modal', async () => {
            form.reset();
            selectLPU.disabled = true;
            selectLPU.innerHTML = '<option value="" selected disabled>Selecione a OS primeiro...</option>';
            selectOS.innerHTML = '<option value="" selected disabled>Carregando OSs...</option>';
            selectProjeto.innerHTML = '<option value="" selected disabled>Carregando Projetos...</option>';

            try {
                // Se a lista de OSs ainda não foi carregada, busca na API
                if (todasAsOS.length === 0) {
                    const usuarioId = localStorage.getItem('usuarioId');
                    if (!usuarioId) throw new Error('ID do usuário não encontrado.');
                    const response = await fetchComAuth(`https://www.inproutservices.com.br/api/os/por-usuario/${usuarioId}`);
                    if (!response.ok) throw new Error('Falha ao carregar OSs do usuário.');
                    todasAsOS = await response.json();
                }

                // Popula o select de Projetos
                const projetosUnicos = [...new Set(todasAsOS.map(os => os.projeto))];
                selectProjeto.innerHTML = '<option value="" selected disabled>Selecione o projeto...</option>';
                projetosUnicos.forEach(projeto => {
                    selectProjeto.add(new Option(projeto, projeto));
                });

                // Popula o select de OSs (inicialmente com todas)
                selectOS.innerHTML = '<option value="" selected disabled>Selecione a OS...</option>';
                todasAsOS.forEach(os => {
                    selectOS.add(new Option(os.os, os.id));
                });

            } catch (error) {
                selectOS.innerHTML = '<option value="">Erro ao carregar</option>';
                selectProjeto.innerHTML = '<option value="">Erro ao carregar</option>';
                mostrarToast(error.message, 'error');
            }
        });

        // Evento de mudança no select de Projeto
        selectProjeto.addEventListener('change', (e) => {
            const projetoSelecionado = e.target.value;
            const osDoProjeto = todasAsOS.filter(os => os.projeto === projetoSelecionado);

            selectOS.innerHTML = '<option value="" selected disabled>Selecione a OS...</option>';
            osDoProjeto.forEach(os => {
                selectOS.add(new Option(os.os, os.id));
            });

            // Dispara o 'change' na OS para carregar as LPUs
            if (osDoProjeto.length > 0) {
                selectOS.value = osDoProjeto[0].id; // Seleciona a primeira OS por padrão
                selectOS.dispatchEvent(new Event('change'));
            } else {
                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a OS primeiro...</option>';
                selectLPU.disabled = true;
            }
        });

        // Evento de mudança no select de OS
        selectOS.addEventListener('change', async () => {
            // Sincroniza o select de Projeto
            const osId = selectOS.value;
            const osSelecionada = todasAsOS.find(os => os.id == osId);
            if (osSelecionada && selectProjeto.value !== osSelecionada.projeto) {
                selectProjeto.value = osSelecionada.projeto;
            }

            // Lógica para carregar as LPUs
            selectLPU.disabled = true;
            selectLPU.innerHTML = '<option>Carregando LPUs...</option>';

            try {
                // Busca todos os contratos e suas LPUs ativas
                const response = await fetchComAuth(`${API_BASE_URL}/contrato`);
                if (!response.ok) throw new Error('Falha ao buscar LPUs.');
                const contratos = await response.json();

                selectLPU.innerHTML = '<option value="" selected disabled>Selecione o item LPU...</option>';
                contratos.forEach(contrato => {
                    if (contrato.lpus && contrato.lpus.length > 0) {
                        contrato.lpus.forEach(lpu => {
                            if (lpu.ativo) {
                                const label = `Contrato: ${contrato.nome} | ${lpu.codigoLpu} - ${lpu.nomeLpu}`;
                                selectLPU.add(new Option(label, lpu.id));
                            }
                        });
                    }
                });
                selectLPU.disabled = false;

            } catch (error) {
                mostrarToast('Erro ao carregar a lista de LPUs.', 'error');
                selectLPU.innerHTML = '<option value="">Erro ao carregar</option>';
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btnEnviarSolicitacaoComplementar');

            const payload = {
                osId: selectOS.value,
                lpuId: selectLPU.value,
                quantidade: document.getElementById('quantidadeComplementar').value,
                justificativa: document.getElementById('justificativaComplementar').value,
                solicitanteId: localStorage.getItem('usuarioId')
            };

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Enviando...`;

            try {
                // Este endpoint não existe no backend, você precisará criá-lo.
                // Vou manter a chamada, mas saiba que ela vai falhar até o backend ser ajustado.
                const response = await fetchComAuth(`${API_BASE_URL}/solicitacoes-complementares`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao enviar solicitação.');
                }

                mostrarToast('Solicitação de atividade complementar enviada com sucesso!', 'success');
                modalSolicitarComplementar.hide();

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="bi bi-send me-1"></i> Enviar para Aprovação';
            }
        });
    }

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            const dadosParaExportar = {
                "Pendências": {
                    dados: getDadosFiltrados().filter(l => ['RECUSADO_COORDENADOR', 'RECUSADO_CONTROLLER'].includes(l.situacaoAprovacao)),
                    colunas: colunasMinhasPendencias
                },
                "Lançamentos": {
                    dados: getDadosFiltrados().filter(l => l.situacaoAprovacao === 'RASCUNHO'),
                    colunas: colunasLancamentos
                },
                "Pendente Aprovação": {
                    dados: getDadosFiltrados().filter(l => ['PENDENTE_COORDENADOR', 'AGUARDANDO_EXTENSAO_PRAZO', 'PENDENTE_CONTROLLER'].includes(l.situacaoAprovacao)),
                    colunas: colunasPrincipais
                },
                "Paralisados": {
                    dados: getProjetosParalisados(),
                    colunas: colunasMinhasPendencias
                },
                "Histórico": {
                    dados: getDadosFiltrados().filter(l => !['RASCUNHO', 'PENDENTE_COORDENADOR', 'AGUARDANDO_EXTENSAO_PRAZO', 'PENDENTE_CONTROLLER', 'RECUSADO_COORDENADOR', 'RECUSADO_CONTROLLER'].includes(l.situacaoAprovacao)),
                    colunas: colunasHistorico
                }
            };

            const wb = XLSX.utils.book_new();

            for (const aba in dadosParaExportar) {
                const { dados, colunas } = dadosParaExportar[aba];
                const rows = dados.map(lancamento => {
                    return colunas.map(coluna => {
                        const func = dataMapping[coluna];
                        if (func) {
                            return func(lancamento);
                        }
                        return "";
                    });
                });

                const ws = XLSX.utils.aoa_to_sheet([colunas, ...rows]);

                // Ajuste de largura das colunas
                const colWidths = colunas.map(col => ({ wch: Math.max(15, col.length + 2) }));
                ws['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws, aba);
            }

            XLSX.writeFile(wb, "lancamentos.xlsx");
        });
    }


    function inicializarCabecalhos() {
        renderizarCabecalho(colunasLancamentos, document.querySelector('#lancamentos-pane thead'));
        renderizarCabecalho(colunasPrincipais, document.querySelector('#pendentes-pane thead'));
        renderizarCabecalho(colunasHistorico, document.querySelector('#historico-pane thead'));
        renderizarCabecalho(colunasMinhasPendencias, document.querySelector('#minhasPendencias-pane thead'));
        renderizarCabecalho(colunasMinhasPendencias, document.querySelector('#paralisados-pane thead'));
    }

    inicializarCabecalhos();
    adicionarListenersDeOrdenacao();
    carregarLancamentos();
    configurarVisibilidadePorRole();
    window.carregarLancamentos = carregarLancamentos;
});