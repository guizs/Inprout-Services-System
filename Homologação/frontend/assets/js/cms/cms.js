// Path: guizs/inprout-services-system/Inprout-Services-System-9c7c6d66a45787cd6c5531a8ab5c139813218d8f/Homologação/frontend/assets/js/cms/cms.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const tbodyMateriais = document.getElementById('tbody-cms');
    const btnNovoMaterial = document.getElementById('btnNovoMaterial');

    // Modal de Novo Material
    const modalMaterialEl = document.getElementById('modalMaterial');
    const modalMaterial = new bootstrap.Modal(modalMaterialEl);
    const formMaterial = document.getElementById('formMaterial');

    // Modal de Detalhes
    const modalDetalhesEl = document.getElementById('modalDetalhesMaterial');
    const modalDetalhes = new bootstrap.Modal(modalDetalhesEl);
    const detalhesPane = document.getElementById('detalhes-pane');
    const tbodyHistoricoEntradas = document.getElementById('tbody-historico-entradas');

    // Modal de Nova Entrada
    const modalNovaEntradaEl = document.getElementById('modalNovaEntrada');
    const modalNovaEntrada = new bootstrap.Modal(modalNovaEntradaEl);
    const formNovaEntrada = document.getElementById('formNovaEntrada');
    const entradaMaterialIdInput = document.getElementById('entradaMaterialId');

    // Modal de Exclusão
    const modalExcluirEl = document.getElementById('modalExcluir');
    const modalExcluir = new bootstrap.Modal(modalExcluirEl);
    const nomeMaterialExcluirSpan = document.getElementById('nomeMaterialExcluir');
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');

    // Filtros
    const inputBuscaMaterial = document.getElementById('inputBuscaMaterial');
    const selectCondicaoFiltro = document.getElementById('materiais_selectCondicaoFiltro');
    const inputValorFiltro = document.getElementById('materiais_inputValorFiltro');
    const btnAplicarFiltro = document.getElementById('materiais_btnAplicarFiltro');
    const btnLimparFiltro = document.getElementById('materiais_btnLimparFiltro');
    const checkUnitPC = document.getElementById('materiais_checkUnitPC');
    const checkUnitMT = document.getElementById('materiais_checkUnitMT');

    // --- INÍCIO: NOVOS ELEMENTOS DE IMPORTAÇÃO ---
    const importContainer = document.getElementById('importar-materiais-container');
    const btnBaixarTemplate = document.getElementById('btnBaixarTemplateMaterial');
    const btnImportarLegado = document.getElementById('btnImportarLegadoMaterial');
    const importLegadoInput = document.getElementById('import-legado-material-input');

    // Modal de Progresso
    const modalProgressoEl = document.getElementById('modalProgressoImportacao');
    const modalProgresso = modalProgressoEl ? new bootstrap.Modal(modalProgressoEl) : null;
    const textoProgresso = document.getElementById('textoProgressoImportacao');
    const barraProgresso = document.getElementById('barraProgressoImportacao');
    const avisosContainer = document.getElementById('avisosImportacaoContainer');
    const listaAvisos = document.getElementById('listaAvisosImportacao');
    const btnFecharProgresso = document.getElementById('btnFecharProgresso');
    // --- FIM: NOVOS ELEMENTOS DE IMPORTAÇÃO ---
    
    let todosOsMateriais = [];
    const API_BASE_URL = 'https://www.inproutservices.com.br/api';

    // ==========================================================
    // CONTROLE DE ACESSO (ROLE)
    // ==========================================================
    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const rolesComAcessoTotal = ['ADMIN', 'CONTROLLER'];
    const rolesComAcessoImportar = ['ADMIN', 'CONTROLLER']; // Roles que podem importar
    const temAcessoTotal = rolesComAcessoTotal.includes(userRole);

    // --- INÍCIO: NOVA FUNÇÃO DE VISIBILIDADE ---
    /**
     * Configura a visibilidade dos botões de importação com base no perfil do usuário.
     */
    function setupRoleBasedUI_CMA() {
        if (!importContainer) return;

        const podeImportar = rolesComAcessoImportar.includes(userRole);
        
        if (podeImportar) {
            importContainer.style.display = 'flex'; // Mostra o container
        } else {
            importContainer.style.display = 'none !important'; // Garante que esteja oculto
        }
    }
    // --- FIM: NOVA FUNÇÃO DE VISIBILIDADE ---


    const formatarMoeda = (valor) => {
        if (typeof valor !== 'number') return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    async function carregarMateriais() {
        if (typeof toggleLoader === 'function') toggleLoader(true);
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/materiais`);
            if (!response.ok) throw new Error('Erro ao carregar materiais');
            todosOsMateriais = await response.json();
            aplicarFiltrosErenderizar();
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    function aplicarFiltrosErenderizar() {
        let materiaisFiltrados = [...todosOsMateriais];
        
        const termoBusca = inputBuscaMaterial.value.toLowerCase().trim();
        if (termoBusca) {
            materiaisFiltrados = materiaisFiltrados.filter(material =>
                material.codigo.toLowerCase().includes(termoBusca) ||
                material.descricao.toLowerCase().includes(termoBusca)
            );
        }

        const condicao = selectCondicaoFiltro.value;
        const valor = parseFloat(inputValorFiltro.value);
        if (!isNaN(valor)) {
            materiaisFiltrados = materiaisFiltrados.filter(material => {
                const saldo = material.saldoFisico;
                if (condicao === 'maior') return saldo > valor;
                if (condicao === 'menor') return saldo < valor;
                if (condicao === 'igual') return saldo === valor;
                return true;
            });
        }

        const unidadesSelecionadas = [];
        if (checkUnitPC.checked) unidadesSelecionadas.push('PÇ');
        if (checkUnitMT.checked) unidadesSelecionadas.push('MT');
        
        if (unidadesSelecionadas.length > 0) {
            materiaisFiltrados = materiaisFiltrados.filter(material =>
                unidadesSelecionadas.includes(material.unidadeMedida)
            );
        }

        renderizarTabelaMateriais(materiaisFiltrados);
    }

    function renderizarTabelaMateriais(materiais) {
        const tbody = tbodyMateriais;
        const thead = tbody.previousElementSibling;
        
        thead.innerHTML = '';
        tbody.innerHTML = '';

        thead.innerHTML = `
            <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th class="text-center">Unidade</th> 
                <th class="text-center">Quantidade em Estoque</th> 
                <th class="text-center">Custo Médio</th>
                <th class="text-center">Custo Total</th>
            </tr>
        `;

        if (materiais.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhum material encontrado.</td></tr>`;
            return;
        }

        materiais.forEach(material => {
            const tr = document.createElement('tr');
            tr.className = 'material-row';
            tr.dataset.id = material.id;
            tr.style.cursor = 'pointer';

            tr.innerHTML = `
                <td data-label="Código">${material.codigo}</td>
                <td data-label="Descrição">${material.descricao}</td>
                <td data-label="Unidade" class="text-center">${material.unidadeMedida}</td>
                <td data-label="Qtd. Estoque" class="text-center">${new Intl.NumberFormat('pt-BR').format(material.saldoFisico)}</td>
                <td data-label="Custo Médio" class="text-center">${formatarMoeda(material.custoMedioPonderado)}</td>
                <td data-label="Custo Total" class="text-center">${formatarMoeda(material.custoTotal)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function abrirModalDetalhes(id) {
        if (typeof toggleLoader === 'function') toggleLoader(true);
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/materiais/${id}`);
            if (!response.ok) throw new Error('Material não encontrado');
            const material = await response.json();

            document.getElementById('modalDetalhesMaterialLabel').textContent = `Detalhes de: ${material.descricao}`;
            detalhesPane.innerHTML = `
                <p><strong>Código:</strong> ${material.codigo}</p>
                <p><strong>Descrição:</strong> ${material.descricao}</p>
                <p><strong>Unidade:</strong> ${material.unidadeMedida}</p>
                <p><strong>Empresa:</strong> ${material.empresa}</p>
                <p><strong>Quantidade em Estoque:</strong> ${material.saldoFisico}</p>
                <p><strong>Custo Médio Ponderado:</strong> ${formatarMoeda(material.custoMedioPonderado)}</p>
                <p><strong>Custo Total em Estoque:</strong> ${formatarMoeda(material.custoTotal)}</p>
                <p><strong>Observações:</strong> ${material.observacoes || 'N/A'}</p>
            `;
            
            // --- CONTROLE DE ACESSO PARA ABAS E BOTÕES DO MODAL ---
            const tabHistorico = document.getElementById('historico-tab');
            const btnExcluir = modalDetalhesEl.querySelector('.btn-excluir-modal');
            const btnRegistrarEntrada = modalDetalhesEl.querySelector('.btn-registrar-entrada-modal');

            if (temAcessoTotal) {
                tabHistorico.style.display = 'block'; // Mostra a aba
                btnExcluir.style.display = 'inline-block'; // Mostra o botão
                btnRegistrarEntrada.style.display = 'inline-block'; // Mostra o botão

                // Carrega o histórico somente se o usuário tiver permissão
                const entradas = material.entradas || [];
                tbodyHistoricoEntradas.innerHTML = entradas.map(e => `
                    <tr>
                        <td>${new Date(e.dataEntrada).toLocaleString('pt-BR')}</td>
                        <td>${e.quantidade}</td>
                        <td>${formatarMoeda(e.custoUnitario)}</td>
                        <td>${e.observacoes || ''}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4" class="text-center">Nenhuma entrada registrada.</td></tr>';

            } else {
                tabHistorico.style.display = 'none'; // Esconde a aba
                btnExcluir.style.display = 'none'; // Esconde o botão
                btnRegistrarEntrada.style.display = 'none'; // Esconde o botão
            }
             // --- FIM DO CONTROLE DE ACESSO ---


            btnExcluir.dataset.id = id;
            btnExcluir.dataset.descricao = material.descricao;
            btnRegistrarEntrada.dataset.id = id;

            // Garante que a primeira aba esteja sempre ativa ao abrir
            new bootstrap.Tab(document.getElementById('detalhes-tab')).show();

            modalDetalhes.show();
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    tbodyMateriais.addEventListener('click', (e) => {
        const row = e.target.closest('.material-row');
        if (row) abrirModalDetalhes(row.dataset.id);
    });

    // --- Lógica dos Modais ---
    
    btnNovoMaterial.addEventListener('click', () => {
        formMaterial.reset();
        modalMaterial.show();
    });

    formMaterial.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = modalMaterialEl.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

        const materialData = {
            codigo: document.getElementById('materialCodigo').value,
            descricao: document.getElementById('materialDescricao').value,
            unidadeMedida: document.getElementById('materialUnidade').value,
            saldoFisicoInicial: document.getElementById('materialSaldo').value,
            custoUnitarioInicial: parseFloat(document.getElementById('materialCustoUnitario').value.replace(/\./g, '').replace(',', '.')),
            observacoes: document.getElementById('materialObservacoes').value,
            empresa: document.getElementById('materialEmpresa').value
        };

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/materiais`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialData)
            });
            if (!response.ok) throw new Error((await response.json()).message);
            mostrarToast('Material criado com sucesso!', 'success');
            modalMaterial.hide();
            await carregarMateriais();
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = "Salvar";
        }
    });

    modalDetalhesEl.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('btn-excluir-modal')) {
            nomeMaterialExcluirSpan.textContent = `"${e.target.dataset.descricao}"`;
            btnConfirmarExclusao.dataset.id = id;
            modalDetalhes.hide();
            modalExcluir.show();
        }
        if (e.target.classList.contains('btn-registrar-entrada-modal')) {
            entradaMaterialIdInput.value = id;
            formNovaEntrada.reset();
            modalDetalhes.hide();
            modalNovaEntrada.show();
        }
    });

    formNovaEntrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSalvarEntrada');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

        const entradaData = {
            materialId: entradaMaterialIdInput.value,
            quantidade: document.getElementById('entradaQuantidade').value,
            custoUnitario: parseFloat(document.getElementById('entradaCustoUnitario').value.replace(/\./g, '').replace(',', '.')),
            observacoes: document.getElementById('entradaObservacoes').value
        };

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/materiais/entradas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entradaData)
            });
            if (!response.ok) throw new Error((await response.json()).message);
            mostrarToast('Entrada registrada com sucesso!', 'success');
            modalNovaEntrada.hide();
            await carregarMateriais();
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = "Salvar Entrada";
        }
    });

    btnConfirmarExclusao.addEventListener('click', async () => {
        const id = btnConfirmarExclusao.dataset.id;
        if (!id) return;
    
        btnConfirmarExclusao.disabled = true;
        btnConfirmarExclusao.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Excluindo...`;
    
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/materiais/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao excluir.');
            }
            mostrarToast('Material excluído com sucesso!', 'success');
            modalExcluir.hide();
            await carregarMateriais(); // Chame a função correta para recarregar
        } catch (error) {
            mostrarToast(error.message, 'error');
            modalExcluir.hide();
        } finally {
            btnConfirmarExclusao.disabled = false;
            btnConfirmarExclusao.innerHTML = "Sim, Excluir";
        }
    }); 

    // --- Event Listeners para os filtros ---
    inputBuscaMaterial.addEventListener('input', aplicarFiltrosErenderizar);
    btnAplicarFiltro.addEventListener('click', aplicarFiltrosErenderizar);
    btnLimparFiltro.addEventListener('click', () => {
        selectCondicaoFiltro.selectedIndex = 0;
        inputValorFiltro.value = '';
        checkUnitPC.checked = false;
        checkUnitMT.checked = false;
        aplicarFiltrosErenderizar();
    });

    // --- INÍCIO: NOVOS EVENT LISTENERS PARA IMPORTAÇÃO ---
    if (btnBaixarTemplate) {
        btnBaixarTemplate.addEventListener('click', () => {
            // Define os cabeçalhos conforme sua solicitação
            const headers = ["ESTOQUE", "CÓDIGO", "DESCRIÇÃO", "UNIDADE", "SALDO FISICO", "CUSTO UNITÁRIO"];
            // Adiciona uma linha de exemplo
            const exampleData = [
                { ESTOQUE: 'CLIENTE', CÓDIGO: '100.200', DESCRIÇÃO: 'CABO DE REDE CAT6', UNIDADE: 'MT', "SALDO FISICO": 150.50, "CUSTO UNITÁRIO": 5.75 },
                { ESTOQUE: 'INPROUT', CÓDIGO: 'A-001', DESCRIÇÃO: 'CONECTOR RJ45', UNIDADE: 'PÇ', "SALDO FISICO": 500, "CUSTO UNITÁRIO": 1.20 }
            ];
            
            // Cria a planilha
            const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
            
            // Ajusta a largura das colunas
            ws['!cols'] = [
                { wch: 15 }, // ESTOQUE
                { wch: 15 }, // CÓDIGO
                { wch: 40 }, // DESCRIÇÃO
                { wch: 10 }, // UNIDADE
                { wch: 15 }, // SALDO FISICO
                { wch: 15 }  // CUSTO UNITÁRIO
            ];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Modelo Legado CMA");
            
            // Força o download
            XLSX.writeFile(wb, "modelo_importacao_cma.xlsx");
        });
    }

    if (btnImportarLegado) {
        btnImportarLegado.addEventListener('click', () => {
            importLegadoInput.click();
        });
    }

    if (importLegadoInput) {
        importLegadoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!modalProgresso) return;

            // Prepara o modal de progresso
            textoProgresso.textContent = 'Enviando arquivo...';
            barraProgresso.style.width = '25%';
            barraProgresso.textContent = '25%';
            avisosContainer.classList.add('d-none');
            listaAvisos.innerHTML = '';
            btnFecharProgresso.disabled = true;
            modalProgresso.show();

            const formData = new FormData();
            formData.append('file', file);

            try {
                // Simula o processamento no servidor
                await new Promise(res => setTimeout(res, 500)); 
                barraProgresso.style.width = '50%';
                barraProgresso.textContent = '50%';
                textoProgresso.textContent = 'Processando no servidor...';

                // Envia o arquivo para o novo endpoint
                const response = await fetchComAuth(`${API_BASE_URL}/materiais/importar-legado`, {
                    method: 'POST',
                    body: formData
                    // Não defina 'Content-Type', o FormData faz isso
                });

                barraProgresso.style.width = '100%';
                barraProgresso.textContent = '100%';
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Erro desconhecido no servidor.');
                }

                // Exibe o log retornado pelo backend
                textoProgresso.textContent = 'Importação concluída!';
                if (result.log && result.log.length > 0) {
                    avisosContainer.classList.remove('d-none');
                    listaAvisos.innerHTML = result.log.map(item => {
                        let itemClass = 'list-group-item-success'; // Sucesso
                        if (item.startsWith('IGNORADO')) itemClass = 'list-group-item-warning';
                        if (item.startsWith('ERRO')) itemClass = 'list-group-item-danger';
                        return `<li class="list-group-item ${itemClass}">${item}</li>`;
                    }).join('');
                }
                
                // Recarrega a tabela de materiais
                await carregarMateriais();

            } catch (error) {
                textoProgresso.textContent = 'Erro na importação!';
                avisosContainer.classList.remove('d-none');
                listaAvisos.innerHTML = `<li class="list-group-item list-group-item-danger">${error.message}</li>`;
                console.error("Erro na importação de legado CMA:", error);
            } finally {
                btnFecharProgresso.disabled = false;
                importLegadoInput.value = ''; // Limpa o input de arquivo
            }
        });
    }
    // --- FIM: NOVOS EVENT LISTENERS PARA IMPORTAÇÃO ---


    // --- Inicialização ---
    if (!temAcessoTotal) {
        btnNovoMaterial.style.display = 'none';
    }
    setupRoleBasedUI_CMA(); // Chama a nova função de visibilidade
    carregarMateriais();
});