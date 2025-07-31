document.addEventListener('DOMContentLoaded', () => {

    const toastElement = document.getElementById('toastMensagem');
    const toastBody = document.getElementById('toastTexto');
    const toast = toastElement ? new bootstrap.Toast(toastElement) : null;

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
                    if (tbodyElement.id !== 'tbody-lancamentos') {
                        buttonsHtml += ` <button class="btn btn-sm btn-info btn-ver-comentarios" data-id="${lancamento.id}" title="Ver Comentários" data-bs-toggle="modal" data-bs-target="#modalComentarios"><i class="bi bi-chat-left-text"></i></button>`;
                    }

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

    function getDadosFiltrados() {
        let dadosFiltrados = [...todosLancamentos];

        // 1. Filtro por PERÍODO
        if (filtrosAtivos.periodo) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            dadosFiltrados = dadosFiltrados.filter(l => {
                const dataAtividade = new Date(l.dataAtividade.split('/').reverse().join('-')); // Converte DD/MM/YYYY para YYYY-MM-DD

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
                        return true
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
        toggleLoader(true); // <-- MOSTRA O LOADER
        try {
            const response = await fetch('http://localhost:8080/lancamentos');
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);

            // ---> ETAPA 1: EXTRAIR O JSON DA RESPOSTA (ESSA LINHA FALTAVA) <---
            const lancamentosDaApi = await response.json();

            // ---> ETAPA 2: ATUALIZAR A VARIÁVEL GLOBAL COM OS DADOS RECEBIDOS <---
            // Usando a função de filtro que já tínhamos para garantir que cada usuário veja o que deve
            todosLancamentos = filtrarLancamentosParaUsuario(lancamentosDaApi);

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
    const modalAdicionarEl = document.getElementById('modalAdicionar');
    const modalAdicionar = modalAdicionarEl ? new bootstrap.Modal(modalAdicionarEl) : null;

    if (modalAdicionarEl) {
        const formAdicionar = document.getElementById('formAdicionar');
        const modalTitle = document.getElementById('modalAdicionarLabel');
        const submitButton = document.getElementById('btnSubmitAdicionar');


        const selectOS = document.getElementById('osId');
        const selectPrestador = document.getElementById('prestadorId');
        const selectEtapaGeral = document.getElementById('etapaGeralSelect');
        const selectEtapaDetalhada = document.getElementById('etapaDetalhadaId');
        const selectStatus = document.getElementById('status');
        let todasAsOS = [];
        let todasAsEtapas = [];

        selectOS.addEventListener('change', async (e) => {
            const osId = e.target.value;
            // Pega os elementos do DOM para o container e o select da LPU
            const lpuContainer = document.getElementById('lpuContainer');
            const selectLPU = document.getElementById('lpuId');

            // Se o usuário desmarcar a OS, esconde o campo de LPU
            if (!osId) {
                lpuContainer.classList.add('d-none');
                return;
            }

            try {
                // Mostra um "carregando" (opcional, mas bom para UX)
                selectLPU.innerHTML = '<option>Carregando LPUs...</option>';
                selectLPU.disabled = true;
                lpuContainer.classList.remove('d-none'); // Mostra o container

                // Busca as LPUs para a OS selecionada
                const response = await fetch(`http://localhost:8080/os/${osId}/lpus`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar LPUs para esta OS.');
                }

                const lpus = await response.json();

                // Limpa o select e prepara para novas opções
                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a LPU...</option>';

                if (lpus && lpus.length > 0) {
                    // Popula o select com as LPUs encontradas
                    lpus.forEach(lpu => {
                        // Usamos o formato "CÓDIGO - NOME" para o texto da opção
                        const option = new Option(`${lpu.codigo} - ${lpu.nome}`, lpu.id);
                        selectLPU.add(option);
                    });
                    selectLPU.disabled = false;
                } else {
                    // Caso não encontre nenhuma LPU
                    selectLPU.innerHTML = '<option value="" disabled>Nenhuma LPU encontrada para esta OS</option>';
                    selectLPU.disabled = true;
                }

            } catch (error) {
                mostrarToast(error.message, 'error');
                lpuContainer.classList.add('d-none'); // Esconde se der erro
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

        function preencherCamposOS(osId) {
            const osSelecionada = todasAsOS.find(os => os.id == osId);
            if (osSelecionada) {
                document.getElementById('site').value = osSelecionada.site || '';
                document.getElementById('segmento').value = osSelecionada.segmento ? osSelecionada.segmento.nome : '';
                document.getElementById('projeto').value = osSelecionada.projeto || '';
                document.getElementById('contrato').value = osSelecionada.contrato || '';
                document.getElementById('gestorTim').value = osSelecionada.gestorTim || '';
                document.getElementById('regional').value = osSelecionada.regional || '';
            }
        }

        async function popularDropdownsDependentes(etapaGeralId, etapaDetalhadaId) {
            // Lógica para popular a Etapa Detalhada (continua igual)
            const etapaSelecionada = todasAsEtapas.find(etapa => etapa.id == etapaGeralId);
            selectEtapaDetalhada.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectEtapaDetalhada.disabled = true;

            if (etapaSelecionada && etapaSelecionada.etapasDetalhadas.length > 0) {
                etapaSelecionada.etapasDetalhadas.forEach(detalhe => {
                    selectEtapaDetalhada.add(new Option(`${detalhe.indice} - ${detalhe.nome}`, detalhe.id));
                });
                selectEtapaDetalhada.disabled = false;
                // Se um ID já veio pré-selecionado (modo edição), seleciona ele
                if (etapaDetalhadaId) {
                    selectEtapaDetalhada.value = etapaDetalhadaId;
                }
            }

            // --- INÍCIO DA CORREÇÃO ---
            // Lógica para popular o Status, agora de forma mais segura

            selectStatus.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectStatus.disabled = true;

            if (etapaDetalhadaId) {
                let statusDaEtapa = [];
                // Procura em todas as etapas gerais pela etapa detalhada com o ID correto
                for (const etapaGeral of todasAsEtapas) {
                    const etapaEncontrada = etapaGeral.etapasDetalhadas.find(detalhe => detalhe.id == etapaDetalhadaId);
                    if (etapaEncontrada) {
                        statusDaEtapa = etapaEncontrada.status || [];
                        break; // Para a busca quando encontrar
                    }
                }

                // Se encontrou uma lista de status, popula o select
                if (statusDaEtapa.length > 0) {
                    statusDaEtapa.forEach(status => {
                        selectStatus.add(new Option(status, status));
                    });
                    selectStatus.disabled = false;
                }
            }
            // --- FIM DA CORREÇÃO ---
        }

        async function carregarDadosParaModal() {
            // Busca na API só acontece uma vez para otimizar
            if (todasAsOS.length === 0) {
                try {
                    // --- INÍCIO DA ALTERAÇÃO ---
                    const usuarioId = localStorage.getItem('usuarioId'); // Pega o ID do usuário logado
                    if (!usuarioId) {
                        throw new Error('ID do usuário não encontrado no localStorage.');
                    }

                    // Chama o novo endpoint filtrado
                    const response = await fetch(`http://localhost:8080/os/por-usuario/${usuarioId}`);
                    // --- FIM DA ALTERAÇÃO ---

                    if (!response.ok) throw new Error('Falha ao carregar Ordens de Serviço.');
                    const osData = await response.json();

                    // O resto da função continua igual...
                    const osUnicas = [...new Map(osData.map(os => [os.id, os])).values()];
                    todasAsOS = osUnicas.sort((a, b) => a.os.localeCompare(b.os));

                    selectOS.innerHTML = `<option value="" selected disabled>Selecione...</option>`;

                    todasAsOS.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = item.os;
                        selectOS.appendChild(option);
                    });

                } catch (error) {
                    console.error('Erro ao popular o select de OS:', error);
                    selectOS.innerHTML = `<option value="" selected disabled>Erro ao carregar OS</option>`;
                }
            }
            if (selectPrestador.options.length <= 1) {
                await popularSelect(selectPrestador, 'http://localhost:8080/index/prestadores', 'id', (item) => `${item.codigoPrestador} - ${item.prestador}`);
            }
            if (todasAsEtapas.length === 0) {
                todasAsEtapas = await popularSelect(selectEtapaGeral, 'http://localhost:8080/index/etapas', 'id', (item) => `${item.codigo} - ${item.nome}`);
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

        modalAdicionarEl.addEventListener('show.bs.modal', async () => {
            // Se o modal não foi acionado por um botão de edição (ou seja, se é um NOVO lançamento)
            await carregarDadosParaModal();

            if (!formAdicionar.dataset.editingId) {
                modalTitle.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar Nova Atividade';

                // --- INÍCIO DA CORREÇÃO ---
                document.getElementById('btnSubmitAdicionar').style.display = 'inline-block';
                document.getElementById('btnSalvarRascunho').style.display = 'none';
                document.getElementById('btnSalvarEEnviar').style.display = 'none';
                // --- FIM DA CORREÇÃO ---

                submitButton.innerHTML = '<i class="bi bi-check-circle"></i> Salvar Lançamento';
                document.getElementById('osId').disabled = false;
                document.getElementById('dataAtividade').disabled = false;
            }
        });

        modalAdicionarEl.addEventListener('hidden.bs.modal', () => {
            formAdicionar.reset();
            delete formAdicionar.dataset.editingId;

            const selectEtapaDetalhada = document.getElementById('etapaDetalhadaId');
            const selectStatus = document.getElementById('status');

            selectEtapaDetalhada.innerHTML = '<option value="" selected disabled>Primeiro, selecione a etapa geral</option>';
            selectEtapaDetalhada.disabled = true;
            selectStatus.innerHTML = '<option value="" selected disabled>Primeiro, selecione a etapa detalhada</option>';
            selectStatus.disabled = true;
            document.getElementById('osId').disabled = false;
            document.getElementById('lpuContainer').classList.add('d-none');
            document.getElementById('lpuId').innerHTML = '';
        });

        document.body.addEventListener('click', async (e) => {
            const reenviarBtn = e.target.closest('.btn-reenviar, .btn-editar-rascunho, .btn-retomar');
            const comentariosBtn = e.target.closest('.btn-ver-comentarios');
            const submeterBtn = e.target.closest('.btn-submeter-agora');

            if (reenviarBtn) { // Botões que abrem o modal de edição/criação
                const originalContent = reenviarBtn.innerHTML;
                try {
                    reenviarBtn.disabled = true;
                    reenviarBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

                    const lancamentoId = reenviarBtn.dataset.id;
                    const lancamento = todosLancamentos.find(l => l.id == lancamentoId);

                    if (lancamento) {
                        // --- INÍCIO DA CORREÇÃO ---
                        // Verifica se o botão é de 'retomar'. Se for, não há ID de edição (será um novo lançamento).
                        // Caso contrário, passamos o ID do lançamento que será editado.
                        const isRetomar = reenviarBtn.classList.contains('btn-retomar');
                        await abrirModalParaEdicao(lancamento, isRetomar ? null : lancamento.id);
                        // --- FIM DA CORREÇÃO ---
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

                // Pega o botão de confirmação do novo modal
                const btnConfirmar = document.getElementById('btnConfirmarSubmissao');

                // Guarda o ID do lançamento no botão de confirmação para usá-lo depois
                btnConfirmar.dataset.lancamentoId = lancamentoId;

                // Abre o modal de confirmação
                const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmarSubmissao'));
                modalConfirmacao.show();
            }
        });

        async function carregarEPopularLPU(osId) {
            const lpuContainer = document.getElementById('lpuContainer');
            const selectLPU = document.getElementById('lpuId');

            if (!osId) {
                lpuContainer.classList.add('d-none');
                selectLPU.innerHTML = '';
                return;
            }

            try {
                selectLPU.innerHTML = '<option>Carregando LPUs...</option>';
                selectLPU.disabled = true;
                lpuContainer.classList.remove('d-none');

                const response = await fetch(`http://localhost:8080/os/${osId}/lpus`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar LPUs para esta OS.');
                }

                const lpus = await response.json();

                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a LPU...</option>';

                if (lpus && lpus.length > 0) {
                    lpus.forEach(lpu => {
                        // --- INÍCIO DA CORREÇÃO ---
                        // Ajustamos para usar as propriedades corretas: lpu.codigoLpu e lpu.nomeLpu
                        const option = new Option(`${lpu.codigoLpu} - ${lpu.nomeLpu}`, lpu.id);
                        // --- FIM DA CORREÇÃO ---
                        selectLPU.add(option);
                    });
                    selectLPU.disabled = false;
                } else {
                    selectLPU.innerHTML = '<option value="" disabled>Nenhuma LPU encontrada</option>';
                    selectLPU.disabled = true;
                }

            } catch (error) {
                mostrarToast(error.message, 'error');
                lpuContainer.classList.add('d-none');
            }
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

        selectOS.addEventListener('change', async (e) => {
            const osId = e.target.value;
            preencherCamposOS(osId); // Função que você já tem, para preencher site, segmento, etc.

            const lpuContainer = document.getElementById('lpuContainer');
            const selectLPU = document.getElementById('lpuId');

            if (!osId) {
                lpuContainer.classList.add('d-none');
                return;
            }

            try {
                const response = await fetch(`http://localhost:8080/os/${osId}/lpus`);
                if (!response.ok) throw new Error('Falha ao buscar LPUs para esta OS.');

                const lpus = await response.json();

                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a LPU...</option>';
                if (lpus && lpus.length > 0) {
                    lpus.forEach(lpu => {
                        const option = new Option(`${lpu.codigoLpu} - ${lpu.nomeLpu}`, lpu.id);
                        selectLPU.add(option);
                    });
                    selectLPU.disabled = false;
                } else {
                    selectLPU.innerHTML = '<option value="" disabled>Nenhuma LPU encontrada para esta OS</option>';
                    selectLPU.disabled = true;
                }
                lpuContainer.classList.remove('d-none'); // Mostra o campo de LPU

            } catch (error) {
                mostrarToast(error.message, 'error');
                lpuContainer.classList.add('d-none'); // Esconde se der erro
            }
        });

        function formatarDataParaAPI(dataString) {
            if (!dataString) return null; // Se não houver data, retorna nulo

            const partes = dataString.split('/'); // Ex: "31/07/2025" -> ["31", "07", "2025"]
            if (partes.length !== 3) return null; // Retorna nulo se o formato for inválido

            // Remonta a string no formato AAAA-MM-DD
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }

        // Função central para lidar com o envio do formulário, chamada por diferentes botões
        async function handleFormSubmit(acao, submitButton) {
            const editingId = formAdicionar.dataset.editingId;

            // Lógica de "carregando..." no botão que foi clicado
            const originalContent = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Carregando...`;

            const dadosParaEnviar = {
                managerId: localStorage.getItem('usuarioId'),
                osId: document.getElementById('osId').value,
                lpuId: document.getElementById('lpuId').value,
                dataAtividade: formatarDataParaAPI(document.getElementById('dataAtividade').value), // <== MODIFICADO
                prestadorId: document.getElementById('prestadorId').value,
                etapaDetalhadaId: document.getElementById('etapaDetalhadaId').value,
                equipe: document.getElementById('equipe').value,
                vistoria: document.getElementById('vistoria').value,
                planoVistoria: formatarDataParaAPI(document.getElementById('planoVistoria').value), // <== MODIFICADO
                desmobilizacao: document.getElementById('desmobilizacao').value,
                planoDesmobilizacao: formatarDataParaAPI(document.getElementById('planoDesmobilizacao').value), // <== MODIFICADO
                instalacao: document.getElementById('instalacao').value,
                planoInstalacao: formatarDataParaAPI(document.getElementById('planoInstalacao').value), // <== MODIFICADO
                ativacao: document.getElementById('ativacao').value,
                planoAtivacao: formatarDataParaAPI(document.getElementById('planoAtivacao').value), // <== MODIFICADO
                documentacao: document.getElementById('documentacao').value,
                planoDocumentacao: formatarDataParaAPI(document.getElementById('planoDocumentacao').value), // <== MODIFICADO
                status: document.getElementById('status').value,
                situacao: document.getElementById('situacao').value,
                detalheDiario: document.getElementById('detalheDiario').value,
                valor: parseFloat(document.getElementById('valor').value.replace(/\./g, '').replace(',', '.')) || 0,
            };

            // Define o status de aprovação e o método HTTP com base na ação
            let method = 'POST';
            let url = 'http://localhost:8080/lancamentos';

            if (acao === 'salvar') { // Salvar alterações de um Rascunho
                dadosParaEnviar.situacaoAprovacao = 'RASCUNHO';
                method = 'PUT';
                url = `http://localhost:8080/lancamentos/${editingId}`;
            } else if (acao === 'enviar') { // Salvar e Enviar um Rascunho
                dadosParaEnviar.situacaoAprovacao = 'PENDENTE_COORDENADOR';
                method = 'PUT';
                url = `http://localhost:8080/lancamentos/${editingId}`;
            } else if (acao === 'reenviar') { // Reenviar um item Rejeitado
                dadosParaEnviar.situacaoAprovacao = 'PENDENTE_COORDENADOR';
                method = 'PUT';
                url = `http://localhost:8080/lancamentos/${editingId}`;
            }
            // Se a acao for 'criar' (Retomar ou Novo), o método e URL padrão são usados

            try {
                const resposta = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosParaEnviar)
                });
                if (!resposta.ok) throw new Error((await resposta.json()).message || 'Erro ao salvar.');

                mostrarToast('Ação realizada com sucesso!', 'success');
                modalAdicionar.hide();
                await carregarLancamentos();
                renderizarTodasAsTabelas();

            } catch (erro) {
                mostrarToast(erro.message, 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent;
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



        selectOS.addEventListener('change', (e) => {
            carregarEPopularLPU(e.target.value);
        });
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

        // Evento para carregar LPUs quando uma OS é selecionada
        selectOS.addEventListener('change', async (e) => {
            const osId = e.target.value;
            selectLPU.disabled = true; // Mantém desabilitado enquanto carrega
            selectLPU.innerHTML = '<option>Carregando LPUs...</option>';

            // Se o usuário deselecionar a OS, reseta e desabilita o campo de LPU
            if (!osId) {
                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a OS primeiro...</option>';
                return;
            }

            try {
                const response = await fetch(`http://localhost:8080/os/${osId}/lpus`);
                const lpus = await response.json();
                selectLPU.innerHTML = '<option value="" selected disabled>Selecione a LPU...</option>';

                if (lpus && lpus.length > 0) {
                    lpus.forEach(lpu => {
                        const option = new Option(`${lpu.codigoLpu} - ${lpu.nomeLpu}`, lpu.id);
                        selectLPU.add(option);
                    });
                    // SÓ HABILITA SE ENCONTRAR LPUs
                    selectLPU.disabled = false;
                } else {
                    selectLPU.innerHTML = '<option value="" disabled>Nenhuma LPU encontrada</option>';
                }

            } catch (error) {
                console.error("Erro ao buscar LPUs:", error);
                selectLPU.innerHTML = '<option value="">Erro ao carregar</option>';
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
    window.carregarLancamentos = carregarLancamentos;
}); td.innerHTML = `<div class="btn-group" role="group">${buttonsHtml}</div>`;