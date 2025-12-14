const API_GERAL_URL = 'http://localhost:8080/tipos-documentacao';
const API_BANCOS_URL = 'http://localhost:8080/geral/bancos'; // Nova API
const API_DOCUMENTISTAS = 'http://localhost:8080/usuarios/documentistas';

let modalTipoDocInstance;
let modalBancoInstance;
let listaDocumentistasCache = [];

document.addEventListener('DOMContentLoaded', () => {
    verificarPermissaoGeral();

    // Inicializa modais
    const modalDocEl = document.getElementById('modalTipoDoc');
    if (modalDocEl) modalTipoDocInstance = new bootstrap.Modal(modalDocEl);

    const modalBancoEl = document.getElementById('modalBanco');
    if (modalBancoEl) modalBancoInstance = new bootstrap.Modal(modalBancoEl);

    // Listener para carregar dados ao clicar na aba
    const cardGeral = document.querySelector('.segment-card[data-filter="geral"]');
    if (cardGeral) {
        cardGeral.addEventListener('click', () => {
            // Abre na aba padrão (Docs)
            alternarSubsecao('docs');
            carregarDocumentistasParaSelect();
        });
    }
});

// --- Controle de Abas (Subseções) ---
function alternarSubsecao(tipo) {
    // 1. Atualiza visual do menu
    const botoes = document.querySelectorAll('.settings-menu .list-group-item');
    botoes.forEach(btn => btn.classList.remove('active'));

    // 2. Esconde todas as seções
    document.querySelectorAll('.subsecao-geral').forEach(div => div.classList.add('d-none'));

    // 3. Mostra a selecionada e carrega dados
    if (tipo === 'docs') {
        document.getElementById('subsecao-docs').classList.remove('d-none');
        botoes[0].classList.add('active'); // Assume que é o primeiro botão
        carregarTiposDoc();
    } else if (tipo === 'bancos') {
        document.getElementById('subsecao-bancos').classList.remove('d-none');
        botoes[1].classList.add('active'); // Assume que é o segundo botão
        carregarBancos();
    }
}

// --- Funções de Bancos ---
async function carregarBancos() {
    const tbody = document.getElementById('tbody-bancos');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

    try {
        const response = await fetchComAuth(API_BANCOS_URL);
        if (!response.ok) throw new Error('Erro');
        const bancos = await response.json();

        tbody.innerHTML = '';
        if (bancos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Nenhum banco cadastrado.</td></tr>';
            return;
        }

        bancos.forEach(banco => {
            const tr = document.createElement('tr');
            // REMOVIDO: ps-5, text-start
            // ADICIONADO: Centralização e novos botões
            tr.innerHTML = `
                <td class="fw-bold text-secondary">${banco.codigo}</td>
                <td class="fw-medium text-dark">${banco.nome}</td>
                <td>
                    <button class="btn-icon-modern delete" onclick="deletarBanco(${banco.id})" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        mostrarToast("Erro ao carregar bancos.", "error");
    }
}

function abrirModalBanco() {
    document.getElementById('formBanco').reset();
    modalBancoInstance.show();
}

async function salvarBanco() {
    const codigo = document.getElementById('bancoCodigo').value.trim();
    const nome = document.getElementById('bancoNome').value.trim();

    if (!codigo || !nome) {
        mostrarToast("Preencha código e nome.", "warning");
        return;
    }

    const payload = { codigo, nome };

    try {
        const response = await fetchComAuth(API_BANCOS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            mostrarToast("Banco salvo com sucesso!", "success");
            modalBancoInstance.hide();
            carregarBancos();
        } else {
            mostrarToast("Erro ao salvar. Verifique se o código já existe.", "error");
        }
    } catch (error) {
        console.error(error);
        mostrarToast("Erro de conexão.", "error");
    }
}

async function deletarBanco(id) {
    if (!confirm('Deseja realmente excluir este banco?')) return;
    try {
        const response = await fetchComAuth(`${API_BANCOS_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            mostrarToast("Banco excluído.", "success");
            carregarBancos();
        } else {
            mostrarToast("Erro ao excluir banco.", "error");
        }
    } catch (e) {
        mostrarToast("Erro de conexão.", "error");
    }
}

// --- Funções Originais de Permissão e Documentação (Mantidas e Ajustadas) ---
function verificarPermissaoGeral() {
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const allowedRoles = ['ADMIN', 'CONTROLLER', 'ASSISTANT'];
    const cardGeral = document.querySelector('.segment-card[data-filter="geral"]');

    if (cardGeral) {
        if (allowedRoles.includes(userRole)) {
            cardGeral.style.display = 'block'; // alterado de flex para block para o grid funcionar
        } else {
            cardGeral.style.display = 'none';
        }
    }
}

// ... (Mantenha aqui as funções carregarDocumentistasParaSelect, carregarTiposDoc, salvarTipoDoc etc. que já existiam no seu arquivo original, sem alterações lógicas, apenas certifique-se que elas usem fetchComAuth e mostrarToast corretamente)
// Caso precise, posso reescrever essas funções aqui também.

async function carregarDocumentistasParaSelect() {
    if (listaDocumentistasCache.length > 0) return;
    try {
        const response = await fetchComAuth(API_DOCUMENTISTAS);
        if (response.ok) {
            listaDocumentistasCache = await response.json();
            const select = document.getElementById('tipoDocResponsavel');
            if (select) {
                select.innerHTML = ''; // Limpa antes de preencher
                listaDocumentistasCache.forEach(doc => {
                    select.add(new Option(doc.nome, doc.id));
                });
            }
        }
    } catch (error) {
        console.error("Erro documentistas", error);
    }
}

async function carregarTiposDoc() {
    const tbody = document.getElementById('tbody-tipos-doc');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

    try {
        const response = await fetchComAuth(API_GERAL_URL);
        const dados = await response.json();
        tbody.innerHTML = '';

        if (dados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">Nenhum registro encontrado.</td></tr>`;
            return;
        }

        dados.sort((a, b) => a.nome.localeCompare(b.nome));

        dados.forEach(tipo => {
            const tr = document.createElement('tr');

            // Lógica de exibição das badges
            let docBadges = '';

            if (tipo.documentistas && tipo.documentistas.length > 0) {
                docBadges = '<div class="d-flex flex-wrap gap-2 justify-content-center">' +
                    tipo.documentistas.map(d => `<span class="badge doc-badge">${d.nome}</span>`).join('') +
                    '</div>';
            } else {
                // Se a lista estiver vazia, mostra este texto. 
                // Se sua regra de negócio é "Vazio = Todos podem fazer", mantenha. 
                // Se "Vazio = Ninguém", mude para "Nenhum selecionado".
                docBadges = '<span class="text-muted small fst-italic">Todos habilitados (Padrão)</span>';
            }

            const docIds = tipo.documentistas ? JSON.stringify(tipo.documentistas.map(d => d.id)) : '[]';

            tr.innerHTML = `
                <td class="fw-semibold text-dark">${tipo.nome}</td>
                <td>${docBadges}</td>
                <td>
                    <button class="btn-icon-modern edit" onclick='editarTipoDoc(${tipo.id}, "${tipo.nome}", ${docIds})' title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn-icon-modern delete" onclick="deletarTipoDoc(${tipo.id})" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}

function abrirModalTipoDoc() {
    document.getElementById('formTipoDoc').reset();
    document.getElementById('tipoDocId').value = '';
    document.getElementById('modalTipoDocLabel').textContent = 'Novo Tipo de Documentação';

    // Reseta seleção do select multiple
    const select = document.getElementById('tipoDocResponsavel');
    if (select) {
        Array.from(select.options).forEach(opt => opt.selected = false);
        // Popula se estiver vazio
        if (select.options.length <= 0 && listaDocumentistasCache.length > 0) {
            listaDocumentistasCache.forEach(doc => select.add(new Option(doc.nome, doc.id)));
        }
    }

    modalTipoDocInstance.show();
}

function editarTipoDoc(id, nome, idsDocumentistas) {
    document.getElementById('tipoDocId').value = id;
    document.getElementById('tipoDocNome').value = nome;

    const select = document.getElementById('tipoDocResponsavel');

    // Garante população
    if (select.options.length <= 0 && listaDocumentistasCache.length > 0) {
        listaDocumentistasCache.forEach(doc => select.add(new Option(doc.nome, doc.id)));
    }

    // Seleciona os itens corretos no multiselect
    if (idsDocumentistas && Array.isArray(idsDocumentistas)) {
        Array.from(select.options).forEach(option => {
            option.selected = idsDocumentistas.includes(parseInt(option.value));
        });
    }

    document.getElementById('modalTipoDocLabel').textContent = 'Editar Tipo de Documentação';
    modalTipoDocInstance.show();
}

async function salvarTipoDoc() {
    const id = document.getElementById('tipoDocId').value;
    const nome = document.getElementById('tipoDocNome').value;

    // 1. CORREÇÃO CRÍTICA: Declarar o select aqui
    const select = document.getElementById('tipoDocResponsavel');

    if (!nome.trim()) {
        mostrarToast("O nome é obrigatório.", "warning");
        return;
    }

    // 2. Captura os IDs selecionados (se nenhum, retorna array vazio [])
    const selectedIds = Array.from(select.selectedOptions).map(opt => parseInt(opt.value));

    // 3. Monta o payload
    const payload = {
        nome: nome,
        documentistas: selectedIds.map(id => ({ id: id }))
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_GERAL_URL}/${id}` : API_GERAL_URL;

    const btnSalvar = document.querySelector('#modalTipoDoc .btn-primary');
    const originalText = btnSalvar.textContent;
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        const response = await fetchComAuth(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            modalTipoDocInstance.hide();
            mostrarToast("Salvo com sucesso!", "success");

            // Recarrega a tabela para mostrar os novos dados vindos do backend
            await carregarTiposDoc();
        } else {
            mostrarToast("Erro ao salvar.", "error");
        }
    } catch (error) {
        console.error(error);
        mostrarToast("Erro de conexão.", "error");
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = originalText;
    }
}

async function deletarTipoDoc(id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
        const response = await fetchComAuth(`${API_GERAL_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarTiposDoc();
        } else {
            alert('Erro ao excluir. O item pode estar em uso em algum lançamento.');
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao tentar excluir.');
    }
}