// Path: guizs/inprout-services-system/Inprout-Services-System-9c7c6d66a45787cd6c5531a8ab5c139813218d8f/Homologação/frontend/assets/js/cms/cms.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const tbodyMateriais = document.getElementById('tbody-cms');
    const btnNovoMaterial = document.getElementById('btnNovoMaterial');

    // --- REMOVIDO: Botão de editar principal e modal de edição separado ---
    // const btnEditarMaterial = document.getElementById('btnEditarMaterial');
    // const modalEditarMaterialEl = document.getElementById('modalEditarMaterial');
    // const modalEditarMaterial = modalEditarMaterialEl ? new bootstrap.Modal(modalEditarMaterialEl) : null;
    // const formEditarMaterial = document.getElementById('formEditarMaterial');
    // const selectMaterialEditar = document.getElementById('selectMaterialEditar');
    // const formCamposMaterial = document.getElementById('formCamposMaterial');
    // const btnSalvarEdicaoMaterial = document.getElementById('btnSalvarEdicaoMaterial');
    // let choicesSelectEditar = null; 

    // --- ADICIONADO: Seletores para os novos campos dentro do modal de detalhes ---
    const formEditarMaterial = document.getElementById('formEditarMaterial'); // Agora é o form do modal de detalhes
    const editMaterialIdInput = document.getElementById('editMaterialId');
    const btnEditarMaterialModal = document.getElementById('btnEditarMaterialModal');
    const btnSalvarEdicaoMaterial = document.getElementById('btnSalvarEdicaoMaterial');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    const viewModeFields = document.getElementById('view-mode-fields');
    const editModeFields = document.getElementById('edit-mode-fields');
    const footerActionsView = document.getElementById('footer-actions-right').querySelectorAll('.btn-view-mode');
    const footerActionsEdit = document.getElementById('footer-actions-right').querySelectorAll('.btn-edit-mode');
    const footerActionsLeft = document.getElementById('footer-actions-left');
    const materialTab = document.getElementById('materialTab');


    // Modal de Novo Material
    const modalMaterialEl = document.getElementById('modalMaterial');
    const modalMaterial = modalMaterialEl ? new bootstrap.Modal(modalMaterialEl) : null;
    const formMaterial = document.getElementById('formMaterial');

    // Modal de Detalhes
    const modalDetalhesEl = document.getElementById('modalDetalhesMaterial');
    const modalDetalhes = modalDetalhesEl ? new bootstrap.Modal(modalDetalhesEl) : null;
    // const detalhesPane = document.getElementById('detalhes-pane'); // (Substituído por viewModeFields)
    const tbodyHistoricoEntradas = document.getElementById('tbody-historico-entradas');

    // Modal de Nova Entrada
    const modalNovaEntradaEl = document.getElementById('modalNovaEntrada');
    const modalNovaEntrada = modalNovaEntradaEl ? new bootstrap.Modal(modalNovaEntradaEl) : null;
    const formNovaEntrada = document.getElementById('formNovaEntrada');
    const entradaMaterialIdInput = document.getElementById('entradaMaterialId');

    // Modal de Exclusão
    const modalExcluirEl = document.getElementById('modalExcluir');
    const modalExcluir = modalExcluirEl ? new bootstrap.Modal(modalExcluirEl) : null;
    const nomeMaterialExcluirSpan = document.getElementById('nomeMaterialExcluir');
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao'); // ID Corrigido

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

    function setupRoleBasedUI_CMA() {
        if (!importContainer) return;

        const podeImportar = rolesComAcessoImportar.includes(userRole);

        if (podeImportar) {
            importContainer.style.display = 'flex'; // Mostra o container
        } else {
            // Garante que esteja oculto
            importContainer.style.setProperty('display', 'none', 'important');
        }

        // --- Botão Editar (principal) FOI REMOVIDO ---
    }


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

    // --- NOVA FUNÇÃO ---
    /**
     * Alterna a visibilidade dos campos no modal de detalhes.
     * @param {boolean} modoEdicao - True para mostrar campos de edição, false para visualização.
     */
    function alternarModoModalDetalhes(modoEdicao) {
        // Mostra/esconde os campos de visualização
        if (viewModeFields) viewModeFields.classList.toggle('d-none', modoEdicao);
        // Mostra/esconde os campos de edição
        if (editModeFields) editModeFields.classList.toggle('d-none', !modoEdicao);
        // Mostra/esconde as abas (esconde no modo edição)
        if (materialTab) materialTab.style.display = modoEdicao ? 'none' : '';
        // Mostra/esconde os botões de ação da esquerda (Excluir)
        if (footerActionsLeft) footerActionsLeft.style.display = modoEdicao ? 'none' : 'block';

        // Mostra/esconde os botões de visualização no rodapé
        footerActionsView.forEach(btn => btn.style.display = modoEdicao ? 'none' : 'inline-block');
        // Mostra/esconde os botões de edição no rodapé
        footerActionsEdit.forEach(btn => btn.style.display = modoEdicao ? 'inline-block' : 'none');

        // Garante que a aba de detalhes esteja ativa ao entrar no modo edição
        if (modoEdicao) {
            new bootstrap.Tab(document.getElementById('detalhes-tab')).show();
        }
    }

    async function abrirModalDetalhes(id) {
        // Reseta o modal para o modo de visualização padrão
        alternarModoModalDetalhes(false);

        if (typeof toggleLoader === 'function') toggleLoader(true);
        try {
            const response = await fetchComAuth(`${API_BASE_URL}/materiais/${id}`);
            if (!response.ok) throw new Error('Material não encontrado');
            const material = await response.json();

            // Guarda o ID no formulário
            if (editMaterialIdInput) editMaterialIdInput.value = material.id;

            // Preenche os campos de VISUALIZAÇÃO
            if (viewModeFields) {
                viewModeFields.querySelector('[data-field="codigo"]').textContent = material.codigo;
                viewModeFields.querySelector('[data-field="descricao"]').textContent = material.descricao;
                viewModeFields.querySelector('[data-field="unidadeMedida"]').textContent = material.unidadeMedida;
                viewModeFields.querySelector('[data-field="empresa"]').textContent = material.empresa;
                viewModeFields.querySelector('[data-field="saldoFisico"]').textContent = material.saldoFisico;
                viewModeFields.querySelector('[data-field="custoMedioPonderado"]').textContent = formatarMoeda(material.custoMedioPonderado);
                viewModeFields.querySelector('[data-field="custoTotal"]').textContent = formatarMoeda(material.custoTotal);
                viewModeFields.querySelector('[data-field="observacoes"]').textContent = material.observacoes || 'N/A';
            }

            // Preenche os campos de EDIÇÃO (que estão escondidos)
            if (editModeFields) {
                document.getElementById('materialCodigoEditar').value = material.codigo;
                document.getElementById('materialDescricaoEditar').value = material.descricao;
                document.getElementById('materialObservacoesEditar').value = material.observacoes || '';
            }

            // --- CONTROLE DE ACESSO PARA ABAS E BOTÕES DO MODAL ---
            const tabHistorico = document.getElementById('historico-tab');
            const btnExcluir = modalDetalhesEl.querySelector('.btn-excluir-modal');
            const btnRegistrarEntrada = modalDetalhesEl.querySelector('.btn-registrar-entrada-modal');
            // O novo botão de editar dentro do modal
            const btnEditar = modalDetalhesEl.querySelector('#btnEditarMaterialModal');

            if (temAcessoTotal) {
                tabHistorico.style.display = 'block';
                btnExcluir.style.display = 'inline-block';
                btnRegistrarEntrada.style.display = 'inline-block';
                btnEditar.style.display = 'inline-block'; // Mostra o botão "Editar"

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
                tabHistorico.style.display = 'none';
                btnExcluir.style.display = 'none';
                btnRegistrarEntrada.style.display = 'none';
                btnEditar.style.display = 'none'; // Esconde o botão "Editar"
            }
            // --- FIM DO CONTROLE DE ACESSO ---


            btnExcluir.dataset.id = id;
            btnExcluir.dataset.descricao = material.descricao;
            btnRegistrarEntrada.dataset.id = id;
            btnEditar.dataset.id = id; // Armazena o ID no botão editar

            // Garante que a primeira aba esteja sempre ativa ao abrir
            new bootstrap.Tab(document.getElementById('detalhes-tab')).show();

            if (modalDetalhes) modalDetalhes.show();
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    if (tbodyMateriais) {
        tbodyMateriais.addEventListener('click', (e) => {
            const row = e.target.closest('.material-row');
            if (row) abrirModalDetalhes(row.dataset.id);
        });
    }

    // --- Lógica dos Modais ---

    if (btnNovoMaterial) {
        btnNovoMaterial.addEventListener('click', () => {
            if (formMaterial) formMaterial.reset();
            if (modalMaterial) modalMaterial.show();
        });
    }

    if (formMaterial) {
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
                if (modalMaterial) modalMaterial.hide();
                await carregarMateriais();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = "Salvar";
            }
        });
    }

    if (modalDetalhesEl) {
        modalDetalhesEl.addEventListener('click', (e) => {
            const target = e.target;

            // --- CORREÇÃO AQUI ---
            // Encontra o botão mais próximo, caso o clique seja no ícone <i>
            const closestButton = target.closest('button');

            // Se não clicou em um botão (ou elemento dentro de um), não faz nada.
            if (!closestButton) return;

            // Agora é seguro ler o dataset, pois sabemos que closestButton existe.
            const id = closestButton.dataset.id;
            // --- FIM DA CORREÇÃO ---

            // Botão Excluir
            if (closestButton.classList.contains('btn-excluir-modal')) {
                nomeMaterialExcluirSpan.textContent = `"${closestButton.dataset.descricao}"`;
                btnConfirmarExclusao.dataset.id = id;
                if (modalDetalhes) modalDetalhes.hide();
                if (modalExcluir) modalExcluir.show();
            }
            // Botão Registrar Entrada
            if (closestButton.classList.contains('btn-registrar-entrada-modal')) {
                entradaMaterialIdInput.value = id;
                if (formNovaEntrada) formNovaEntrada.reset();
                if (modalDetalhes) modalDetalhes.hide();
                if (modalNovaEntrada) modalNovaEntrada.show();
            }
            // NOVO: Botão Editar (dentro do modal)
            if (closestButton.id === 'btnEditarMaterialModal') {
                alternarModoModalDetalhes(true); // Entra no modo de edição
            }
            // NOVO: Botão Cancelar Edição
            if (closestButton.id === 'btnCancelarEdicao') {
                alternarModoModalDetalhes(false); // Volta para o modo de visualização
            }
        });
    }

    if (formNovaEntrada) {
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
                if (modalNovaEntrada) modalNovaEntrada.hide();
                await carregarMateriais();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = "Salvar Entrada";
            }
        });
    }

    // --- CORREÇÃO: ADICIONADA VERIFICAÇÃO DE NULO ---
    if (btnConfirmarExclusao) {
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
                if (modalExcluir) modalExcluir.hide();
                await carregarMateriais(); // Chame a função correta para recarregar
            } catch (error) {
                mostrarToast(error.message, 'error');
                if (modalExcluir) modalExcluir.hide();
            } finally {
                btnConfirmarExclusao.disabled = false;
                btnConfirmarExclusao.innerHTML = "Sim, Excluir";
            }
        });
    }
    // --- FIM DA CORREÇÃO --- 

    // --- Event Listeners para os filtros ---
    if (inputBuscaMaterial) {
        inputBuscaMaterial.addEventListener('input', aplicarFiltrosErenderizar);
    }
    if (btnAplicarFiltro) {
        btnAplicarFiltro.addEventListener('click', aplicarFiltrosErenderizar);
    }
    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', () => {
            selectCondicaoFiltro.selectedIndex = 0;
            inputValorFiltro.value = '';
            checkUnitPC.checked = false;
            checkUnitMT.checked = false;
            aplicarFiltrosErenderizar();
        });
    }

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
            if (importLegadoInput) importLegadoInput.click();
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
                        if (item.includes('IGNORADO')) itemClass = 'list-group-item-warning';
                        if (item.includes('ERRO')) itemClass = 'list-group-item-danger';
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

    // ==========================================================
    // --- INÍCIO: NOVA LÓGICA DO MODAL DE EDIÇÃO DE MATERIAL (INTEGRADA) ---
    // ==========================================================

    // Quando o formulário de EDIÇÃO é enviado (agora parte do modal de detalhes)
    if (formEditarMaterial) {
        formEditarMaterial.addEventListener('submit', async (e) => {
            e.preventDefault();
            const materialId = editMaterialIdInput.value;
            if (!materialId) return;

            // Mostra o loader no botão
            btnSalvarEdicaoMaterial.disabled = true;
            btnSalvarEdicaoMaterial.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

            // Prepara o payload com os novos dados
            const payload = {
                codigo: document.getElementById('materialCodigoEditar').value,
                descricao: document.getElementById('materialDescricaoEditar').value,
                observacoes: document.getElementById('materialObservacoesEditar').value
            };

            try {
                const response = await fetchComAuth(`${API_BASE_URL}/materiais/${materialId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao salvar alterações.');
                }

                mostrarToast('Material atualizado com sucesso!', 'success');
                if (modalDetalhes) modalDetalhes.hide();
                await carregarMateriais(); // Recarrega a tabela principal

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                // Restaura o botão
                btnSalvarEdicaoMaterial.disabled = false;
                btnSalvarEdicaoMaterial.innerHTML = '<i class="bi bi-check-circle"></i> Salvar Alterações';
                // Garante que o modal volte ao modo de visualização na próxima vez
                alternarModoModalDetalhes(false);
            }
        });
    }

    // --- FIM DA LÓGICA DO MODAL DE EDIÇÃO ---


    // --- Inicialização ---
    if (!temAcessoTotal && btnNovoMaterial) {
        btnNovoMaterial.style.display = 'none';
    }
    setupRoleBasedUI_CMA(); // Chama a nova função de visibilidade
    carregarMateriais();
});