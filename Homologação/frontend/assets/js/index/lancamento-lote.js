document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleciona todos os elementos do modal "Adicionar em Lote"
    const modalAdicionarEmLote = document.getElementById('modalAdicionarEmLote');
    if (!modalAdicionarEmLote) {
        // Se o modal não existe na página, não faz nada para evitar erros.
        return;
    }

    const formAdicionarEmLote = document.getElementById('formAdicionarEmLote');
    const selectOSLote = document.getElementById('osIdLote');
    const selectProjetoLote = document.getElementById('projetoIdLote');
    const lpuChecklistContainerLote = document.getElementById('lpuChecklistContainerLote');
    const btnAvancarParaPreenchimentoLote = document.getElementById('btnAvancarParaPreenchimentoLote');
    const formulariosContainerLote = document.getElementById('formulariosContainerLote');

    // Botões do rodapé do modal
    const btnSubmitAdicionarLote = document.getElementById('btnSubmitAdicionarLote');
    const btnSalvarRascunhoLote = document.getElementById('btnSalvarRascunhoLote');
    const btnSalvarEEnviarLote = document.getElementById('btnSalvarEEnviarLote');

    // Variáveis de cache para evitar múltiplas chamadas à API
    let todasAsEtapasLote = [];
    let todosOsPrestadoresLote = [];
    let todasAsOSLote = [];


    function inicializarFlatpickrComFormato(selector) {
        // Verifica se a biblioteca flatpickr está disponível
        if (typeof flatpickr === 'function') {
            flatpickr(selector, {
                locale: 'pt', // Usa a tradução para português
                dateFormat: 'd/m/Y', // Formato de data visível: 31/12/2025
                allowInput: true, // Permite que o usuário digite a data
                onOpen: function (selectedDates, dateStr, instance) {
                    // Limpa a data selecionada toda vez que o calendário é aberto
                    // se o campo de input estiver vazio.
                    if (instance.input.value === '') {
                        instance.clear();
                    }
                }
            });
        }
    }


    // ==========================================================
    // LÓGICA DO MODAL
    // ==========================================================

    // Evento disparado sempre que o modal de lote for aberto
    modalAdicionarEmLote.addEventListener('show.bs.modal', async () => {
        // Reseta o formulário para um estado limpo
        formAdicionarEmLote.reset();
        lpuChecklistContainerLote.innerHTML = '<p class="text-muted">Selecione uma OS para ver as LPUs.</p>';
        formulariosContainerLote.innerHTML = '';
        btnAvancarParaPreenchimentoLote.disabled = true;

        // NOVO: Inicializa o flatpickr no campo de data principal do lote
        inicializarFlatpickrComFormato('#dataAtividadeLote');

        // Pré-carrega a lista de Ordens de Serviço
        await carregarProjetosEOSParaSelectLote();
    });

    // Função para carregar as OSs do usuário no select
    async function carregarProjetosEOSParaSelectLote() {
        try {
            const usuarioId = localStorage.getItem('usuarioId');
            if (!usuarioId) throw new Error('ID do usuário não encontrado.');

            const response = await fetch(`http://localhost:8080/os/por-usuario/${usuarioId}`);
            if (!response.ok) throw new Error('Falha ao carregar Ordens de Serviço.');

            const osData = await response.json();
            todasAsOSLote = osData;

            // Pega todos os projetos unicos
            const projetos = [...new Set(osData.map(item => item.projeto))];

            selectProjetoLote.innerHTML = `<option value="" selected disabled>Selecione um Projeto...</option>`;
            projetos.forEach(projeto => {
                const option = new Option(projeto, projeto);
                selectProjetoLote.add(option);
            });

            selectOSLote.innerHTML = `<option value="" selected disabled>Selecione uma OS...</option>`;
            todasAsOSLote.forEach(item => {
                const option = new Option(item.os, item.id);
                selectOSLote.add(option);
            });

        } catch (error) {
            console.error('Erro ao carregar OSs:', error);
            if (typeof mostrarToast === 'function') {
                mostrarToast('Erro ao carregar Ordens de Serviço.', 'error');
            }
        }
    }

    function preencherCamposOSLote(osData) {
        const siteInput = document.getElementById('siteLote');
        const segmentoInput = document.getElementById('segmentoLote');
        const projetoInput = document.getElementById('projetoLote');
        const contratoInput = document.getElementById('contratoLote');
        const gestorTimInput = document.getElementById('gestorTimLote');
        const regionalInput = document.getElementById('regionalLote');

        if (osData) {
            // Pega os dados que ainda são da OS principal
            segmentoInput.value = osData.segmento ? osData.segmento.nome : '';
            projetoInput.value = osData.projeto || '';
            gestorTimInput.value = osData.gestorTim || '';

            // Pega os dados do primeiro detalhe (OsLpuDetalhe)
            const primeiroDetalhe = osData.detalhes && osData.detalhes.length > 0 ? osData.detalhes[0] : {};
            siteInput.value = primeiroDetalhe.site || '';
            contratoInput.value = primeiroDetalhe.contrato || '';
            regionalInput.value = primeiroDetalhe.regional || '';
        } else {
            // Limpa todos os campos se não houver dados
            siteInput.value = '';
            segmentoInput.value = '';
            projetoInput.value = '';
            contratoInput.value = '';
            gestorTimInput.value = '';
            regionalInput.value = '';
        }
    }

    selectProjetoLote.addEventListener('change', async (e) => {
        const projeto = e.target.value;
        const os = todasAsOSLote.find(os => os.projeto === projeto);
        if (os) {
            selectOSLote.value = os.id;
            selectOSLote.dispatchEvent(new Event('change'));
        }
    });

    // 🔥 ========================================================== 🔥
    // 🔥 PONTO CENTRAL DA CORREÇÃO NO LANÇAMENTO-LOTE.JS
    // 🔥 ========================================================== 🔥
    selectOSLote.addEventListener('change', async (e) => {
        const osId = e.target.value;
        const os = todasAsOSLote.find(os => os.id == osId);
        if (os) {
            selectProjetoLote.value = os.projeto;
        }

        formulariosContainerLote.innerHTML = '';
        btnAvancarParaPreenchimentoLote.disabled = true;

        if (!osId) {
            lpuChecklistContainerLote.innerHTML = '<p class="text-muted">Selecione uma OS para ver as LPUs.</p>';
            preencherCamposOSLote(null);
            return;
        }

        lpuChecklistContainerLote.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Carregando...</span></div>';
        preencherCamposOSLote(null);

        try {
            // Buscamos os detalhes completos da OS, que inclui a lista de LPUs
            const response = await fetch(`http://localhost:8080/os/${osId}`);
            if (!response.ok) throw new Error('Falha ao buscar dados da OS.');
            const osData = await response.json();

            preencherCamposOSLote(osData);

            // CORREÇÃO APLICADA AQUI: Trocamos 'osData.lpus' por 'osData.detalhes'
            const lpus = osData.detalhes || [];

            if (lpus.length === 0) {
                lpuChecklistContainerLote.innerHTML = '<p class="text-muted">Nenhuma LPU encontrada para esta OS.</p>';
            } else {
                lpuChecklistContainerLote.innerHTML = lpus.map(item => { // 'item' é o objeto OsLpuDetalhe
                    const lpu = item.lpu;
                    if (!lpu) return '';

                    const codigo = lpu.codigo ?? lpu.codigoLpu ?? '';
                    const nome = lpu.nome ?? lpu.nomeLpu ?? '';
                    const label = `${codigo}${codigo && nome ? ' - ' : ''}${nome}`;

                    return `
                    <div class="form-check">
                        <input class="form-check-input lpu-checkbox" type="checkbox" 
                            value="${lpu.id}" 
                            data-os-lpu-detalhe-id="${item.id}" 
                            id="lpu-lote-${lpu.id}" data-nome="${label}">
                        <label class="form-check-label" for="lpu-lote-${lpu.id}">
                            ${label}
                        </label>
                    </div>
                `;
                }).join('');
            }
        } catch (error) {
            console.error("Erro ao carregar dados da OS:", error);
            lpuChecklistContainerLote.innerHTML = '<p class="text-danger">Erro ao carregar dados.</p>';
            preencherCamposOSLote(null);
        }
    });


    // 3. Evento de mudança nos checkboxes de LPU para habilitar o botão "Avançar"
    lpuChecklistContainerLote.addEventListener('change', (e) => {
        if (e.target.classList.contains('lpu-checkbox')) {
            const algumCheckboxMarcado = lpuChecklistContainerLote.querySelector('.lpu-checkbox:checked');
            btnAvancarParaPreenchimentoLote.disabled = !algumCheckboxMarcado;
        }
    });


    // 4. Evento de clique no botão "Avançar" para gerar o acordeão
    btnAvancarParaPreenchimentoLote.addEventListener('click', async () => {
        const lpusSelecionadas = document.querySelectorAll('#lpuChecklistContainerLote .lpu-checkbox:checked');
        if (lpusSelecionadas.length === 0) return;

        formulariosContainerLote.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"><span class="visually-hidden">Gerando formulários...</span></div></div>';

        try {
            if (todasAsEtapasLote.length === 0) {
                todasAsEtapasLote = await fetch('http://localhost:8080/index/etapas').then(res => res.json());
            }
            if (todosOsPrestadoresLote.length === 0) {
                todosOsPrestadoresLote = await fetch('http://localhost:8080/index/prestadores/ativos').then(res => res.json());
            }

            formulariosContainerLote.innerHTML = Array.from(lpusSelecionadas).map((checkbox, index) => {
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
                                    <input type="text" class="form-control flatpickr-date-lote" id="planoVistoria-lpu-${lpuId}" placeholder="dd/mm/aaaa">
                                </div>
                                <div class="card etapa-card">
                                    <h6>Desmobilização</h6>
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="desmobilizacao-lpu-${lpuId}">
                                        <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                    </select>
                                    <label class="form-label mt-2">Plano (Data)</label>
                                    <input type="text" class="form-control flatpickr-date-lote" id="planoDesmobilizacao-lpu-${lpuId}" placeholder="dd/mm/aaaa">
                                </div>
                                <div class="card etapa-card">
                                    <h6>Instalação</h6>
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="instalacao-lpu-${lpuId}">
                                        <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                    </select>
                                    <label class="form-label mt-2">Plano (Data)</label>
                                    <input type="text" class="form-control flatpickr-date-lote" id="planoInstalacao-lpu-${lpuId}" placeholder="dd/mm/aaaa">
                                </div>
                                <div class="card etapa-card">
                                    <h6>Ativação</h6>
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="ativacao-lpu-${lpuId}">
                                        <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                    </select>
                                    <label class="form-label mt-2">Plano (Data)</label>
                                    <input type="text" class="form-control flatpickr-date-lote" id="planoAtivacao-lpu-${lpuId}" placeholder="dd/mm/aaaa">
                                </div>
                                <div class="card etapa-card">
                                    <h6>Documentação</h6>
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="documentacao-lpu-${lpuId}">
                                        <option>OK</option> <option>NOK</option> <option selected>N/A</option>
                                    </select>
                                    <label class="form-label mt-2">Plano (Data)</label>
                                    <input type="text" class="form-control flatpickr-date-lote" id="planoDocumentacao-lpu-${lpuId}" placeholder="dd/mm/aaaa">
                                </div>
                            </div>
                            <h6 class="section-title">Etapas</h6>
                            <div class="row g-3 mb-3">
                                <div class="col-md-4">
                                    <label for="etapaGeral-lpu-${lpuId}" class="form-label">ETAPA GERAL</label>
                                    <select class="form-select etapa-geral-select" id="etapaGeral-lpu-${lpuId}" data-lpu-id="${lpuId}" required>
                                        <option value="" selected disabled>Selecione...</option>
                                        </select>
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
                                <textarea class="form-control" id="detalheDiario-lpu-${lpuId}" rows="2" required placeholder="Descreva o detalhe diário aqui..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="situacao-lpu-${lpuId}" class="form-label">SITUAÇÃO</label>
                                <select class="form-select" id="situacao-lpu-${lpuId}">
                                    <option value="" selected disabled>Selecione a situação...</option>
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
                                    <select class="form-select" id="prestadorId-lpu-${lpuId}" required>
                                        <option value="" selected disabled>Selecione o prestador...</option>
                                        </select>
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

            lpusSelecionadas.forEach(checkbox => {
                const lpuId = checkbox.value;
                const selectPrestador = document.getElementById(`prestadorId-lpu-${lpuId}`);
                if (selectPrestador) todosOsPrestadoresLote.forEach(p => selectPrestador.add(new Option(`${p.codigoPrestador} - ${p.prestador}`, p.id)));

                const selectEtapaGeral = document.getElementById(`etapaGeral-lpu-${lpuId}`);
                if (selectEtapaGeral) todasAsEtapasLote.forEach(e => selectEtapaGeral.add(new Option(`${e.codigo} - ${e.nome}`, e.id)));
            });

            inicializarFlatpickrComFormato('.flatpickr-date-lote');

        } catch (error) {
            console.error("Erro ao gerar formulários:", error);
            formulariosContainerLote.innerHTML = '<p class="text-danger text-center">Ocorreu um erro ao gerar os formulários. Tente novamente.</p>';
        }
    });


    // 5. Adiciona listeners para os selects dinâmicos (cascading dropdowns)
    formulariosContainerLote.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('etapa-geral-select')) {
            const lpuId = target.dataset.lpuId;
            const etapaGeralId = target.value;
            const selectDetalhada = document.getElementById(`etapaDetalhadaId-lpu-${lpuId}`);
            const selectStatus = document.getElementById(`status-lpu-${lpuId}`);

            const etapaSelecionada = todasAsEtapasLote.find(etapa => etapa.id == etapaGeralId);

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
        if (target.classList.contains('etapa-detalhada-select')) {
            const accordionBody = target.closest('.accordion-body');
            const lpuId = accordionBody.querySelector('.etapa-geral-select').dataset.lpuId;
            const etapaGeralId = accordionBody.querySelector('.etapa-geral-select').value;
            const etapaDetalhadaId = target.value;
            const selectStatus = document.getElementById(`status-lpu-${lpuId}`);

            const etapaGeral = todasAsEtapasLote.find(e => e.id == etapaGeralId);
            const etapaDetalhada = etapaGeral?.etapasDetalhadas.find(ed => ed.id == etapaDetalhadaId);

            selectStatus.innerHTML = '<option value="" selected disabled>Selecione...</option>';
            selectStatus.disabled = true;

            if (etapaDetalhada && etapaDetalhada.status.length > 0) {
                etapaDetalhada.status.forEach(status => selectStatus.add(new Option(status, status)));
                selectStatus.disabled = false;
            }
        }
    });

    function formatarDataParaAPI(dataString) {
        if (!dataString) return null;
        if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dataString;
        }
        if (dataString.includes('/')) {
            const [dia, mes, ano] = dataString.split('/');
            if (dia && mes && ano) {
                return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }
        }
        return null;
    }

    async function handleFormSubmitLote(acao, submitButton) {
        if (!formAdicionarEmLote.checkValidity()) {
            formAdicionarEmLote.classList.add('was-validated');
            if (typeof mostrarToast === 'function') mostrarToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const originalContent = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

        try {
            const lpusSelecionadas = document.querySelectorAll('#lpuChecklistContainerLote .lpu-checkbox:checked');
            if (lpusSelecionadas.length === 0) throw new Error("Nenhuma LPU foi selecionada para o lançamento.");

            const lancamentosEmLote = [];
            const osId = selectOSLote.value;
            const dataAtividade = document.getElementById('dataAtividadeLote').value;

            if (!dataAtividade) throw new Error('A Data da Atividade é obrigatória.');

            for (const checkbox of lpusSelecionadas) {
                const lpuId = checkbox.value;
                const osLpuDetalheId = checkbox.dataset.osLpuDetalheId;

                const dadosLpu = {
                    managerId: localStorage.getItem('usuarioId'),
                    osId: osId,
                    lpuId: lpuId,
                    osLpuDetalheId: osLpuDetalheId, // <-- INCLUSÃO NO PAYLOAD
                    dataAtividade: formatarDataParaAPI(dataAtividade),
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
                    etapaDetalhadaId: document.getElementById(`etapaDetalhadaId-lpu-${lpuId}`).value,
                    status: document.getElementById(`status-lpu-${lpuId}`).value,
                    situacao: document.getElementById(`situacao-lpu-${lpuId}`).value,
                    detalheDiario: document.getElementById(`detalheDiario-lpu-${lpuId}`).value,
                    prestadorId: document.getElementById(`prestadorId-lpu-${lpuId}`).value,
                    valor: parseFloat(document.getElementById(`valor-lpu-${lpuId}`).value.replace(/\./g, '').replace(',', '.')) || 0,
                };
                if (acao === 'salvarRascunho') {
                    dadosLpu.situacaoAprovacao = 'RASCUNHO';
                } else if (acao === 'enviar') {
                    dadosLpu.situacaoAprovacao = 'PENDENTE_COORDENADOR';
                }

                lancamentosEmLote.push(dadosLpu);
            }

            const response = await fetch('http://localhost:8080/lancamentos/lote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lancamentosEmLote)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar lançamentos em lote.');
            }

            if (typeof mostrarToast === 'function') mostrarToast('Lançamentos(s) salvo(s) com sucesso!', 'success');
            bootstrap.Modal.getInstance(modalAdicionarEmLote).hide();
            await carregarLancamentos();

        } catch (error) {
            if (typeof mostrarToast === 'function') mostrarToast(error.message, 'error');
            console.error("Erro na submissão em lote:", error);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalContent;
        }
    }

    if (btnSubmitAdicionarLote) {
        btnSubmitAdicionarLote.addEventListener('click', (e) => {
            e.preventDefault();
            handleFormSubmitLote('enviar', e.currentTarget);
        });
    }
    if (btnSalvarRascunhoLote) {
        btnSalvarRascunhoLote.addEventListener('click', (e) => {
            e.preventDefault();
            handleFormSubmitLote('salvarRascunho', e.currentTarget);
        });
    }
    if (btnSalvarEEnviarLote) {
        btnSalvarEEnviarLote.addEventListener('click', (e) => {
            e.preventDefault();
            handleFormSubmitLote('enviar', e.currentTarget);
        });
    }
});