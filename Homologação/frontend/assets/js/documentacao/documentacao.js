document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('role');
    
    // 1. Carregar Lista de Documentadores (para o select do Manager)
    let documentadores = [];
    async function carregarDocumentadores() {
        // Endpoint que retorna usuários com ROLE_DOCUMENTADOR
        const res = await fetchComAuth('http://localhost:8080/usuarios/documentadores'); 
        documentadores = await res.json();
    }

    // 2. Carregar Pendências de Solicitação (Visão Manager)
    async function carregarPendentesSolicitacao() {
        const tbody = document.getElementById('tbody-pendentes-solicitacao');
        // Busca lançamentos que têm dataEnvioDocumentacao != null E não têm solicitação criada
        const res = await fetchComAuth('http://localhost:8080/documentacao/pendentes-solicitacao');
        const dados = await res.json();

        tbody.innerHTML = dados.map(l => {
            // Cria o select de documentadores dinamicamente
            let options = `<option value="">Selecione...</option>`;
            documentadores.forEach(doc => {
                options += `<option value="${doc.id}">${doc.nome}</option>`;
            });

            return `
            <tr>
                <td>${l.os.os}</td>
                <td>${l.os.projeto}</td>
                <td>${l.detalhe.lpu.nomeLpu}</td>
                <td>${formatarData(l.dataEnvioDocumentacao)}</td>
                <td>
                    <select class="form-select form-select-sm select-documentador" id="doc-select-${l.id}">
                        ${options}
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="solicitarDocumentacao(${l.id})">
                        Solicitar
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    // 3. Função para Solicitar (Manager)
    window.solicitarDocumentacao = async (lancamentoId) => {
        const docId = document.getElementById(`doc-select-${lancamentoId}`).value;
        if(!docId) return alert("Selecione um documentador!");

        await fetchComAuth('http://localhost:8080/documentacao/solicitar', {
            method: 'POST',
            body: JSON.stringify({ lancamentoId, documentadorId: docId })
        });
        // Recarregar tabela...
        carregarPendentesSolicitacao();
    };

    // 4. Carregar Fila de Trabalho (Visão Documentador)
    async function carregarFilaTrabalho() {
        // Busca solicitações onde documentador == userLogado AND status != FINALIZADO
        const res = await fetchComAuth(`http://localhost:8080/documentacao/minha-fila`); 
        // ... renderizar tabela com botões "OK" e "Reportar"
    }

    // Inicialização
    if(userRole === 'MANAGER' || userRole === 'ADMIN') {
        carregarDocumentadores().then(carregarPendentesSolicitacao);
    }
    if(userRole === 'DOCUMENTADOR' || userRole === 'ADMIN') {
        carregarFilaTrabalho();
    }
});