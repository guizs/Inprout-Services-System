const API_GERAL_URL = 'http://localhost:8080/tipos-documentacao';
const API_DOCUMENTISTAS = 'http://localhost:8080/usuarios/documentistas';
let modalTipoDocInstance;
let listaDocumentistasCache = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. REGRA DE PERMISSÃO: Esconder a aba se não for autorizado
    verificarPermissaoGeral();

    // Inicializa o modal
    const modalEl = document.getElementById('modalTipoDoc');
    if (modalEl) modalTipoDocInstance = new bootstrap.Modal(modalEl);

    // Lógica para detectar clique na aba "Geral"
    const cardGeral = document.querySelector('.segment-card[data-filter="geral"]');
    if (cardGeral) {
        cardGeral.addEventListener('click', () => {
            carregarTiposDoc();
            carregarDocumentistasParaSelect(); // Pré-carrega o select
        });
    }
});

function verificarPermissaoGeral() {
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const allowedRoles = ['ADMIN', 'CONTROLLER', 'ASSISTANT'];
    const cardGeral = document.querySelector('.segment-card[data-filter="geral"]');

    if (cardGeral) {
        if (allowedRoles.includes(userRole)) {
            cardGeral.style.display = 'flex'; // ou 'block' dependendo do seu CSS grid
        } else {
            cardGeral.style.display = 'none'; // Esconde de quem não pode ver
            // Se o usuário estiver na aba geral (por URL ou bug), remove o conteúdo
            const conteudoGeral = document.getElementById('conteudo-geral');
            if (conteudoGeral) conteudoGeral.innerHTML = '';
        }
    }
}

async function carregarDocumentistasParaSelect() {
    if (listaDocumentistasCache.length > 0) return; // Já carregado

    try {
        const response = await fetchComAuth(API_DOCUMENTISTAS);
        if (response.ok) {
            listaDocumentistasCache = await response.json();
            const select = document.getElementById('tipoDocResponsavel');
            if (select) {
                // Mantém a opção padrão "Sem responsável"
                select.innerHTML = '<option value="" selected>Sem responsável fixo</option>';
                listaDocumentistasCache.forEach(doc => {
                    select.add(new Option(doc.nome, doc.id));
                });
            }
        }
    } catch (error) {
        console.error("Erro ao carregar documentistas", error);
    }
}

async function carregarTiposDoc() {
    const tbody = document.getElementById('tbody-tipos-doc');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>';

    try {
        const response = await fetchComAuth(API_GERAL_URL);
        if (!response.ok) throw new Error('Falha ao buscar dados');

        const dados = await response.json();
        tbody.innerHTML = '';

        dados.sort((a, b) => a.nome.localeCompare(b.nome));

        if (dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Nenhum item cadastrado.</td></tr>';
            return;
        }

        dados.forEach(tipo => {
            let docBadges = '<span class="text-muted small">Todos habilitados</span>';
            if (tipo.documentistas && tipo.documentistas.length > 0) {
                docBadges = tipo.documentistas.map(d =>
                    `<span class="badge bg-light text-dark border me-1">${d.nome}</span>`
                ).join('');
            }

            // Prepara lista de IDs para o botão editar
            const docIds = tipo.documentistas ? tipo.documentistas.map(d => d.id) : [];

            tr.innerHTML = `
                <td class="ps-4 fw-medium text-dark">${tipo.nome}</td>
                <td>${docBadges}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm text-primary me-2" onclick='editarTipoDoc(${tipo.id}, "${tipo.nome}", ${JSON.stringify(docIds)})'>
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm text-danger" onclick="deletarTipoDoc(${tipo.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
    }
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

    if (!nome.trim()) {
        alert("O nome é obrigatório.");
        return;
    }

    const selectedIds = Array.from(select.selectedOptions).map(opt => parseInt(opt.value));

    // Monta payload com lista de objetos Usuario
    const payload = {
        nome: nome,
        documentistas: selectedIds.map(id => ({ id: id }))
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_GERAL_URL}/${id}` : API_GERAL_URL;

    // Feedback visual no botão
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
            carregarTiposDoc();
        } else {
            alert('Erro ao salvar. Verifique se o backend está atualizado.');
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão.');
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