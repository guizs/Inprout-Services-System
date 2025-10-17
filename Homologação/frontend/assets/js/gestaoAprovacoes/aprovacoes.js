// ==========================================================
// FUNÇÕES GLOBAIS PARA ABRIR MODAIS
// ==========================================================
const modalAprovar = document.getElementById('modalAprovarLancamento') ? new bootstrap.Modal(document.getElementById('modalAprovarLancamento')) : null;
const modalComentar = document.getElementById('modalComentarPrazo') ? new bootstrap.Modal(document.getElementById('modalComentarPrazo')) : null;
const modalEditar = document.getElementById('modalEditarLancamento') ? new bootstrap.Modal(document.getElementById('modalEditarLancamento')) : null;
const modalRecusar = document.getElementById('modalRecusarLancamento') ? new bootstrap.Modal(document.getElementById('modalRecusarLancamento')) : null;
const modalComentarios = document.getElementById('modalComentarios') ? new bootstrap.Modal(document.getElementById('modalComentarios')) : null;
const modalAprovarMaterial = document.getElementById('modalAprovarMaterial') ? new bootstrap.Modal(document.getElementById('modalAprovarMaterial')) : null;
const modalRecusarMaterial = document.getElementById('modalRecusarMaterial') ? new bootstrap.Modal(document.getElementById('modalRecusarMaterial')) : null;
let todosOsLancamentosGlobais = [];
const tbodyHistoricoMateriais = document.getElementById('tbody-historico-materiais');
const filtroSegmentoMateriais = document.getElementById('filtro-segmento-materiais');
const acoesLoteContainer = document.getElementById('acoes-lote-container');
const btnAprovarSelecionados = document.getElementById('btn-aprovar-selecionados');
const contadorSelecionados = document.getElementById('contador-selecionados');
const contadorAprovacao = document.getElementById('contador-aprovacao');
const btnRecusarSelecionados = document.getElementById('btn-recusar-selecionados');
const contadorRecusa = document.getElementById('contador-recusa');
const btnSolicitarPrazo = document.getElementById('btn-solicitar-prazo-selecionados');
const contadorPrazo = document.getElementById('contador-prazo');
const filtroHistoricoStatus = document.getElementById('filtro-historico-status');
let todasPendenciasMateriais = [];
let todosHistoricoMateriais = [];
const API_BASE_URL = 'https://www.inproutservices.com.br/api';

// Funções para abrir modais (sem alterações)
function aprovarLancamento(id) {
    if (!modalAprovar) return;
    document.getElementById('aprovarLancamentoId').value = id;
    modalAprovar.show();
}

function comentarLancamento(id) {
    if (!modalComentar) return;
    document.getElementById('comentarLancamentoId').value = id;
    document.getElementById('formComentarPrazo').reset();
    modalComentar.show();
}

function recusarLancamento(id) {
    if (!modalRecusar) return;
    document.getElementById('recusarLancamentoId').value = id;
    document.getElementById('formRecusarLancamento').reset();
    modalRecusar.show();
}

function toggleLoader(ativo = true) {
    const overlay = document.getElementById("overlay-loader");
    if (overlay) {
        overlay.classList.toggle("d-none", !ativo);
    }
}

function aprovarMaterial(id) {
    if (!modalAprovarMaterial) return;
    const btnConfirmar = document.getElementById('btnConfirmarAprovacaoMaterial');
    btnConfirmar.dataset.id = id;
    modalAprovarMaterial.show();
}

function recusarMaterial(id) {
    if (!modalRecusarMaterial) return;
    const form = document.getElementById('formRecusarMaterial');
    form.dataset.id = id;
    form.reset();
    modalRecusarMaterial.show();
}

function verComentarios(id) {
    if (!modalComentarios) return;
    const lancamento = todosOsLancamentosGlobais.find(l => l.id == id);
    const modalBody = document.getElementById('modalComentariosBody');
    modalBody.innerHTML = '';

    if (!lancamento || !lancamento.comentarios || lancamento.comentarios.length === 0) {
        modalBody.innerHTML = '<p class="text-center text-muted">Nenhum comentário para este lançamento.</p>';
    } else {
        const comentariosOrdenados = [...lancamento.comentarios].sort((a, b) => parseDataBrasileira(b.dataHora) - parseDataBrasileira(a.dataHora));
        modalBody.innerHTML = comentariosOrdenados.map(comentario => `
            <div class="card mb-3">
                <div class="card-header bg-light d-flex justify-content-between align-items-center small">
                    <strong><i class="bi bi-person-circle me-2"></i>${comentario.autor.nome}</strong>
                    <span class="text-muted">${comentario.dataHora ? new Date(parseDataBrasileira(comentario.dataHora)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">${comentario.texto}</p>
                </div>
            </div>
        `).join('');
    }
    modalComentarios.show();
}

function parseDataBrasileira(dataString) {
    if (!dataString) return null;
    const [data, hora] = dataString.split(' ');
    const [dia, mes, ano] = data.split('/');
    return new Date(`${ano}-${mes}-${dia}T${hora || '00:00:00'}`);
}

function aprovarLancamentoController(id) {
    if (!modalAprovar) return;
    const modalBody = modalAprovar._element.querySelector('.modal-body');
    modalBody.innerHTML = `
        <input type="hidden" id="aprovarLancamentoId" value="${id}">
        <p>Você tem certeza que deseja aprovar este lançamento?</p>
        <p class="text-danger small"><b>Atenção:</b> Esta ação é final e o lançamento será concluído. Nenhuma outra alteração será possível.</p>
    `;
    modalAprovar.show();
}

function recusarLancamentoController(id) {
    recusarLancamento(id);
}

function aprovarPrazoController(id) {
    if (!modalAprovar) return;
    const modalBody = modalAprovar._element.querySelector('.modal-body');
    modalBody.innerHTML = `
        <input type="hidden" id="aprovarLancamentoId" value="${id}">
        <p>Aprovar a solicitação de novo prazo feita pelo coordenador?</p>
        <p class="text-muted small">O lançamento voltará para a fila do coordenador com a nova data.</p>
    `;
    modalAprovar.show();
}

function recusarPrazoController(id) {
    if (!modalComentar) return;
    document.getElementById('comentarLancamentoId').value = id;
    modalComentar.show();
    const modalTitle = modalComentar._element.querySelector('.modal-title');
    modalTitle.innerHTML = '<i class="bi bi-calendar-x-fill text-danger me-2"></i>Recusar/Estabelecer Novo Prazo';
    const comentarioLabel = modalComentar._element.querySelector('label[for="comentarioCoordenador"]');
    comentarioLabel.textContent = 'Motivo da Recusa / Comentário (Obrigatório)';
    const dataLabel = modalComentar._element.querySelector('label[for="novaDataProposta"]');
    dataLabel.textContent = 'Definir Novo Prazo (Obrigatório)';
}

// ==========================================================
// LÓGICA PRINCIPAL DA PÁGINA
// ==========================================================
document.addEventListener('DOMContentLoaded', function () {

    const toastElement = document.getElementById('toastMensagem');
    const toastBody = document.getElementById('toastTexto');
    const toast = toastElement ? new bootstrap.Toast(toastElement) : null;
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const userId = localStorage.getItem('usuarioId');
    const theadHistorico = document.getElementById('thead-historico');
    const tbodyHistorico = document.getElementById('tbody-historico');
    const tbodyPendentesMateriais = document.getElementById('tbody-pendentes-materiais');

    // --- INÍCIO DA CORREÇÃO ---
    // A variável 'colunas' agora é definida aqui, no escopo principal do DOMContentLoaded.
    const colunas = [
        "AÇÕES", "PRAZO AÇÃO", "STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE", "VALOR DA ATIVIDADE", "CONTRATO", "SEGMENTO", "PROJETO",
        "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE",
        "OBSERVAÇÕES", "DATA PO", "VISTORIA", "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DE DESMOBILIZAÇÃO",
        "INSTALAÇÃO", "PLANO DE INSTALAÇÃO", "ATIVAÇÃO", "PLANO DE ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DE DOCUMENTAÇÃO",
        "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "GESTOR"
    ];
    // --- FIM DA CORREÇÃO ---

    if (userRole === 'MANAGER') {
        const abaAprovacaoAtividades = document.getElementById('atividades-tab');
        const abaAprovacaoMateriais = document.getElementById('materiais-tab');
        const painelAprovacaoAtividades = document.getElementById('atividades-pane');
        const painelAprovacaoMateriais = document.getElementById('materiais-pane');

        if (abaAprovacaoAtividades) {
            abaAprovacaoAtividades.style.display = 'none';
            abaAprovacaoAtividades.classList.remove('active');
        }
        if (abaAprovacaoMateriais) abaAprovacaoMateriais.style.display = 'none';
        if (painelAprovacaoAtividades) painelAprovacaoAtividades.classList.remove('show', 'active');
        if (painelAprovacaoMateriais) painelAprovacaoMateriais.classList.remove('show', 'active');

        const abaHistoricoAtividades = document.getElementById('historico-atividades-tab');
        const painelHistoricoAtividades = document.getElementById('historico-atividades-pane');
        if (abaHistoricoAtividades) abaHistoricoAtividades.classList.add('active');
        if (painelHistoricoAtividades) painelHistoricoAtividades.classList.add('show', 'active');
    }

    const campoNovaData = document.getElementById('novaDataProposta');
    if (campoNovaData) {
        flatpickr(campoNovaData, { locale: "pt", dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", allowInput: false });
    }

    function mostrarToast(mensagem, tipo = 'success') {
        if (!toast || !toastBody) return;
        toastElement.classList.remove('text-bg-success', 'text-bg-danger');
        toastElement.classList.add(tipo === 'success' ? 'text-bg-success' : 'text-bg-danger');
        toastBody.textContent = mensagem;
        toast.show();
    }

    function setButtonLoading(button, isLoading) {
        if (!button) return;
        const spinner = button.querySelector('.spinner-border');
        button.disabled = isLoading;
        spinner?.classList.toggle('d-none', !isLoading);
    }

    function aplicarEstiloStatus(cell, statusText) {
        if (!statusText) return;
        cell.classList.add('status-cell');
        const statusUpper = statusText.toUpperCase();
        if (statusUpper === 'OK') cell.classList.add('status-ok');
        else if (statusUpper === 'NOK') cell.classList.add('status-nok');
        else if (statusUpper === 'N/A') cell.classList.add('status-na');
    }

    // --- NOVA FUNÇÃO DE RENDERIZAÇÃO DO ACORDEÃO ---
    function renderizarAcordeonPendencias(dados) {
        const accordionContainer = document.getElementById('accordion-pendencias');
        if (!accordionContainer) return;

        accordionContainer.innerHTML = '';

        if (!dados || dados.length === 0) {
            accordionContainer.innerHTML = `<div class="text-center p-4 text-muted">Nenhuma pendência encontrada para seu perfil.</div>`;
            return;
        }

        const agrupadoPorOS = dados.reduce((acc, lancamento) => {
            const osId = lancamento.os.id;
            if (!acc[osId]) {
                acc[osId] = {
                    id: osId,
                    os: lancamento.os.os,
                    projeto: lancamento.os.projeto,
                    totalOs: lancamento.totalOs,
                    valorCps: lancamento.valorCps,
                    valorPendente: lancamento.valorPendente,
                    custoTotalMateriais: lancamento.os.custoTotalMateriais,
                    linhas: []
                };
            }
            acc[osId].linhas.push(lancamento);
            return acc;
        }, {});

        const grupos = Object.values(agrupadoPorOS);
        const frag = document.createDocumentFragment();
        const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : '-';
        const formatarData = (data) => data ? data.split('-').reverse().join('/') : '-';

        const get = (obj, path, defaultValue = '-') => {
            const value = path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : undefined), obj);
            return value !== undefined ? value : defaultValue;
        };

        const colunas = [
            "AÇÕES", "PRAZO AÇÃO", "STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE",
            "VALOR DA ATIVIDADE", "VALOR TOTAL DO ITEM",
            "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM",
            "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "OBSERVAÇÕES", "DATA PO", "VISTORIA",
            "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DE DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO DE INSTALAÇÃO",
            "ATIVAÇÃO", "PLANO DE ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DE DOCUMENTAÇÃO", "ETAPA GERAL",
            "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "GESTOR"
        ];

        const dataMapping = {
            "AÇÕES": (lancamento) => {
                let acoesHtml = '';
                if (userRole === 'COORDINATOR') {
                    acoesHtml = `<div class="d-flex justify-content-center gap-1">
                                <button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarLancamento(${lancamento.id})"><i class="bi bi-check-lg"></i></button>
                                <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarLancamento(${lancamento.id})"><i class="bi bi-x-lg"></i></button>
                                <button class="btn btn-sm btn-outline-warning" title="Comentar/Solicitar Prazo" onclick="comentarLancamento(${lancamento.id})"><i class="bi bi-chat-left-text"></i></button>
                                <button class="btn btn-sm btn-outline-secondary" title="Ver Comentários" onclick="verComentarios(${lancamento.id})" ${!lancamento.comentarios || lancamento.comentarios.length === 0 ? 'disabled' : ''}><i class="bi bi-eye"></i></button>
                            </div>`;
                } else if (userRole === 'CONTROLLER') {
                    switch (lancamento.situacaoAprovacao) {
                        case 'PENDENTE_CONTROLLER':
                            acoesHtml = `<div class="d-flex justify-content-center gap-1">
                        <button class="btn btn-sm btn-outline-success" title="Aprovar Lançamento" onclick="aprovarLancamentoController(${lancamento.id})"><i class="bi bi-check-lg"></i></button>
                        <button class="btn btn-sm btn-outline-danger" title="Recusar Lançamento" onclick="recusarLancamentoController(${lancamento.id})"><i class="bi bi-x-lg"></i></button>
                         <button class="btn btn-sm btn-outline-secondary" title="Ver Comentários" onclick="verComentarios(${lancamento.id})" ${!lancamento.comentarios || lancamento.comentarios.length === 0 ? 'disabled' : ''}><i class="bi bi-eye"></i></button>
                    </div>`;
                            break;
                        case 'AGUARDANDO_EXTENSAO_PRAZO':
                        case 'PRAZO_VENCIDO':
                            acoesHtml = `<div class="d-flex justify-content-center gap-1">
                        <button class="btn btn-sm btn-outline-success" title="Aprovar Novo Prazo" onclick="aprovarPrazoController(${lancamento.id})"><i class="bi bi-calendar-check"></i></button>
                        <button class="btn btn-sm btn-outline-danger" title="Recusar/Definir Prazo" onclick="recusarPrazoController(${lancamento.id})"><i class="bi bi-calendar-x"></i></button>
                         <button class="btn btn-sm btn-outline-secondary" title="Ver Comentários" onclick="verComentarios(${lancamento.id})" ${!lancamento.comentarios || lancamento.comentarios.length === 0 ? 'disabled' : ''}><i class="bi bi-eye"></i></button>
                    </div>`;
                            break;
                    }
                }
                return acoesHtml;
            },
            "PRAZO AÇÃO": (lancamento) => userRole !== 'CONTROLLER' ? `<span class="badge bg-danger">${formatarData(lancamento.dataPrazo)}</span>` : '',
            "STATUS APROVAÇÃO": (lancamento) => {
                let statusHtml = `<span class="badge rounded-pill text-bg-warning">${(lancamento.situacaoAprovacao || '').replace(/_/g, ' ')}</span>`;
                if (lancamento.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO' && lancamento.dataPrazoProposta) {
                    statusHtml += `<br><small class="text-muted">Prazo Solicitado: <b>${lancamento.dataPrazoProposta.split('-').reverse().join('/')}</b></small>`;
                }
                return statusHtml;
            },
            "DATA ATIVIDADE": (lancamento) => formatarData(lancamento.dataAtividade),
            "OS": (lancamento) => get(lancamento, 'os.os'), "SITE": (lancamento) => get(lancamento, 'detalhe.site'),
            "VALOR DA ATIVIDADE": (lancamento) => formatarMoeda(lancamento.valor),
            "VALOR TOTAL DO ITEM": (lancamento) => formatarMoeda(get(lancamento, 'detalhe.valorTotal')),
            "CONTRATO": (lancamento) => get(lancamento, 'detalhe.contrato'),
            "SEGMENTO": (lancamento) => get(lancamento, 'os.segmento.nome'), "PROJETO": (lancamento) => get(lancamento, 'os.projeto'),
            "GESTOR TIM": (lancamento) => get(lancamento, 'os.gestorTim'), "REGIONAL": (lancamento) => get(lancamento, 'detalhe.regional'),
            "LPU": (lancamento) => get(lancamento, 'detalhe.lpu.nomeLpu'), "LOTE": (lancamento) => get(lancamento, 'detalhe.lote'), "BOQ": (lancamento) => get(lancamento, 'detalhe.boq'),
            "PO": (lancamento) => get(lancamento, 'detalhe.po'), "ITEM": (lancamento) => get(lancamento, 'detalhe.item'),
            "OBJETO CONTRATADO": (lancamento) => get(lancamento, 'detalhe.objetoContratado'), "UNIDADE": (lancamento) => get(lancamento, 'detalhe.unidade'),
            "QUANTIDADE": (lancamento) => get(lancamento, 'detalhe.quantidade'), "OBSERVAÇÕES": (lancamento) => get(lancamento, 'detalhe.observacoes'),
            "DATA PO": (lancamento) => formatarData(get(lancamento, 'detalhe.dataPo')), "VISTORIA": (lancamento) => get(lancamento, 'vistoria'),
            "PLANO DE VISTORIA": (lancamento) => formatarData(lancamento.planoVistoria), "DESMOBILIZAÇÃO": (lancamento) => get(lancamento, 'desmobilizacao'),
            "PLANO DE DESMOBILIZAÇÃO": (lancamento) => formatarData(lancamento.planoDesmobilizacao), "INSTALAÇÃO": (lancamento) => get(lancamento, 'instalacao'),
            "PLANO DE INSTALAÇÃO": (lancamento) => formatarData(lancamento.planoInstalacao), "ATIVAÇÃO": (lancamento) => get(lancamento, 'ativacao'),
            "PLANO DE ATIVAÇÃO": (lancamento) => formatarData(lancamento.planoAtivacao), "DOCUMENTAÇÃO": (lancamento) => get(lancamento, 'documentacao'),
            "PLANO DE DOCUMENTAÇÃO": (lancamento) => formatarData(lancamento.planoDocumentacao),
            "ETAPA GERAL": (lancamento) => get(lancamento, 'etapa.codigoGeral', '') + ' - ' + get(lancamento, 'etapa.nomeGeral', ''),
            "ETAPA DETALHADA": (lancamento) => get(lancamento, 'etapa.indiceDetalhado', '') + ' - ' + get(lancamento, 'etapa.nomeDetalhado', ''),
            "STATUS": (lancamento) => get(lancamento, 'status'), "SITUAÇÃO": (lancamento) => get(lancamento, 'situacao'),
            "DETALHE DIÁRIO": (lancamento) => get(lancamento, 'detalheDiario'), "CÓD. PRESTADOR": (lancamento) => get(lancamento, 'prestador.codigo'),
            "PRESTADOR": (lancamento) => get(lancamento, 'prestador.nome'), "GESTOR": (lancamento) => get(lancamento, 'manager.nome'),
        };


        grupos.forEach((grupo, index) => {
            const uniqueId = `${grupo.id}-${index}`;
            const item = document.createElement('div');
            item.className = 'accordion-item';

            // Verifica se algum lançamento no grupo está vencido
            const isVencido = grupo.linhas.some(lancamento => {
                const dataPrazo = lancamento.dataPrazo ? new Date(lancamento.dataPrazo.split('/').reverse().join('-')) : null;
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                return dataPrazo && dataPrazo < hoje;
            });

            const buttonClass = isVencido ? 'accordion-button collapsed accordion-button-vencido' : 'accordion-button collapsed';

            const totalOs = grupo.totalOs || 0;
            const totalCpsAprovado = grupo.valorCps || 0;
            const totalMaterial = grupo.custoTotalMateriais || 0;
            const totalPendente = grupo.valorPendente || 0;
            const previsaoCps = totalCpsAprovado + totalPendente;
            const percentualAtual = totalOs > 0 ? ((totalCpsAprovado + totalMaterial) / totalOs) * 100 : 0;
            const percentualPrevisto = totalOs > 0 ? ((previsaoCps + totalMaterial) / totalOs) * 100 : 0;

            const kpiHTML = `
            <div class="header-kpi-wrapper">
                <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(totalOs)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(totalCpsAprovado)}</span></div>
                <div class="header-kpi"><span class="kpi-label">Total Material</span><span class="kpi-value">${formatarMoeda(totalMaterial)}</span></div>
                <div class="header-kpi"><span class="kpi-label text-primary">Previsão CPS</span><span class="kpi-value text-primary">${formatarMoeda(previsaoCps)}</span></div>
                <div class="header-kpi"><span class="kpi-label">% Atual</span><span class="kpi-value kpi-percentage">${percentualAtual.toFixed(2)}%</span></div>
                <div class="header-kpi"><span class="kpi-label text-primary">% Previsto</span><span class="kpi-value kpi-percentage text-primary">${percentualPrevisto.toFixed(2)}%</span></div>
            </div>`;

            const headerHTML = `
            <h2 class="accordion-header" id="heading-${uniqueId}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                    <div class="header-content">
                        <div class="header-title-wrapper">
                            <span class="header-title-project">${grupo.projeto}</span>
                            <span class="header-title-os">${grupo.os}</span>
                        </div>
                        ${kpiHTML}
                        <span class="badge bg-primary header-badge">${grupo.linhas.length} itens pendentes</span>
                    </div>
                </button>
            </h2>`;

            let colunasParaRenderizar = [...colunas];
            if (userRole === 'CONTROLLER') {
                colunasParaRenderizar = colunasParaRenderizar.filter(c => c !== "PRAZO AÇÃO");
            }
            const bodyRowsHTML = grupo.linhas.map(lancamento => {
                const cellsHTML = colunasParaRenderizar.map(header => {
                    const func = dataMapping[header];
                    const valor = func ? func(lancamento) : '-';
                    let classes = '';
                    if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(header)) {
                        classes += ' status-cell';
                        if (valor === 'OK') classes += ' status-ok';
                        else if (valor === 'NOK') classes += ' status-nok';
                        else if (valor === 'N/A') classes += ' status-na';
                    }
                    if (header === "DETALHE DIÁRIO") {
                        classes += ' detalhe-diario-cell';
                    }
                    return `<td class="${classes}">${valor}</td>`;
                }).join('');
                return `<tr data-id="${lancamento.id}"><td><input type="checkbox" class="form-check-input linha-checkbox" data-id="${lancamento.id}"></td>${cellsHTML}</tr>`;
            }).join('');

            // --- CORREÇÃO APLICADA AQUI ---
            // O atributo "data-bs-parent" foi removido do div abaixo
            const bodyHTML = `
            <div id="collapse-${uniqueId}" class="accordion-collapse collapse">
                <div class="accordion-body">
                    <div class="table-responsive">
                        <table class="table modern-table table-sm">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" class="form-check-input selecionar-todos-grupo" data-group-id="${uniqueId}"></th>
                                    ${colunasParaRenderizar.map(c => `<th>${c}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody data-group-id="${uniqueId}">
                                ${bodyRowsHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
            item.innerHTML = headerHTML + bodyHTML;
            frag.appendChild(item);
        });
        accordionContainer.appendChild(frag);
    }

    function renderizarCardsDashboard(todosLancamentos) {
        const dashboardContainer = document.getElementById('dashboard-container');
        if (!dashboardContainer) return;

        const hojeString = new Date().toLocaleDateString('pt-BR');
        let cardsHtml = '';

        if (userRole === 'COORDINATOR') {
            const minhasPendencias = todosLancamentos.filter(l => l.situacaoAprovacao === 'PENDENTE_COORDENADOR').length;
            const aguardandoController = todosLancamentos.filter(l => l.situacaoAprovacao === 'PENDENTE_CONTROLLER').length;
            const prazosSolicitados = todosLancamentos.filter(l => l.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO').length;
            const aprovadosHoje = todosLancamentos.filter(l => {
                const dataAcao = new Date(parseDataBrasileira(l.ultUpdate)).toLocaleDateString('pt-BR');
                return l.situacaoAprovacao === 'PENDENTE_CONTROLLER' && dataAcao === hojeString;
            }).length;

            cardsHtml = `
            <div class="card card-stat card-perigo">
                <div class="card-body"><h5>Minhas Pendências</h5><p>${minhasPendencias}</p></div>
            </div>
            <div class="card card-stat card-info">
                <div class="card-body"><h5>Aguardando Controller</h5><p>${aguardandoController}</p></div>
            </div>
            <div class="card card-stat card-alerta">
                <div class="card-body"><h5>Prazos Solicitados</h5><p>${prazosSolicitados}</p></div>
            </div>
            <div class="card card-stat card-sucesso">
                <div class="card-body"><h5>Aprovados Hoje</h5><p>${aprovadosHoje}</p></div>
            </div>
        `;

        } else if (userRole === 'CONTROLLER') {
            const pendenciasGerais = todosLancamentos.filter(l => l.situacaoAprovacao === 'PENDENTE_CONTROLLER').length;
            const solicitacoesPrazo = todosLancamentos.filter(l => l.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO').length;
            const prazosVencidos = todosLancamentos.filter(l => l.situacaoAprovacao === 'PRAZO_VENCIDO').length;
            const aprovadosHoje = todosLancamentos.filter(l => {
                const dataAcao = new Date(parseDataBrasileira(l.ultUpdate)).toLocaleDateString('pt-BR');
                return l.situacaoAprovacao === 'APROVADO' && dataAcao === hojeString;
            }).length;

            cardsHtml = `
                <div class="card card-stat card-info">
                    <div class="card-body"><h5>Pendências para Ação</h5><p>${pendenciasGerais}</p></div>
                </div>
                <div class="card card-stat card-alerta">
                    <div class="card-body"><h5>Solicitações de Prazo</h5><p>${solicitacoesPrazo}</p></div>
                </div>
                <div class="card card-stat card-perigo">
                    <div class="card-body"><h5>Prazos Vencidos</h5><p>${prazosVencidos}</p></div>
                </div>
                <div class="card card-stat card-sucesso">
                    <div class="card-body"><h5>Aprovados hoje</h5><p>${aprovadosHoje}</p></div>
                </div>
            `;
        }

        dashboardContainer.innerHTML = cardsHtml;
    }

    async function carregarDadosMateriais() {
        if (!document.getElementById('tbody-pendentes-materiais')) return;

        try {
            const pendentesResponse = await fetchComAuth(`${API_BASE_URL}/solicitacoes/pendentes`, {
                headers: {
                    'X-User-Role': userRole,
                    'X-User-ID': userId
                }
            });
            const historicoResponse = await fetchComAuth(`${API_BASE_URL}/solicitacoes/historico/${userId}`);

            if (!pendentesResponse.ok || !historicoResponse.ok) {
                throw new Error('Falha ao carregar solicitações de materiais.');
            }

            todasPendenciasMateriais = await pendentesResponse.json();
            todosHistoricoMateriais = await historicoResponse.json();

            popularFiltroSegmento();
            renderizarTabelaPendentesMateriais();
            renderizarTabelaHistoricoMateriais();

        } catch (error) {
            console.error("Erro ao carregar dados de materiais:", error);
            mostrarToast(error.message, 'error');
        }
    }

    function popularFiltroSegmento() {
        const segmentos = new Set();
        [...todasPendenciasMateriais, ...todosHistoricoMateriais].forEach(s => {
            if (s.os.segmento) {
                segmentos.add(JSON.stringify(s.os.segmento));
            }
        });

        filtroSegmentoMateriais.innerHTML = '<option value="todos">Todos os Segmentos</option>';

        Array.from(segmentos)
            .map(s => JSON.parse(s))
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .forEach(segmento => {
                const option = new Option(segmento.nome, segmento.id);
                filtroSegmentoMateriais.add(option);
            });
    }


    function renderizarTabelaPendentesMateriais(solicitacoes) {
        const tbody = tbodyPendentesMateriais;
        if (!tbody) return;

        const filtroSegmentoId = filtroSegmentoMateriais.value;
        const solicitacoesFiltradas = filtroSegmentoId === 'todos'
            ? todasPendenciasMateriais
            : todasPendenciasMateriais.filter(s => s.os.segmento && s.os.segmento.id == filtroSegmentoId);


        const thead = tbody.previousElementSibling;
        thead.innerHTML = '';
        tbody.innerHTML = '';

        let colunasHtml = `
    <th>Ações</th>
    <th>Data Solicitação</th>
    <th>Solicitante</th>
    <th>OS</th>
    <th>Segmento</th>
    <th>LPU</th>
    <th>Item Solicitado</th>
    <th class="text-center">Unidade</th>
    <th class="text-center">Qtd. Solicitada</th>
    <th class="text-center">Qtd. em Estoque</th>
    <th>Justificativa</th>
`;
        if (userRole === 'CONTROLLER') {
            colunasHtml += '<th>Status</th>';
        }
        thead.innerHTML = `<tr>${colunasHtml}</tr>`;

        const colspan = userRole === 'CONTROLLER' ? 12 : 11;
        if (!solicitacoesFiltradas || solicitacoesFiltradas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-muted">Nenhuma pendência de material.</td></tr>`;
            return;
        }

        solicitacoesFiltradas.forEach(s => {
            const item = s.itens[0];
            if (!item) return;

            const tr = document.createElement('tr');

            let acoesHtml = '';
            let statusHtml = '';

            if (userRole === 'CONTROLLER') {
                if (s.status === 'PENDENTE_CONTROLLER') {
                    acoesHtml = `
                <button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarMaterial(${s.id})"><i class="bi bi-check-lg"></i></button>
                <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarMaterial(${s.id})"><i class="bi bi-x-lg"></i></button>`;
                    statusHtml = `<span class="badge rounded-pill text-bg-warning">PENDENTE CONTROLLER</span>`;
                } else {
                    acoesHtml = `—`;
                    statusHtml = `<span class="badge rounded-pill text-bg-info">PENDENTE COORDENADOR</span>`;
                }
            } else if (userRole === 'COORDINATOR' || userRole === 'MANAGER') {
                acoesHtml = `
            <button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarMaterial(${s.id})"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarMaterial(${s.id})"><i class="bi bi-x-lg"></i></button>`;
            }

            tr.innerHTML = `
        <td data-label="Ações" class="text-center">${acoesHtml}</td>
        <td data-label="Data">${new Date(s.dataSolicitacao).toLocaleString('pt-BR')}</td>
        <td data-label="Solicitante">${s.nomeSolicitante || 'N/A'}</td>
        <td data-label="OS">${s.os.os}</td>
        <td data-label="Segmento">${s.os.segmento ? s.os.segmento.nome : 'N/A'}</td>
        <td data-label="LPU">${s.lpu.codigoLpu}</td>
        <td data-label="Item Solicitado">${item.material.descricao}</td>
        <td data-label="Unidade" class="text-center">${item.material.unidadeMedida}</td>
        <td data-label="Qtd. Solicitada" class="text-center">${item.quantidadeSolicitada}</td>
        <td data-label="Qtd. em Estoque" class="text-center">${item.material.saldoFisico}</td>
        <td data-label="Justificativa">${s.justificativa || ''}</td>
        ${userRole === 'CONTROLLER' ? `<td data-label="Status">${statusHtml}</td>` : ''}
    `;
            tbody.appendChild(tr);
        });
    }

    function renderizarTabelaHistoricoMateriais() {
        const tbody = tbodyHistoricoMateriais;
        if (!tbody) return;

        const filtroSegmentoId = filtroSegmentoMateriais.value;
        const solicitacoes = filtroSegmentoId === 'todos'
            ? todosHistoricoMateriais
            : todosHistoricoMateriais.filter(s => s.os.segmento && s.os.segmento.id == filtroSegmentoId);

        const thead = tbody.previousElementSibling;
        thead.innerHTML = '';
        tbody.innerHTML = '';

        thead.innerHTML = `
    <tr>
        <th>Data Ação</th>
        <th>Status</th>
        <th>Data Solicitação</th>
        <th>Solicitante</th>
        <th>OS</th>
        <th>Segmento</th>
        <th>LPU</th>
        <th>Item Solicitado</th>
        <th class="text-center">Unidade</th>
        <th class="text-center">Qtd. Solicitada</th>
        <th>Aprovador</th>
        <th>Motivo Recusa</th>
    </tr>
`;

        if (!solicitacoes || solicitacoes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">Nenhum histórico encontrado.</td></tr>`;
            return;
        }

        solicitacoes.sort((a, b) => {
            const dateA = new Date(a.dataAcaoController || a.dataAcaoCoordenador);
            const dateB = new Date(b.dataAcaoController || b.dataAcaoCoordenador);
            return dateB - dateA;
        });

        solicitacoes.forEach(s => {
            const item = s.itens[0];
            if (!item) return;

            const tr = document.createElement('tr');
            const statusBadge = s.status === 'APROVADA'
                ? `<span class="badge bg-success">${s.status}</span>`
                : `<span class="badge bg-danger">${s.status}</span>`;

            const dataAcao = s.dataAcaoController || s.dataAcaoCoordenador;
            const dataAcaoFormatada = dataAcao ? new Date(dataAcao).toLocaleString('pt-BR') : 'Pendente';
            const nomeAprovador = s.nomeAprovadorController || s.nomeAprovadorCoordenador;

            tr.innerHTML = `
            <td data-label="Data Ação">${dataAcaoFormatada}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Data Solicitação">${new Date(s.dataSolicitacao).toLocaleString('pt-BR')}</td>
            <td data-label="Solicitante">${s.nomeSolicitante || 'N/A'}</td>
            <td data-label="OS">${s.os.os}</td>
            <td data-label="Segmento">${s.os.segmento ? s.os.segmento.nome : 'N/A'}</td>
            <td data-label="LPU">${s.lpu.codigoLpu}</td>
            <td data-label="Item Solicitado">${item.material.descricao}</td>
            <td data-label="Unidade" class="text-center">${item.material.unidadeMedida}</td>
            <td data-label="Qtd. Solicitada" class="text-center">${item.quantidadeSolicitada}</td>
            <td data-label="Aprovador">${nomeAprovador || 'N/A'}</td>
            <td data-label="Motivo Recusa">${s.motivoRecusa || '—'}</td>
        `;
            tbody.appendChild(tr);
        });
    }

    function aprovarMaterial(id) {
        if (!modalAprovar) return;
        document.getElementById('aprovarLancamentoId').value = id;
        modalAprovar._element.querySelector('.modal-body p').textContent = 'Você tem certeza que deseja aprovar esta solicitação de material?';
        document.getElementById('btnConfirmarAprovacao').dataset.tipo = 'material';
        modalAprovar.show();
    }

    function recusarMaterial(id) {
        if (!modalRecusar) return;
        document.getElementById('recusarLancamentoId').value = id;
        document.getElementById('formRecusarLancamento').reset();
        document.getElementById('btnConfirmarRecusa').dataset.tipo = 'material';
        modalRecusar.show();
    }

    async function carregarDadosAtividades() {
        toggleLoader(true);
        try {
            const userId = localStorage.getItem('usuarioId');
            const responseGeral = await fetchComAuth(`${API_BASE_URL}/lancamentos`);
            if (!responseGeral.ok) throw new Error(`Erro na rede: ${responseGeral.statusText}`);
            const todosLancamentos = await responseGeral.json();
            todosOsLancamentosGlobais = todosLancamentos;
            renderizarCardsDashboard(todosLancamentos);

            const responsePendencias = await fetchComAuth(`${API_BASE_URL}/lancamentos/pendentes/${userId}`);
            if (!responsePendencias.ok) throw new Error('Falha ao carregar suas pendências.');
            const pendenciasParaExibir = await responsePendencias.json();

            const responseHistorico = await fetchComAuth(`${API_BASE_URL}/lancamentos/historico/${userId}`);
            if (!responseHistorico.ok) throw new Error('Falha ao carregar seu histórico.');
            const historicoParaExibir = await responseHistorico.json();

            renderizarAcordeonPendencias(pendenciasParaExibir);
            renderizarTabelaHistorico(historicoParaExibir);

            if (userRole === 'COORDINATOR') {
                document.getElementById('titulo-tabela').innerHTML = '<i class="bi bi-clock-history me-2"></i> Pendências';
            } else if (userRole === 'CONTROLLER') {
                document.getElementById('titulo-tabela').innerHTML = '<i class="bi bi-shield-check me-2"></i> Pendências do Controller';
            }

        } catch (error) {
            console.error('Falha ao buscar dados:', error);
            mostrarToast('Falha ao carregar os dados da página.', 'error');
            const accordionContainer = document.getElementById('accordion-pendencias');
            if (accordionContainer) accordionContainer.innerHTML = `<div class="alert alert-danger">Falha ao carregar dados.</div>`;
        } finally {
            toggleLoader(false);
        }
    }

    function renderizarTabelaHistorico(dados) {
        if (!tbodyHistorico) return;

        // Objeto para guardar o estado da ordenação
        let sortConfig = { key: 'dataAtividade', direction: 'desc' };

        // Função auxiliar para ordenar os dados
        function sortData(dadosParaOrdenar) {
            dadosParaOrdenar.sort((a, b) => {
                let valA, valB;

                // Lógica para pegar o valor correto dependendo da coluna
                if (sortConfig.key === 'os') {
                    valA = a.os?.os || '';
                    valB = b.os?.os || '';
                } else if (sortConfig.key === 'valor') {
                    valA = a.valor || 0;
                    valB = b.valor || 0;
                } else { // Padrão para data
                    valA = a.dataAtividade ? new Date(a.dataAtividade.split('/').reverse().join('-')) : new Date(0);
                    valB = b.dataAtividade ? new Date(b.dataAtividade.split('/').reverse().join('-')) : new Date(0);
                }

                if (typeof valA === 'string') {
                    return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                }
            });
            return dadosParaOrdenar;
        }

        // Função para renderizar
        function render() {
            const statusFiltrado = document.getElementById('filtro-historico-status').value;
            let dadosFiltrados = statusFiltrado === 'todos' ?
                dados :
                dados.filter(l => l.situacaoAprovacao === statusFiltrado);

            dadosFiltrados = sortData(dadosFiltrados); // Ordena os dados

            const colunasHeaders = [
                { key: 'dataAtividade', label: 'DATA ATIVIDADE' }, { key: 'statusAprovacao', label: 'STATUS' },
                { key: 'os', label: 'OS' }, { key: 'site', label: 'SITE' },
                { key: 'segmento', label: 'SEGMENTO' }, { key: 'valor', label: 'VALOR' },
                { key: 'prestador', label: 'PRESTADOR' }
            ];

            if (theadHistorico) {
                theadHistorico.innerHTML = `<tr>
                <th>COMENTÁRIOS</th>
                ${colunasHeaders.map(h => {
                    const isSorted = sortConfig.key === h.key;
                    const icon = isSorted ? (sortConfig.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up';
                    return `<th class="sortable" data-sort-key="${h.key}">${h.label} <i class="bi ${icon}"></i></th>`;
                }).join('')}
            </tr>`;
            }

            tbodyHistorico.innerHTML = '';
            if (!dadosFiltrados || dadosFiltrados.length === 0) {
                tbodyHistorico.innerHTML = `<tr><td colspan="${colunasHeaders.length + 1}" class="text-center text-muted p-4">Nenhum histórico para o filtro.</td></tr>`;
                return;
            }

            dadosFiltrados.forEach(lancamento => {
                const tr = document.createElement('tr');
                const statusBadge = lancamento.situacaoAprovacao.includes('RECUSADO') ? `<span class="badge rounded-pill text-bg-danger">${lancamento.situacaoAprovacao.replace(/_/g, ' ')}</span>` : `<span class="badge rounded-pill text-bg-success">${lancamento.situacaoAprovacao}</span>`;

                tr.innerHTML = `
                <td><button class="btn btn-sm btn-outline-secondary" onclick="verComentarios(${lancamento.id})" ${!lancamento.comentarios || lancamento.comentarios.length === 0 ? 'disabled' : ''}><i class="bi bi-eye"></i></button></td>
                <td>${lancamento.dataAtividade.split('-').reverse().join('/') || ''}</td>
                <td>${statusBadge}</td>
                <td>${lancamento.os?.os || ''}</td>
                <td>${lancamento.detalhe?.site || ''}</td>
                <td>${lancamento.os?.segmento?.nome || ''}</td>
                <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lancamento.valor || 0)}</td>
                <td>${lancamento.prestador?.nome || ''}</td>
            `;
                tbodyHistorico.appendChild(tr);
            });
        }

        // Adiciona o listener de clique no cabeçalho
        if (theadHistorico) {
            theadHistorico.addEventListener('click', (e) => {
                const header = e.target.closest('th.sortable');
                if (!header) return;

                const key = header.dataset.sortKey;
                if (sortConfig.key === key) {
                    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortConfig.key = key;
                    sortConfig.direction = 'desc';
                }
                render();
            });
        }

        render(); // Renderiza pela primeira vez
    }

    const collapseElement = document.getElementById('collapseAprovacoesCards');
    const collapseIcon = document.querySelector('a[href="#collapseAprovacoesCards"] i.bi');
    if (collapseElement && collapseIcon) {
        collapseElement.addEventListener('show.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-down', 'bi-chevron-up'));
        collapseElement.addEventListener('hide.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-up', 'bi-chevron-down'));
    }

    document.getElementById('btnConfirmarAprovacao')?.addEventListener('click', async function () {
        const isAcaoEmLote = modalAprovar._element.dataset.acaoEmLote === 'true';
        const ids = isAcaoEmLote
            ? Array.from(document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked')).map(cb => cb.dataset.id)
            : [document.getElementById('aprovarLancamentoId').value];

        if (ids.length === 0) return;
        const primeiroLancamento = todosOsLancamentosGlobais.find(l => l.id == ids[0]);
        if (!primeiroLancamento) return;

        setButtonLoading(this, true);
        try {
            let endpoint = '';
            let payload = { lancamentoIds: ids, aprovadorId: userId };

            if (userRole === 'CONTROLLER') {
                endpoint = primeiroLancamento.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO'
                    ? `${API_BASE_URL}/lancamentos/lote/prazo/aprovar`
                    : `${API_BASE_URL}/lancamentos/lote/controller-aprovar`;
            } else { // COORDENADOR
                endpoint = `${API_BASE_URL}/lancamentos/lote/coordenador-aprovar`;
            }

            const response = await fetchComAuth(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao aprovar.');

            mostrarToast(`${ids.length} item(ns) aprovado(s) com sucesso!`, 'success');
            modalAprovar.hide();
            await carregarDadosAtividades();
        } catch (error) {
            mostrarToast(`Erro: ${error.message}`, 'error');
        } finally {
            setButtonLoading(this, false);
            delete modalAprovar._element.dataset.acaoEmLote; // Limpa o dataset
        }
    });

    document.getElementById('formRecusarLancamento')?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const btn = document.getElementById('btnConfirmarRecusa');
        const isAcaoEmLote = modalRecusar._element.dataset.acaoEmLote === 'true';
        const ids = isAcaoEmLote
            ? Array.from(document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked')).map(cb => cb.dataset.id)
            : [document.getElementById('recusarLancamentoId').value];

        if (ids.length === 0) return;

        const motivo = document.getElementById('motivoRecusa').value;
        let endpoint = '';
        let payload = {};

        if (userRole === 'CONTROLLER') {
            endpoint = `${API_BASE_URL}/lancamentos/lote/controller-rejeitar`;
            payload = { lancamentoIds: ids, controllerId: userId, motivoRejeicao: motivo };
        } else { // COORDENADOR
            endpoint = `${API_BASE_URL}/lancamentos/lote/coordenador-rejeitar`;
            payload = { lancamentoIds: ids, aprovadorId: userId, comentario: motivo };
        }

        setButtonLoading(btn, true);
        try {
            const response = await fetchComAuth(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao recusar.');

            mostrarToast(`${ids.length} item(ns) recusado(s) com sucesso!`, 'success');
            modalRecusar.hide();
            await carregarDadosAtividades();
        } catch (error) {
            mostrarToast(`Erro: ${error.message}`, 'error');
        } finally {
            setButtonLoading(btn, false);
            delete modalRecusar._element.dataset.acaoEmLote;
        }
    });

    document.getElementById('formComentarPrazo')?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const btn = document.getElementById('btnEnviarComentario');
        const isAcaoEmLote = modalComentar._element.dataset.acaoEmLote === 'true';
        const ids = isAcaoEmLote
            ? Array.from(document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked')).map(cb => cb.dataset.id)
            : [document.getElementById('comentarLancamentoId').value];

        if (ids.length === 0) return;

        let endpoint = '';
        let payload = {};
        const comentario = document.getElementById('comentarioCoordenador').value;
        const novaData = document.getElementById('novaDataProposta').value;

        if (userRole === 'CONTROLLER') {
            endpoint = `${API_BASE_URL}/lancamentos/lote/prazo/rejeitar`;
            payload = { lancamentoIds: ids, controllerId: userId, motivoRejeicao: comentario, novaDataPrazo: novaData };
        } else { // COORDENADOR
            endpoint = `${API_BASE_URL}/lancamentos/lote/coordenador-solicitar-prazo`;
            payload = { lancamentoIds: ids, coordenadorId: userId, comentario: comentario, novaDataSugerida: novaData };
        }

        setButtonLoading(btn, true);
        try {
            const response = await fetchComAuth(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao enviar solicitação.');

            mostrarToast(`Ação realizada com sucesso para ${ids.length} item(ns)!`, 'success');
            modalComentar.hide();
            await carregarDadosAtividades();
        } catch (error) {
            mostrarToast(`Erro: ${error.message}`, 'error');
        } finally {
            setButtonLoading(btn, false);
            delete modalComentar._element.dataset.acaoEmLote;
        }
    });

    function atualizarEstadoAcoesLote() {
        const checkboxesSelecionados = document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked');
        const totalSelecionado = checkboxesSelecionados.length;
        const acoesContainer = document.getElementById('acoes-lote-container');

        if (!acoesContainer) return;

        acoesContainer.classList.toggle('d-none', totalSelecionado === 0);
        if (totalSelecionado === 0) return;

        document.getElementById('contador-aprovacao').textContent = totalSelecionado;
        document.getElementById('contador-recusa').textContent = totalSelecionado;
        document.getElementById('contador-prazo').textContent = totalSelecionado;

        const idsSelecionados = Array.from(checkboxesSelecionados).map(cb => cb.dataset.id);
        const lancamentosSelecionados = todosOsLancamentosGlobais.filter(l => idsSelecionados.includes(String(l.id)));
        const primeiroStatus = lancamentosSelecionados.length > 0 ? lancamentosSelecionados[0].situacaoAprovacao : null;
        const todosMesmoStatus = lancamentosSelecionados.every(l => l.situacaoAprovacao === primeiroStatus);

        const btnAprovar = document.getElementById('btn-aprovar-selecionados');
        const btnRecusar = document.getElementById('btn-recusar-selecionados');
        const btnPrazo = document.getElementById('btn-solicitar-prazo-selecionados');

        [btnAprovar, btnRecusar, btnPrazo].forEach(btn => btn.style.display = 'none');

        if (todosMesmoStatus) {
            if ((userRole === 'COORDINATOR' || userRole === 'MANAGER') && primeiroStatus === 'PENDENTE_COORDENADOR') {
                [btnAprovar, btnRecusar, btnPrazo].forEach(btn => btn.style.display = 'inline-block');
            } else if (userRole === 'CONTROLLER') {
                if (primeiroStatus === 'PENDENTE_CONTROLLER') {
                    [btnAprovar, btnRecusar].forEach(btn => btn.style.display = 'inline-block');
                } else if (primeiroStatus === 'AGUARDANDO_EXTENSAO_PRAZO') {
                    [btnAprovar, btnRecusar].forEach(btn => btn.style.display = 'inline-block');
                    btnAprovar.innerHTML = `<i class="bi bi-calendar-check"></i> Aprovar Prazo (${totalSelecionado})`;
                    btnRecusar.innerHTML = `<i class="bi bi-calendar-x"></i> Recusar Prazo (${totalSelecionado})`;
                }
            }
        }
    }

    async function carregarTodosOsDados() {
        toggleLoader(true);
        await Promise.all([
            carregarDadosAtividades(),
            carregarDadosMateriais()
        ]);
        toggleLoader(false);
    }

    const btnConfirmarAprovacaoMaterial = document.getElementById('btnConfirmarAprovacaoMaterial');
    if (btnConfirmarAprovacaoMaterial) {
        btnConfirmarAprovacaoMaterial.addEventListener('click', async function () {
            const solicitacaoId = this.dataset.id;
            const endpoint = userRole === 'COORDINATOR'
                ? `${API_BASE_URL}/solicitacoes/${solicitacaoId}/coordenador/aprovar`
                : `${API_BASE_URL}/solicitacoes/${solicitacaoId}/controller/aprovar`;

            setButtonLoading(this, true);
            try {
                const response = await fetchComAuth(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ aprovadorId: userId })
                });
                if (!response.ok) throw new Error((await response.json()).message || 'Falha ao aprovar.');

                mostrarToast('Solicitação de material aprovada!', 'success');
                modalAprovarMaterial.hide();
                await carregarTodosOsDados();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                setButtonLoading(this, false);
            }
        });
    }

    const formRecusarMaterial = document.getElementById('formRecusarMaterial');
    if (formRecusarMaterial) {
        formRecusarMaterial.addEventListener('submit', async function (event) {
            event.preventDefault();
            const solicitacaoId = this.dataset.id;
            const motivo = document.getElementById('motivoRecusaMaterial').value;
            const btn = document.getElementById('btnConfirmarRecusaMaterial');

            const endpoint = userRole === 'COORDINATOR'
                ? `${API_BASE_URL}/solicitacoes/${solicitacaoId}/coordenador/rejeitar`
                : `${API_BASE_URL}/solicitacoes/${solicitacaoId}/controller/rejeitar`;

            setButtonLoading(btn, true);
            try {
                const response = await fetchComAuth(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ aprovadorId: userId, observacao: motivo })
                });
                if (!response.ok) throw new Error((await response.json()).message || 'Falha ao recusar.');

                mostrarToast('Solicitação de material recusada.', 'success');
                modalRecusarMaterial.hide();
                await carregarTodosOsDados();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                setButtonLoading(btn, false);
            }
        });
    }

    if (filtroHistoricoStatus) {
        filtroHistoricoStatus.addEventListener('change', async () => {
            toggleLoader(true);
            try {
                const responseHistorico = await fetchComAuth(`${API_BASE_URL}/lancamentos/historico/${userId}`);
                if (!responseHistorico.ok) throw new Error('Falha ao recarregar seu histórico.');
                const historicoParaExibir = await responseHistorico.json();
                renderizarTabelaHistorico(historicoParaExibir);
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleLoader(false);
            }
        });
    }

    btnRecusarSelecionados.addEventListener('click', () => {
        const checkboxesSelecionados = document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked');
        if (checkboxesSelecionados.length === 0) return;

        const primeiroId = checkboxesSelecionados[0].dataset.id;
        const primeiroLancamento = todosOsLancamentosGlobais.find(l => l.id == primeiroId);

        // Verifica se é recusa de prazo para o Controller
        if (userRole === 'CONTROLLER' && (primeiroLancamento.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO' || primeiroLancamento.situacaoAprovacao === 'PRAZO_VENCIDO')) {
            modalComentar._element.dataset.acaoEmLote = 'true';
            recusarPrazoController(null);
        } else {
            modalRecusar._element.dataset.acaoEmLote = 'true';
            recusarLancamento(null);
        }
    });

    btnSolicitarPrazo.addEventListener('click', () => {
        modalComentar._element.dataset.acaoEmLote = 'true';
        comentarLancamento(null);
    });

    if (filtroSegmentoMateriais) {
        filtroSegmentoMateriais.addEventListener('change', () => {
            renderizarTabelaPendentesMateriais();
            renderizarTabelaHistoricoMateriais();
        });
    }

    document.getElementById('atividades-pane').addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('linha-checkbox')) {
            const linha = target.closest('tr');
            linha.classList.toggle('table-active', target.checked);
            atualizarEstadoAcoesLote();
        } else if (target.classList.contains('selecionar-todos-grupo')) {
            const isChecked = target.checked;
            const groupId = target.dataset.groupId;
            document.querySelectorAll(`tbody[data-group-id="${groupId}"] .linha-checkbox`).forEach(checkbox => {
                checkbox.checked = isChecked;
                const linha = checkbox.closest('tr');
                linha.classList.toggle('table-active', isChecked);
            });
            atualizarEstadoAcoesLote();
        }
    });

    btnAprovarSelecionados.addEventListener('click', () => {
        // A única responsabilidade deste botão é ABRIR o modal de confirmação.
        modalAprovar._element.dataset.acaoEmLote = 'true';
        aprovarLancamento(null); // Passa null, pois os IDs virão dos checkboxes.
    });

    carregarTodosOsDados();
});