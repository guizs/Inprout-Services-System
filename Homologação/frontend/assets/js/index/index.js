document.addEventListener('DOMContentLoaded', () => {

    const toastElement = document.getElementById('toastMensagem');
    const toastBody = document.getElementById('toastTexto');
    const toast = toastElement ? new bootstrap.Toast(toastElement) : null;
    const searchInput = document.getElementById('searchInput');

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
        const overlay = document.getElementById("overlay-loader");
        if (overlay) {
            if (ativo) {
                overlay.classList.remove("d-none");
            } else {
                overlay.classList.add("d-none");
            }
        }
    }

    function configurarVisibilidadePorRole() {
        const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

        // Seleciona os ITENS (<li>) da navegação por aba
        const navMinhasPendencias = document.getElementById('nav-item-minhas-pendencias');
        const navLancamentos = document.getElementById('nav-item-lancamentos');
        const navPendentes = document.getElementById('nav-item-pendentes');
        const navParalisados = document.getElementById('nav-item-paralisados');
        const navHistorico = document.getElementById('nav-item-historico');

        // Seleciona os BOTÕES de ação principais
        const btnNovoLancamento = document.getElementById('btnNovoLancamento');
        const btnSolicitarMaterial = document.getElementById('btnSolicitarMaterial');

        // Seletores para ativar a aba correta
        const tabLancamentos = document.getElementById('lancamentos-tab');
        const paneLancamentos = document.getElementById('lancamentos-pane');
        const tabHistorico = document.getElementById('historico-tab');
        const paneHistorico = document.getElementById('historico-pane');
        const tabMinhasPendencias = document.getElementById('minhasPendencias-tab');
        const paneMinhasPendencias = document.getElementById('minhasPendencias-pane');

        // Oculta tudo por padrão para começar do zero
        [navMinhasPendencias, navLancamentos, navPendentes, navParalisados, navHistorico, btnNovoLancamento, btnSolicitarMaterial].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Aplica as regras de visibilidade para cada cargo
        switch (userRole) {
            case 'MANAGER':
                // Mostra todas as abas e os botões de ação
                [navMinhasPendencias, navLancamentos, navPendentes, navParalisados, navHistorico, btnNovoLancamento, btnSolicitarMaterial].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                // Define a aba padrão como "Minhas Pendências"
                tabLancamentos.classList.add('active');
                paneLancamentos.classList.add('show', 'active');
                break;

            case 'COORDINATOR':
                // Mostra "Pendente aprovação", "Paralisados" e "Histórico"
                [navPendentes, navParalisados, navHistorico].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                // Define a aba padrão como "Pendente aprovação"
                tabLancamentos.classList.remove('active');
                paneLancamentos.classList.remove('show', 'active');
                // (Opcional) Se quiser que "Pendente Aprovação" seja a aba padrão para o coordenador:
                const tabPendentes = document.getElementById('pendentes-tab');
                const panePendentes = document.getElementById('pendentes-pane');
                if (tabPendentes) tabPendentes.classList.add('active');
                if (panePendentes) panePendentes.classList.add('show', 'active');
                break;

            case 'CONTROLLER':
                // Mostra todas as abas, exceto "Minhas Pendências"
                [navLancamentos, navPendentes, navParalisados, navHistorico].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                break;

            case 'ADMIN':
                // Mostra todas as abas, exceto "Minhas Pendências", e mostra os botões de ação
                [navLancamentos, navPendentes, navParalisados, navHistorico, btnNovoLancamento, btnSolicitarMaterial].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                break;

            default:
                // Comportamento padrão para outros cargos (se houver)
                [navLancamentos, navPendentes, navParalisados, navHistorico].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                break;
        }
    }

    // ==========================================================
    // SEÇÃO 1: LÓGICA DO PAINEL "VISÃO GERAL" (RECOLHÍVEL)
    // ==========================================================
    const collapseElement = document.getElementById('collapseDashboardCards');
    const collapseIcon = document.querySelector('a[href="#collapseDashboardCards"] i');
    if (collapseElement && collapseIcon) {
        collapseElement.addEventListener('show.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-down', 'bi-chevron-up'));
        collapseElement.addEventListener('hide.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-up', 'bi-chevron-down'));
    }

    // ==========================================================
    // SEÇÃO 2: LÓGICA DAS TABELAS PRINCIPAIS (LISTAGEM)
    // ==========================================================
    const tbodyLancamentos = document.getElementById('tbody-lancamentos');
    const tbodyPendentes = document.getElementById('tbody-pendentes');
    const tbodyHistorico = document.getElementById('tbody-historico');
    const tbodyMinhasPendencias = document.getElementById('tbody-minhas-pendencias');
    const tbodyParalisados = document.getElementById('tbody-paralisados');
    const notificacaoPendencias = document.getElementById('notificacao-pendencias');
    let filtrosAtivos = { periodo: null, status: null, osId: null };
    let todosLancamentos = []; // Armazena todos os lançamentos para fácil acesso

    const colunasPrincipais = ["STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE", "SEGMENTO", "PROJETO", "LPU", "GESTOR TIM", "REGIONAL", "VISTORIA", "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DE DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO DE INSTALAÇÃO", "ATIVAÇÃO", "PLANO DE ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DE DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR"];
    const colunasLancamentos = [...colunasPrincipais.filter(c => c !== "STATUS APROVAÇÃO"), "AÇÃO"];
    const colunasMinhasPendencias = colunasLancamentos;
    const colunasHistorico = [...colunasPrincipais, "AÇÃO"];

    function renderizarCabecalho(colunas, theadElement) {
        if (!theadElement) return;
        const tr = document.createElement('tr');
        colunas.forEach(textoColuna => {
            const th = document.createElement('th');
            th.textContent = textoColuna;
            tr.appendChild(th);
        });
        theadElement.innerHTML = '';
        theadElement.appendChild(tr);
    }

    function renderizarCardsDashboard(lancamentos) {
        // --- LÓGICA GERAL ---
        const hoje = new Date().toLocaleDateString('pt-BR'); // Formato "dd/MM/yyyy"
        const statusPendenteAprovacao = ['PENDENTE_COORDENADOR', 'AGUARDANDO_EXTENSAO_PRAZO', 'PENDENTE_CONTROLLER'];
        const statusRecusado = ['RECUSADO_COORDENADOR', 'RECUSADO_CONTROLLER'];

        // --- CÁLCULO DOS CARDS ---

        // 1. Lançamentos para Hoje: Rascunhos cuja data da atividade é hoje.
        const totalLancamentosHoje = lancamentos.filter(l =>
            l.situacaoAprovacao === 'RASCUNHO' && l.dataAtividade === hoje
        ).length;

        // 2. Aguardando Aprovação
        const totalPendentesAprovacao = lancamentos.filter(l =>
            statusPendenteAprovacao.includes(l.situacaoAprovacao)
        ).length;

        // 3. Recusados para Correção
        const totalRecusados = lancamentos.filter(l =>
            statusRecusado.includes(l.situacaoAprovacao)
        ).length;

        // 4. Projetos em Andamento: Contagem de projetos únicos (OS+LPU) cujo último status NÃO é Paralisado ou Finalizado.
        const projetosAtivos = new Set();
        lancamentos.forEach(l => {
            if (l.situacao !== 'Paralisado' && l.situacao !== 'Finalizado' && l.os && l.lpu) {
                const chaveProjeto = `${l.os.id}-${l.lpu.id}`;
                projetosAtivos.add(chaveProjeto);
            }
        });
        const totalEmAndamento = projetosAtivos.size;

        // 5. Projetos Paralisados: Reutiliza a função que já existe.
        const totalParalisadas = getProjetosParalisados().length;

        // 6. Finalizados Hoje: Lançamentos com situação "Finalizado" e data da atividade de hoje.
        const totalFinalizadasHoje = lancamentos.filter(l =>
            l.situacao === 'Finalizado' && l.dataAtividade === hoje
        ).length;


        // --- ATUALIZAÇÃO DO HTML ---
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
                "DATA ATIVIDADE": lancamento.dataAtividade || '',
                "OS": os.os || '',
                "SITE": detalhe.site || '',
                "SEGMENTO": os.segmento ? os.segmento.nome : '',
                "PROJETO": os.projeto || '',
                "LPU": labelLpu(lpu),
                "GESTOR TIM": os.gestorTim || '',
                "REGIONAL": detalhe.regional || '',
                "VISTORIA": lancamento.vistoria || 'N/A',
                "PLANO DE VISTORIA": formatarData(lancamento.planoVistoria),
                "DESMOBILIZAÇÃO": lancamento.desmobilizacao || 'N/A',
                "PLANO DE DESMOBILIZAÇÃO": formatarData(lancamento.planoDesmobilizacao),
                "INSTALAÇÃO": lancamento.instalacao || 'N/A',
                "PLANO DE INSTALAÇÃO": formatarData(lancamento.planoInstalacao),
                "ATIVAÇÃO": lancamento.ativacao || 'N/A',
                "PLANO DE ATIVAÇÃO": formatarData(lancamento.planoAtivacao),
                "DOCUMENTAÇÃO": lancamento.documentacao || 'N/A',
                "PLANO DE DOCUMENTAÇÃO": formatarData(lancamento.planoDocumentacao),
                "ETAPA GERAL": (etapa.codigoGeral && etapa.nomeGeral) ? `${etapa.codigoGeral} - ${etapa.nomeGeral}` : '',
                "ETAPA DETALHADA": (etapa.indiceDetalhado && etapa.nomeDetalhado) ? `${etapa.indiceDetalhado} - ${etapa.nomeDetalhado}` : '',
                "STATUS": lancamento.status || '',
                "SITUAÇÃO": lancamento.situacao || '',
                "DETALHE DIÁRIO": lancamento.detalheDiario || '',
                "CÓD. PRESTADOR": prestador.codigo || '',
                "PRESTADOR": prestador.nome || '',
                "VALOR": formatarMoeda(lancamento.valor),
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
                        } else if (tbodyElement.id === 'tbody-lancamentos') {
                            buttonsHtml += `<button class="btn btn-sm btn-secondary btn-editar-rascunho" data-id="${lancamento.id}" title="Editar Rascunho"><i class="bi bi-pencil"></i></button>`;
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
                    l.os?.os,
                    l.detalhe?.site,
                    l.os?.segmento?.nome,
                    l.os?.projeto,
                    l.detalhe?.lpu?.nomeLpu,
                    l.detalhe?.lpu?.codigoLpu,
                    l.prestador?.nome
                ].join(' ').toLowerCase();
                return textoPesquisavel.includes(termoBusca);
            });
        }

        // 1. Filtro por PERÍODO
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
                    case 'hoje':
                        return dataAtividade.getTime() === hoje.getTime();
                    case 'ontem':
                        const ontem = new Date(hoje);
                        ontem.setDate(hoje.getDate() - 1);
                        return dataAtividade.getTime() === ontem.getTime();
                    case 'semana':
                        const umaSemanaAtras = new Date(hoje);
                        umaSemanaAtras.setDate(hoje.getDate() - 6);
                        return dataAtividade >= umaSemanaAtras;
                    case 'mes':
                        const umMesAtras = new Date(hoje);
                        umMesAtras.setMonth(hoje.getMonth() - 1);
                        return dataAtividade >= umMesAtras;
                    default:
                        return true;
                }
            });
        }

        // 2. Filtro por STATUS DE APROVAÇÃO
        if (filtrosAtivos.status) {
            dadosFiltrados = dadosFiltrados.filter(l => l.situacaoAprovacao === filtrosAtivos.status);
        }

        // 3. Filtro por OS
        if (filtrosAtivos.osId) {
            dadosFiltrados = dadosFiltrados.filter(l => l.os.id == filtrosAtivos.osId);
        }

        return dadosFiltrados;
    }

    async function carregarLancamentos() {
        toggleLoader(true);
        try {
            const response = await fetchComAuth('http://localhost:8080/lancamentos');
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

        const statusPendentes = ['PENDENTE_COORDENADOR', 'AGUARDANDO_EXTENSAO_PRAZO', 'PENDENTE_CONTROLLER'];
        const statusRejeitados = ['RECUSADO_COORDENADOR', 'RECUSADO_CONTROLLER'];

        const rascunhos = dadosParaExibir.filter(l => l.situacaoAprovacao === 'RASCUNHO');
        const pendentesAprovacao = dadosParaExibir.filter(l => statusPendentes.includes(l.situacaoAprovacao));
        const minhasPendencias = dadosParaExibir.filter(l => statusRejeitados.includes(l.situacaoAprovacao));

        // --- INÍCIO DA CORREÇÃO ---

        // 1. Filtra os lançamentos que pertencem ao histórico
        const historico = dadosParaExibir.filter(l => !['RASCUNHO', ...statusPendentes, ...statusRejeitados].includes(l.situacaoAprovacao));

        // 2. Ordena a lista de histórico pela data de criação, do mais recente para o mais antigo
        historico.sort((a, b) => {
            const dataA = parseDataBrasileira(a.dataCriacao);
            const dataB = parseDataBrasileira(b.dataCriacao);
            // Coloca itens sem data no final
            if (!dataA) return 1;
            if (!dataB) return -1;
            // Compara as datas (b - a para ordem decrescente)
            return dataB - dataA;
        });

        // --- FIM DA CORREÇÃO ---

        const paralisados = getProjetosParalisados();

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

    // ==========================================================
    // SEÇÃO 3: LÓGICA DO MODAL
    // ==========================================================
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

        const chkAtividadeComplementar = document.getElementById('atividadeComplementar');
        const quantidadeContainer = document.getElementById('quantidadeComplementarContainer');
        const lpuContainer = document.getElementById('lpuContainer');

        let todasAsOS = [];
        let todasAsEtapas = [];
        let todosOsPrestadores = []; // Cache para prestadores

        // ==========================================================
        // ===== INÍCIO DA CORREÇÃO: LÓGICA DE SUBMISSÃO DO FORM =====
        // ==========================================================

        formAdicionar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitter = e.submitter || document.activeElement; // Pega o botão que foi cl-icado
            const acao = submitter.dataset.acao; // Ação será 'rascunho' ou 'enviar'
            const isComplementar = chkAtividadeComplementar.checked;

            const payload = {
                managerId: localStorage.getItem('usuarioId'),
                osId: selectOS.value,
                prestadorId: selectPrestador.value,
                etapaDetalhadaId: selectEtapaDetalhada.value,
                dataAtividade: document.getElementById('dataAtividade').value,
                equipe: document.getElementById('equipe')?.value, // Adicionado para segurança
                vistoria: document.getElementById('vistoria').value,
                planoVistoria: document.getElementById('planoVistoria').value || null,
                desmobilizacao: document.getElementById('desmobilizacao').value,
                planoDesmobilizacao: document.getElementById('planoDesmobilizacao').value || null,
                instalacao: document.getElementById('instalacao').value,
                planoInstalacao: document.getElementById('planoInstalacao').value || null,
                ativacao: document.getElementById('ativacao').value,
                planoAtivacao: document.getElementById('planoAtivacao').value || null,
                documentacao: document.getElementById('documentacao').value,
                planoDocumentacao: document.getElementById('planoDocumentacao').value || null,
                status: selectStatus.value,
                situacao: document.getElementById('situacao').value,
                detalheDiario: document.getElementById('detalheDiario').value,
                valor: parseFloat(document.getElementById('valor').value.replace(/\./g, '').replace(',', '.')) || 0,
                atividadeComplementar: isComplementar,
                quantidade: isComplementar ? parseInt(document.getElementById('quantidade').value, 10) : null,
                situacaoAprovacao: acao === 'enviar' ? 'PENDENTE_COORDENADOR' : 'RASCUNHO',

                // Lógica condicional para lpuId vs osLpuDetalheId
                lpuId: isComplementar ? document.getElementById('lpuId').value : null,
                osLpuDetalheId: !isComplementar ? document.getElementById('lpuId').value : null
            };

            const editingId = formAdicionar.dataset.editingId;
            const url = editingId ? `http://localhost:8080/lancamentos/${editingId}` : 'http://localhost:8080/lancamentos';
            const method = editingId ? 'PUT' : 'POST';

            try {
                toggleLoader(true);
                const response = await fetchComAuth(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error((await response.json()).message || 'Erro ao salvar.');

                mostrarToast('Lançamento salvo com sucesso!', 'success');
                modalAdicionar.hide();
                await carregarLancamentos();

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleLoader(false);
            }
        });

        // ==========================================================
        // ===== FIM DA CORREÇÃO =====
        // ==========================================================

        async function carregarEPopularLPU(osId, isComplementar = false) {
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
                let url;
                const osSelecionada = todasAsOS.find(os => os.id == osId);

                if (isComplementar) {
                    if (!osSelecionada || !osSelecionada.detalhes[0]?.contratoId) {
                        throw new Error("Contrato da OS não encontrado para buscar LPUs complementares.");
                    }
                    const contratoId = osSelecionada.detalhes[0].contratoId;
                    url = `http://localhost:8080/lpu/contrato/${contratoId}`;
                } else {
                    url = `http://localhost:8080/os/${osId}/lpus`;
                }

                const response = await fetchComAuth(url);
                if (!response.ok) throw new Error('Falha ao buscar LPUs.');

                const lpus = await response.json();

                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a LPU...</option>';
                if (lpus && lpus.length > 0) {
                    lpus.forEach(lpu => selectLPU.add(new Option(labelLpu(lpu), lpu.id)));
                    selectLPU.disabled = false;
                } else {
                    selectLPU.innerHTML = '<option value="" disabled>Nenhuma LPU encontrada.</option>';
                }
            } catch (error) {
                mostrarToast(error.message, 'error');
                lpuContainer.classList.add('d-none');
            }
        }

        chkAtividadeComplementar.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            quantidadeContainer.classList.toggle('d-none', !isChecked);
            const osId = selectOS.value;
            if (osId) {
                carregarEPopularLPU(osId, isChecked);
            }
        });

        selectOS.addEventListener('change', async (e) => {
            const osId = e.target.value;
            const os = todasAsOS.find(os => os.id == osId);
            if (os) {
                selectProjeto.value = os.projeto;
            }
            preencherCamposOS(osId);
            await carregarEPopularLPU(osId, chkAtividadeComplementar.checked);
        });

        selectProjeto.addEventListener('change', async (e) => {
            const projeto = e.target.value;
            const os = todasAsOS.find(os => os.projeto == projeto);
            if (os) {
                selectOS.value = os.id;
                selectOS.dispatchEvent(new Event('change'));
            }
        });

        async function popularSelect(selectElement, url, valueField, textFieldFormatter) {
            try {
                const response = await fetchComAuth(url);
                if (!response.ok) throw new Error(`Falha ao carregar dados: ${response.statusText}`);
                const data = await response.json();

                if (selectElement.id.includes('prestadorId') && typeof Choices !== 'undefined') {
                    // --- INÍCIO DA CORREÇÃO ---
                    if (selectElement.choices) {
                        selectElement.choices.destroy();
                    }
                    selectElement.innerHTML = '';

                    // 1. Criamos a nova instância da biblioteca
                    const choices = new Choices(selectElement, {
                        searchEnabled: true,
                        placeholder: true,
                        placeholderValue: 'Digite para buscar o prestador...',
                        removeItemButton: true,
                        itemSelectText: 'Pressione Enter para selecionar',
                        noResultsText: 'Nenhum resultado encontrado',
                        noChoicesText: 'Nenhuma opção para escolher',
                    });

                    // 2. Mapeamos os dados para o formato que a biblioteca entende
                    const choicesData = data.map(item => ({
                        value: item[valueField],
                        label: textFieldFormatter(item)
                    }));

                    // 3. Populamos o select com as opções
                    choices.setChoices(choicesData, 'value', 'label', false);

                    // 4. PONTO CRÍTICO: Guardamos a instância da biblioteca no próprio elemento do select
                    selectElement.choices = choices;
                    // --- FIM DA CORREÇÃO ---

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
                    const response = await fetchComAuth(`http://localhost:8080/os/por-usuario/${usuarioId}`);
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
                todosOsPrestadores = await popularSelect(selectPrestador, 'http://localhost:8080/index/prestadores/ativos', 'id', item => `${item.codigoPrestador} - ${item.prestador}`);
            }
            if (todasAsEtapas.length === 0) {
                todasAsEtapas = await popularSelect(selectEtapaGeral, 'http://localhost:8080/index/etapas', 'id', item => `${item.codigo} - ${item.nome}`);
            }
        }

        async function abrirModalParaEdicao(lancamento, editingId) {
            // 1. Carrega todos os dados necessários (isso permanece igual)
            await carregarDadosParaModal();
            formAdicionar.dataset.editingId = editingId;

            if (lancamento.detalhe) {
                formAdicionar.dataset.osLpuDetalheId = lancamento.detalhe.id;
            }

            // 2. Preenche todos os campos, exceto o de prestador por enquanto
            const modalTitle = document.getElementById('modalAdicionarLabel');
            const btnSubmitPadrao = document.getElementById('btnSubmitAdicionar');
            const btnSalvarRascunho = document.getElementById('btnSalvarRascunho');
            const btnSalvarEEnviar = document.getElementById('btnSalvarEEnviar');
            const dataAtividadeInput = document.getElementById('dataAtividade');
            const chkAtividadeComplementarContainer = document.getElementById('atividadeComplementar').parentElement;
            const quantidadeContainer = document.getElementById('quantidadeComplementarContainer');
            const selectProjeto = document.getElementById('projetoId');

            if (chkAtividadeComplementarContainer) chkAtividadeComplementarContainer.style.display = 'none';
            if (quantidadeContainer) quantidadeContainer.classList.add('d-none');

            if (lancamento.os && lancamento.os.projeto) {
                selectProjeto.value = lancamento.os.projeto;
                selectProjeto.disabled = true;
            }

            btnSubmitPadrao.style.display = 'none';
            btnSalvarRascunho.style.display = 'none';
            btnSalvarEEnviar.style.display = 'none';

            if (lancamento.situacaoAprovacao === 'RASCUNHO') {
                modalTitle.innerHTML = `<i class="bi bi-pencil"></i> Editar Rascunho #${lancamento.id}`;
                btnSalvarRascunho.style.display = 'inline-block';
                btnSalvarEEnviar.style.display = 'inline-block';
                dataAtividadeInput.value = lancamento.dataAtividade ? lancamento.dataAtividade.split('/').reverse().join('-') : '';
            } else {
                btnSubmitPadrao.style.display = 'inline-block';
                if (editingId) {
                    modalTitle.innerHTML = `<i class="bi bi-pencil-square"></i> Editar Lançamento #${editingId}`;
                    btnSubmitPadrao.innerHTML = `<i class="bi bi-send-check"></i> Salvar e Reenviar`;
                    dataAtividadeInput.value = lancamento.dataAtividade ? lancamento.dataAtividade.split('/').reverse().join('-') : '';
                } else {
                    modalTitle.innerHTML = `<i class="bi bi-play-circle"></i> Retomar Lançamento (Novo)`;
                    btnSubmitPadrao.innerHTML = `<i class="bi bi-check-circle"></i> Criar Lançamento`;
                    dataAtividadeInput.value = new Date().toISOString().split('T')[0];
                }
            }

            document.getElementById('detalheDiario').value = lancamento.detalheDiario || '';
            document.getElementById('valor').value = (lancamento.valor || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2
            });
            document.getElementById('situacao').value = lancamento.situacao || '';

            ['vistoria', 'desmobilizacao', 'instalacao', 'ativacao', 'documentacao'].forEach(k => document.getElementById(k).value = lancamento[k] || 'N/A');
            ['planoVistoria', 'planoDesmobilizacao', 'planoInstalacao', 'planoAtivacao', 'planoDocumentacao'].forEach(k => {
                if (lancamento[k]) document.getElementById(k).value = lancamento[k].split('/').reverse().join('-');
            });

            if (lancamento.os && lancamento.os.id) {
                selectOS.value = lancamento.os.id;
                preencherCamposOS(lancamento.os.id);
            }

            const selectLPU = document.getElementById('lpuId');
            selectLPU.innerHTML = '';
            if (lancamento.detalhe && lancamento.detalhe.lpu) {
                const lpu = lancamento.detalhe.lpu;
                selectLPU.add(new Option(labelLpu(lpu), lpu.id));
                selectLPU.value = lpu.id;
                lpuContainer.classList.remove('d-none');
            }
            selectOS.disabled = true;
            selectLPU.disabled = true;

            if (lancamento.etapa && lancamento.etapa.id) {
                const etapaGeralPai = todasAsEtapas.find(eg => eg.codigo === lancamento.etapa.codigoGeral);
                if (etapaGeralPai) {
                    selectEtapaGeral.value = etapaGeralPai.id;
                    await popularDropdownsDependentes(etapaGeralPai.id, lancamento.etapa.id, lancamento.status);
                }
            } else {
                selectEtapaGeral.value = '';
                await popularDropdownsDependentes('', null, null);
            }

            // 3. Mostra o modal
            modalAdicionar.show();

            // --- INÍCIO DA CORREÇÃO ---
            // 4. A MÁGICA: Adia o preenchimento do campo do prestador
            //    Isso garante que o modal e o componente Choices.js estejam 100% prontos.
            setTimeout(() => {
                const selectPrestadorEl = document.getElementById('prestadorId');
                if (selectPrestadorEl && selectPrestadorEl.choices) {
                    selectPrestadorEl.choices.setChoiceByValue(String(lancamento.prestador?.id || ''));
                }
            }, 150); // Um pequeno atraso de 150ms é suficiente.
            // --- FIM DA CORREÇÃO ---
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
                chkAtividadeComplementar.parentElement.style.display = 'block';
            }
        });

        modalAdicionarEl.addEventListener('hidden.bs.modal', () => {
            formAdicionar.reset();
            delete formAdicionar.dataset.editingId;
            selectEtapaDetalhada.innerHTML = '<option value="" selected disabled>Primeiro, selecione a etapa geral</option>';
            selectEtapaDetalhada.disabled = true;
            selectStatus.innerHTML = '<option value="" selected disabled>Primeiro, selecione a etapa detalhada</option>';
            selectStatus.disabled = true;
            selectOS.disabled = false;
            selectProjeto.disabled = false;
            lpuContainer.classList.add('d-none');
            document.getElementById('lpuId').innerHTML = '';
            chkAtividadeComplementar.parentElement.style.display = 'block';
        });

        document.body.addEventListener('click', async (e) => {
            const reenviarBtn = e.target.closest('.btn-reenviar, .btn-editar-rascunho, .btn-retomar');
            const comentariosBtn = e.target.closest('.btn-ver-comentarios');
            const submeterBtn = e.target.closest('.btn-submeter-agora');

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
        });

        function getProjetosParalisados() {
            const ultimosLancamentos = new Map();
            todosLancamentos.forEach(l => {
                if (l.os && l.detalhe && l.detalhe.lpu) {
                    const chaveProjeto = `${l.os.id}-${l.detalhe.lpu.id}`;
                    if (!ultimosLancamentos.has(chaveProjeto) || l.id > ultimosLancamentos.get(chaveProjeto).id) {
                        ultimosLancamentos.set(chaveProjeto, l);
                    }
                }
            });
            return Array.from(ultimosLancamentos.values()).filter(l => l.situacao === 'Paralisado' && l.situacaoAprovacao !== 'RASCUNHO');
        }

        document.getElementById('btnConfirmarSubmissao').addEventListener('click', async function (e) {
            const confirmButton = e.currentTarget;
            const id = confirmButton.dataset.lancamentoId;
            if (!id) return;

            const originalContent = confirmButton.innerHTML;
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarSubmissao'));

            try {
                confirmButton.disabled = true;
                confirmButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Enviando...`;
                const resposta = await fetchComAuth(`http://localhost:8080/lancamentos/${id}/submeter`, { method: 'POST' });
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
            const etapaSelecionada = todasAsEtapas.find(etapa => etapa.id == etapaGeralId);

            selectEtapaDetalhada.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectStatus.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectEtapaDetalhada.disabled = true;
            selectStatus.disabled = true;

            if (etapaSelecionada && etapaSelecionada.etapasDetalhadas.length > 0) {
                etapaSelecionada.etapasDetalhadas.forEach(detalhe => {
                    selectEtapaDetalhada.add(new Option(`${detalhe.indice} - ${detalhe.nome}`, detalhe.id));
                });
                selectEtapaDetalhada.disabled = false;
                if (etapaDetalhadaIdSelecionada) {
                    selectEtapaDetalhada.value = etapaDetalhadaIdSelecionada;
                    const etapaDetalhada = etapaSelecionada.etapasDetalhadas.find(ed => ed.id == etapaDetalhadaIdSelecionada);
                    if (etapaDetalhada && etapaDetalhada.status.length > 0) {
                        etapaDetalhada.status.forEach(status => selectStatus.add(new Option(status, status)));
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
                fetchComAuth('http://localhost:8080/materiais')
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
                const response = await fetchComAuth(`http://localhost:8080/os/por-usuario/${usuarioId}`);
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
                const response = await fetchComAuth(`http://localhost:8080/os/${osId}/lpus`);
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
            console.log('Enviando para o backend:', JSON.stringify(payload, null, 2));

            try {
                const response = await fetchComAuth('http://localhost:8080/solicitacoes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Erro recebido do backend:", errorText);
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

    function inicializarCabecalhos() {
        renderizarCabecalho(colunasLancamentos, document.querySelector('#lancamentos-pane thead'));
        renderizarCabecalho(colunasPrincipais, document.querySelector('#pendentes-pane thead'));
        renderizarCabecalho(colunasHistorico, document.querySelector('#historico-pane thead'));
        renderizarCabecalho(colunasMinhasPendencias, document.querySelector('#minhasPendencias-pane thead'));
        renderizarCabecalho(colunasMinhasPendencias, document.querySelector('#paralisados-pane thead'));
    }

    inicializarCabecalhos();
    carregarLancamentos();
    configurarVisibilidadePorRole();
    window.carregarLancamentos = carregarLancamentos;
});