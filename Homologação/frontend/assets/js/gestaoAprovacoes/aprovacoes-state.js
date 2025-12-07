// ==========================================================
// ESTADO GLOBAL E UTILITÁRIOS
// ==========================================================

const API_BASE_URL = 'http://localhost:8080';
const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
const userId = localStorage.getItem('usuarioId');

// --- Variáveis de Dados Globais ---
// Usamos 'var' ou definimos no window para garantir acesso global entre arquivos
window.todosOsLancamentosGlobais = [];
window.todasPendenciasMateriais = [];
window.todosHistoricoMateriais = [];
window.todasPendenciasComplementares = [];
window.todoHistoricoComplementares = [];
window.todasPendenciasAtividades = [];

// Variáveis de CPS
window.dadosCpsGlobais = [];
window.dadosCpsHistorico = [];

// Variáveis de Histórico de Atividades
window.todosHistoricoAtividades = [];
window.histDataFim = new Date();
window.histDataInicio = new Date();
window.histDataInicio.setDate(window.histDataFim.getDate() - 30);


// --- Inicialização de Modais (Bootstrap) ---
// Verifica se o elemento existe antes de criar a instância para evitar erros
const getModal = (id) => document.getElementById(id) ? new bootstrap.Modal(document.getElementById(id)) : null;

const modalAprovar = getModal('modalAprovarLancamento');
const modalComentar = getModal('modalComentarPrazo');
const modalEditar = getModal('modalEditarLancamento');
const modalRecusar = getModal('modalRecusarLancamento');
const modalComentarios = getModal('modalComentarios');
const modalAprovarMaterial = getModal('modalAprovarMaterial');
const modalRecusarMaterial = getModal('modalRecusarMaterial');
const modalAprovarComplementar = getModal('modalAprovarComplementar');
const modalRecusarComplementar = getModal('modalRecusarComplementar');
const modalAdiantamento = getModal('modalSolicitarAdiantamento');
const modalAlterarValorCPS = getModal('modalAlterarValorCPS');
const modalRecusarCPS = getModal('modalRecusarCPS');
const modalAprovarAdiantamento = getModal('modalAprovarAdiantamento');
const modalRecusarAdiantamento = getModal('modalRecusarAdiantamento');


// --- Funções Utilitárias Compartilhadas ---

// Formata data para ISO (YYYY-MM-DD)
const formatarISO = (d) => d.toISOString().split('T')[0];

// Parse de data brasileira (dd/mm/yyyy HH:mm) para Date object
function parseDataBrasileira(dataString) {
    if (!dataString) return null;
    const [data, hora] = dataString.split(' ');
    const [dia, mes, ano] = data.split('/');
    return new Date(`${ano}-${mes}-${dia}T${hora || '00:00:00'}`);
}

// Controla o loader
function toggleLoader(ativo = true, containerSelector = '.content-loader-container') {
    const container = document.querySelector(containerSelector);
    if (container) {
        const overlay = container.querySelector(".overlay-loader");
        if (overlay) {
            overlay.classList.toggle("d-none", !ativo);
        }
    }
}

// Exibe Toast
function mostrarToast(mensagem, tipo = 'success') {
    const toastElement = document.getElementById('toastMensagem');
    const toastBody = document.getElementById('toastTexto');
    const toast = toastElement ? new bootstrap.Toast(toastElement) : null;
    
    if (!toast || !toastBody) return;
    
    toastElement.classList.remove('text-bg-success', 'text-bg-danger');
    toastElement.classList.add(tipo === 'success' ? 'text-bg-success' : 'text-bg-danger');
    toastBody.textContent = mensagem;
    toast.show();
}

// Controle de estado de botão (loading)
function setButtonLoading(button, isLoading) {
    if (!button) return;
    const spinner = button.querySelector('.spinner-border');
    button.disabled = isLoading;
    if (spinner) spinner.classList.toggle('d-none', !isLoading);
}

// Formatação de Moeda
const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : '-';

// Formatação de Data
const formatarData = (data) => data ? data.split('-').reverse().join('/') : '-';

// Safe Getter para objetos aninhados
const get = (obj, path, defaultValue = '-') => {
    const value = path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : undefined), obj);
    return value !== undefined ? value : defaultValue;
};