document.addEventListener('DOMContentLoaded', () => {

    const toastElement = document.getElementById('toastMensagem');
    const toastBody = document.getElementById('toastTexto');
    const toast = toastElement ? new bootstrap.Toast(toastElement) : null;
    const lpuChecklistContainer = document.getElementById('lpuChecklistContainer');
    const btnAvancarParaPreenchimento = document.getElementById('btnAvancarParaPreenchimento');
    const divisorFormularios = document.getElementById('divisorFormularios');
    const formulariosContainer = document.getElementById('formulariosContainer');
    const btnSalvar = document.getElementById('btnSalvar');
    const modalAdicionarEl = document.getElementById('modalAdicionar');

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
                // Mostra apenas "Paralisados" e "Histórico"
                [navParalisados, navHistorico].forEach(el => {
                    if (el) el.style.display = 'block';
                });
                // Define a aba padrão como "Histórico"
                tabLancamentos.classList.remove('active');
                paneLancamentos.classList.remove('show', 'active');
                tabHistorico.classList.add('active');
                paneHistorico.classList.add('show', 'active');
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
    let todosOsPrestadores = [];
    let todasAsEtapas = [];
    let todasAsOS = [];

    const colunasPrincipais = ["STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE", "SEGMENTO", "PROJETO", "LPU", "GESTOR TIM", "REGIONAL", "EQUIPE", "VISTORIA", "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DE DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO DE INSTALAÇÃO", "ATIVAÇÃO", "PLANO DE ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DE DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR"];
    const colunasLancamentos = [...colunasPrincipais.filter(c => c !== "STATUS APROVAÇÃO"), "AÇÃO"];
    const colunasMinhasPendencias = colunasLancamentos;

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
            td.textContent = 'Nenhum lançamento encontrado para esta categoria.';
            td.className = 'text-center text-muted p-4';
            tr.appendChild(td);
            tbodyElement.appendChild(tr);
            return;
        }

        const formatarMoeda = (valor) => valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : '';
        const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

        dados.forEach(lancamento => {
            const tr = document.createElement('tr');
            const mapaDeCelulas = {
                "DATA ATIVIDADE": lancamento.dataAtividade || '', "OS": lancamento.os.os || '', "SITE": lancamento.os.site || '', "SEGMENTO": lancamento.os.segmento ? lancamento.os.segmento.nome : '', "PROJETO": lancamento.os.projeto || '', "LPU": (lancamento.lpu) ? `${lancamento.lpu.codigo} - ${lancamento.lpu.nome}` : '', "GESTOR TIM": lancamento.os.gestorTim || '', "REGIONAL": lancamento.os.regional || '', "EQUIPE": lancamento.equipe || '', "VISTORIA": lancamento.vistoria || '', "PLANO DE VISTORIA": lancamento.planoVistoria || '', "DESMOBILIZAÇÃO": lancamento.desmobilizacao || '', "PLANO DE DESMOBILIZAÇÃO": lancamento.planoDesmobilizacao || '', "INSTALAÇÃO": lancamento.instalacao || '', "PLANO DE INSTALAÇÃO": lancamento.planoInstalacao || '', "ATIVAÇÃO": lancamento.ativacao || '', "PLANO DE ATIVAÇÃO": lancamento.planoAtivacao || '', "DOCUMENTAÇÃO": lancamento.documentacao || '', "PLANO DE DOCUMENTAÇÃO": lancamento.planoDocumentacao || '', "ETAPA GERAL": lancamento.etapa ? lancamento.etapa.nomeGeral : '', "ETAPA DETALHADA": lancamento.etapa ? lancamento.etapa.nomeDetalhado : '', "STATUS": lancamento.status || '', "SITUAÇÃO": lancamento.situacao || '', "DETALHE DIÁRIO": lancamento.detalheDiario || '', "CÓD. PRESTADOR": lancamento.prestador ? lancamento.prestador.codigo : '', "PRESTADOR": lancamento.prestador ? lancamento.prestador.nome : '', "VALOR": formatarMoeda(lancamento.valor), "GESTOR": lancamento.manager ? lancamento.manager.nome : '', "STATUS APROVAÇÃO": `<span class="badge rounded-pill text-bg-secondary">${lancamento.situacaoAprovacao.replace(/_/g, ' ')}</span>`
            };

            colunas.forEach(nomeColuna => {
                const td = document.createElement('td');
                td.dataset.label = nomeColuna;

                if (nomeColuna === 'AÇÃO') {
                    let buttonsHtml = '';

                    // Regra: Apenas ADMIN e MANAGER podem ver os botões de fluxo
                    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
                        if (tbodyElement.id === 'tbody-minhas-pendencias') {
                            buttonsHtml += `<button class="btn btn-sm btn-success btn-reenviar" data-id="${lancamento.id}" title="Corrigir e Reenviar"><i class="bi bi-pencil-square"></i></button>`;
                        } else if (tbodyElement.id === 'tbody-lancamentos') {
                            buttonsHtml += `<button class="btn btn-sm btn-secondary btn-editar-rascunho" data-id="${lancamento.id}" title="Editar Rascunho"><i class="bi bi-pencil"></i></button>`;
                        } else if (tbodyElement.id === 'tbody-paralisados') {
                            buttonsHtml += `<button class="btn btn-sm btn-warning btn-retomar" data-id="${lancamento.id}" title="Retomar Lançamento"><i class="bi bi-play-circle"></i></button>`;
                        }
                    }

                    // Regra: Todos os cargos podem ver os comentários
                    buttonsHtml += ` <button class="btn btn-sm btn-info btn-ver-comentarios" data-id="${lancamento.id}" title="Ver Comentários" data-bs-toggle="modal" data-bs-target="#modalComentarios"><i class="bi bi-chat-left-text"></i></button>`;

                    td.innerHTML = `<div class="btn-group" role="group">${buttonsHtml}</div>`;
                } else {
                    td.innerHTML = mapaDeCelulas[nomeColuna];
                }

                if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(nomeColuna)) {
                    aplicarEstiloStatus(td, mapaDeCelulas[nomeColuna]);
                }
                tr.appendChild(td);
            });
            tbodyElement.appendChild(tr);
        });
    }

    async function carregarLancamentos() {
        toggleLoader(true); // <-- MOSTRA O LOADER
        try {
            const response = await fetch('http://localhost:8080/lancamentos');
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);

            // ---> ETAPA 1: EXTRAIR O JSON DA RESPOSTA (ESSA LINHA FALTAVA) <---
            const lancamentosDaApi = await response.json();

            // ---> ETAPA 2: ATUALIZAR A VARIÁVEL GLOBAL COM OS DADOS RECEBIDOS <---
            // Usando a função de filtro que já tínhamos para garantir que cada usuário veja o que deve
            todosLancamentos = lancamentosDaApi;

            // AGORA sim, as funções de renderização têm os dados corretos para trabalhar
            renderizarCardsDashboard(todosLancamentos);
            popularFiltroOS();
            renderizarTodasAsTabelas();

        } catch (error) {
            console.error('Falha ao buscar lançamentos:', error);
            mostrarToast('Falha ao carregar dados do servidor.', 'error');
        } finally {
            toggleLoader(false); // <-- ESCONDE O LOADER (no sucesso ou no erro)
        }
    }

    filtrosAtivos = { periodo: null, status: null, osId: null };

    function getDadosFiltrados() {
        let dadosFiltrados = [...todosLancamentos];

        // 1. Filtro por PERÍODO
        if (filtrosAtivos.periodo) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            dadosFiltrados = dadosFiltrados.filter(l => {
                // --- INÍCIO DA CORREÇÃO ---
                // Transforma a string "DD/MM/YYYY" em uma data na timezone local, não em UTC.
                const partesData = l.dataAtividade.split('/'); // -> ["15", "07", "2025"]
                // O mês é -1 porque em JavaScript os meses vão de 0 (Janeiro) a 11 (Dezembro).
                const dataAtividade = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                // --- FIM DA CORREÇÃO ---

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

    function renderizarTodasAsTabelas() {
        const dadosParaExibir = getDadosFiltrados();

        const statusPendentes = ['PENDENTE_COORDENADOR', 'AGUARDANDO_EXTENSAO_PRAZO', 'PENDENTE_CONTROLLER'];
        const statusRejeitados = ['RECUSADO_COORDENADOR', 'RECUSADO_CONTROLLER'];

        // Filtra os dados para cada aba
        const rascunhos = dadosParaExibir.filter(l => l.situacaoAprovacao === 'RASCUNHO');
        const pendentesAprovacao = dadosParaExibir.filter(l => statusPendentes.includes(l.situacaoAprovacao));
        const minhasPendencias = dadosParaExibir.filter(l => statusRejeitados.includes(l.situacaoAprovacao));
        const historico = dadosParaExibir.filter(l => !['RASCUNHO', ...statusPendentes, ...statusRejeitados].includes(l.situacaoAprovacao));
        const paralisados = getProjetosParalisados();

        // Renderiza cada tabela
        renderizarTabela(rascunhos, tbodyLancamentos, colunasLancamentos);
        renderizarTabela(pendentesAprovacao, tbodyPendentes, colunasPrincipais);
        renderizarTabela(minhasPendencias, tbodyMinhasPendencias, colunasMinhasPendencias);
        renderizarTabela(historico, tbodyHistorico, colunasPrincipais);
        renderizarTabela(paralisados, tbodyParalisados, colunasMinhasPendencias);

        // Atualiza a notificação
        if (notificacaoPendencias) {
            notificacaoPendencias.textContent = minhasPendencias.length;
            notificacaoPendencias.style.display = minhasPendencias.length > 0 ? '' : 'none';
        }
    }

    // ==========================================================
    // SEÇÃO 3: LÓGICA DO MODAL
    // ==========================================================

    if (modalAdicionarEl) {
        const formAdicionar = document.getElementById('formAdicionar');
        const modalTitle = document.getElementById('modalAdicionarLabel');
        const submitButton = document.getElementById('btnSubmitAdicionar');


        const selectOS = document.getElementById('osId');
        const selectPrestador = document.getElementById('prestadorId');

        selectOS.addEventListener('change', async (e) => {
            const osId = e.target.value;

            // ESTA LINHA É A MAIS IMPORTANTE!
            // Ela pega o ID da OS selecionada e chama a função para preencher os campos.
            preencherCamposOS(osId);

            // O resto da sua função que carrega os checkboxes da LPU continua igual...
            formulariosContainer.innerHTML = '';
            if (divisorFormularios) divisorFormularios.style.display = 'none';
            btnAvancarParaPreenchimento.disabled = true;
            btnAvancarParaPreenchimento.style.display = 'inline-block';
            if (lpuChecklistContainer.parentElement) lpuChecklistContainer.parentElement.style.display = 'block';

            if (!osId) {
                lpuChecklistContainer.innerHTML = '<p class="text-muted">Selecione uma OS para ver as LPUs.</p>';
                return;
            }

            lpuChecklistContainer.innerHTML = '<p class="text-muted">Carregando LPUs...</p>';

            try {
                const response = await fetch(`http://localhost:8080/os/${osId}/lpus`);
                if (!response.ok) throw new Error('Falha ao buscar LPUs para esta OS.');
                const lpus = await response.json();

                if (lpus.length === 0) {
                    lpuChecklistContainer.innerHTML = '<p class="text-muted">Nenhuma LPU encontrada para esta OS.</p>';
                } else {
                    lpuChecklistContainer.innerHTML = lpus.map(lpu => `
                <div class="form-check">
                    <input class="form-check-input lpu-checkbox" type="checkbox" value="${lpu.id}" id="lpu-${lpu.id}" data-nome="${lpu.codigoLpu} - ${lpu.nomeLpu}">
                    <label class="form-check-label" for="lpu-${lpu.id}">
                        ${lpu.codigoLpu} - ${lpu.nomeLpu}
                    </label>
                </div>
            `).join('');
                }
            } catch (error) {
                console.error("Erro ao carregar LPUs:", error);
                lpuChecklistContainer.innerHTML = '<p class="text-danger">Erro ao carregar LPUs.</p>';
                mostrarToast(error.message, 'error');
            }
        });

        async function popularSelect(selectElement, url, valueField, textFieldFormatter) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Falha ao carregar dados: ${response.statusText}`);
                const data = await response.json();
                selectElement.innerHTML = `<option value="" selected disabled>Selecione...</option>`;
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[valueField];
                    option.textContent = textFieldFormatter(item);
                    selectElement.appendChild(option);
                });
                return data;
            } catch (error) {
                console.error(`Erro ao popular o select #${selectElement.id}:`, error);
                selectElement.innerHTML = `<option value="" selected disabled>Erro ao carregar</option>`;
                return [];
            }
        }

        function preencherCamposOS(osId, sufixo = '') {
            // Busca a OS selecionada na lista que já temos em memória
            const osSelecionada = todasAsOS.find(os => os.id == osId);

            if (osSelecionada) {
                // Usa o sufixo para encontrar os IDs corretos dinamicamente
                // Ex: para o modal de edição, procura por 'siteEditar', 'segmentoEditar', etc.
                document.getElementById(`site${sufixo}`).value = osSelecionada.site || '';
                document.getElementById(`segmento${sufixo}`).value = osSelecionada.segmento ? osSelecionada.segmento.nome : '';
                document.getElementById(`projeto${sufixo}`).value = osSelecionada.projeto || '';
                document.getElementById(`contrato${sufixo}`).value = osSelecionada.contrato || '';
                document.getElementById(`gestorTim${sufixo}`).value = osSelecionada.gestorTim || '';
                document.getElementById(`regional${sufixo}`).value = osSelecionada.regional || '';
            }
        }


        async function popularDropdownsDependentes(etapaGeralId, etapaDetalhadaId, statusId, sufixo = '') {
            // --- INÍCIO DA CORREÇÃO ---
            // Seleciona os elementos <select> corretos usando o sufixo ('Editar' ou nada)
            const selectEtapaDetalhada = document.getElementById(`etapaDetalhadaId${sufixo}`);
            const selectStatus = document.getElementById(`status${sufixo}`);

            // Uma verificação de segurança para garantir que os elementos foram encontrados no HTML
            if (!selectEtapaDetalhada || !selectStatus) {
                console.error(`Não foi possível encontrar os selects de etapa com o sufixo: '${sufixo}'`);
                return;
            }
            // --- FIM DA CORREÇÃO ---

            const etapaSelecionada = todasAsEtapas.find(etapa => etapa.id == etapaGeralId);
            selectEtapaDetalhada.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectEtapaDetalhada.disabled = true;

            if (etapaSelecionada && etapaSelecionada.etapasDetalhadas.length > 0) {
                etapaSelecionada.etapasDetalhadas.forEach(detalhe => {
                    selectEtapaDetalhada.add(new Option(`${detalhe.indice} - ${detalhe.nome}`, detalhe.id));
                });
                selectEtapaDetalhada.disabled = false;
                if (etapaDetalhadaId) {
                    selectEtapaDetalhada.value = etapaDetalhadaId;
                }
            }

            selectStatus.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectStatus.disabled = true;

            if (etapaDetalhadaId) {
                let statusDaEtapa = [];
                for (const etapaGeral of todasAsEtapas) {
                    const etapaEncontrada = etapaGeral.etapasDetalhadas.find(detalhe => detalhe.id == etapaDetalhadaId);
                    if (etapaEncontrada) {
                        statusDaEtapa = etapaEncontrada.status || [];
                        break;
                    }
                }

                if (statusDaEtapa.length > 0) {
                    statusDaEtapa.forEach(status => {
                        selectStatus.add(new Option(status, status));
                    });
                    selectStatus.disabled = false;
                    // Se um status veio pré-selecionado (modo edição), seleciona ele
                    if (statusId) {
                        selectStatus.value = statusId;
                    }
                }
            }
        }

        async function carregarDadosParaModal(id, acao) {
            // Mostra a UI de edição e esconde a de criação
            document.getElementById('osId').parentElement.style.display = 'none';
            if (lpuChecklistContainer) lpuChecklistContainer.parentElement.style.display = 'none';
            if (btnAvancarParaPreenchimento) btnAvancarParaPreenchimento.style.display = 'none';

            // Exibe o container do acordeão para preencher com os dados
            if (formulariosContainer) formulariosContainer.style.display = 'block';

            const formAdicionar = document.getElementById('formAdicionar');
            const modalTitle = document.getElementById('modalAdicionarLabel');

            try {
                const response = await fetch(`http://localhost:8080/lancamentos/${id}`);
                if (!response.ok) throw new Error('Falha ao buscar dados do lançamento.');
                const data = await response.json();

                // Lógica para definir título e botões
                if (acao === 'editar-rascunho') {
                    modalTitle.innerHTML = `<i class="bi bi-pencil"></i> Editar Rascunho #${data.id}`;
                    document.getElementById('btnSalvarRascunho').style.display = 'inline-block';
                    document.getElementById('btnSalvarEEnviar').style.display = 'inline-block';
                    document.getElementById('btnSubmitAdicionar').style.display = 'none';
                    formAdicionar.dataset.editingId = data.id;
                } else if (acao === 'retomar') {
                    modalTitle.innerHTML = `<i class="bi bi-play-circle"></i> Retomar Lançamento (criando novo)`;
                    // Não define editingId, pois será uma nova entrada
                }

                // Preenche os dados gerais que são únicos
                document.getElementById('dataAtividade').value = data.dataAtividade.split('/').reverse().join('-');
                preencherCamposOS(data.os.id); // Esta função já preenche site, segmento, etc.

                // Gera o HTML do acordeão para o ÚNICO item que está sendo editado/retomado
                // (Esta é uma simplificação, você pode customizar mais se precisar)
                const lpuNome = `${data.lpu.codigo} - ${data.lpu.nome}`;
                formulariosContainer.innerHTML = criarHtmlDoAcordeaoParaItemUnico(data, lpuNome);

                // Popula os selects dentro do acordeão gerado
                await popularSelectsDoAcordeao(data);

            } catch (error) {
                console.error("Erro ao carregar dados para o modal:", error);
                mostrarToast(error.message, 'error');
            }
        }

        async function abrirModalParaEdicao(lancamento, editingId) {
            await carregarDadosParaModal();
            formAdicionar.dataset.editingId = editingId;

            const modalTitle = document.getElementById('modalAdicionarLabel');
            const btnSubmitPadrao = document.getElementById('btnSubmitAdicionar');
            const btnSalvarRascunho = document.getElementById('btnSalvarRascunho');
            const btnSalvarEEnviar = document.getElementById('btnSalvarEEnviar');

            btnSubmitPadrao.style.display = 'none';
            btnSalvarRascunho.style.display = 'none';
            btnSalvarEEnviar.style.display = 'none';

            if (lancamento.situacaoAprovacao === 'RASCUNHO') {
                modalTitle.innerHTML = `<i class="bi bi-pencil"></i> Editar Rascunho #${lancamento.id}`;
                btnSalvarRascunho.style.display = 'inline-block';
                btnSalvarEEnviar.style.display = 'inline-block';
            } else {
                btnSubmitPadrao.style.display = 'inline-block';
                if (editingId) {
                    modalTitle.innerHTML = `<i class="bi bi-pencil-square"></i> Editar Lançamento #${editingId}`;
                    btnSubmitPadrao.innerHTML = `<i class="bi bi-send-check"></i> Salvar e Reenviar`;
                } else {
                    modalTitle.innerHTML = `<i class="bi bi-play-circle"></i> Retomar Lançamento (Novo)`;
                    btnSubmitPadrao.innerHTML = `<i class="bi bi-check-circle"></i> Criar Lançamento`;
                }
            }

            const selectOS = document.getElementById('osId');
            const selectLPU = document.getElementById('lpuId');
            selectOS.disabled = true;

            const dataAtividadeInput = document.getElementById('dataAtividade');
            dataAtividadeInput.value = lancamento.dataAtividade || '';
            dataAtividadeInput.disabled = !!editingId;

            document.getElementById('equipe').value = lancamento.equipe || '';
            document.getElementById('detalheDiario').value = lancamento.detalheDiario || '';
            document.getElementById('valor').value = (lancamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            ['vistoria', 'desmobilizacao', 'instalacao', 'ativacao', 'documentacao'].forEach(k => document.getElementById(k).value = lancamento[k] || 'N/A');
            ['planoVistoria', 'planoDesmobilizacao', 'planoInstalacao', 'planoAtivacao', 'planoDocumentacao'].forEach(k => {
                if (lancamento[k]) {
                    // CORREÇÃO: Atribui a data no formato original (DD/MM/AAAA)
                    document.getElementById(k).value = lancamento[k];
                }
            });

            // --- INÍCIO DA LÓGICA CORRIGIDA ---
            if (lancamento.os && lancamento.os.id) {
                selectOS.value = lancamento.os.id;
                preencherCamposOS(lancamento.os.id);

                // 1. CHAMA E ESPERA A FUNÇÃO DE CARREGAR A LPU TERMINAR
                await carregarEPopularLPU(lancamento.os.id);
            }

            if (lancamento.lpu && lancamento.lpu.id) {
                // 2. AGORA, COM CERTEZA A LISTA ESTÁ PRONTA, ENTÃO PREENCHEMOS E TRAVAMOS
                selectLPU.value = lancamento.lpu.id;
                selectLPU.disabled = true;
            }
            // --- FIM DA LÓGICA CORRIGIDA ---

            if (lancamento.prestador) {
                document.getElementById('prestadorId').value = lancamento.prestador.id;
            }

            if (lancamento.etapa && lancamento.etapa.id) {
                const etapaGeralPai = todasAsEtapas.find(eg => eg.etapasDetalhadas.some(ed => ed.id === lancamento.etapa.id));
                if (etapaGeralPai) {
                    document.getElementById('etapaGeralSelect').value = etapaGeralPai.id;
                    await popularDropdownsDependentes(etapaGeralPai.id, lancamento.etapa.id);
                    document.getElementById('etapaDetalhadaId').value = lancamento.etapa.id;
                }
            } else {
                document.getElementById('etapaGeralSelect').value = '';
                await popularDropdownsDependentes('', null);
            }

            const selectStatus = document.getElementById('status');
            if (lancamento.status && !selectStatus.querySelector(`option[value="${lancamento.status}"]`)) {
                selectStatus.add(new Option(lancamento.status, lancamento.status, true, true));
            } else {
                selectStatus.value = lancamento.status || '';
            }

            const selectSituacao = document.getElementById('situacao');
            if (lancamento.situacao && !selectSituacao.querySelector(`option[value="${lancamento.situacao}"]`)) {
                selectSituacao.add(new Option(lancamento.situacao, lancamento.situacao, true, true));
            } else {
                selectSituacao.value = lancamento.situacao || 'Não iniciado';
            }

            const modalEl = document.getElementById('modalAdicionar');
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.show();
        }

        modalAdicionarEl.addEventListener('show.bs.modal', async function (event) {
            const button = event.relatedTarget; // Botão que abriu o modal
            const formAdicionar = document.getElementById('formAdicionar');
            const modalTitle = document.getElementById('modalAdicionarLabel');

            // Reseta o formulário e o estado do modal para o padrão de "Novo Lançamento"
            formAdicionar.reset();
            delete formAdicionar.dataset.editingId;
            modalTitle.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar Nova Atividade';

            // Mostra a UI de seleção de LPUs e esconde a UI de edição
            document.getElementById('osId').parentElement.style.display = 'block';
            if (lpuChecklistContainer) lpuChecklistContainer.parentElement.style.display = 'block';
            if (btnAvancarParaPreenchimento) btnAvancarParaPreenchimento.style.display = 'inline-block';
            if (formulariosContainer) formulariosContainer.innerHTML = '';
            if (formulariosContainer) formulariosContainer.style.display = 'none'; // Começa escondido

            // Mostra/esconde os botões de ação corretos
            document.getElementById('btnSubmitAdicionar').style.display = 'inline-block';
            document.getElementById('btnSalvarRascunho').style.display = 'none';
            document.getElementById('btnSalvarEEnviar').style.display = 'none';

            // AGORA, VERIFICAMOS SE O MODAL FOI ABERTO POR UM BOTÃO DE EDIÇÃO/RETOMAR
            if (button && button.dataset.id) {
                const lancamentoId = button.dataset.id;
                const acao = button.dataset.action; // 'editar', 'retomar', etc.

                // SÓ CHAMA carregarDadosParaModal SE TIVER UM ID
                await carregarDadosParaModal(lancamentoId, acao);
            } else {
                // Se for um NOVO lançamento, apenas carrega os dropdowns padrões
                await carregarDadosIniciaisParaNovoLancamento();
            }
        });

        document.addEventListener('click', async function (event) {
            const button = event.target.closest('[data-bs-toggle="modal"]');
            if (!button) return;

            const lancamentoId = button.dataset.id;
            const targetModalId = button.getAttribute('data-bs-target');

            if (lancamentoId && targetModalId === '#modalAdicionar') {
                event.preventDefault(); // Impede a abertura do modal de "Adicionar"

                const acao = button.dataset.action || 'editar-rascunho';
                const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));

                await carregarDadosParaModalEditar(lancamentoId, acao);
                modalEditar.show();
            }
        });

        // Este listener serve apenas para LIMPAR o modal de ADICIONAR sempre que ele for aberto.
        const modalAdicionar = modalAdicionarEl ? new bootstrap.Modal(modalAdicionarEl) : null;
        if (modalAdicionarEl) {
            modalAdicionarEl.addEventListener('show.bs.modal', function () {
                // Reseta o formulário de adicionar para um estado limpo
                const formAdicionar = document.getElementById('formAdicionar');
                formAdicionar.reset();
                delete formAdicionar.dataset.editingId;

                // Limpa a interface de criação em lote
                const lpuContainer = document.getElementById('lpuChecklistContainer');
                const formulariosContainer = document.getElementById('formulariosContainer');
                const btnAvancar = document.getElementById('btnAvancarParaPreenchimento');

                if (lpuContainer) lpuContainer.innerHTML = '<p class="text-muted">Selecione uma OS para ver as LPUs.</p>';
                if (formulariosContainer) formulariosContainer.innerHTML = '';
                if (btnAvancar) btnAvancar.disabled = true;

                // Garante que os campos de seleção fiquem visíveis no modal de Adicionar
                const osIdSelect = document.getElementById('osId');
                if (osIdSelect && osIdSelect.parentElement) {
                    osIdSelect.parentElement.style.display = 'block';
                }
                if (lpuContainer && lpuContainer.parentElement) lpuContainer.parentElement.style.display = 'block';
                if (btnAvancar) btnAvancar.style.display = 'inline-block';

                // Carrega os dados iniciais (lista de OSs) para um novo lançamento
                carregarDadosIniciaisParaNovoLancamento();
            });
        }

        document.body.addEventListener('click', async (e) => {
            // Unificamos a lógica para qualquer botão que precise abrir o modal de edição/detalhes
            const actionBtn = e.target.closest('.btn-reenviar, .btn-editar-rascunho, .btn-retomar');
            const comentariosBtn = e.target.closest('.btn-ver-comentarios');
            const submeterBtn = e.target.closest('.btn-submeter-agora');

            if (actionBtn) { // Se clicou em um botão de ação (Editar, Reenviar, Retomar)
                const originalContent = actionBtn.innerHTML;
                try {
                    actionBtn.disabled = true;
                    actionBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

                    const lancamentoId = actionBtn.dataset.id;
                    if (!lancamentoId) {
                        throw new Error('ID do lançamento não foi encontrado no botão.');
                    }

                    // Identifica a ação baseada na classe do botão
                    const acao = actionBtn.classList.contains('btn-reenviar') ? 'rejeitado' : 'editar-rascunho';

                    // Pega a instância do modal de EDIÇÃO
                    const modalEditarEl = document.getElementById('modalEditar');
                    if (!modalEditarEl) {
                        throw new Error('O modal de edição #modalEditar não foi encontrado no HTML.');
                    }
                    const modalInstance = new bootstrap.Modal(modalEditarEl);

                    // CHAMA A FUNÇÃO CORRETA para carregar dados no modal de EDIÇÃO
                    await carregarDadosParaModalEditar(lancamentoId, acao);

                    // MOSTRA O MODAL DE EDIÇÃO
                    modalInstance.show();

                } catch (error) {
                    console.error("Erro ao preparar modal de edição:", error);
                    mostrarToast(error.message, 'error');
                } finally {
                    actionBtn.disabled = false;
                    actionBtn.innerHTML = originalContent;
                }
            } else if (comentariosBtn) {
                // Lógica para comentários (permanece a mesma)
                const lancamento = todosLancamentos.find(l => l.id == comentariosBtn.dataset.id);
                if (lancamento) {
                    exibirComentarios(lancamento);
                } else {
                    mostrarToast('Lançamento não encontrado.', 'error');
                }
            } else if (submeterBtn) {
                // Lógica para submissão (permanece a mesma)
                const lancamentoId = submeterBtn.dataset.id;
                const btnConfirmar = document.getElementById('btnConfirmarSubmissao');
                btnConfirmar.dataset.lancamentoId = lancamentoId;
                const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmarSubmissao'));
                modalConfirmacao.show();
            }
        });

        async function carregarDadosIniciaisParaNovoLancamento() {
            // Passo 1: Garante que a lista de OSs esteja carregada na memória.
            // A função 'carregarTodasAsOS' já tem a lógica de cache (só busca se for necessário).
            await carregarTodasAsOS();

            // Passo 2: Agora que 'todasAsOS' está preenchida, apenas popula o select.
            const selectOS = document.getElementById('osId');
            selectOS.innerHTML = `<option value="" selected disabled>Selecione...</option>`;

            todasAsOS.forEach(item => {
                const option = new Option(item.os, item.id);
                selectOS.add(option);
            });
        }

        function getProjetosParalisados() {
            const ultimosLancamentos = new Map();
            todosLancamentos.forEach(l => {
                // Garante que o lançamento tenha uma OS e uma LPU antes de processar
                if (l.os && l.lpu) {
                    // CORREÇÃO: Acessamos l.os.id e l.lpu.id diretamente
                    const chaveProjeto = `${l.os.id}-${l.lpu.id}`; // Define a chave aqui

                    if (!ultimosLancamentos.has(chaveProjeto) || l.id > ultimosLancamentos.get(chaveProjeto).id) {
                        ultimosLancamentos.set(chaveProjeto, l);
                    }
                }
            });
            // Filtra para retornar apenas os projetos cujo último lançamento está "Paralisado"
            return Array.from(ultimosLancamentos.values()).filter(l => l.situacao === 'Paralisado' && l.situacaoAprovacao !== 'RASCUNHO');
        }

        async function popularPrestadores(prestadorIdSelecionado, sufixo = '') {
            const selectPrestador = document.getElementById(`prestadorId${sufixo}`);
            if (!selectPrestador) {
                console.error(`Select de prestador com sufixo '${sufixo}' não foi encontrado.`);
                return;
            }

            // 1. Busca os dados da API apenas se a lista (cache) estiver vazia
            if (todosOsPrestadores.length === 0) {
                try {
                    const response = await fetch('http://localhost:8080/index/prestadores/ativos');
                    if (!response.ok) throw new Error('Falha ao buscar prestadores de serviço.');
                    todosOsPrestadores = await response.json();
                } catch (error) {
                    console.error("Erro ao carregar prestadores:", error);
                    selectPrestador.innerHTML = '<option value="">Erro ao carregar</option>';
                    return; // Sai da função se a busca falhar
                }
            }

            // 2. Popula o <select> com os dados da lista (cache)
            selectPrestador.innerHTML = '<option value="" disabled>Selecione...</option>';
            todosOsPrestadores.forEach(p => {
                selectPrestador.add(new Option(`${p.codigoPrestador} - ${p.prestador}`, p.id));
            });

            // 3. Seleciona o prestador correto se um ID for fornecido
            if (prestadorIdSelecionado) {
                selectPrestador.value = prestadorIdSelecionado;
            }
        }

        async function carregarTodasAsEtapas() {
            // Só faz a busca na API se a variável ainda estiver vazia
            if (todasAsEtapas.length === 0) {
                try {
                    const response = await fetch('http://localhost:8080/index/etapas');
                    if (!response.ok) throw new Error('Falha ao buscar os dados das etapas.');
                    todasAsEtapas = await response.json(); // Armazena na variável global
                } catch (error) {
                    console.error('Erro fatal ao carregar etapas:', error);
                    mostrarToast(error.message, 'error');
                    // Retorna um array vazio em caso de erro para não quebrar outras funções
                    todasAsEtapas = [];
                }
            }
        }

        // Listener para o botão de confirmação final de submissão
        document.getElementById('btnConfirmarSubmissao').addEventListener('click', async function (e) {
            const confirmButton = e.currentTarget;
            const id = confirmButton.dataset.lancamentoId;

            if (!id) return;

            const originalContent = confirmButton.innerHTML;
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarSubmissao'));

            try {
                // Lógica de "carregando..."
                confirmButton.disabled = true;
                confirmButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Enviando...`;

                const resposta = await fetch(`http://localhost:8080/lancamentos/${id}/submeter`, { method: 'POST' });
                if (!resposta.ok) {
                    const erroData = await resposta.json();
                    throw new Error(erroData.message || 'Erro ao submeter.');
                }

                mostrarToast('Lançamento submetido com sucesso!', 'success');

                // Recarrega os dados para atualizar as tabelas
                await carregarLancamentos();
                renderizarTodasAsTabelas();

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                // Restaura o botão e esconde o modal
                confirmButton.disabled = false;
                confirmButton.innerHTML = originalContent;
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        });


        lpuChecklistContainer.addEventListener('change', (e) => {

            if (e.target.classList.contains('lpu-checkbox')) {

                const algumCheckboxMarcado = lpuChecklistContainer.querySelector('.lpu-checkbox:checked');

                btnAvancarParaPreenchimento.disabled = !algumCheckboxMarcado;

            }

        });

        // VERSÃO CORRIGIDA (para colar no lugar)
        btnAvancarParaPreenchimento.addEventListener('click', async () => {
            // Mostra a área dos formulários
            formulariosContainer.style.display = 'block';

            const lpusSelecionadas = document.querySelectorAll('.lpu-checkbox:checked');
            if (lpusSelecionadas.length === 0) return;

            // Busca os dados de Etapas e Prestadores uma única vez
            const [etapas, prestadores] = await Promise.all([
                fetch('http://localhost:8080/index/etapas').then(res => res.json()),
                fetch('http://localhost:8080/index/prestadores/ativos').then(res => res.json())
            ]);

            // Gera o HTML do acordeão (esta parte continua igual à anterior)
            formulariosContainer.innerHTML = Array.from(lpusSelecionadas).map((checkbox, index) => {
                const lpuId = checkbox.value;
                const lpuNome = checkbox.dataset.nome;
                const isPrimeiroItem = index === 0;

                return `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${lpuId}">
                    <button class="accordion-button ${!isPrimeiroItem ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${lpuId}" aria-expanded="${isPrimeiroItem}">
                        LPU: ${lpuNome}
                    </button>
                </h2>
                <div id="collapse-${lpuId}" class="accordion-collapse collapse ${isPrimeiroItem ? 'show' : ''}">
                    <div class="accordion-body">
                        <h6 class="section-title">Execução</h6>
                        <div class="etapas-scroll mb-3">
                            <div class="card etapa-card">
                                <h6>Vistoria</h6>
                                <label class="form-label">Status</label>
                                <select class="form-select" id="vistoria-lpu-${lpuId}">
                                    <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                </select>
                                <label class="form-label mt-2">Plano (Data)</label>
                                <input type="date" class="form-control" id="planoVistoria-lpu-${lpuId}">
                            </div>
                            <div class="card etapa-card">
                                <h6>Desmobilização</h6>
                                <label class="form-label">Status</label>
                                <select class="form-select" id="desmobilizacao-lpu-${lpuId}">
                                    <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                </select>
                                <label class="form-label mt-2">Plano (Data)</label>
                                <input type="date" class="form-control" id="planoDesmobilizacao-lpu-${lpuId}">
                            </div>
                            <div class="card etapa-card">
                                <h6>Instalação</h6>
                                <label class="form-label">Status</label>
                                <select class="form-select" id="instalacao-lpu-${lpuId}">
                                    <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                </select>
                                <label class="form-label mt-2">Plano (Data)</label>
                                <input type="date" class="form-control" id="planoInstalacao-lpu-${lpuId}">
                            </div>
                            <div class="card etapa-card">
                                <h6>Ativação</h6>
                                <label class="form-label">Status</label>
                                <select class="form-select" id="ativacao-lpu-${lpuId}">
                                    <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                </select>
                                <label class="form-label mt-2">Plano (Data)</label>
                                <input type="date" class="form-control" id="planoAtivacao-lpu-${lpuId}">
                            </div>
                            <div class="card etapa-card">
                                <h6>Documentação</h6>
                                <label class="form-label">Status</label>
                                <select class="form-select" id="documentacao-lpu-${lpuId}">
                                    <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                </select>
                                <label class="form-label mt-2">Plano (Data)</label>
                                <input type="date" class="form-control" id="planoDocumentacao-lpu-${lpuId}">
                            </div>
                        </div>
                        <h6 class="section-title">Etapas</h6>
                        <div class="row g-3 mb-3">
                            <div class="col-md-4">
                                <label for="etapaGeral-lpu-${lpuId}" class="form-label">ETAPA GERAL</label>
                                <select class="form-select etapa-geral-select" id="etapaGeral-lpu-${lpuId}" data-lpu-id="${lpuId}" required></select>
                            </div>
                            <div class="col-md-4">
                                <label for="etapaDetalhadaId-lpu-${lpuId}" class="form-label">ETAPA DETALHADA</label>
                                <select class="form-select etapa-detalhada-select" id="etapaDetalhadaId-lpu-${lpuId}" required disabled></select>
                            </div>
                            <div class="col-md-4">
                                <label for="status-lpu-${lpuId}" class="form-label">STATUS</label>
                                <select class="form-select status-select" id="status-lpu-${lpuId}" required disabled></select>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="detalheDiario-lpu-${lpuId}" class="form-label">DETALHE DIÁRIO</label>
                            <textarea class="form-control" id="detalheDiario-lpu-${lpuId}" rows="2" required></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="situacao-lpu-${lpuId}" class="form-label">SITUAÇÃO</label>
                            <select class="form-select" id="situacao-lpu-${lpuId}">
                                <option>Não iniciado</option>
                                <option>Aguardando documentação</option>
                                <option>Paralisado</option>
                                <option selected>Em andamento</option>
                                <option>Finalizado</option>
                            </select>
                        </div>
                        <h6 class="section-title">Financeiro</h6>
                        <div class="row g-3 mb-3">
                            <div class="col-md-8">
                                <label for="prestadorId-lpu-${lpuId}" class="form-label">PRESTADOR</label>
                                <select class="form-select" id="prestadorId-lpu-${lpuId}" required></select>
                            </div>
                            <div class="col-md-4">
                                <label for="valor-lpu-${lpuId}" class="form-label">VALOR DA ATIVIDADE</label>
                                <div class="input-group">
                                    <span class="input-group-text">R$</span>
                                    <input type="text" class="form-control" id="valor-lpu-${lpuId}" inputmode="numeric" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
            }).join('');

            // Popula os selects (o resto da função continua igual)
            lpusSelecionadas.forEach(checkbox => {
                const lpuId = checkbox.value;
                const selectPrestador = document.getElementById(`prestadorId-lpu-${lpuId}`);
                prestadores.forEach(p => selectPrestador.add(new Option(`${p.codigoPrestador} - ${p.prestador}`, p.id)));
                const selectEtapaGeral = document.getElementById(`etapaGeral-lpu-${lpuId}`);
                etapas.forEach(e => selectEtapaGeral.add(new Option(`${e.codigo} - ${e.nome}`, e.id)));
            });

            formulariosContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('etapa-geral-select')) {
                    const lpuId = e.target.dataset.lpuId;
                    const etapaGeralId = e.target.value;
                    const selectDetalhada = document.getElementById(`etapaDetalhadaId-lpu-${lpuId}`);
                    const selectStatus = document.getElementById(`status-lpu-${lpuId}`);
                    const etapaSelecionada = etapas.find(etapa => etapa.id == etapaGeralId);
                    selectDetalhada.innerHTML = '<option value="" selected disabled>Selecione...</option>';
                    selectStatus.innerHTML = '<option value="" selected disabled>Selecione...</option>';
                    selectDetalhada.disabled = true;
                    selectStatus.disabled = true;
                    if (etapaSelecionada && etapaSelecionada.etapasDetalhadas.length > 0) {
                        etapaSelecionada.etapasDetalhadas.forEach(detalhe => {
                            selectDetalhada.add(new Option(`${detalhe.indice} - ${detalhe.nome}`, detalhe.id));
                        });
                        selectDetalhada.disabled = false;
                    }
                }
                if (e.target.classList.contains('etapa-detalhada-select')) {
                    const lpuId = e.target.closest('.accordion-body').querySelector('.etapa-geral-select').dataset.lpuId;
                    const etapaGeralId = e.target.closest('.accordion-body').querySelector('.etapa-geral-select').value;
                    const etapaDetalhadaId = e.target.value;
                    const selectStatus = document.getElementById(`status-lpu-${lpuId}`);
                    const etapaGeral = etapas.find(e => e.id == etapaGeralId);
                    const etapaDetalhada = etapaGeral?.etapasDetalhadas.find(ed => ed.id == etapaDetalhadaId);
                    selectStatus.innerHTML = '<option value="" selected disabled>Selecione...</option>';
                    selectStatus.disabled = true;
                    if (etapaDetalhada && etapaDetalhada.status.length > 0) {
                        etapaDetalhada.status.forEach(status => selectStatus.add(new Option(status, status)));
                        selectStatus.disabled = false;
                    }
                }
            });

            flatpickr("#formulariosContainer input[type=date]", {
                dateFormat: "d/m/Y",
                locale: "pt"
            });

            btnSalvar.disabled = false;
        });

        async function carregarDadosParaModalEditar(id, acao) {
            // Garante que todos os dados de suporte estejam carregados (usando cache)
            await carregarTodasAsOS();
            await carregarTodasAsEtapas();
            await popularPrestadores(null, 'Editar');

            const form = document.getElementById('formEditar');
            const modalTitle = document.getElementById('modalEditarLabel');
            form.reset();
            form.dataset.editingId = id;

            // ... (declaração de botões e função formatarDataParaInput) ...
            const btnSubmit = document.getElementById('btnSubmitEditar');
            const btnSalvarRascunho = document.getElementById('btnSalvarRascunhoEditar');
            const btnSalvarEEnviar = document.getElementById('btnSalvarEEnviarEditar');
            const formatarDataParaInput = (dataString) => {
                if (!dataString) return '';
                const [dia, mes, ano] = dataString.split('/');
                return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            };

            try {
                const response = await fetch(`http://localhost:8080/lancamentos/${id}`);
                if (!response.ok) throw new Error('Falha ao buscar dados do lançamento.');
                const data = await response.json();

                // 1. Preenche Dados Gerais e da OS
                const selectOS = document.getElementById('osIdEditar');
                if (!Array.from(selectOS.options).some(opt => opt.value == data.os.id)) {
                    selectOS.add(new Option(data.os.os, data.os.id));
                }
                selectOS.value = data.os.id;
                preencherCamposOS(data.os.id, 'Editar');
                document.getElementById('dataAtividadeEditar').value = formatarDataParaInput(data.dataAtividade);

                // 2. Preenche a LPU
                const selectLPU = document.getElementById('lpuIdEditar');
                selectLPU.innerHTML = '';
                if (data.lpu) {
                    selectLPU.add(new Option(`${data.lpu.codigo} - ${data.lpu.nome}`, data.lpu.id));
                    selectLPU.value = data.lpu.id;
                } else {
                    selectLPU.innerHTML = '<option value="">LPU não informada</option>';
                }
                selectLPU.disabled = true;

                // 3. Preenche a seção de Execução
                document.getElementById('vistoriaEditar').value = data.vistoria || 'N/A';
                document.getElementById('planoVistoriaEditar').value = formatarDataParaInput(data.planoVistoria);
                document.getElementById('desmobilizacaoEditar').value = data.desmobilizacao || 'N/A';
                document.getElementById('planoDesmobilizacaoEditar').value = formatarDataParaInput(data.planoDesmobilizacao);
                document.getElementById('instalacaoEditar').value = data.instalacao || 'N/A';
                document.getElementById('planoInstalacaoEditar').value = formatarDataParaInput(data.planoInstalacao);
                document.getElementById('ativacaoEditar').value = data.ativacao || 'N/A';
                document.getElementById('planoAtivacaoEditar').value = formatarDataParaInput(data.planoAtivacao);
                document.getElementById('documentacaoEditar').value = data.documentacao || 'N/A';
                document.getElementById('planoDocumentacaoEditar').value = formatarDataParaInput(data.planoDocumentacao);

                // 4. Preenche a seção de Etapas (LÓGICA FINALMENTE CORRIGIDA)
                // --- INÍCIO DA CORREÇÃO PRINCIPAL ---
                let etapaGeralId = null;
                let etapaDetalhadaId = null;

                // Verifica se o objeto 'etapa' existe na resposta da sua API
                if (data.etapa) {
                    etapaDetalhadaId = data.etapa.id; // Temos o ID da etapa detalhada diretamente

                    // Loop para encontrar a Etapa Geral 'mãe' da Etapa Detalhada
                    for (const etapaGeral of todasAsEtapas) {
                        const detalheEncontrado = etapaGeral.etapasDetalhadas.find(ed => ed.id === etapaDetalhadaId);
                        if (detalheEncontrado) {
                            etapaGeralId = etapaGeral.id; // Se achou o filho, pegamos o ID do pai
                            break; // Para o loop pois já encontramos
                        }
                    }
                }
                // --- FIM DA CORREÇÃO PRINCIPAL ---

                const selectEtapaGeral = document.getElementById('etapaGeralSelectEditar');
                selectEtapaGeral.innerHTML = '<option value="" disabled>Selecione...</option>';
                todasAsEtapas.forEach(e => selectEtapaGeral.add(new Option(`${e.codigo} - ${e.nome}`, e.id)));

                if (etapaGeralId) {
                    selectEtapaGeral.value = etapaGeralId; // Seleciona a Etapa Geral correta
                }

                // Agora, esta função receberá os IDs corretos para popular o restante
                await popularDropdownsDependentes(etapaGeralId, etapaDetalhadaId, data.status, 'Editar');

                document.getElementById('situacaoEditar').value = data.situacao;
                document.getElementById('detalheDiarioEditar').value = data.detalheDiario || '';

                // 5. Preenche a seção Financeira
                document.getElementById('prestadorIdEditar').value = data.prestador.id;
                document.getElementById('valorEditar').value = (data.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

                // 6. Configura o Título e Botões
                // ... (o resto da função continua igual) ...
                modalTitle.innerHTML = `<i class="bi bi-pencil"></i> Detalhes da Atividade #${id}`;
                btnSubmit.style.display = 'none';
                btnSalvarRascunho.style.display = 'none';
                btnSalvarEEnviar.style.display = 'none';

                if (data.situacaoAprovacao === 'RASCUNHO') {
                    btnSalvarRascunho.style.display = 'inline-block';
                    btnSalvarEEnviar.style.display = 'inline-block';
                } else if (data.situacaoAprovacao === 'REJEITADO') {
                    btnSubmit.innerHTML = '<i class="bi bi-send"></i> Reenviar';
                    btnSubmit.style.display = 'inline-block';
                }

            } catch (error) {
                console.error("Erro ao carregar dados para o modal de edição:", error);
                mostrarToast(error.message, 'error');
            }
        }

        async function handleFormSubmitEditar(acao, submitButton) {
            const form = document.getElementById('formEditar');
            const editingId = form.dataset.editingId;
            if (!editingId) {
                mostrarToast('ID de edição não encontrado. Não é possível salvar.', 'error');
                return;
            }

            const originalContent = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

            // Função auxiliar para formatar datas para o formato YYYY-MM-DD que o backend espera
            const formatarDataParaAPI = (dataString) => {
                if (!dataString) return null;
                if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) return dataString; // Já está no formato correto
                if (dataString.includes('/')) {
                    const [dia, mes, ano] = dataString.split('/');
                    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                }
                return null; // Formato inválido
            };

            try {
                // Coleta todos os dados do formulário de EDIÇÃO
                const dadosParaEnviar = {
                    managerId: localStorage.getItem('usuarioId'),
                    osId: document.getElementById('osIdEditar').value,
                    lpuId: document.getElementById('lpuIdEditar').value,
                    dataAtividade: formatarDataParaAPI(document.getElementById('dataAtividadeEditar').value),
                    prestadorId: document.getElementById('prestadorIdEditar').value,
                    etapaDetalhadaId: document.getElementById('etapaDetalhadaIdEditar').value,
                    vistoria: document.getElementById('vistoriaEditar').value,
                    planoVistoria: formatarDataParaAPI(document.getElementById('planoVistoriaEditar').value),
                    desmobilizacao: document.getElementById('desmobilizacaoEditar').value,
                    planoDesmobilizacao: formatarDataParaAPI(document.getElementById('planoDesmobilizacaoEditar').value),
                    instalacao: document.getElementById('instalacaoEditar').value,
                    planoInstalacao: formatarDataParaAPI(document.getElementById('planoInstalacaoEditar').value),
                    ativacao: document.getElementById('ativacaoEditar').value,
                    planoAtivacao: formatarDataParaAPI(document.getElementById('planoAtivacaoEditar').value),
                    documentacao: document.getElementById('documentacaoEditar').value,
                    planoDocumentacao: formatarDataParaAPI(document.getElementById('planoDocumentacaoEditar').value),
                    status: document.getElementById('statusEditar').value,
                    situacao: document.getElementById('situacaoEditar').value,
                    detalheDiario: document.getElementById('detalheDiarioEditar').value,
                    valor: parseFloat(document.getElementById('valorEditar').value.replace(/\./g, '').replace(',', '.')) || 0,
                };

                // Define o status de aprovação com base no botão que foi clicado
                if (acao === 'salvar') {
                    dadosParaEnviar.situacaoAprovacao = 'RASCUNHO';
                } else if (acao === 'enviar' || acao === 'reenviar') {
                    dadosParaEnviar.situacaoAprovacao = 'PENDENTE_COORDENADOR';
                }

                // Envia a requisição PUT para o backend
                const resposta = await fetch(`http://localhost:8080/lancamentos/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosParaEnviar)
                });

                if (!resposta.ok) {
                    const errorData = await resposta.json();
                    throw new Error(errorData.message || 'Erro ao salvar alterações.');
                }

                // Se deu tudo certo, mostra feedback e atualiza a tela
                mostrarToast('Lançamento atualizado com sucesso!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
                await carregarLancamentos();

            } catch (erro) {
                mostrarToast(erro.message, 'error');
            } finally {
                // Restaura o estado do botão
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalContent;
                }
            }
        }

        async function handleFormSubmit(acao, submitButton) {
            const editingId = formAdicionar.dataset.editingId;

            const originalContent = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

            // Função auxiliar para formatar a data para o padrão que o backend espera (YYYY-MM-DD)
            const formatarDataParaAPI = (dataString) => {
                if (!dataString || !dataString.includes('/')) {
                    return null; // Retorna nulo se a data for vazia ou inválida
                }
                const [dia, mes, ano] = dataString.split('/');
                return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            };

            try {
                // A condição foi ajustada para ser mais explícita: só entra no modo lote se NÃO houver editingId.
                if (!editingId) {
                    // MODO NOVO: CRIAÇÃO EM LOTE
                    const lpusSelecionadas = document.querySelectorAll('.lpu-checkbox:checked');
                    if (lpusSelecionadas.length === 0) {
                        throw new Error("Nenhuma LPU foi selecionada.");
                    }

                    const lancamentosEmLote = [];
                    const osId = document.getElementById('osId').value;
                    const dataAtividade = document.getElementById('dataAtividade').value;

                    if (!dataAtividade) {
                        throw new Error('A Data da Atividade é obrigatória.');
                    }

                    lpusSelecionadas.forEach(checkbox => {
                        const lpuId = checkbox.value;

                        // Monta o objeto de dados para cada LPU
                        const dadosLpu = {
                            managerId: localStorage.getItem('usuarioId'),
                            osId: osId,
                            lpuId: lpuId,
                            dataAtividade: formatarDataParaAPI(dataAtividade), // <-- CORREÇÃO FINAL APLICADA AQUI

                            // Campos da seção Execução
                            vistoria: document.getElementById(`vistoria-lpu-${lpuId}`).value,
                            planoVistoria: formatarDataParaAPI(document.getElementById(`planoVistoria-lpu-${lpuId}`).value),
                            desmobilizacao: document.getElementById(`desmobilizacao-lpu-${lpuId}`).value,
                            planoDesmobilizacao: formatarDataParaAPI(document.getElementById(`planoDesmobilizacao-lpu-${lpuId}`).value),
                            instalacao: document.getElementById(`instalacao-lpu-${lpuId}`).value,
                            planoInstalacao: formatarDataParaAPI(document.getElementById(`planoInstalacao-lpu-${lpuId}`).value),
                            ativacao: document.getElementById(`ativacao-lpu-${lpuId}`).value,
                            planoAtivacao: formatarDataParaAPI(document.getElementById(`planoAtivacao-lpu-${lpuId}`).value),
                            documentacao: document.getElementById(`documentacao-lpu-${lpuId}`).value,
                            planoDocumentacao: formatarDataParaAPI(document.getElementById(`planoDocumentacao-lpu-${lpuId}`).value),

                            // Campos da seção Etapas
                            etapaDetalhadaId: document.getElementById(`etapaDetalhadaId-lpu-${lpuId}`).value,
                            status: document.getElementById(`status-lpu-${lpuId}`).value,
                            situacao: document.getElementById(`situacao-lpu-${lpuId}`).value,
                            detalheDiario: document.getElementById(`detalheDiario-lpu-${lpuId}`).value,

                            // Campos da seção Financeiro
                            prestadorId: document.getElementById(`prestadorId-lpu-${lpuId}`).value,
                            valor: parseFloat(document.getElementById(`valor-lpu-${lpuId}`).value.replace(/\./g, '').replace(',', '.')) || 0,
                        };
                        lancamentosEmLote.push(dadosLpu);
                    });

                    const resposta = await fetch('http://localhost:8080/lancamentos/lote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(lancamentosEmLote)
                    });

                    if (!resposta.ok) {
                        const errorText = await resposta.text();
                        console.error("Erro do backend:", errorText);
                        throw new Error('Erro ao salvar lançamentos. Verifique o console para detalhes.');
                    }

                } else {
                    // MODO ANTIGO: EDIÇÃO DE UM ÚNICO ITEM
                    const dadosParaEnviar = {
                        managerId: localStorage.getItem('usuarioId'),
                        osId: document.getElementById('osId').value,
                        lpuId: document.getElementById('lpuId').value,
                        dataAtividade: formatarDataParaAPI(document.getElementById('dataAtividade').value), // Formata a data também na edição
                        prestadorId: document.getElementById('prestadorId').value,
                        etapaDetalhadaId: document.getElementById('etapaDetalhadaId').value,
                        equipe: document.getElementById('equipe').value,
                        vistoria: document.getElementById('vistoria').value,
                        planoVistoria: formatarDataParaAPI(document.getElementById('planoVistoria').value),
                        desmobilizacao: document.getElementById('desmobilizacao').value,
                        planoDesmobilizacao: formatarDataParaAPI(document.getElementById('planoDesmobilizacao').value),
                        instalacao: document.getElementById('instalacao').value,
                        planoInstalacao: formatarDataParaAPI(document.getElementById('planoInstalacao').value),
                        ativacao: document.getElementById('ativacao').value,
                        planoAtivacao: formatarDataParaAPI(document.getElementById('planoAtivacao').value),
                        documentacao: document.getElementById('documentacao').value,
                        planoDocumentacao: formatarDataParaAPI(document.getElementById('planoDocumentacao').value),
                        status: document.getElementById('status').value,
                        situacao: document.getElementById('situacao').value,
                        detalheDiario: document.getElementById('detalheDiario').value,
                        valor: parseFloat(document.getElementById('valor').value.replace(/\./g, '').replace(',', '.')) || 0,
                    };

                    let method = 'PUT';
                    let url = `http://localhost:8080/lancamentos/${editingId}`;

                    if (acao === 'salvar') {
                        dadosParaEnviar.situacaoAprovacao = 'RASCUNHO';
                    } else if (acao === 'enviar' || acao === 'reenviar') {
                        dadosParaEnviar.situacaoAprovacao = 'PENDENTE_COORDENADOR';
                    }

                    const resposta = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dadosParaEnviar)
                    });

                    if (!resposta.ok) throw new Error((await resposta.json()).message || 'Erro ao salvar.');
                }

                // Se chegou até aqui, a operação foi um sucesso
                mostrarToast('Ação realizada com sucesso!', 'success');
                modalAdicionar.hide();
                await carregarLancamentos();
                renderizarTodasAsTabelas();

            } catch (erro) {
                // Exibe qualquer erro que tenha ocorrido no processo
                mostrarToast(erro.message, 'error');
            } finally {
                // Este bloco sempre será executado, reativando o botão
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalContent;
                }
            }
        }

        // Listener para o botão 'Salvar e Enviar' (de um rascunho)
        document.getElementById('btnSalvarEEnviar').addEventListener('click', function (e) {
            handleFormSubmit('enviar', e.currentTarget);
        });

        // Listener para o botão 'Salvar Alterações' (só salva como rascunho)
        document.getElementById('btnSalvarRascunho').addEventListener('click', function (e) {
            handleFormSubmit('salvar', e.currentTarget);
        });

        // Listener para o botão de submit padrão (usado para Criar Novo e para Reenviar Rejeitado)
        document.getElementById('btnSubmitAdicionar').addEventListener('click', function (e) {
            const editingId = formAdicionar.dataset.editingId;

            const isEditing = editingId && editingId !== 'null' && editingId !== 'undefined';

            handleFormSubmit(isEditing ? 'reenviar' : 'criar', e.currentTarget);
        });

    }

    async function carregarTodasAsOS() {
        if (todasAsOS.length === 0) { // Só busca na API se a lista estiver vazia
            try {
                const usuarioId = localStorage.getItem('usuarioId');
                if (!usuarioId) throw new Error('ID do usuário não encontrado.');

                const response = await fetch(`http://localhost:8080/os/por-usuario/${usuarioId}`);
                if (!response.ok) throw new Error('Falha ao carregar Ordens de Serviço.');

                const osData = await response.json();
                todasAsOS = osData.sort((a, b) => a.os.localeCompare(b.os)); // Armazena na variável global
            } catch (error) {
                console.error('Erro ao carregar OSs:', error);
                mostrarToast('Erro ao carregar Ordens de Serviço.', 'error');
            }
        }
    }

    function exibirComentarios(lancamento) {
        const modalBody = document.getElementById('modalComentariosBody');
        const modalTitle = document.getElementById('modalComentariosLabel');

        modalTitle.textContent = `Comentários do Lançamento`;
        modalBody.innerHTML = ''; // Limpa o conteúdo anterior

        if (!lancamento.comentarios || lancamento.comentarios.length === 0) {
            modalBody.innerHTML = '<p class="text-muted text-center">Nenhum comentário para este lançamento.</p>';
            return;
        }

        // Ordena os comentários do mais recente para o mais antigo (opcional, mas bom para UX)
        const comentariosOrdenados = [...lancamento.comentarios].sort((a, b) => {
            // Função de ordenação robusta que também lida com o parse da data
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

            // --- INÍCIO DA CORREÇÃO ---
            // Desmonta a string 'DD/MM/YYYY HH:mm' para criar uma data válida
            const partes = comentario.dataHora.split(' ');         // -> ["15/07/2025", "20:39"]
            const dataPartes = partes[0].split('/');             // -> ["15", "07", "2025"]
            const tempoPartes = partes[1].split(':');            // -> ["20", "39"]

            // Formato para o construtor: new Date(ano, mês - 1, dia, hora, minuto)
            // O mês é -1 porque em JavaScript os meses vão de 0 (Janeiro) a 11 (Dezembro)
            const dataValida = new Date(dataPartes[2], dataPartes[1] - 1, dataPartes[0], tempoPartes[0], tempoPartes[1]);

            // Formata a data válida para o padrão brasileiro
            const dataFormatada = dataValida.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            // --- FIM DA CORREÇÃO ---

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

    // --- LÓGICA DOS FILTROS ---
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
        renderizarTodasAsTabelas();
    });

    // --- LÓGICA DO MODAL DE SOLICITAÇÃO DE MATERIAL ---
    const modalSolicitarMaterialEl = document.getElementById('modalSolicitarMaterial');
    if (modalSolicitarMaterialEl) {
        const modalSolicitarMaterial = new bootstrap.Modal(modalSolicitarMaterialEl);
        const formSolicitacao = document.getElementById('formSolicitarMaterial');
        const selectOS = document.getElementById('osSolicitacao');
        const selectLPU = document.getElementById('lpuSolicitacao');
        const listaItensContainer = document.getElementById('listaItens');
        const btnAdicionarItem = document.getElementById('btnAdicionarItem');

        let todosOsMateriais = []; // Cache para a lista de materiais

        // Função para popular um select de materiais
        const popularSelectMateriais = (selectElement) => {
            selectElement.innerHTML = '<option value="" selected disabled>Carregando...</option>';
            if (todosOsMateriais.length === 0) {
                // Busca materiais da API apenas se o cache estiver vazio
                fetch('http://localhost:8080/materiais')
                    .then(res => res.json())
                    .then(data => {
                        todosOsMateriais = data; // Armazena no cache
                        preencherOpcoes(selectElement);
                    })
                    .catch(err => {
                        console.error("Erro ao buscar materiais:", err);
                        selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
                    });
            } else {
                preencherOpcoes(selectElement); // Usa o cache
            }
        };

        const preencherOpcoes = (selectElement) => {
            selectElement.innerHTML = '<option value="" selected disabled>Selecione o material...</option>';
            todosOsMateriais.forEach(material => {
                const option = new Option(`${material.codigo} - ${material.descricao}`, material.codigo);
                selectElement.add(option);
            });
        };

        // Evento disparado quando o modal de solicitação é aberto
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

            // Popula o primeiro select de material
            popularSelectMateriais(listaItensContainer.querySelector('.material-select'));

            // Popula o select de OS
            try {
                // --- INÍCIO DA ALTERAÇÃO ---
                const usuarioId = localStorage.getItem('usuarioId');
                if (!usuarioId) {
                    throw new Error('ID do usuário não encontrado para filtrar as OSs.');
                }
                // Altera a URL para o endpoint que filtra por usuário
                const response = await fetch(`http://localhost:8080/os/por-usuario/${usuarioId}`);
                // --- FIM DA ALTERAÇÃO ---

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

        // Evento para adicionar um novo item à solicitação
        btnAdicionarItem.addEventListener('click', () => {
            const novoItemRow = listaItensContainer.firstElementChild.cloneNode(true);
            const newSelect = novoItemRow.querySelector('.material-select');
            novoItemRow.querySelector('.quantidade-input').value = 1;

            // Habilita o botão de remover para o novo item
            const btnRemover = novoItemRow.querySelector('.btn-remover-item');
            btnRemover.disabled = false;

            listaItensContainer.appendChild(novoItemRow);
            popularSelectMateriais(newSelect); // Popula o select do novo item
        });

        // Evento para remover um item (usando delegação de evento)
        listaItensContainer.addEventListener('click', (e) => {
            if (e.target.closest('.btn-remover-item')) {
                e.target.closest('.item-row').remove();
            }
        });

        // Evento de submissão do formulário
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

            // ==========================================================
            // ADICIONE ESTA LINHA PARA VER O PAYLOAD NO CONSOLE DO NAVEGADOR
            console.log('Enviando para o backend:', JSON.stringify(payload, null, 2));
            // ==========================================================

            try {
                const response = await fetch('http://localhost:8080/solicitacoes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    // Tenta ler a resposta de erro como texto, pois pode não ser JSON
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

    // Listener para o botão 'Salvar Alterações' do modal de EDIÇÃO
    document.getElementById('btnSalvarRascunhoEditar').addEventListener('click', function (e) {
        // O primeiro argumento 'salvar' fará com que a situacaoAprovacao seja 'RASCUNHO'
        handleFormSubmitEditar('salvar', e.currentTarget);
    });

    // Listener para o botão 'Salvar e Enviar' do modal de EDIÇÃO
    document.getElementById('btnSalvarEEnviarEditar').addEventListener('click', function (e) {
        // O primeiro argumento 'enviar' fará com que a situacaoAprovacao seja 'PENDENTE_COORDENADOR'
        handleFormSubmitEditar('enviar', e.currentTarget);
    });

    // Listener para o botão de submit principal do modal de EDIÇÃO (Reenviar um item rejeitado)
    document.getElementById('btnSubmitEditar').addEventListener('click', function (e) {
        handleFormSubmitEditar('reenviar', e.currentTarget);
    });


    // ==========================================================
    // SEÇÃO 4: EXECUÇÃO INICIAL
    // ==========================================================
    function inicializarCabecalhos() {
        renderizarCabecalho(colunasLancamentos, document.querySelector('#lancamentos-pane thead'));
        renderizarCabecalho(colunasPrincipais, document.querySelector('#pendentes-pane thead'));
        renderizarCabecalho(colunasPrincipais, document.querySelector('#historico-pane thead'));
        renderizarCabecalho(colunasMinhasPendencias, document.querySelector('#minhasPendencias-pane thead'));
        renderizarCabecalho(colunasMinhasPendencias, document.querySelector('#paralisados-pane thead'));
    }

    inicializarCabecalhos();
    carregarLancamentos();
    configurarVisibilidadePorRole();
});