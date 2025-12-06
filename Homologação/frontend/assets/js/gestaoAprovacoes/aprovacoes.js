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
const modalAprovarComplementar = document.getElementById('modalAprovarComplementar') ? new bootstrap.Modal(document.getElementById('modalAprovarComplementar')) : null;
const modalRecusarComplementar = document.getElementById('modalRecusarComplementar') ? new bootstrap.Modal(document.getElementById('modalRecusarComplementar')) : null;
const modalAdiantamento = document.getElementById('modalSolicitarAdiantamento') ? new bootstrap.Modal(document.getElementById('modalSolicitarAdiantamento')) : null;

// Variáveis Globais
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
let todasPendenciasComplementares = [];
let todoHistoricoComplementares = [];
let todasPendenciasAtividades = [];
let acaoLoteAtual = '';
let idsLoteSelecionados = [];

const API_BASE_URL = 'http://localhost:8080';

// Funções para abrir modais
function aprovarLancamento(id) {
    if (!modalAprovar) return;
    document.getElementById('aprovarLancamentoId').value = id;
    modalAprovar.show();
}

function gerarOpcoesCompetencia() {
    const select = document.getElementById('cpsCompetenciaInput');
    if (!select) return;

    select.innerHTML = ''; // Limpa opções anteriores

    const hoje = new Date();
    const diaAtual = hoje.getDate();

    // REGRA DO DIA 05:
    let dataBase = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    if (diaAtual > 5) {
        dataBase.setMonth(dataBase.getMonth() + 1);
    }

    const mesesNomes = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

    // Gera opções para os próximos 5 anos (60 meses)
    for (let i = 0; i < 60; i++) {
        const mes = dataBase.getMonth();
        const ano = dataBase.getFullYear();

        // Valor que vai para o banco (YYYY-MM-DD)
        const valor = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
        // Texto que aparece para o usuário
        const texto = `${mesesNomes[mes]}/${ano}`;

        const option = new Option(texto, valor);
        select.add(option);

        // Avança para o próximo mês
        dataBase.setMonth(dataBase.getMonth() + 1);
    }
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

function toggleLoader(ativo = true, containerSelector = '.content-loader-container') {
    const container = document.querySelector(containerSelector);
    if (container) {
        const overlay = container.querySelector(".overlay-loader");
        if (overlay) {
            overlay.classList.toggle("d-none", !ativo);
        }
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

function aprovarComplementar(id) {
    if (!modalAprovarComplementar) return;
    const btnConfirmar = document.getElementById('btnConfirmarAprovacaoComplementar');
    btnConfirmar.dataset.id = id;
    modalAprovarComplementar.show();
}

function recusarComplementar(id) {
    if (!modalRecusarComplementar) return;
    const form = document.getElementById('formRecusarComplementar');
    form.dataset.id = id;
    form.reset();
    modalRecusarComplementar.show();
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

window.abrirModalSolicitarAdiantamento = function (id, valorTotal, valorJaAdiantado) {
    const modal = new bootstrap.Modal(document.getElementById('modalSolicitarAdiantamento'));

    document.getElementById('adiantamentoLancamentoId').value = id;
    document.getElementById('adiantamentoValorTotalDisplay').value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal);
    document.getElementById('adiantamentoValorJaPagoDisplay').value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorJaAdiantado);

    const inputValor = document.getElementById('valorSolicitadoInput');
    inputValor.value = '';

    // Máscara de moeda simples no input
    inputValor.oninput = function () {
        let v = this.value.replace(/\D/g, '');
        v = (v / 100).toFixed(2) + '';
        v = v.replace(".", ",");
        v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        this.value = v;
    };

    modal.show();
};

// 2. Aprovar Adiantamento (Controller)
window.aprovarAdiantamento = function (id, valor) {
    const modalEl = document.getElementById('modalAprovarAdiantamento');
    const modal = new bootstrap.Modal(modalEl);

    document.getElementById('idAdiantamentoAprovar').value = id;

    // Formata o valor para exibição
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    document.getElementById('displayValorAdiantamento').textContent = valorFormatado;

    modal.show();
};

// 3. Recusar Adiantamento (Controller)
window.recusarAdiantamento = function (id) {
    const modalEl = document.getElementById('modalRecusarAdiantamento');
    const modal = new bootstrap.Modal(modalEl);

    document.getElementById('idAdiantamentoRecusar').value = id;
    document.getElementById('motivoRecusaAdiantamento').value = ''; // Limpa o campo

    modal.show();
};

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

    const colunas = [
        "AÇÕES", "PRAZO AÇÃO", "STATUS APROVAÇÃO", "DATA ATIVIDADE", "OS", "SITE", "VALOR DA ATIVIDADE", "CONTRATO", "SEGMENTO", "PROJETO",
        "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE",
        "OBSERVAÇÕES", "DATA PO", "VISTORIA", "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DE DESMOBILIZAÇÃO",
        "INSTALAÇÃO", "PLANO DE INSTALAÇÃO", "ATIVAÇÃO", "PLANO DE ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DE DOCUMENTAÇÃO",
        "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "GESTOR"
    ];

    if (userRole === 'MANAGER') {
        // Seleciona as abas e painéis que devem ser ESCONDIDOS
        const abaAprovacaoAtividades = document.getElementById('atividades-tab');
        const painelAprovacaoAtividades = document.getElementById('atividades-pane');
        const abaAprovacaoMateriais = document.getElementById('materiais-tab');
        const painelAprovacaoMateriais = document.getElementById('materiais-pane');
        const abaComplementares = document.getElementById('complementares-tab');
        const painelComplementares = document.getElementById('complementares-pane');

        // --- NOVOS ELEMENTOS A ESCONDER (CPS) ---
        const abaCpsPendencias = document.getElementById('cps-pendencias-tab');
        const painelCpsPendencias = document.getElementById('cps-pendencias-pane');
        const abaCpsHistorico = document.getElementById('cps-historico-tab');
        const painelCpsHistorico = document.getElementById('cps-historico-pane');

        // Oculta as abas de aprovação/pendências
        if (abaAprovacaoAtividades) {
            abaAprovacaoAtividades.style.display = 'none';
            abaAprovacaoAtividades.classList.remove('active');
        }
        if (painelAprovacaoAtividades) painelAprovacaoAtividades.classList.remove('show', 'active');

        if (abaAprovacaoMateriais) abaAprovacaoMateriais.style.display = 'none';
        if (painelAprovacaoMateriais) painelAprovacaoMateriais.classList.remove('show', 'active');

        if (abaComplementares) abaComplementares.style.display = 'none';
        if (painelComplementares) painelComplementares.classList.remove('show', 'active');

        // --- APLICAÇÃO DO OULTAMENTO DAS ABAS CPS ---
        if (abaCpsPendencias) {
            abaCpsPendencias.style.display = 'none';
            abaCpsPendencias.classList.remove('active');
        }
        if (painelCpsPendencias) painelCpsPendencias.classList.remove('show', 'active');

        if (abaCpsHistorico) {
            abaCpsHistorico.style.display = 'none';
            abaCpsHistorico.classList.remove('active');
        }
        if (painelCpsHistorico) painelCpsHistorico.classList.remove('show', 'active');
        // --------------------------------------------

        // Garante que a primeira aba visível (Histórico de Atividades) seja a ativa
        const abaHistoricoAtividades = document.getElementById('historico-atividades-tab');
        const painelHistoricoAtividades = document.getElementById('historico-atividades-pane');
        if (abaHistoricoAtividades) {
            // Usa o bootstrap Tab API para mostrar corretamente
            const tab = new bootstrap.Tab(abaHistoricoAtividades);
            tab.show();
        }
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
        if (spinner) spinner.classList.toggle('d-none', !isLoading);
    }

    function aplicarEstiloStatus(cell, statusText) {
        if (!statusText) return;
        cell.classList.add('status-cell');
        const statusUpper = statusText.toUpperCase();
        if (statusUpper === 'OK') cell.classList.add('status-ok');
        else if (statusUpper === 'NOK') cell.classList.add('status-nok');
        else if (statusUpper === 'N/A') cell.classList.add('status-na');
    }

    function renderizarAcordeonPendencias(dados) {
        const accordionContainer = document.getElementById('accordion-pendencias');
        if (!accordionContainer) return;

        accordionContainer.innerHTML = ''; // Limpa o conteúdo anterior

        if (!dados || dados.length === 0) {
            accordionContainer.innerHTML = `<div class="text-center p-4 text-muted">Nenhuma pendência encontrada para seu perfil.</div>`;
            return;
        }

        // Agrupa os lançamentos pelo ID da OS
        const agrupadoPorOS = dados.reduce((acc, lancamento) => {
            const osId = lancamento.os.id;
            if (!acc[osId]) {
                acc[osId] = {
                    id: osId,
                    os: lancamento.os.os,
                    projeto: lancamento.os.projeto,
                    totalOs: lancamento.totalOs, // Valor total da OS (vem do DTO)
                    valorCps: lancamento.valorCps, // Valor de CPS aprovado (vem do DTO)
                    valorPendente: lancamento.valorPendente, // Valor pendente (vem do DTO)
                    custoTotalMateriais: lancamento.os.custoTotalMateriais, // Custo de material (vem do DTO)
                    linhas: []
                };
            }
            acc[osId].linhas.push(lancamento);
            return acc;
        }, {});

        const grupos = Object.values(agrupadoPorOS); // Transforma o objeto em um array de grupos
        const frag = document.createDocumentFragment(); // Para otimizar a inserção no DOM

        // Funções auxiliares de formatação
        const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : '-';
        const formatarData = (data) => data ? data.split('-').reverse().join('/') : '-';
        const get = (obj, path, defaultValue = '-') => {
            const value = path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : undefined), obj);
            return value !== undefined ? value : defaultValue;
        };

        // Mapeamento das colunas para os dados do lançamento (mantido como estava)
        const dataMapping = {
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

        // Itera sobre cada GRUPO de OS para criar um item do acordeão
        grupos.forEach((grupo, index) => {
            const uniqueId = `${grupo.id}-${index}`; // ID único para o acordeão
            const item = document.createElement('div');
            item.className = 'accordion-item';

            // Verifica se algum lançamento no grupo tem prazo vencido
            const isVencido = grupo.linhas.some(lancamento => {
                const dataPrazo = lancamento.dataPrazo ? parseDataBrasileira(lancamento.dataPrazo) : null;
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                return dataPrazo && dataPrazo < hoje;
            });

            // Lógica para definir o título da OS (incluindo se for complementar)
            const primeiroLancamento = grupo.linhas[0];
            // Acessa os dados da OS a partir do primeiro lançamento para pegar o valor legado
            const dadosOS = primeiroLancamento.os || {};

            const isComplementar = get(primeiroLancamento, 'detalhe.key', '').includes('_AC_');
            let tituloOS = grupo.os;
            if (isComplementar) {
                const lpu = get(primeiroLancamento, 'detalhe.lpu.nomeLpu', '');
                tituloOS = `${grupo.os} (Complementar: ${lpu})`;
            }

            // Define a classe do botão do acordeão (vermelho se vencido)
            const buttonClass = isVencido ? 'accordion-button collapsed accordion-button-vencido' : 'accordion-button collapsed';

            // --- CÁLCULOS DOS KPIS (INCLUINDO LEGADO) ---
            // 1. Definindo as variáveis corretamente para uso no template string
            const valorTotalOS = grupo.totalOs || 0;
            const valorTotalCPS = grupo.valorCps || 0; // Total Aprovado
            const custoTotalMateriais = grupo.custoTotalMateriais || 0;
            const totalPendente = grupo.valorPendente || 0;

            // Dados vindos da entidade OS
            const valorCpsLegado = dadosOS.valorCpsLegado || 0;
            const valorTransporte = dadosOS.transporte || 0;

            // Previsão de Serviços (Aprovado + Pendente + Legado)
            const previsaoCps = valorTotalCPS + totalPendente + valorCpsLegado;

            // 1. Percentual Atual (O que já foi gasto/aprovado de fato)
            const percentualAtual = valorTotalOS > 0
                ? ((valorTotalCPS + custoTotalMateriais + valorCpsLegado + valorTransporte) / valorTotalOS) * 100
                : 0;

            // Definimos 'percentual' para ser usado no HTML
            const percentual = percentualAtual;

            // HTML dos KPIs (indicadores) do cabeçalho
            let kpiHTML = `
            <div class="header-kpi-wrapper">
                <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(valorTotalOS)}</span></div>
                
                ${valorCpsLegado > 0 ? `<div class="header-kpi"><span class="kpi-label text-warning">Legado</span><span class="kpi-value text-warning">${formatarMoeda(valorCpsLegado)}</span></div>` : ''}
                
                <div class="header-kpi"><span class="kpi-label">CPS</span><span class="kpi-value">${formatarMoeda(valorTotalCPS)}</span></div>
                
                <div class="header-kpi"><span class="kpi-label">Material</span><span class="kpi-value">${formatarMoeda(custoTotalMateriais)}</span></div>
                
                <div class="header-kpi"><span class="kpi-label">Transp.</span><span class="kpi-value">${formatarMoeda(valorTransporte)}</span></div>

                <div class="header-kpi"><span class="kpi-label">%</span><span class="kpi-value kpi-percentage">${percentual.toFixed(2)}%</span></div>
            </div>`;

            const headerHTML = `
            <h2 class="accordion-header position-relative" id="heading-${uniqueId}">
                <div class="position-absolute top-50 start-0 translate-middle-y ms-3" style="z-index: 5;">
                    <input class="form-check-input selecionar-todos-acordeon shadow-sm" type="checkbox" 
                           data-target-body="collapse-${uniqueId}" 
                           style="cursor: pointer; margin: 0;">
                </div>
                <button class="${buttonClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                    <div class="header-content w-100 ps-5"> <div class="header-title-wrapper">
                            <span class="header-title-project">${grupo.projeto}</span>
                            <span class="header-title-os">${tituloOS}</span>
                        </div>
                        ${kpiHTML}
                        <span class="badge bg-primary header-badge">${grupo.linhas.length} itens pendentes</span>
                    </div>
                </button>
            </h2>`;

            // Define as colunas a serem exibidas na tabela interna
            let colunasParaRenderizar = [...colunas]; // Começa com todas as colunas
            if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                // Se for Controller, remove a coluna "PRAZO AÇÃO"
                colunasParaRenderizar = colunasParaRenderizar.filter(c => c !== "PRAZO AÇÃO");
            }

            // Gera o HTML das linhas da tabela interna
            const bodyRowsHTML = grupo.linhas.map(lancamento => {
                const cellsHTML = colunasParaRenderizar.map(header => {
                    const func = dataMapping[header]; // Pega a função correspondente à coluna
                    const valor = func ? func(lancamento) : '-'; // Executa a função ou usa '-'
                    let classes = ''; // Classes CSS adicionais para a célula
                    // Aplica estilo de cor para colunas de status (OK/NOK/NA)
                    if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(header)) {
                        classes += ' status-cell';
                        if (valor === 'OK') classes += ' status-ok';
                        else if (valor === 'NOK') classes += ' status-nok';
                        else if (valor === 'N/A') classes += ' status-na';
                    }
                    // Adiciona classe para a célula de detalhe diário (para abrir o modal)
                    if (header === "DETALHE DIÁRIO") {
                        classes += ' detalhe-diario-cell';
                    }
                    return `<td class="${classes}">${valor}</td>`; // Retorna o HTML da célula
                }).join('');
                // Retorna o HTML da linha completa (tr)
                return `<tr data-id="${lancamento.id}"><td><input type="checkbox" class="form-check-input linha-checkbox" data-id="${lancamento.id}"></td>${cellsHTML}</tr>`;
            }).join('');

            // HTML do corpo do acordeão (a tabela interna)
            const bodyHTML = `
            <div id="collapse-${uniqueId}" class="accordion-collapse collapse">
                <div class="accordion-body">
                    <div class="table-responsive">
                        <table class="table modern-table table-sm">
                            <thead>
                                <tr>
                                    <th></th> ${colunasParaRenderizar.map(c => `<th>${c}</th>`).join('')} </tr>
                            </thead>
                            <tbody data-group-id="${uniqueId}">
                                ${bodyRowsHTML} </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

            // Junta o cabeçalho e o corpo e adiciona ao fragmento
            item.innerHTML = headerHTML + bodyHTML;
            frag.appendChild(item);
        });

        // Adiciona todos os itens do acordeão ao container de uma só vez
        accordionContainer.appendChild(frag);
    }

    function prepararAcaoLote(tipoAcao) {
        // 1. Coletar IDs selecionados
        const checkboxes = document.querySelectorAll('.cps-check:checked');
        idsLoteSelecionados = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-id')));

        if (idsLoteSelecionados.length === 0) {
            alert("Nenhum item selecionado!");
            return;
        }

        // 2. Configurar o Modal com base na ação
        acaoLoteAtual = tipoAcao;
        const modalEl = document.getElementById('modalAcaoLoteCPS');
        const modal = new bootstrap.Modal(modalEl);

        const titulo = document.getElementById('tituloModalLote');
        const texto = document.getElementById('textoModalLote');
        const btn = document.getElementById('btnConfirmarLote');
        const inputMotivo = document.getElementById('motivoLoteInput');
        const avisoMotivo = document.getElementById('avisoMotivo');
        const resumo = document.getElementById('resumoLote');

        // Limpa campo
        inputMotivo.value = '';
        avisoMotivo.classList.add('d-none');

        // Configuração Visual
        resumo.innerHTML = `Você selecionou <strong>${idsLoteSelecionados.length}</strong> itens para esta ação.`;

        if (tipoAcao === 'fechar') {
            titulo.textContent = "Confirmar Fechamento em Lote";
            titulo.className = "modal-title text-success";
            texto.textContent = "Deseja fechar todos os itens selecionados para pagamento?";
            btn.textContent = "Sim, Fechar";
            btn.className = "btn btn-success";
            // Para fechar, motivo não costuma ser obrigatório, mas deixamos disponível
        }
        else if (tipoAcao === 'recusar' || tipoAcao === 'recusar-controller') {
            titulo.textContent = "Confirmar Recusa em Lote";
            titulo.className = "modal-title text-danger";
            texto.textContent = "Deseja recusar/devolver os itens selecionados?";
            btn.textContent = "Sim, Recusar";
            btn.className = "btn btn-danger";
            // Aviso que motivo é obrigatório
            avisoMotivo.classList.remove('d-none');
        }

        // 3. Exibir o Modal
        modal.show();
    }

    /**
     * Função executada ao clicar em "Confirmar" dentro do Modal
     */
    async function executarAcaoLote() {
        const motivo = document.getElementById('motivoLoteInput').value.trim();
        const modalEl = document.getElementById('modalAcaoLoteCPS');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);

        // Validação de Motivo para Recusas
        if ((acaoLoteAtual.includes('recusar')) && !motivo) {
            alert("Para recusar, é obrigatório informar uma justificativa.");
            return;
        }

        // Define endpoint e corpo baseado na ação
        let url = '';
        let body = {};
        const usuarioId = localStorage.getItem("usuarioId"); // Ajuste conforme seu auth

        if (acaoLoteAtual === 'fechar') {
            url = `${API_BASE_URL}/controle-cps/fechar-lote`;
            body = {
                lancamentoIds: idsLoteSelecionados,
                coordenadorId: usuarioId
            };
        } else if (acaoLoteAtual === 'recusar') {
            url = `${API_BASE_URL}/controle-cps/recusar-lote`;
            body = {
                lancamentoIds: idsLoteSelecionados,
                coordenadorId: usuarioId,
                motivo: motivo
            };
        } else if (acaoLoteAtual === 'recusar-controller') {
            url = `${API_BASE_URL}/controle-cps/recusar-controller-lote`;
            body = {
                lancamentoIds: idsLoteSelecionados,
                controllerId: usuarioId,
                motivo: motivo
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': usuarioId
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert("Ação em lote realizada com sucesso!");
                modalInstance.hide();
                carregarPendenciasCPS(); // Recarrega a tela
            } else {
                const err = await response.text();
                alert("Erro ao processar lote: " + err);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão ao tentar processar lote.");
        }
    }



    function renderizarCardsDashboard(todosLancamentos, pendenciasPorCoordenador, pendenciasMateriaisCount, pendenciasComplementaresCount) {
        const dashboardContainer = document.getElementById('dashboard-container');
        const coordenadoresContainer = document.getElementById('dashboard-coordenadores-container');
        const coordenadoresCards = document.getElementById('coordenadores-cards');

        if (!dashboardContainer || !coordenadoresContainer || !coordenadoresCards) return;

        const hojeString = new Date().toLocaleDateString('pt-BR');
        let cardsHtml = '';

        dashboardContainer.innerHTML = '';
        coordenadoresCards.innerHTML = '';
        coordenadoresContainer.style.display = 'none';

        if (userRole !== 'MANAGER') {
            cardsHtml += `
                <div class="card card-stat card-perigo">
                    <div class="card-body"><h5>Pendências de Materiais</h5><p>${pendenciasMateriaisCount}</p></div>
                </div>
                <div class="card card-stat card-perigo">
                    <div class="card-body"><h5>Ativ. Complementares</h5><p>${pendenciasComplementaresCount}</p></div>
                </div>
            `;
        }

        if (userRole === 'COORDINATOR') {
            // Lógica para Coordenador... (código existente)

        } else if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            const pendenciasGerais = todosLancamentos.filter(l => l.situacaoAprovacao === 'PENDENTE_CONTROLLER').length;
            const solicitacoesPrazo = todosLancamentos.filter(l => l.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO').length;
            const prazosVencidos = todosLancamentos.filter(l => l.situacaoAprovacao === 'PRAZO_VENCIDO').length;
            const aprovadosHoje = todosLancamentos.filter(l => {
                const dataAcao = l.ultUpdate ? new Date(parseDataBrasileira(l.ultUpdate)).toLocaleDateString('pt-BR') : null;
                return l.situacaoAprovacao === 'APROVADO' && dataAcao === hojeString;
            }).length;


            cardsHtml += `
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

            if (pendenciasPorCoordenador && pendenciasPorCoordenador.length > 0) {
                coordenadoresContainer.style.display = 'block';
                let coordenadoresHtml = '';
                pendenciasPorCoordenador.forEach(item => {
                    coordenadoresHtml += `
                    <div class="card card-stat card-planejamento">
                        <div class="card-body">
                            <h5>${item.coordenadorNome}</h5>
                            <p>${item.quantidade}</p>
                        </div>
                    </div>
                `;
                });
                coordenadoresCards.innerHTML = coordenadoresHtml;
            }
        }
        dashboardContainer.innerHTML = cardsHtml;
    }

    function renderizarTabelaPendentesComplementares(solicitacoes) {
        const tbody = document.getElementById('tbody-pendentes-complementares');
        if (!tbody) return;

        const thead = tbody.previousElementSibling;
        thead.innerHTML = '';
        tbody.innerHTML = '';

        thead.innerHTML = `
            <tr>
                <th><input type="checkbox" class="form-check-input" id="selecionar-todos-complementar" title="Selecionar Todos"></th>
                <th>Ações</th>
                <th>Data Solicitação</th>
                <th>Solicitante</th>
                <th>OS</th>
                <th>Segmento</th> 
                <th>LPU</th>
                <th class="text-center">Quantidade</th>
                <th>Justificativa</th>
                <th>Status</th>
            </tr>
        `;

        if (!solicitacoes || solicitacoes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">Nenhuma pendência de atividade complementar.</td></tr>`;
            return;
        }

        solicitacoes.forEach(s => {
            const tr = document.createElement('tr');
            tr.dataset.id = s.id;
            let acoesHtml = '';
            let statusBadge = '';
            let checkboxHtml = `<input type="checkbox" class="form-check-input linha-checkbox-complementar" data-id="${s.id}">`;
            const statusFormatado = (s.status || '').replace(/_/g, ' ');

            if ((userRole === 'COORDINATOR' && s.status === 'PENDENTE_COORDENADOR') || ((userRole === 'CONTROLLER' || userRole === 'ADMIN') && s.status === 'PENDENTE_CONTROLLER')) {
                acoesHtml = `
                    <button class="btn btn-sm btn-outline-success" title="Aprovar" onclick="aprovarComplementar(${s.id})"><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-sm btn-outline-danger" title="Recusar" onclick="recusarComplementar(${s.id})"><i class="bi bi-x-lg"></i></button>
                `;
                statusBadge = `<span class="badge rounded-pill text-bg-warning">${statusFormatado}</span>`;
            } else {
                checkboxHtml = ''; // Não mostra checkbox se não for passível de ação
                acoesHtml = `—`;
                statusBadge = `<span class="badge rounded-pill text-bg-info">${statusFormatado}</span>`;
            }

            const dataFormatada = s.dataSolicitacao ? new Date(parseDataBrasileira(s.dataSolicitacao)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data inválida';

            tr.innerHTML = `
                <td data-label="Selecionar">${checkboxHtml}</td>
                <td data-label="Ações" class="text-center">${acoesHtml}</td>
                <td data-label="Data">${dataFormatada}</td>
                <td data-label="Solicitante">${s.solicitanteNome || 'N/A'}</td>
                <td data-label="OS">${s.os.os}</td>
                <td data-label="Segmento">${s.os.segmento ? s.os.segmento.nome : 'N/A'}</td>
                <td data-label="LPU">${s.lpu.codigoLpu} - ${s.lpu.nomeLpu}</td>
                <td data-label="Quantidade" class="text-center">${s.quantidade}</td>
                <td data-label="Justificativa">${s.justificativa || ''}</td>
                <td data-label="Status">${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderizarTabelaHistoricoComplementares(solicitacoes) {
        const tbody = document.getElementById('tbody-historico-complementares');
        if (!tbody) return;

        const thead = tbody.previousElementSibling;
        thead.innerHTML = '';
        tbody.innerHTML = '';

        thead.innerHTML = `
            <tr>
                <th>Status Final</th>
                <th>Data Solicitação</th>
                <th>Solicitante</th>
                <th>OS</th>
                <th>Segmento</th>
                <th>LPU</th>
                <th>Coordenador</th>
                <th>Data Ação Coord.</th>
                <th>Controller</th>
                <th>Data Ação Contr.</th>
                <th>Motivo Recusa</th>
            </tr>
        `;

        if (!solicitacoes || solicitacoes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted">Nenhum histórico encontrado.</td></tr>`;
            return;
        }

        solicitacoes.forEach(s => {
            const tr = document.createElement('tr');

            let statusBadge = '';
            const statusFormatado = (s.status || '').replace(/_/g, ' ');

            switch (s.status) {
                case 'APROVADO':
                    statusBadge = `<span class="badge rounded-pill text-bg-success">${statusFormatado}</span>`;
                    break;
                case 'REJEITADO':
                    statusBadge = `<span class="badge rounded-pill text-bg-danger">${statusFormatado}</span>`;
                    break;
                case 'PENDENTE_COORDENADOR':
                    statusBadge = `<span class="badge rounded-pill text-bg-primary">${statusFormatado}</span>`;
                    break;
                case 'PENDENTE_CONTROLLER':
                    statusBadge = `<span class="badge rounded-pill text-bg-warning">${statusFormatado}</span>`;
                    break;
                default:
                    statusBadge = `<span class="badge rounded-pill text-bg-secondary">${statusFormatado}</span>`;
            }

            const dataSolicitacaoFmt = s.dataSolicitacao ? new Date(parseDataBrasileira(s.dataSolicitacao)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
            const dataAcaoCoordFmt = s.dataAcaoCoordenador ? new Date(parseDataBrasileira(s.dataAcaoCoordenador)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
            const dataAcaoContrFmt = s.dataAcaoController ? new Date(parseDataBrasileira(s.dataAcaoController)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

            tr.innerHTML = `
                <td data-label="Status">${statusBadge}</td>
                <td data-label="Data Solicitação">${dataSolicitacaoFmt}</td>
                <td data-label="Solicitante">${s.solicitanteNome || 'N/A'}</td>
                <td data-label="OS">${s.os.os}</td>
                <td data-label="Segmento">${s.os.segmento ? s.os.segmento.nome : 'N/A'}</td>
                <td data-label="LPU">${s.lpu.codigoLpu} - ${s.lpu.nomeLpu}</td>
                <td data-label="Coordenador">${s.aprovadorCoordenadorNome || '—'}</td>
                <td data-label="Data Ação Coord.">${dataAcaoCoordFmt}</td>
                <td data-label="Controller">${s.aprovadorControllerNome || '—'}</td>
                <td data-label="Data Ação Contr.">${dataAcaoContrFmt}</td>
                <td data-label="Motivo Recusa" style="white-space: normal;">${s.motivoRecusa || '—'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function carregarDadosMateriais() {
        if (!document.getElementById('tbody-pendentes-materiais')) return;
        toggleLoader(true, '#materiais-pane');
        toggleLoader(true, '#historico-materiais-pane');

        try {
            // ==========================================================
            // INÍCIO DA CORREÇÃO 1 (Remoção do Cache)
            // ==========================================================
            // REMOVIDO: if (todasPendenciasMateriais.length === 0) { ... }

            const pendentesResponse = await fetchComAuth(`${API_BASE_URL}/solicitacoes/pendentes`, {
                headers: { 'X-User-Role': userRole, 'X-User-ID': userId }
            });
            if (!pendentesResponse.ok) throw new Error('Falha ao carregar pendências de materiais.');
            todasPendenciasMateriais = await pendentesResponse.json();

            // REMOVIDO: O histórico agora é carregado pela sua própria aba
            // const historicoResponse = await fetchComAuth(`${API_BASE_URL}/solicitacoes/historico/${userId}`);
            // ...
            // todosHistoricoMateriais = await historicoResponse.json();

            // Popula o filtro (pode ser otimizado para não rodar sempre)
            if (filtroSegmentoMateriais.options.length <= 1) {
                popularFiltroSegmento();
            }

            renderizarTabelaPendentesMateriais(); // Renderiza com os dados (novos ou cacheados)
            // REMOVIDO: renderizarTabelaHistoricoMateriais();
            // ==========================================================
            // FIM DA CORREÇÃO 1
            // ==========================================================

        } catch (error) {
            console.error("Erro ao carregar dados de materiais:", error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false, '#materiais-pane');
            toggleLoader(false, '#historico-materiais-pane');
        }
    }

    // ==========================================================
    // INÍCIO DA CORREÇÃO 1 (Nova Função de Histórico)
    // ==========================================================
    async function carregarDadosHistoricoMateriais() {
        if (!tbodyHistoricoMateriais) return;
        toggleLoader(true, '#historico-materiais-pane');
        try {
            const historicoResponse = await fetchComAuth(`${API_BASE_URL}/solicitacoes/historico/${userId}`);
            if (!historicoResponse.ok) throw new Error('Falha ao carregar histórico de materiais.');
            todosHistoricoMateriais = await historicoResponse.json();

            // Popula o filtro (se ainda não foi populado pela aba de pendências)
            if (filtroSegmentoMateriais.options.length <= 1) {
                popularFiltroSegmento();
            }

            renderizarTabelaHistoricoMateriais();
        } catch (error) {
            console.error("Erro ao carregar dados de histórico de materiais:", error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false, '#historico-materiais-pane');
        }
    }
    // ==========================================================
    // FIM DA CORREÇÃO 1
    // ==========================================================


    async function carregarDadosComplementares() {
        const tabComplementares = document.getElementById('complementares-tab');
        if (!tabComplementares) return;
        toggleLoader(true, '#complementares-pane');

        try {
            // ==========================================================
            // INÍCIO DA CORREÇÃO 1 (Remoção do Cache)
            // ==========================================================
            // REMOVIDO: if (todasPendenciasComplementares.length === 0) { ... }

            const response = await fetchComAuth(`${API_BASE_URL}/solicitacoes-complementares/pendentes`, {
                headers: { 'X-User-Role': userRole, 'X-User-ID': userId }
            });
            if (!response.ok) throw new Error('Falha ao carregar pendências de ativ. complementares.');
            todasPendenciasComplementares = await response.json();

            renderizarTabelaPendentesComplementares(todasPendenciasComplementares);
            // ==========================================================
            // FIM DA CORREÇÃO 1
            // ==========================================================
        } catch (error) {
            console.error("Erro ao carregar dados de atividades complementares:", error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false, '#complementares-pane');
        }
    }

    async function carregarDadosHistoricoComplementares() {
        if (!document.getElementById('tbody-historico-complementares')) return;
        toggleLoader(true, '#historico-complementares-pane');

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/solicitacoes-complementares/historico/${userId}`);
            if (!response.ok) throw new Error('Falha ao carregar histórico de atividades complementares.');

            todoHistoricoComplementares = await response.json();
            renderizarTabelaHistoricoComplementares(todoHistoricoComplementares);

        } catch (error) {
            console.error("Erro ao carregar histórico de ativ. complementares:", error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false, '#historico-complementares-pane');
        }
    }


    function popularFiltroSegmento() {
        const segmentos = new Set();
        // Garante que ambos os arrays (pendentes e histórico) existam antes de tentar iterar
        (todasPendenciasMateriais || []).forEach(s => {
            if (s.os.segmento) segmentos.add(JSON.stringify(s.os.segmento));
        });
        (todosHistoricoMateriais || []).forEach(s => {
            if (s.os.segmento) segmentos.add(JSON.stringify(s.os.segmento));
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
        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
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

            if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
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
                ${(userRole === 'CONTROLLER' || userRole === 'ADMIN') ? `<td data-label="Status">${statusHtml}</td>` : ''}
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

    async function carregarDadosAtividades() {
        toggleLoader(true, '#atividades-pane');
        toggleLoader(true, '#historico-atividades-pane');
        try {
            // ==========================================================
            // INÍCIO DA CORREÇÃO 1 (Remoção do Cache)
            // ==========================================================
            // REMOVIDO: if (todosOsLancamentosGlobais.length === 0)

            const [responseGeral, responseHistorico, responsePendenciasAtiv] = await Promise.all([
                fetchComAuth(`${API_BASE_URL}/lancamentos`),
                fetchComAuth(`${API_BASE_URL}/lancamentos/historico/${userId}`),
                fetchComAuth(`${API_BASE_URL}/lancamentos/pendentes/${userId}`) // Busca as pendências atualizadas
            ]);

            if (!responseGeral.ok || !responseHistorico.ok || !responsePendenciasAtiv.ok) {
                throw new Error('Falha ao carregar dados de atividades.');
            }

            todosOsLancamentosGlobais = await responseGeral.json();
            const historicoParaExibir = await responseHistorico.json();
            todasPendenciasAtividades = await responsePendenciasAtiv.json(); // Atualiza o array global de pendências

            renderizarTabelaHistorico(historicoParaExibir);
            renderizarAcordeonPendencias(todasPendenciasAtividades); // Renderiza com os dados atualizados
            // ==========================================================
            // FIM DA CORREÇÃO 1
            // ==========================================================


            if (userRole === 'COORDINATOR') {
                document.getElementById('titulo-tabela').innerHTML = '<i class="bi bi-clock-history me-2"></i> Pendências';
            } else if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                document.getElementById('titulo-tabela').innerHTML = '<i class="bi bi-shield-check me-2"></i> Pendências do Controller';
            }

        } catch (error) {
            console.error('Falha ao buscar dados de atividades:', error);
            mostrarToast('Falha ao carregar os dados da página de atividades.', 'error');
            const accordionContainer = document.getElementById('accordion-pendencias');
            if (accordionContainer) accordionContainer.innerHTML = `<div class="alert alert-danger">Falha ao carregar dados.</div>`;
        } finally {
            toggleLoader(false, '#atividades-pane');
            toggleLoader(false, '#historico-atividades-pane');
        }
    }

    // ==========================================================
    // INÍCIO DA CORREÇÃO 1 (Nova Função de Histórico)
    // ==========================================================
    async function carregarDadosHistoricoAtividades() {
        if (!tbodyHistorico) return;
        toggleLoader(true, '#historico-atividades-pane');
        try {
            const responseHistorico = await fetchComAuth(`${API_BASE_URL}/lancamentos/historico/${userId}`);
            if (!responseHistorico.ok) throw new Error('Falha ao carregar histórico de atividades.');
            const historicoParaExibir = await responseHistorico.json();
            renderizarTabelaHistorico(historicoParaExibir);
        } catch (error) {
            console.error('Falha ao buscar dados de histórico de atividades:', error);
            mostrarToast('Falha ao carregar o histórico de atividades.', 'error');
        } finally {
            toggleLoader(false, '#historico-atividades-pane');
        }
    }
    // ==========================================================
    // FIM DA CORREÇÃO 1
    // ==========================================================


    const inputValorAdiantamento = document.getElementById('valorAdiantamentoInput');
    if (inputValorAdiantamento) {
        inputValorAdiantamento.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            value = (Number(value) / 100).toFixed(2) + '';
            e.target.value = value.replace('.', ',');
        });
    }

    async function carregarDashboardEBadges() {
        // Mostra o loader no container do dashboard
        toggleLoader(true, '.overview-card');

        try {
            const userId = localStorage.getItem('usuarioId');

            const [
                responseGeral,
                responsePendenciasAtiv,
                responsePendenciasCoord,
                responsePendenciasMat,
                responsePendenciasCompl
            ] = await Promise.all([
                fetchComAuth(`${API_BASE_URL}/lancamentos`),
                fetchComAuth(`${API_BASE_URL}/lancamentos/pendentes/${userId}`),
                fetchComAuth(`${API_BASE_URL}/lancamentos/pendencias-por-coordenador`),
                fetchComAuth(`${API_BASE_URL}/solicitacoes/pendentes`, { headers: { 'X-User-Role': userRole, 'X-User-ID': userId } }),
                fetchComAuth(`${API_BASE_URL}/solicitacoes-complementares/pendentes`, { headers: { 'X-User-Role': userRole, 'X-User-ID': userId } })
            ]);

            if (!responseGeral.ok || !responsePendenciasAtiv.ok || !responsePendenciasCoord.ok || !responsePendenciasMat.ok || !responsePendenciasCompl.ok) {
                throw new Error('Falha ao carregar um ou mais dados do dashboard.');
            }

            todosOsLancamentosGlobais = await responseGeral.json();
            todasPendenciasAtividades = await responsePendenciasAtiv.json();
            const pendenciasPorCoordenador = await responsePendenciasCoord.json();
            todasPendenciasMateriais = await responsePendenciasMat.json();
            todasPendenciasComplementares = await responsePendenciasCompl.json();

            renderizarCardsDashboard(
                todosOsLancamentosGlobais,
                pendenciasPorCoordenador,
                todasPendenciasMateriais.length,
                todasPendenciasComplementares.length
            );

            const tabMateriais = document.getElementById('materiais-tab');
            if (tabMateriais) {
                let badgeMat = tabMateriais.querySelector('.badge');
                if (!badgeMat) {
                    badgeMat = document.createElement('span');
                    badgeMat.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
                    tabMateriais.appendChild(badgeMat);
                }
                const countMat = todasPendenciasMateriais.length;
                badgeMat.textContent = countMat > 9 ? '9+' : countMat;
                badgeMat.style.display = countMat > 0 ? '' : 'none';
            }

            const tabComplementares = document.getElementById('complementares-tab');
            if (tabComplementares) {
                let badgeCompl = tabComplementares.querySelector('.badge');
                if (!badgeCompl) {
                    badgeCompl = document.createElement('span');
                    badgeCompl.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
                    tabComplementares.appendChild(badgeCompl);
                }
                const countCompl = todasPendenciasComplementares.length;
                badgeCompl.textContent = countCompl > 9 ? '9+' : countCompl;
                badgeCompl.style.display = countCompl > 0 ? '' : 'none';
            }

        } catch (error) {
            console.error('Falha ao carregar dashboard e badges:', error);
            mostrarToast('Falha ao carregar o dashboard.', 'error');
            const dashboardContainer = document.getElementById('dashboard-container');
            if (dashboardContainer) dashboardContainer.innerHTML = `<div class="alert alert-danger">Falha ao carregar dashboard.</div>`;
        } finally {
            toggleLoader(false, '.overview-card');
        }
    }


    function renderizarTabelaHistorico(dados) {
        if (!tbodyHistorico) return;

        let sortConfig = { key: 'dataAtividade', direction: 'desc' };

        function sortData(dadosParaOrdenar) {
            dadosParaOrdenar.sort((a, b) => {
                let valA, valB;
                if (sortConfig.key === 'os') {
                    valA = a.os?.os || '';
                    valB = b.os?.os || '';
                } else if (sortConfig.key === 'valor') {
                    valA = a.valor || 0;
                    valB = b.valor || 0;
                } else {
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

        function render() {
            const statusFiltrado = document.getElementById('filtro-historico-status').value;
            let dadosFiltrados = statusFiltrado === 'todos' ?
                dados :
                dados.filter(l => l.situacaoAprovacao === statusFiltrado);

            dadosFiltrados = sortData(dadosFiltrados);

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

        render();
    }

    const collapseElement = document.getElementById('collapseAprovacoesCards');
    const collapseIcon = document.querySelector('a[href="#collapseAprovacoesCards"] i.bi');
    if (collapseElement && collapseIcon) {
        collapseElement.addEventListener('show.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-down', 'bi-chevron-up'));
        collapseElement.addEventListener('hide.bs.collapse', () => collapseIcon.classList.replace('bi-chevron-up', 'bi-chevron-down'));
    }

    // ==========================================================
    // INÍCIO DA CORREÇÃO 1 (Atualização dos Handlers)
    // ==========================================================

    document.getElementById('btnConfirmarAprovacao')?.addEventListener('click', async function () {
        const isAcaoEmLote = modalAprovar._element.dataset.acaoEmLote === 'true';
        const ids = isAcaoEmLote
            ? Array.from(document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked')).map(cb => cb.dataset.id)
            : [document.getElementById('aprovarLancamentoId').value];

        if (ids.length === 0) return;
        const primeiroLancamento = todosOsLancamentosGlobais.find(l => l.id == ids[0]);
        if (!primeiroLancamento) return;

        // >>> ADICIONE O LOADER AQUI <<<
        toggleLoader(true, '#atividades-pane');
        setButtonLoading(this, true);

        try {
            let endpoint = '';
            let payload = { lancamentoIds: ids, aprovadorId: userId };

            if (primeiroLancamento.situacaoAprovacao === 'PENDENTE_COORDENADOR') {
                endpoint = `${API_BASE_URL}/lancamentos/lote/coordenador-aprovar`;
            }
            else if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
                endpoint = primeiroLancamento.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO'
                    ? `${API_BASE_URL}/lancamentos/lote/prazo/aprovar`
                    : `${API_BASE_URL}/lancamentos/lote/controller-aprovar`;
            }

            const response = await fetchComAuth(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao aprovar.');

            mostrarToast(`${ids.length} item(ns) aprovado(s) com sucesso!`, 'success');
            modalAprovar.hide();

            // Recarrega o dashboard e as pendências
            await carregarDashboardEBadges();
            renderizarAcordeonPendencias(todasPendenciasAtividades);

        } catch (error) {
            mostrarToast(`Erro: ${error.message}`, 'error');
        } finally {
            setButtonLoading(this, false);
            delete modalAprovar._element.dataset.acaoEmLote;

            // >>> REMOVA O LOADER AQUI <<<
            toggleLoader(false, '#atividades-pane');
        }
    });

    // ==========================================================
    // LÓGICA DE SCROLL DAS ABAS
    // ==========================================================
    const tabsList = document.getElementById('aprovacoesTab');
    const btnLeft = document.getElementById('btnScrollLeft');
    const btnRight = document.getElementById('btnScrollRight');

    if (tabsList && btnLeft && btnRight) {

        // Função para verificar visibilidade dos botões
        const checkScrollButtons = () => {
            // Margem de tolerância (1px) para evitar bugs de arredondamento de tela
            const maxScrollLeft = tabsList.scrollWidth - tabsList.clientWidth - 1;

            // Se o conteúdo cabe todo na tela, esconde tudo
            if (tabsList.scrollWidth <= tabsList.clientWidth) {
                btnLeft.classList.add('d-none');
                btnRight.classList.add('d-none');
            } else {
                // Controla botão Esquerda
                if (tabsList.scrollLeft <= 0) {
                    btnLeft.classList.add('d-none');
                } else {
                    btnLeft.classList.remove('d-none');
                }

                // Controla botão Direita
                if (tabsList.scrollLeft >= maxScrollLeft) {
                    btnRight.classList.add('d-none');
                } else {
                    btnRight.classList.remove('d-none');
                }
            }
        };

        // Rolar para a ESQUERDA suavemente
        btnLeft.addEventListener('click', () => {
            tabsList.scrollBy({
                left: -300, // Quantidade de pixels para rolar
                behavior: 'smooth' // Mágica da suavidade
            });
            // Verifica os botões logo após iniciar e terminar o scroll
            setTimeout(checkScrollButtons, 100);
            setTimeout(checkScrollButtons, 500);
        });

        // Rolar para a DIREITA suavemente
        btnRight.addEventListener('click', () => {
            tabsList.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
            setTimeout(checkScrollButtons, 100);
            setTimeout(checkScrollButtons, 500);
        });

        // Eventos para recalcular a visibilidade das setas
        tabsList.addEventListener('scroll', checkScrollButtons);
        window.addEventListener('resize', checkScrollButtons);

        // Inicia
        checkScrollButtons();
    }

    document.getElementById('formRecusarLancamento')?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const btn = document.getElementById('btnConfirmarRecusa');
        const isAcaoEmLote = modalRecusar._element.dataset.acaoEmLote === 'true';
        const ids = isAcaoEmLote
            ? Array.from(document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked')).map(cb => cb.dataset.id)
            : [document.getElementById('recusarLancamentoId').value];

        if (ids.length === 0) return;

        const motivo = document.getElementById('motivoRecusa').value;
        // ... (lógica de endpoint igual ao original) ...
        let endpoint = '';
        let payload = {};

        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            endpoint = `${API_BASE_URL}/lancamentos/lote/controller-rejeitar`;
            payload = { lancamentoIds: ids, controllerId: userId, motivoRejeicao: motivo };
        } else {
            endpoint = `${API_BASE_URL}/lancamentos/lote/coordenador-rejeitar`;
            payload = { lancamentoIds: ids, aprovadorId: userId, comentario: motivo };
        }

        // >>> ADICIONE O LOADER AQUI <<<
        toggleLoader(true, '#atividades-pane');
        setButtonLoading(btn, true);

        try {
            const response = await fetchComAuth(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao recusar.');

            mostrarToast(`${ids.length} item(ns) recusado(s) com sucesso!`, 'success');
            modalRecusar.hide();

            await carregarDashboardEBadges();
            renderizarAcordeonPendencias(todasPendenciasAtividades);

        } catch (error) {
            mostrarToast(`Erro: ${error.message}`, 'error');
        } finally {
            setButtonLoading(btn, false);
            delete modalRecusar._element.dataset.acaoEmLote;

            // >>> REMOVA O LOADER AQUI <<<
            toggleLoader(false, '#atividades-pane');
        }
    });

    const formSolicitarAdiantamento = document.getElementById('formSolicitarAdiantamento');
    if (formSolicitarAdiantamento) {
        formSolicitarAdiantamento.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('adiantamentoLancamentoId').value;
            // Converte "1.000,00" para 1000.00
            const valorRaw = document.getElementById('valorSolicitadoInput').value;
            const valor = parseFloat(valorRaw.replace(/\./g, '').replace(',', '.'));
            const justificativa = document.getElementById('justificativaAdiantamentoInput').value;

            // Referência ao botão de submit para aplicar o efeito de loading
            const btnSubmit = formSolicitarAdiantamento.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerHTML;

            if (!valor || valor <= 0) {
                mostrarToast("Digite um valor válido maior que zero.", "warning");
                return;
            }

            // Fecha o modal visualmente (mas mantém a lógica rodando)
            const modalEl = document.getElementById('modalSolicitarAdiantamento');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);

            // EFEITO DE LOADING
            toggleLoader(true, '#cps-pendencias-pane');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Enviando...`;

            try {
                const userId = localStorage.getItem('usuarioId');
                const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}/solicitar-adiantamento`, {
                    method: 'POST',
                    body: JSON.stringify({
                        valor: valor,
                        usuarioId: userId,
                        justificativa: justificativa
                    })
                });

                if (!response.ok) throw new Error((await response.json()).message || "Erro ao solicitar.");

                mostrarToast("Solicitação de adiantamento enviada!", "success");
                modalInstance.hide();

                // Recarrega a lista
                document.getElementById('btn-atualizar-cps').click();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleLoader(false, '#cps-pendencias-pane');
                // Restaura o botão
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginal;
            }
        });
    }

    document.getElementById('formComentarPrazo')?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const btn = document.getElementById('btnEnviarComentario');
        const isAcaoEmLote = modalComentar._element.dataset.acaoEmLote === 'true';
        const ids = isAcaoEmLote
            ? Array.from(document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked')).map(cb => cb.dataset.id)
            : [document.getElementById('comentarLancamentoId').value];

        if (ids.length === 0) return;

        // ... (lógica de endpoint igual ao original) ...
        let endpoint = '';
        let payload = {};
        const comentario = document.getElementById('comentarioCoordenador').value;
        const novaData = document.getElementById('novaDataProposta').value;

        if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
            endpoint = `${API_BASE_URL}/lancamentos/lote/prazo/rejeitar`;
            payload = { lancamentoIds: ids, controllerId: userId, motivoRejeicao: comentario, novaDataPrazo: novaData };
        } else {
            endpoint = `${API_BASE_URL}/lancamentos/lote/coordenador-solicitar-prazo`;
            payload = { lancamentoIds: ids, coordenadorId: userId, comentario: comentario, novaDataSugerida: novaData };
        }

        // >>> ADICIONE O LOADER AQUI <<<
        toggleLoader(true, '#atividades-pane');
        setButtonLoading(btn, true);

        try {
            const response = await fetchComAuth(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao enviar solicitação.');

            mostrarToast(`Ação realizada com sucesso para ${ids.length} item(ns)!`, 'success');
            modalComentar.hide();

            await carregarDashboardEBadges();
            renderizarAcordeonPendencias(todasPendenciasAtividades);

        } catch (error) {
            mostrarToast(`Erro: ${error.message}`, 'error');
        } finally {
            setButtonLoading(btn, false);
            delete modalComentar._element.dataset.acaoEmLote;

            // >>> REMOVA O LOADER AQUI <<<
            toggleLoader(false, '#atividades-pane');
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
            if ((userRole === 'COORDINATOR' || userRole === 'MANAGER' || userRole === 'ADMIN') && primeiroStatus === 'PENDENTE_COORDENADOR') {
                [btnAprovar, btnRecusar, btnPrazo].forEach(btn => btn.style.display = 'inline-block');
            } else if (userRole === 'CONTROLLER' || userRole === 'ADMIN') {
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

                // Recarrega o dashboard (que recarrega os dados globais)
                await carregarDashboardEBadges();
                // Re-renderiza a tabela de materiais com os dados globais atualizados
                renderizarTabelaPendentesMateriais();

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

                // Recarrega o dashboard (que recarrega os dados globais)
                await carregarDashboardEBadges();
                // Re-renderiza a tabela de materiais com os dados globais atualizados
                renderizarTabelaPendentesMateriais();

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                setButtonLoading(btn, false);
            }
        });
    }

    const btnConfirmarAprovacaoComplementar = document.getElementById('btnConfirmarAprovacaoComplementar');
    if (btnConfirmarAprovacaoComplementar) {
        btnConfirmarAprovacaoComplementar.addEventListener('click', async function () {
            const isAcaoEmLote = modalAprovarComplementar._element.dataset.acaoEmLote === 'true';
            const ids = isAcaoEmLote
                ? Array.from(document.querySelectorAll('#tbody-pendentes-complementares .linha-checkbox-complementar:checked')).map(cb => cb.dataset.id)
                : [this.dataset.id];

            if (ids.length === 0) return;

            const endpoint = userRole === 'COORDINATOR'
                ? `${API_BASE_URL}/solicitacoes-complementares/lote/coordenador/aprovar`
                : `${API_BASE_URL}/solicitacoes-complementares/lote/controller/aprovar`;

            setButtonLoading(this, true);
            try {
                const response = await fetchComAuth(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ solicitacaoIds: ids, aprovadorId: userId })
                });
                if (!response.ok) throw new Error((await response.json()).message || 'Falha ao aprovar.');

                mostrarToast(`${ids.length} solicitação(ões) complementar(es) aprovada(s)!`, 'success');
                modalAprovarComplementar.hide();

                // Recarrega o dashboard (que recarrega os dados globais)
                await carregarDashboardEBadges();
                // Re-renderiza a tabela de complementares com os dados globais atualizados
                renderizarTabelaPendentesComplementares(todasPendenciasComplementares);

                // Força o recarregamento do histórico na próxima visita
                const painelHistCompl = document.getElementById('historico-complementares-pane');
                if (painelHistCompl) painelHistCompl.dataset.loaded = 'false';

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                setButtonLoading(this, false);
                delete modalAprovarComplementar._element.dataset.acaoEmLote;
            }
        });
    }

    const formRecusarComplementar = document.getElementById('formRecusarComplementar');
    if (formRecusarComplementar) {
        formRecusarComplementar.addEventListener('submit', async function (event) {
            event.preventDefault();
            const isAcaoEmLote = modalRecusarComplementar._element.dataset.acaoEmLote === 'true';
            const ids = isAcaoEmLote
                ? Array.from(document.querySelectorAll('#tbody-pendentes-complementares .linha-checkbox-complementar:checked')).map(cb => cb.dataset.id)
                : [this.dataset.id];

            if (ids.length === 0) return;

            const motivo = document.getElementById('motivoRecusaComplementar').value;
            const btn = document.getElementById('btnConfirmarRecusaComplementar');

            const endpoint = userRole === 'COORDINATOR'
                ? `${API_BASE_URL}/solicitacoes-complementares/lote/coordenador/rejeitar`
                : `${API_BASE_URL}/solicitacoes-complementares/lote/controller/rejeitar`;

            setButtonLoading(btn, true);
            try {
                const response = await fetchComAuth(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ solicitacaoIds: ids, aprovadorId: userId, motivo: motivo })
                });
                if (!response.ok) throw new Error((await response.json()).message || 'Falha ao recusar.');

                mostrarToast(`${ids.length} solicitação(ões) complementar(es) recusada(s).`, 'success');
                modalRecusarComplementar.hide();

                // Recarrega o dashboard (que recarrega os dados globais)
                await carregarDashboardEBadges();
                // Re-renderiza a tabela de complementares com os dados globais atualizados
                renderizarTabelaPendentesComplementares(todasPendenciasComplementares);

                // Força o recarregamento do histórico na próxima visita
                const painelHistCompl = document.getElementById('historico-complementares-pane');
                if (painelHistCompl) painelHistCompl.dataset.loaded = 'false';

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                setButtonLoading(btn, false);
                delete modalRecusarComplementar._element.dataset.acaoEmLote;
            }
        });
    }
    // ==========================================================
    // FIM DA CORREÇÃO 1
    // ==========================================================


    if (filtroHistoricoStatus) {
        filtroHistoricoStatus.addEventListener('change', async () => {
            // Apenas re-renderiza os dados de histórico que já foram carregados
            await carregarDadosHistoricoAtividades();
        });
    }

    btnRecusarSelecionados.addEventListener('click', () => {
        const checkboxesSelecionados = document.querySelectorAll('#accordion-pendencias .linha-checkbox:checked');
        if (checkboxesSelecionados.length === 0) return;

        const primeiroId = checkboxesSelecionados[0].dataset.id;
        const primeiroLancamento = todosOsLancamentosGlobais.find(l => l.id == primeiroId);

        if ((userRole === 'CONTROLLER' || userRole === 'ADMIN') && (primeiroLancamento.situacaoAprovacao === 'AGUARDANDO_EXTENSAO_PRAZO' || primeiroLancamento.situacaoAprovacao === 'PRAZO_VENCIDO')) {
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

    const accordionContainer = document.getElementById('accordion-pendencias');
    if (accordionContainer) {
        // ==========================================================
        // INÍCIO DA CORREÇÃO 2 (Novo Listener de CLICK)
        // ==========================================================
        accordionContainer.addEventListener('click', (e) => {
            // Se o clique foi no container do checkbox do header
            if (e.target.closest('.check-container-header')) {
                // Impede que o clique "borbulhe" até o botão do acordeão e o abra/feche
                e.stopPropagation();
            }
        });
        // ==========================================================
        // FIM DA CORREÇÃO 2
        // ==========================================================

        accordionContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('selecionar-todos-acordeon')) {
                const headerCheckbox = e.target;
                const isChecked = headerCheckbox.checked;
                const targetBodyId = headerCheckbox.dataset.targetBody;

                const accordionItem = headerCheckbox.closest('.accordion-item');
                if (!accordionItem) return;

                const accordionButton = accordionItem.querySelector('.accordion-button');
                if (accordionButton) {
                    if (isChecked) {
                        accordionButton.classList.add('header-selected');
                    } else {
                        accordionButton.classList.remove('header-selected');
                    }
                }

                const itemCheckboxes = accordionItem.querySelectorAll(`#${targetBodyId} .linha-checkbox`);
                itemCheckboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                    const linha = checkbox.closest('tr');
                    if (linha) {
                        linha.classList.toggle('table-active', isChecked);
                    }
                });

                const bodySelectAll = accordionItem.querySelector('.selecionar-todos-grupo');
                if (bodySelectAll) {
                    bodySelectAll.checked = isChecked;
                    bodySelectAll.indeterminate = false;
                }

                atualizarEstadoAcoesLote();
            }
        });
    }

    document.getElementById('atividades-pane').addEventListener('change', (e) => {
        const target = e.target;

        if (target.classList.contains('linha-checkbox')) {
            const linha = target.closest('tr');
            linha.classList.toggle('table-active', target.checked);

            const accordionItem = target.closest('.accordion-item');
            if (accordionItem) {
                const allCheckboxesInGroup = accordionItem.querySelectorAll('.linha-checkbox');
                const checkedCount = Array.from(allCheckboxesInGroup).filter(cb => cb.checked).length;
                const totalCount = allCheckboxesInGroup.length;

                const headerCheckbox = accordionItem.querySelector('.selecionar-todos-acordeon');
                // Busca o botão para alterar a cor
                const accordionButton = accordionItem.querySelector('.accordion-button');

                if (headerCheckbox) {
                    if (checkedCount === 0) {
                        headerCheckbox.checked = false;
                        headerCheckbox.indeterminate = false;

                        if (accordionButton) accordionButton.classList.remove('header-selected');
                    } else if (checkedCount === totalCount) {
                        headerCheckbox.checked = true;
                        headerCheckbox.indeterminate = false;

                        if (accordionButton) accordionButton.classList.add('header-selected');
                    } else {
                        headerCheckbox.indeterminate = true;

                        if (accordionButton) accordionButton.classList.remove('header-selected');
                    }
                }
            }
            atualizarEstadoAcoesLote();
        }
    });

    btnAprovarSelecionados.addEventListener('click', () => {
        modalAprovar._element.dataset.acaoEmLote = 'true';
        aprovarLancamento(null);
    });

    // ==========================================================
    // INÍCIO DA CORREÇÃO 1 (Atualização do Listener de Abas)
    // ==========================================================
    const tabElements = document.querySelectorAll('#aprovacoesTab .nav-link');
    tabElements.forEach(tabEl => {
        tabEl.addEventListener('show.bs.tab', function (event) {
            const targetPaneId = event.target.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetPaneId);

            // As abas de PENDÊNCIAS agora sempre re-renderizam com os dados globais
            if (targetPaneId === '#atividades-pane') {
                renderizarAcordeonPendencias(todasPendenciasAtividades);
            } else if (targetPaneId === '#materiais-pane') {
                renderizarTabelaPendentesMateriais();
            } else if (targetPaneId === '#complementares-pane') {
                renderizarTabelaPendentesComplementares(todasPendenciasComplementares);
            }

            // As abas de HISTÓRICO só carregam UMA VEZ
            else if (targetPaneId === '#historico-atividades-pane') {
                if (targetPane && targetPane.dataset.loaded !== 'true') {
                    carregarDadosHistoricoAtividades().finally(() => { targetPane.dataset.loaded = 'true'; });
                }
            } else if (targetPaneId === '#historico-materiais-pane') {
                if (targetPane && targetPane.dataset.loaded !== 'true') {
                    carregarDadosHistoricoMateriais().finally(() => { targetPane.dataset.loaded = 'true'; });
                }
            } else if (targetPaneId === '#historico-complementares-pane') {
                if (targetPane && targetPane.dataset.loaded !== 'true') {
                    carregarDadosHistoricoComplementares().finally(() => { targetPane.dataset.loaded = 'true'; });
                }
            }
        });
    });

    // Dispara o carregamento inicial (Dashboard E a primeira aba visível)
    const primeiraAba = document.querySelector('#aprovacoesTab .nav-link.active');
    if (primeiraAba) {
        const targetPaneId = primeiraAba.getAttribute('data-bs-target');
        const targetPane = document.querySelector(targetPaneId);

        if (targetPane) {
            // Marca como "carregando"
            targetPane.dataset.loaded = 'true';

            // >>> CORREÇÃO: Mostra o loader na aba ativa (ex: lista de atividades) <<<
            toggleLoader(true, targetPaneId);

            // CHAMA A NOVA FUNÇÃO DE DASHBOARD (que carrega todos os dados de pendência)
            carregarDashboardEBadges().finally(() => {
                // Depois que o dashboard carregar (e preencher os arrays globais):

                // >>> CORREÇÃO: Esconde o loader da aba ativa <<<
                toggleLoader(false, targetPaneId);

                // Renderiza a primeira aba ativa com os dados que acabaram de ser carregados
                if (targetPaneId === '#atividades-pane') {
                    renderizarAcordeonPendencias(todasPendenciasAtividades);
                } else if (targetPaneId === '#materiais-pane') {
                    renderizarTabelaPendentesMateriais();
                } else if (targetPaneId === '#complementares-pane') {
                    renderizarTabelaPendentesComplementares(todasPendenciasComplementares);
                }

                // Se a primeira aba for de histórico, ela carrega seus próprios dados
                else if (targetPaneId === '#historico-atividades-pane') {
                    carregarDadosHistoricoAtividades();
                } else if (targetPaneId === '#historico-materiais-pane') {
                    carregarDadosHistoricoMateriais();
                } else if (targetPaneId === '#historico-complementares-pane') {
                    carregarDadosHistoricoComplementares();
                }
            });
        }
    }

    // ==========================================================
    // LÓGICA DE AÇÕES EM LOTE PARA ABA COMPLEMENTAR
    // ==========================================================

    function atualizarEstadoAcoesLoteComplementar() {
        const container = document.getElementById('acoes-lote-container-complementar');
        const checkboxes = document.querySelectorAll('#tbody-pendentes-complementares .linha-checkbox-complementar:checked');
        const total = checkboxes.length;

        if (!container) return;
        container.classList.toggle('d-none', total === 0);

        if (total > 0) {
            document.getElementById('contador-aprovacao-complementar').textContent = total;
            document.getElementById('contador-recusa-complementar').textContent = total;
        }
    }

    const painelComplementar = document.getElementById('complementares-pane');
    if (painelComplementar) {
        painelComplementar.addEventListener('change', (e) => {
            const target = e.target;
            const cbTodos = document.getElementById('selecionar-todos-complementar');

            if (target.classList.contains('linha-checkbox-complementar')) {
                const linha = target.closest('tr');
                linha.classList.toggle('table-active', target.checked);

                const totalCheckboxes = document.querySelectorAll('.linha-checkbox-complementar').length;
                const checkedCount = document.querySelectorAll('.linha-checkbox-complementar:checked').length;

                cbTodos.checked = checkedCount === totalCheckboxes;
                cbTodos.indeterminate = checkedCount > 0 && checkedCount < totalCheckboxes;
            }
            else if (target.id === 'selecionar-todos-complementar') {
                const isChecked = target.checked;
                document.querySelectorAll('.linha-checkbox-complementar').forEach(cb => {
                    cb.checked = isChecked;
                    const linha = cb.closest('tr');
                    linha.classList.toggle('table-active', isChecked);
                });
                cbTodos.indeterminate = false;
            }

            atualizarEstadoAcoesLoteComplementar();
        });
    }

    document.getElementById('btn-aprovar-selecionados-complementar')?.addEventListener('click', () => {
        if (modalAprovarComplementar) {
            modalAprovarComplementar._element.dataset.acaoEmLote = 'true';
            modalAprovarComplementar.show();
        }
    });

    document.getElementById('btn-recusar-selecionados-complementar')?.addEventListener('click', () => {
        if (modalRecusarComplementar) {
            modalRecusarComplementar._element.dataset.acaoEmLote = 'true';
            recusarComplementar(null);
        }
    });

    // ==========================================================
    // LÓGICA DO CONTROLE CPS (MIGRADO E CORRIGIDO)
    // ==========================================================

    // Variáveis Globais do CPS
    let choicesCpsPrestador = null; // Inicializa como null para controle
    let dadosCpsGlobais = [];
    let dadosCpsHistorico = [];

    // Elementos DOM (Garante que pegamos apenas se existirem)
    const tabCPSPendencias = document.getElementById('cps-pendencias-tab');
    const tabCPSHistorico = document.getElementById('cps-historico-tab');
    const filtroCpsMes = document.getElementById('cps-filtro-mes-ref');
    const filtroCpsSegmento = document.getElementById('cps-filtro-segmento');
    const filtroCpsPrestador = document.getElementById('cps-filtro-prestador');
    const btnAtualizarCps = document.getElementById('btn-atualizar-cps');

    // Modais CPS
    const modalAlterarValorCPS = new bootstrap.Modal(document.getElementById('modalAlterarValorCPS'));
    const modalRecusarCPS = new bootstrap.Modal(document.getElementById('modalRecusarCPS'));

    // --- Inicialização dos Filtros CPS ---
    function initFiltrosCPS() {
        // 1. Evita erro de null se os elementos não existirem na tela
        if (!filtroCpsMes || !filtroCpsSegmento || !filtroCpsPrestador) return;

        // 2. Popula Mês (apenas se estiver vazio para evitar refazer)
        if (filtroCpsMes.options.length === 0) {
            const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const hoje = new Date();
            for (let i = 0; i < 12; i++) {
                const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const txt = `${nomesMeses[d.getMonth()]}/${d.getFullYear()}`;
                filtroCpsMes.add(new Option(txt, val, i === 0, i === 0));
            }
        }

        // 3. Carrega Segmentos e Prestadores (apenas se estiverem vazios)
        if (filtroCpsSegmento.options.length <= 1) {
            Promise.all([
                fetchComAuth(`${API_BASE_URL}/segmentos`),
                fetchComAuth(`${API_BASE_URL}/index/prestadores`)
            ]).then(async ([resSeg, resPrest]) => {
                // Limpa antes de adicionar
                filtroCpsSegmento.innerHTML = '<option value="">Todos</option>';
                filtroCpsPrestador.innerHTML = '<option value="">Todos</option>';

                if (resSeg.ok) {
                    const segs = await resSeg.json();
                    segs.forEach(s => filtroCpsSegmento.add(new Option(s.nome, s.id)));
                }
                if (resPrest.ok) {
                    const prests = await resPrest.json();
                    prests.forEach(p => filtroCpsPrestador.add(new Option(`${p.codigoPrestador} - ${p.prestador}`, p.id)));
                }

                // 4. Correção do erro "Choices already initialised"
                if (typeof Choices !== 'undefined') {
                    if (choicesCpsPrestador) {
                        choicesCpsPrestador.destroy(); // Destrói a instância anterior se existir
                    }
                    choicesCpsPrestador = new Choices(filtroCpsPrestador, {
                        searchEnabled: true,
                        itemSelectText: '',
                        shouldSort: false
                    });
                }
            });
        }
    }

    // --- Carregar Pendências CPS ---
    async function carregarPendenciasCPS() {
        toggleLoader(true, '#cps-pendencias-pane');

        // CHAMA A NOVA FUNÇÃO AQUI:
        atualizarHeaderKpiCPS();

        try {
            const res = await fetchComAuth(`${API_BASE_URL}/controle-cps`, { headers: { 'X-User-ID': userId } });
            if (!res.ok) throw new Error('Erro ao buscar pendências CPS');
            dadosCpsGlobais = await res.json();

            renderizarAcordeonCPS(dadosCpsGlobais, 'accordionPendenciasCPS', 'msg-sem-pendencias-cps', true);
        } catch (error) {
            console.error(error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false, '#cps-pendencias-pane');
        }
    }

    // --- Carregar Histórico CPS ---
    async function carregarHistoricoCPS() {
        toggleLoader(true, '#cps-historico-pane');

        atualizarHeaderKpiCPS();

        // Pega valores dos filtros (reutilizando os filtros da aba pendências por enquanto, ou crie novos IDs se preferir filtros independentes)
        const mes = document.getElementById('cps-filtro-mes-ref').value.split('-');
        const inicio = `${mes[0]}-${mes[1]}-01`;
        // Ultimo dia do mes
        const fim = new Date(mes[0], mes[1], 0).toISOString().split('T')[0];

        const params = new URLSearchParams({
            inicio: inicio, fim: fim,
            segmentoId: document.getElementById('cps-filtro-segmento').value,
            prestadorId: document.getElementById('cps-filtro-prestador').value
        });

        try {
            const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/historico?${params}`, { headers: { 'X-User-ID': localStorage.getItem('usuarioId') } });
            if (!res.ok) throw new Error('Erro ao buscar histórico CPS');

            const dados = await res.json();

            // 1. SALVA NA VARIÁVEL GLOBAL PARA EXPORTAÇÃO
            dadosCpsHistorico = dados;

            // 2. Renderiza
            renderizarAcordeonCPS(dados, 'accordionHistoricoCPS', 'msg-sem-historico-cps', false);

        } catch (error) {
            console.error(error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false, '#cps-historico-pane');
        }
    }

    function exportarCpsExcel(dados, nomeArquivo) {
        if (!dados || dados.length === 0) {
            mostrarToast("Não há dados para exportar.", "warning");
            return;
        }

        // Cabeçalho do Excel
        const headers = [
            "Status Pagamento", "Competência", "Data Atividade",
            "OS", "Site", "Projeto", "Segmento", "Contrato",
            "Prestador", "Código Prestador", "Gestor",
            "Valor Total (R$)", "Valor Adiantado (R$)", "Valor Pago (R$)",
            "Status Aprovação", "Key"
        ];

        // Mapeamento das linhas
        const rows = dados.map(l => [
            (l.statusPagamento || '').replace(/_/g, ' '),
            l.dataCompetencia || '-',
            l.dataAtividade ? l.dataAtividade.split('-').reverse().join('/') : '-',
            l.os?.os || '',
            l.detalhe?.site || '',
            l.os?.projeto || '',
            l.os?.segmento?.nome || '',
            l.detalhe?.contrato || '',
            l.prestador?.nome || '',
            l.prestador?.codigoPrestador || '',
            l.manager?.nome || '',
            l.valor || 0,
            l.valorAdiantamento || 0,
            l.valorPagamento || 0,
            (l.situacaoAprovacao || '').replace(/_/g, ' '),
            l.detalhe?.key || ''
        ]);

        // Criação da Planilha
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        // Ajuste de largura das colunas (opcional, visual)
        ws['!cols'] = headers.map(() => ({ wch: 20 }));

        XLSX.utils.book_append_sheet(wb, ws, "Relatorio CPS");
        XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
    }

    // --- Listeners dos Botões de Exportar ---

    const btnExportPendencias = document.getElementById('btn-exportar-cps-pendencias');
    if (btnExportPendencias) {
        btnExportPendencias.addEventListener('click', () => {
            // Exporta o que está na tela de pendências
            exportarCpsExcel(dadosCpsGlobais, "CPS_Pendencias");
        });
    }

    const btnExportHistorico = document.getElementById('btn-exportar-cps-historico');
    if (btnExportHistorico) {
        btnExportHistorico.addEventListener('click', () => {
            // Exporta o que está na tela de histórico
            exportarCpsExcel(dadosCpsHistorico, "CPS_Historico");
        });
    }

    // --- Renderização Genérica CORRIGIDA ---
    function renderizarAcordeonCPS(lista, containerId, msgVazioId, isPendencia) {
        const container = document.getElementById(containerId);
        const msgDiv = document.getElementById(msgVazioId);

        if (!container || !msgDiv) return;
        container.innerHTML = '';

        if (!lista || lista.length === 0) {
            msgDiv.classList.remove('d-none');
            return;
        }
        msgDiv.classList.add('d-none');

        // Agrupamento por OS
        const grupos = lista.reduce((acc, l) => {
            const id = l.os?.id || 0;
            if (!acc[id]) acc[id] = {
                os: l.os?.os,
                projeto: l.os?.projeto,
                totalCps: l.valorCps || 0,
                totalPago: l.totalPago || 0,
                totalAdiantado: 0,
                itens: []
            };
            acc[id].totalAdiantado += parseFloat(l.valorAdiantamento) || 0;
            acc[id].itens.push(l);
            return acc;
        }, {});

        const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
        const isControllerOrAdmin = ['CONTROLLER', 'ADMIN'].includes(userRole);
        const isCoordOrAdmin = ['COORDINATOR', 'ADMIN', 'MANAGER'].includes(userRole); // Manager tb pode ver status
        const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

        Object.values(grupos).forEach((grp, idx) => {
            const uniqueId = `cps-${isPendencia ? 'pend' : 'hist'}-${idx}`;

            // Ordenação interna
            grp.itens.sort((a, b) => {
                const peso = (s) => s === 'EM_ABERTO' ? 1 : (s === 'FECHADO' ? 2 : 3);
                return peso(a.statusPagamento) - peso(b.statusPagamento);
            });

            const valorTotalCps = grp.totalCps;
            const valorAdiantado = grp.totalAdiantado;
            const saldoPendente = valorTotalCps - valorAdiantado;
            const valorPago = grp.totalPago;
            const percentual = valorTotalCps > 0 ? (valorPago / valorTotalCps) * 100 : 0;

            // Lógica do Checkbox do Cabeçalho
            let showHeaderCheckbox = false;
            if (isPendencia) {
                if (userRole === 'ADMIN') showHeaderCheckbox = true;
                else if (['COORDINATOR', 'MANAGER'].includes(userRole) && grp.itens.some(i => i.statusPagamento === 'EM_ABERTO')) showHeaderCheckbox = true;
                else if (userRole === 'CONTROLLER' && grp.itens.some(i => i.statusPagamento === 'FECHADO' || i.statusPagamento === 'ALTERACAO_SOLICITADA')) showHeaderCheckbox = true;
                else if (userRole === 'CONTROLLER' && grp.itens.some(i => i.statusPagamento === 'SOLICITACAO_ADIANTAMENTO')) showHeaderCheckbox = true;
            }

            // Checkbox posicionado "flutuando" sobre o botão para não ser afetado pelo clique do acordeão
            const checkboxHeaderHtml = showHeaderCheckbox ? `
            <div class="position-absolute top-50 start-0 translate-middle-y ms-3 check-container-header" style="z-index: 5;">
                <input class="form-check-input cps-select-all shadow-sm" type="checkbox" 
                       data-target-body="collapse-${uniqueId}" 
                       style="cursor: pointer; margin: 0;">
            </div>` : '';

            const paddingLeft = showHeaderCheckbox ? 'ps-5' : 'ps-3';

            const headerContentHtml = `
            <div class="header-content w-100">
                <div class="header-title-wrapper">
                    <span class="header-title-project">${grp.projeto || '-'}</span>
                    <span class="header-title-os">${grp.os || '-'}</span>
                </div>
                <div class="header-kpi-wrapper" style="gap: 1.5rem;">
                    <div class="header-kpi"><span class="kpi-label">TOTAL CPS</span><span class="kpi-value">${formatMoney(valorTotalCps)}</span></div>
                    <div class="header-kpi"><span class="kpi-label text-warning">ADIANTADO</span><span class="kpi-value text-warning">${formatMoney(valorAdiantado)}</span></div>
                    <div class="header-kpi"><span class="kpi-label text-danger">PENDENTE</span><span class="kpi-value text-danger">${formatMoney(saldoPendente)}</span></div>
                    <div class="header-kpi"><span class="kpi-label text-success">PAGO</span><span class="kpi-value text-success">${formatMoney(valorPago)}</span></div>
                    <div class="header-kpi border-start ps-3 d-flex flex-column justify-content-center">
                        <span class="kpi-value" style="font-size: 1.1rem;">${percentual.toFixed(1)}%</span>
                    </div>
                </div>
                <span class="badge bg-secondary header-badge ms-3">${grp.itens.length} item(s)</span>
            </div>`;

            const linhas = grp.itens.map(l => {
                let btns = `<button class="btn btn-sm btn-outline-info me-1" title="Ver Detalhes" onclick="verComentarios(${l.id})"><i class="bi bi-eye"></i></button>`;
                let showRowCheckbox = false;

                if (isPendencia) {
                    // === CENÁRIO 1: EM ABERTO (Coordenador pode fechar ou pedir adiantamento) ===
                    if (l.statusPagamento === 'EM_ABERTO') {
                        if (isCoordOrAdmin) {
                            // Botão Fechar (Existente)
                            btns += `<button class="btn btn-sm btn-outline-success me-1" title="Fechar Pagamento Total" onclick="abrirModalCpsValor(${l.id}, 'fechar')"><i class="bi bi-check-circle"></i></button>`;

                            // Botão NOVO: Solicitar Adiantamento
                            btns += `<button class="btn btn-sm btn-outline-primary me-1" title="Solicitar Adiantamento" onclick="abrirModalSolicitarAdiantamento(${l.id}, ${l.valor}, ${l.valorAdiantamento || 0})"><i class="bi bi-cash-stack"></i></button>`;

                            // Botão Recusar (Existente)
                            btns += `<button class="btn btn-sm btn-outline-danger" title="Recusar (Voltar ao Gestor)" onclick="abrirModalCpsValor(${l.id}, 'recusar')"><i class="bi bi-x-circle"></i></button>`;

                            showRowCheckbox = true;
                        } else {
                            btns += `<span class="badge bg-light text-dark border">Aguardando Coord.</span>`;
                        }
                    }

                    // === CENÁRIO 2: SOLICITAÇÃO DE ADIANTAMENTO (Controller aprova/recusa) ===
                    else if (l.statusPagamento === 'SOLICITACAO_ADIANTAMENTO') {
                        if (isControllerOrAdmin) {
                            const valorSolicitadoFmt = formatMoney(l.valorSolicitadoAdiantamento);

                            // BOTÕES PADRONIZADOS (Outline, Pequenos)
                            btns += `<button class="btn btn-sm btn-outline-success me-1" title="Pagar Adiantamento (${valorSolicitadoFmt})" onclick="aprovarAdiantamento(${l.id}, ${l.valorSolicitadoAdiantamento})"><i class="bi bi-check-lg"></i></button>`;

                            btns += `<button class="btn btn-sm btn-outline-danger" title="Recusar Adiantamento" onclick="recusarAdiantamento(${l.id})"><i class="bi bi-x-lg"></i></button>`;

                            showRowCheckbox = true; // >>> HABILITA CHECKBOX DE LINHA
                        } else {
                            btns += `<span class="badge bg-warning text-dark">Aguardando Controller<br>(Adiantamento)</span>`;
                        }
                    }

                    // === CENÁRIO 3: FECHADO (Controller paga total) ===
                    else if (isControllerOrAdmin && (l.statusPagamento === 'FECHADO' || l.statusPagamento === 'ALTERACAO_SOLICITADA')) {
                        btns += `<button class="btn btn-sm btn-outline-danger" title="Devolver ao Coordenador" onclick="abrirModalCpsRecusarController(${l.id})"><i class="bi bi-arrow-counterclockwise"></i></button>`;
                        showRowCheckbox = true; // Permite seleção em lote para pagamento
                    }
                }

                // ADICIONADO: data-status aqui!
                const checkHtml = showRowCheckbox
                    ? `<td><input type="checkbox" class="form-check-input cps-check" data-id="${l.id}" data-status="${l.statusPagamento}"></td>`
                    : (isPendencia ? '<td></td>' : '');

                const valPg = l.valorPagamento !== null ? l.valorPagamento : l.valor;
                const rowClass = l.statusPagamento === 'FECHADO' ? 'table-success' : '';
                const compTexto = l.dataCompetencia || '-';

                return `
                <tr class="${rowClass}">
                    ${checkHtml}
                    <td class="text-center bg-transparent">${btns}</td>
                    <td class="bg-transparent"><span class="badge text-bg-secondary bg-opacity-75 text-dark">${(l.statusPagamento || '').replace(/_/g, ' ')}</span></td>
                    <td class="bg-transparent">${l.dataAtividade || '-'}</td>
                    <td class="bg-transparent text-center fw-bold text-primary">${compTexto}</td> 
                    <td class="bg-transparent">${l.detalhe?.site || '-'}</td>
                    <td class="bg-transparent">${l.detalhe?.lpu?.nomeLpu || '-'}</td>
                    <td class="bg-transparent">${l.prestador?.nome || '-'}</td>
                    <td class="bg-transparent">${l.manager?.nome || '-'}</td>
                    <td class="text-center bg-transparent fw-bold">${formatMoney(valPg)}</td>
                    <td class="bg-transparent"><small>${l.detalhe?.key || '-'}</small></td>
                </tr>`;
            }).join('');

            const thCheck = isPendencia ? '<th><i class="bi bi-check-all"></i></th>' : '';

            container.insertAdjacentHTML('beforeend', `
            <div class="accordion-item border mb-2">
                <h2 class="accordion-header position-relative" id="heading-${uniqueId}">
                    ${checkboxHeaderHtml}
                    <button class="accordion-button collapsed ${paddingLeft}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}" aria-expanded="false" aria-controls="collapse-${uniqueId}">
                        ${headerContentHtml}
                    </button>
                </h2>
                <div id="collapse-${uniqueId}" class="accordion-collapse collapse" aria-labelledby="heading-${uniqueId}" data-bs-parent="#${containerId}">
                    <div class="accordion-body p-0">
                        <div class="table-responsive">
                            <table class="table mb-0 align-middle small table-hover">
                                <thead class="table-light">
                                    <tr>
                                        ${thCheck}
                                        <th class="text-center">Ações</th>
                                        <th>Status</th>
                                        <th>DATA DA ATIVIDADE</th>
                                        <th>COMPETÊNCIA</th> 
                                        <th>Site</th>
                                        <th>Item</th>
                                        <th>Prestador</th>
                                        <th>Gestor</th>
                                        <th class="text-center">Valor</th>
                                        <th>KEY</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-${uniqueId}">${linhas}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`);
        });

        if (isPendencia) {
            atualizarBotoesLoteCPS();
            // Reinicia a lógica de busca após renderizar (para pegar os novos elementos)
            configurarBuscaCps('input-busca-cps-pendencias', 'accordionPendenciasCPS');
        } else {
            configurarBuscaCps('input-busca-cps-historico', 'accordionHistoricoCPS');
        }
    }

    const accordionCPS = document.getElementById('accordionPendenciasCPS');
    if (accordionCPS) {

        // 1. Listener de CLIQUE para impedir propagação no checkbox do cabeçalho
        accordionCPS.addEventListener('click', (e) => {
            // Se clicou no container do checkbox ou no próprio checkbox
            if (e.target.closest('.check-container-header') || e.target.classList.contains('cps-select-all')) {
                e.stopPropagation(); // Impede que o Bootstrap receba o clique e feche o acordeão
            }
        });

        // 2. Listener de MUDANÇA (Change) para lógica de seleção
        accordionCPS.addEventListener('change', (e) => {
            const target = e.target;

            // CASO 1: Clicou no "Selecionar Todos" do cabeçalho
            if (target.classList.contains('cps-select-all')) {
                const isChecked = target.checked;
                const targetBodyId = target.dataset.targetBody;

                // Busca checkboxes DENTRO deste grupo específico
                const checkboxesNoGrupo = document.querySelectorAll(`#${targetBodyId} .cps-check`);

                checkboxesNoGrupo.forEach(cb => {
                    cb.checked = isChecked;
                    // Opcional: Visual na linha
                    const tr = cb.closest('tr');
                    if (tr) isChecked ? tr.classList.add('table-active') : tr.classList.remove('table-active');
                });

                atualizarBotoesLoteCPS();
            }

            // CASO 2: Clicou em um checkbox de linha individual
            else if (target.classList.contains('cps-check')) {
                const tr = target.closest('tr');
                if (tr) target.checked ? tr.classList.add('table-active') : tr.classList.remove('table-active');

                // Atualiza o checkbox "pai" (Selecionar Todos) deste grupo
                const tbody = target.closest('tbody');
                const accordionItem = target.closest('.accordion-item');
                const headerCheckbox = accordionItem ? accordionItem.querySelector('.cps-select-all') : null;

                if (headerCheckbox && tbody) {
                    const totalChecks = tbody.querySelectorAll('.cps-check').length;
                    const totalChecked = tbody.querySelectorAll('.cps-check:checked').length;
                    headerCheckbox.checked = totalChecks > 0 && totalChecks === totalChecked;
                    headerCheckbox.indeterminate = totalChecked > 0 && totalChecked < totalChecks;
                }

                atualizarBotoesLoteCPS();
            }
        });
    }

    window.abrirModalCpsRecusarController = function (id) {
        // Define o ID no modal de recusa
        document.getElementById('cpsLancamentoIdRecusar').value = id;

        // Define que NÃO é uma ação em lote
        modalRecusarCPS._element.dataset.acaoEmLote = 'false';

        // Limpa o campo de motivo
        document.getElementById('cpsMotivoRecusaInput').value = '';

        modalRecusarCPS.show();
    };

    async function atualizarHeaderKpiCPS() {
        // 1. Seleciona todos os elementos de valor na tela
        const elsTotal = document.querySelectorAll('.kpi-cps-total-mes-value');
        const elsAdiantado = document.querySelectorAll('.kpi-cps-total-adiantado-value'); // Novo
        const elsPendente = document.querySelectorAll('.kpi-cps-total-pendente-value');   // Novo
        const elsPago = document.querySelectorAll('.kpi-cps-total-pago-value');
        const elsQtd = document.querySelectorAll('.kpi-cps-qtd-itens-value');             // Novo

        if (elsTotal.length === 0) return;

        // 2. Pega os filtros atuais da tela
        const mesVal = document.getElementById('cps-filtro-mes-ref').value;
        const segmentoId = document.getElementById('cps-filtro-segmento').value;
        const prestadorId = document.getElementById('cps-filtro-prestador').value;

        if (!mesVal) return;

        const [ano, mes] = mesVal.split('-');
        const dataInicio = `${ano}-${mes}-01`;
        const ultimoDia = new Date(ano, mes, 0).getDate();
        const dataFim = `${ano}-${mes}-${ultimoDia}`;

        const params = new URLSearchParams({
            inicio: dataInicio,
            fim: dataFim,
            segmentoId: segmentoId || '',
            prestadorId: prestadorId || ''
        });

        // Função helper para definir texto de carregamento
        const setLoading = (text) => {
            [elsTotal, elsAdiantado, elsPendente, elsPago, elsQtd].forEach(nodeList => {
                nodeList.forEach(el => el.textContent = text);
            });
        };
        setLoading("...");

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/controle-cps/dashboard?${params}`, {
                headers: { 'X-User-ID': localStorage.getItem('usuarioId') }
            });

            if (!response.ok) throw new Error('Erro ao carregar KPIs');

            const dados = await response.json();
            const formatar = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

            // 4. Atualiza os valores na tela
            elsTotal.forEach(el => el.textContent = formatar(dados.valorTotal));
            elsAdiantado.forEach(el => el.textContent = formatar(dados.valorTotalAdiantado));
            elsPendente.forEach(el => el.textContent = formatar(dados.valorTotalPendente));
            elsPago.forEach(el => el.textContent = formatar(dados.valorTotalPago));
            elsQtd.forEach(el => el.textContent = dados.quantidadeItens || 0);

        } catch (error) {
            console.error("Erro KPIs:", error);
            setLoading("-");
        }
    }

    // --- Handlers de Ação Globais ---
    window.abrirModalCpsValor = function (id, acao) {
        const l = dadosCpsGlobais.find(x => x.id == id);
        if (!l) return;

        document.getElementById('cpsLancamentoIdAcao').value = id;
        document.getElementById('cpsAcaoCoordenador').value = acao;

        // Reseta flag de lote
        modalAlterarValorCPS._element.dataset.acaoEmLote = 'false';

        const btnConfirmar = document.getElementById('btnConfirmarAcaoCPS');
        const divCompetencia = document.getElementById('divCompetenciaCps');
        const inputValor = document.getElementById('cpsValorPagamentoInput');
        const inputJustificativa = document.getElementById('cpsJustificativaInput');
        const modalTitle = document.querySelector('#modalAlterarValorCPS .modal-title');

        document.getElementById('formAlterarValorCPS').classList.remove('was-validated');

        if (acao === 'recusar') {
            modalTitle.innerHTML = '<i class="bi bi-x-circle text-danger me-2"></i>Recusar pagamento';
            btnConfirmar.className = 'btn btn-danger';
            btnConfirmar.textContent = "Confirmar Recusa";
            divCompetencia.style.display = 'none';
            document.getElementById('cpsCompetenciaInput').required = false;
            inputValor.disabled = true;
            // inputValor.value = '0,00'; // Visualmente zerado ou manter o original, não importa pois o backend ignora
            inputJustificativa.required = true;
            inputJustificativa.placeholder = "Descreva o motivo da recusa...";
        } else {
            // Lógica 'fechar' (mantida igual)
            modalTitle.innerHTML = '<i class="bi bi-check-circle text-success me-2"></i>Fechar Pagamento';
            btnConfirmar.className = 'btn btn-success';
            btnConfirmar.textContent = "Confirmar Fechamento";
            divCompetencia.style.display = 'block';
            gerarOpcoesCompetencia();
            document.getElementById('cpsCompetenciaInput').required = true;
            inputValor.disabled = false;
            inputJustificativa.required = false;
            inputJustificativa.placeholder = "Observações opcionais...";
        }

        const val = l.valorPagamento !== null ? l.valorPagamento : l.valor;
        inputValor.value = val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        modalAlterarValorCPS.show();
    };

    window.abrirModalCpsRecusar = function (id) {
        document.getElementById('cpsLancamentoIdRecusar').value = id;
        modalRecusarCPS.show();
    };

    window.abrirModalCpsRecusar = window.abrirModalCpsRecusarController;

    // --- Lógica de Botões de Lote ---

    function atualizarBotoesLoteCPS() {
        // Seleciona apenas os checkboxes VISÍVEIS na aba atual para evitar conflitos
        // O painel ativo do CPS é o #cps-pendencias-pane
        const paneCPS = document.getElementById('cps-pendencias-pane');
        if (!paneCPS) return;

        const checkboxes = paneCPS.querySelectorAll('.cps-check:checked');
        const total = checkboxes.length;

        const containerCoord = document.getElementById('cps-acoes-lote-coord-container');
        const containerController = document.getElementById('cps-acoes-lote-controller-container');
        const containerAdiantamento = document.getElementById('cps-acoes-lote-adiantamento-container'); // <--- ESTE É O NOVO CONTAINER

        // Esconde tudo primeiro para resetar o estado
        if (containerCoord) containerCoord.classList.add('d-none');
        if (containerController) containerController.classList.add('d-none');
        if (containerAdiantamento) containerAdiantamento.classList.add('d-none');

        // Se nada selecionado, para por aqui
        if (total === 0) return;

        const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

        let temEmAberto = false;
        let temFechado = false;
        let temAdiantamento = false;

        // Verifica os status dos itens selecionados
        checkboxes.forEach(cb => {
            const status = cb.getAttribute('data-status');
            if (status === 'EM_ABERTO') temEmAberto = true;
            if (status === 'FECHADO' || status === 'ALTERACAO_SOLICITADA') temFechado = true;
            if (status === 'SOLICITACAO_ADIANTAMENTO') temAdiantamento = true;
        });

        // Lógica de visibilidade baseada no PERFIL e nos STATUS selecionados

        // 1. Perfil COORDENADOR (Vê apenas EM_ABERTO)
        if (['COORDINATOR', 'MANAGER', 'ADMIN'].includes(userRole)) {
            // Se tem itens em aberto e NÃO misturou com outros tipos
            if (temEmAberto && !temFechado && !temAdiantamento) {
                if (containerCoord) {
                    containerCoord.classList.remove('d-none');
                    // Atualiza contadores
                    const spanFechar = document.getElementById('contador-fechar-cps');
                    const spanRecusar = document.getElementById('contador-recusar-cps-coord');
                    if (spanFechar) spanFechar.textContent = total;
                    if (spanRecusar) spanRecusar.textContent = total;
                }
            }
        }

        // 2. Perfil CONTROLLER (Vê FECHADO e ADIANTAMENTO)
        if (['CONTROLLER', 'ADMIN'].includes(userRole)) {

            // Cenário A: Pagamento Normal (FECHADO)
            if (temFechado && !temEmAberto && !temAdiantamento) {
                if (containerController) {
                    containerController.classList.remove('d-none');
                    const spanPagar = document.getElementById('contador-pagamento-cps');
                    const spanDevolver = document.getElementById('contador-recusar-cps-controller');
                    if (spanPagar) spanPagar.textContent = total;
                    if (spanDevolver) spanDevolver.textContent = total;
                }
            }

            // Cenário B: Adiantamento (SOLICITACAO_ADIANTAMENTO)
            // IMPORTANTE: Aqui está a lógica que faltava para o seu problema
            if (temAdiantamento && !temEmAberto && !temFechado) {
                if (containerAdiantamento) {
                    containerAdiantamento.classList.remove('d-none');
                    const spanPagarAdiant = document.getElementById('contador-pagar-adiantamento');
                    const spanRecusarAdiant = document.getElementById('contador-recusar-adiantamento');
                    if (spanPagarAdiant) spanPagarAdiant.textContent = total;
                    if (spanRecusarAdiant) spanRecusarAdiant.textContent = total;
                }
            }
        }
    }

    const btnPagarAdiantamentoLote = document.getElementById('btn-pagar-adiantamento-lote');
    if (btnPagarAdiantamentoLote) {
        btnPagarAdiantamentoLote.addEventListener('click', async function () {
            const checks = document.querySelectorAll('.cps-check:checked');
            const ids = Array.from(checks).map(c => parseInt(c.dataset.id));
            if (!ids.length) return;

            if (!confirm(`Confirma o pagamento de ${ids.length} adiantamentos selecionados?`)) return;

            toggleLoader(true, '#cps-pendencias-pane');
            const originalText = this.innerHTML;
            this.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processando...`;
            this.disabled = true;

            try {
                const userId = localStorage.getItem('usuarioId');
                const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/pagar-adiantamento-lote`, {
                    method: 'POST',
                    body: JSON.stringify({ lancamentoIds: ids, usuarioId: userId })
                });

                if (!response.ok) throw new Error("Erro ao pagar adiantamentos.");

                mostrarToast(`${ids.length} adiantamentos pagos com sucesso!`, 'success');
                document.getElementById('btn-atualizar-cps').click();

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleLoader(false, '#cps-pendencias-pane');
                this.disabled = false;
                this.innerHTML = originalText;
            }
        });
    }

    // 5. Recusar Adiantamento em Lote
    const btnRecusarAdiantamentoLote = document.getElementById('btn-recusar-adiantamento-lote');
    if (btnRecusarAdiantamentoLote) {
        btnRecusarAdiantamentoLote.addEventListener('click', async function () {
            const checks = document.querySelectorAll('.cps-check:checked');
            const ids = Array.from(checks).map(c => parseInt(c.dataset.id));
            if (!ids.length) return;

            const motivo = prompt("Motivo da recusa para os itens selecionados:");
            if (motivo === null) return;
            if (!motivo.trim()) { alert("Motivo obrigatório."); return; }

            toggleLoader(true, '#cps-pendencias-pane');
            const originalText = this.innerHTML;
            this.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processando...`;
            this.disabled = true;

            try {
                const userId = localStorage.getItem('usuarioId');
                const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/recusar-adiantamento-lote`, {
                    method: 'POST',
                    body: JSON.stringify({ lancamentoIds: ids, usuarioId: userId, motivo: motivo })
                });

                if (!response.ok) throw new Error("Erro ao recusar adiantamentos.");

                mostrarToast(`${ids.length} solicitações recusadas.`, 'warning');
                document.getElementById('btn-atualizar-cps').click();

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleLoader(false, '#cps-pendencias-pane');
                this.disabled = false;
                this.innerHTML = originalText;
            }
        });
    }

    function configurarBuscaCps(inputId, accordionId) {
        const input = document.getElementById(inputId);
        const accordion = document.getElementById(accordionId);

        if (!input || !accordion) return;

        // Remove listener anterior se houver (clonando o elemento)
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);

        newInput.addEventListener('keyup', function () {
            const termo = this.value.toLowerCase();
            const items = accordion.querySelectorAll('.accordion-item');

            items.forEach(item => {
                let itemVisivel = false;

                // 1. Verifica no cabeçalho (OS, Projeto, Valores Totais)
                const headerText = item.querySelector('.accordion-header').innerText.toLowerCase();

                // Se o cabeçalho der match, mostramos o grupo inteiro
                if (headerText.includes(termo)) {
                    itemVisivel = true;
                    const linhas = item.querySelectorAll('tbody tr');
                    linhas.forEach(tr => tr.classList.remove('d-none'));
                } else {
                    // 2. Se não achou no cabeçalho, verifica linha a linha
                    const linhas = item.querySelectorAll('tbody tr');
                    let algumaLinhaVisivel = false;

                    linhas.forEach(tr => {
                        const linhaText = tr.innerText.toLowerCase();
                        if (linhaText.includes(termo)) {
                            tr.classList.remove('d-none');
                            algumaLinhaVisivel = true;
                        } else {
                            tr.classList.add('d-none');
                        }
                    });

                    if (algumaLinhaVisivel) itemVisivel = true;
                }

                // Exibe ou oculta o item inteiro do acordeão
                if (itemVisivel) {
                    item.classList.remove('d-none');
                } else {
                    item.classList.add('d-none');
                }
            });
        });
    }

    // Listener para checkboxes (delegação)
    const accordionPendencias = document.getElementById('accordionPendenciasCPS');
    if (accordionPendencias) {
        accordionPendencias.addEventListener('change', (e) => {
            if (e.target.classList.contains('cps-check')) {
                atualizarBotoesLoteCPS();
            }
        });
    }

    // --- Listeners de Submit ---

    // 1. Submit Fechar/Alterar Valor (Individual)
    const formAlterarValorCPS = document.getElementById('formAlterarValorCPS');
    if (formAlterarValorCPS) {
        formAlterarValorCPS.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Validação do formulário (HTML5)
            if (!formAlterarValorCPS.checkValidity()) {
                e.stopPropagation();
                formAlterarValorCPS.classList.add('was-validated');
                return;
            }

            const btn = document.getElementById('btnConfirmarAcaoCPS');
            const originalContent = btn.innerHTML; // Guarda texto original do botão

            // 2. Coleta de dados do formulário
            const acao = document.getElementById('cpsAcaoCoordenador').value; // 'fechar' ou 'recusar'
            const just = document.getElementById('cpsJustificativaInput').value;
            const competencia = document.getElementById('cpsCompetenciaInput').value;

            const isLote = modalAlterarValorCPS._element.dataset.acaoEmLote === 'true';
            let ids = [];

            // 3. Definição dos IDs (Lote ou Individual)
            if (isLote) {
                ids = Array.from(document.querySelectorAll('.cps-check:checked')).map(c => parseInt(c.dataset.id));
            } else {
                const idInput = document.getElementById('cpsLancamentoIdAcao').value;
                if (idInput) ids = [parseInt(idInput)];
            }

            if (ids.length === 0) {
                mostrarToast('Nenhum item identificado para processar.', 'warning');
                return;
            }

            // 4. ATIVA LOADING (Feedback visual)
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processando...`;

            try {
                let endpoint = '';
                let payload = {};

                // --- LÓGICA DE RECUSAR ---
                if (acao === 'recusar') {
                    endpoint = isLote ? '/controle-cps/recusar-lote' : '/controle-cps/recusar';

                    payload = isLote
                        ? {
                            lancamentoIds: ids,
                            coordenadorId: userId,
                            justificativa: just
                        }
                        : {
                            lancamentoId: ids[0],
                            coordenadorId: userId,
                            valorPagamento: 0, // Valor irrelevante na recusa
                            justificativa: just
                        };

                    // --- LÓGICA DE FECHAR (APROVAR) ---
                } else {
                    endpoint = isLote ? '/controle-cps/fechar-lote' : '/controle-cps/fechar';

                    if (isLote) {
                        payload = {
                            lancamentoIds: ids,
                            coordenadorId: userId,
                            competencia: competencia // Envia a competência selecionada no modal
                        };
                    } else {
                        // Individual requer leitura do valor monetário inputado
                        const valor = parseFloat(document.getElementById('cpsValorPagamentoInput').value.replace(/\./g, '').replace(',', '.'));
                        payload = {
                            lancamentoId: ids[0],
                            coordenadorId: userId,
                            valorPagamento: valor,
                            justificativa: just,
                            competencia: competencia // Envia a competência
                        };
                    }
                }

                // 5. Execução da Requisição
                const res = await fetchComAuth(`${API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error((await res.json()).message || 'Erro ao processar a ação.');

                // 6. Sucesso
                const msgSucesso = acao === 'recusar'
                    ? `${ids.length} item(ns) recusado(s)!`
                    : `${ids.length} item(ns) fechado(s) com sucesso!`;

                mostrarToast(msgSucesso, 'success');

                // 7. Limpeza e Atualização da Interface
                modalAlterarValorCPS.hide();

                // Remove os itens processados da lista global e re-renderiza
                dadosCpsGlobais = dadosCpsGlobais.filter(i => !ids.includes(i.id));
                renderizarAcordeonCPS(dadosCpsGlobais, 'accordionPendenciasCPS', 'msg-sem-pendencias-cps', true);

            } catch (err) {
                console.error(err);
                mostrarToast(err.message, 'error');
            } finally {
                // 8. REMOVE LOADING (Restaura botão)
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        });
    }

    const btnFecharLote = document.getElementById('btn-fechar-selecionados-cps');
    if (btnFecharLote) {
        btnFecharLote.addEventListener('click', () => {
            // Configura o modal para FECHAR em LOTE
            document.getElementById('cpsAcaoCoordenador').value = 'fechar';
            modalAlterarValorCPS._element.dataset.acaoEmLote = 'true';

            // Ajustes visuais
            const modalTitle = document.querySelector('#modalAlterarValorCPS .modal-title');
            const btnConfirmar = document.getElementById('btnConfirmarAcaoCPS');
            const divCompetencia = document.getElementById('divCompetenciaCps');
            const inputValor = document.getElementById('cpsValorPagamentoInput');
            const inputJustificativa = document.getElementById('cpsJustificativaInput');

            modalTitle.innerHTML = '<i class="bi bi-check-all text-success me-2"></i>Fechar Lote';
            btnConfirmar.className = 'btn btn-success';
            btnConfirmar.textContent = "Confirmar Fechamento em Lote";

            divCompetencia.style.display = 'block';
            gerarOpcoesCompetencia(); // Gera o select de datas
            document.getElementById('cpsCompetenciaInput').required = true;

            inputValor.disabled = true; // Valor em lote geralmente mantém o original
            inputValor.value = 'Manter Original';

            inputJustificativa.required = false;
            inputJustificativa.value = '';
            inputJustificativa.placeholder = "Observação para o lote (opcional)...";

            modalAlterarValorCPS.show();
        });
    }

    document.getElementById('formRecusarCPS').addEventListener('submit', async (e) => {
        e.preventDefault();

        const motivo = document.getElementById('cpsMotivoRecusaInput').value;
        const isLote = modalRecusarCPS._element.dataset.acaoEmLote === 'true';
        let ids = [];

        if (isLote) {
            ids = Array.from(document.querySelectorAll('.cps-check:checked')).map(c => parseInt(c.dataset.id));
        } else {
            ids = [parseInt(document.getElementById('cpsLancamentoIdRecusar').value)];
        }

        const endpoint = isLote ? '/controle-cps/recusar-controller-lote' : '/controle-cps/recusar-controller';
        const payload = isLote
            ? { lancamentoIds: ids, controllerId: userId, motivo: motivo }
            : { lancamentoId: ids[0], controllerId: userId, motivo: motivo };

        try {
            const res = await fetchComAuth(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).message || "Erro ao recusar.");

            // --- ALTERAÇÃO DA MENSAGEM ---
            mostrarToast(`${ids.length} item(ns) devolvido(s) para o Gestor.`, 'success');
            // -----------------------------

            modalRecusarCPS.hide();

            // Atualização Local
            dadosCpsGlobais = dadosCpsGlobais.filter(i => !ids.includes(i.id));
            renderizarAcordeonCPS(dadosCpsGlobais, 'accordionPendenciasCPS', 'msg-sem-pendencias-cps', true);

        } catch (err) {
            mostrarToast(err.message, 'error');
        }
    });

    const btnRecusarLoteCoord = document.getElementById('btn-recusar-selecionados-cps-coord');
    if (btnRecusarLoteCoord) {
        btnRecusarLoteCoord.addEventListener('click', () => {
            // Configura o modal de valor para o modo RECUSA em LOTE
            document.getElementById('cpsAcaoCoordenador').value = 'recusar';
            modalAlterarValorCPS._element.dataset.acaoEmLote = 'true';

            // Ajustes visuais do modal (igual ao individual)
            const modalTitle = document.querySelector('#modalAlterarValorCPS .modal-title');
            const btnConfirmar = document.getElementById('btnConfirmarAcaoCPS');
            const divCompetencia = document.getElementById('divCompetenciaCps');
            const inputValor = document.getElementById('cpsValorPagamentoInput');
            const inputJustificativa = document.getElementById('cpsJustificativaInput');

            modalTitle.innerHTML = '<i class="bi bi-x-circle text-danger me-2"></i>Recusar lançamentos CPS.';
            btnConfirmar.className = 'btn btn-danger';
            btnConfirmar.textContent = "Confirmar Recusa em Lote";
            divCompetencia.style.display = 'none';
            document.getElementById('cpsCompetenciaInput').required = false;
            inputValor.disabled = true;
            inputJustificativa.required = true;
            inputJustificativa.value = '';
            inputJustificativa.placeholder = "Motivo da recusa para todos os itens...";

            modalAlterarValorCPS.show();
        });
    }

    // Botão: Devolver Selecionados (CONTROLLER)
    const btnRecusarLoteController = document.getElementById('btn-recusar-selecionados-cps-controller');
    if (btnRecusarLoteController) {
        btnRecusarLoteController.addEventListener('click', () => {
            modalRecusarCPS._element.dataset.acaoEmLote = 'true';
            document.getElementById('cpsMotivoRecusaInput').value = '';
            modalRecusarCPS.show();
        });
    }

    // 3. Pagar em Lote (Controller)
    const btnPagarLote = document.getElementById('btn-pagar-selecionados-cps');
    if (btnPagarLote) {
        btnPagarLote.addEventListener('click', async function () {
            const checks = document.querySelectorAll('.cps-check:checked');
            const ids = Array.from(checks).map(c => parseInt(c.dataset.id));
            if (!ids.length) return;

            // --- LOADING ADICIONADO ---
            const originalContent = this.innerHTML;
            this.disabled = true;
            this.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processando...`;

            try {
                const res = await fetchComAuth(`${API_BASE_URL}/controle-cps/pagar-lote`, {
                    method: 'POST',
                    body: JSON.stringify({ lancamentoIds: ids, controllerId: userId })
                });
                if (!res.ok) throw new Error("Erro ao pagar.");

                mostrarToast('Pagamentos realizados!', 'success');

                // --- ATUALIZAÇÃO LOCAL ---
                dadosCpsGlobais = dadosCpsGlobais.filter(i => !ids.includes(i.id));
                renderizarAcordeonCPS(dadosCpsGlobais, 'accordionPendenciasCPS', 'msg-sem-pendencias-cps', true);

            } catch (err) {
                mostrarToast(err.message, 'error');
            } finally {
                // --- REMOVE LOADING ---
                this.disabled = false;
                this.innerHTML = originalContent;
                atualizarBotoesLoteCPS(); // Atualiza contadores
            }
        });
    }

    const formRecusarCPS = document.getElementById('formRecusarCPS');
    if (formRecusarCPS) {
        formRecusarCPS.addEventListener('submit', async (e) => {
            e.preventDefault();

            // --- LOADING ADICIONADO ---
            const btnSubmit = formRecusarCPS.querySelector('button[type="submit"]');
            const originalContent = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processando...`;

            const motivo = document.getElementById('cpsMotivoRecusaInput').value;
            const isLote = modalRecusarCPS._element.dataset.acaoEmLote === 'true';
            let ids = [];

            if (isLote) {
                ids = Array.from(document.querySelectorAll('.cps-check:checked')).map(c => parseInt(c.dataset.id));
            } else {
                ids = [parseInt(document.getElementById('cpsLancamentoIdRecusar').value)];
            }

            const endpoint = isLote ? '/controle-cps/recusar-controller-lote' : '/controle-cps/recusar-controller';
            const payload = isLote
                ? { lancamentoIds: ids, controllerId: userId, motivo: motivo }
                : { lancamentoId: ids[0], controllerId: userId, motivo: motivo };

            try {
                const res = await fetchComAuth(`${API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error((await res.json()).message || "Erro ao recusar.");

                mostrarToast(`${ids.length} item(ns) devolvido(s) para Coordenador.`, 'success');
                modalRecusarCPS.hide();

                // Atualização Local
                dadosCpsGlobais = dadosCpsGlobais.filter(i => !ids.includes(i.id));
                renderizarAcordeonCPS(dadosCpsGlobais, 'accordionPendenciasCPS', 'msg-sem-pendencias-cps', true);

            } catch (err) {
                mostrarToast(err.message, 'error');
            } finally {
                // --- REMOVE LOADING ---
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalContent;
            }
        });
    }

    const btnAprovarAdiant = document.getElementById('btnConfirmarAprovarAdiantamento');
    if (btnAprovarAdiant) {
        btnAprovarAdiant.addEventListener('click', async function () {
            const id = document.getElementById('idAdiantamentoAprovar').value;
            const modalEl = document.getElementById('modalAprovarAdiantamento');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);

            // Efeito de Loading no botão
            const originalText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processando...`;
            toggleLoader(true, '#cps-pendencias-pane');

            try {
                const userId = localStorage.getItem('usuarioId');
                const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}/pagar-adiantamento`, {
                    method: 'POST',
                    body: JSON.stringify({ usuarioId: userId })
                });

                if (!response.ok) throw new Error("Erro ao processar pagamento.");

                mostrarToast("Adiantamento pago com sucesso!", "success");
                modalInstance.hide();

                // Recarrega a lista
                document.getElementById('btn-atualizar-cps').click();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleLoader(false, '#cps-pendencias-pane');
                this.disabled = false;
                this.innerHTML = originalText;
            }
        });
    }

    // --- LISTENER: CONFIRMAR RECUSA ADIANTAMENTO ---
    const btnRecusarAdiant = document.getElementById('btnConfirmarRecusaAdiantamento');
    if (btnRecusarAdiant) {
        btnRecusarAdiant.addEventListener('click', async function () {
            const id = document.getElementById('idAdiantamentoRecusar').value;
            const motivo = document.getElementById('motivoRecusaAdiantamento').value.trim();
            const modalEl = document.getElementById('modalRecusarAdiantamento');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);

            if (!motivo) {
                alert("O motivo é obrigatório.");
                document.getElementById('motivoRecusaAdiantamento').focus();
                return;
            }

            // Efeito de Loading no botão
            const originalText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Processando...`;
            toggleLoader(true, '#cps-pendencias-pane');

            try {
                const userId = localStorage.getItem('usuarioId');
                const response = await fetchComAuth(`${API_BASE_URL}/lancamentos/${id}/recusar-adiantamento`, {
                    method: 'POST',
                    body: JSON.stringify({ usuarioId: userId, motivo: motivo })
                });

                if (!response.ok) throw new Error("Erro ao recusar.");

                mostrarToast("Solicitação recusada com sucesso.", "warning");
                modalInstance.hide();

                // Recarrega a lista
                document.getElementById('btn-atualizar-cps').click();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                toggleLoader(false, '#cps-pendencias-pane');
                this.disabled = false;
                this.innerHTML = originalText;
            }
        });
    }

    // --- Listeners de Inicialização ---

    // Troca de aba
    if (tabCPSPendencias) {
        tabCPSPendencias.addEventListener('shown.bs.tab', () => {
            initFiltrosCPS();
            carregarPendenciasCPS();
        });
    }

    if (tabCPSHistorico) {
        tabCPSHistorico.addEventListener('shown.bs.tab', () => {
            initFiltrosCPS();
            carregarHistoricoCPS();
        });
    }

    // Botão Atualizar Filtros
    if (btnAtualizarCps) {
        btnAtualizarCps.addEventListener('click', () => {
            if (tabCPSPendencias.classList.contains('active')) carregarPendenciasCPS();
            if (tabCPSHistorico.classList.contains('active')) carregarHistoricoCPS();
        });
    }

    // Inicializa se a aba já estiver ativa (ex: F5)
    if (tabCPSPendencias && tabCPSPendencias.classList.contains('active')) {
        initFiltrosCPS();
        carregarPendenciasCPS();
    }

    configurarBuscaCps('input-busca-pendencias', 'accordionPendencias');
    configurarBuscaCps('input-busca-historico', 'accordionHistorico');

    document.getElementById('btn-exportar-historico-cps')?.addEventListener('click', (e) => {
        e.preventDefault();
        // Chame sua função de exportação aqui, passando os filtros do histórico
        exportarRelatorioHistorico();
    });
});