document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const tbodyMateriais = document.getElementById('tbody-cms');
    const btnNovoMaterial = document.getElementById('btnNovoMaterial');

    // --- ADICIONADO: Seletores para os novos campos dentro do modal de detalhes ---
    const formEditarMaterial = document.getElementById('formEditarMaterial'); // Agora é o form do modal de detalhes
    const editMaterialIdInput = document.getElementById('editMaterialId');
    const btnEditarMaterialModal = document.getElementById('btnEditarMaterialModal');
    const btnSalvarEdicaoMaterial = document.getElementById('btnSalvarEdicaoMaterial');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    const viewModeFields = document.getElementById('view-mode-fields');
    const editModeFields = document.getElementById('edit-mode-fields');
    const footerActionsRightEl = document.getElementById('footer-actions-right');
    const footerActionsView = footerActionsRightEl ? footerActionsRightEl.querySelectorAll('.btn-view-mode') : [];
    const footerActionsEdit = footerActionsRightEl ? footerActionsRightEl.querySelectorAll('.btn-edit-mode') : [];
    const footerActionsLeft = document.getElementById('footer-actions-left');
    const materialTab = document.getElementById('materialTab');
    let paginaAtual = 1;
    let linhasPorPagina = 10;
    let materiaisFiltradosCache = [];


    // Modal de Novo Material
    const modalMaterialEl = document.getElementById('modalMaterial');
    const modalMaterial = modalMaterialEl ? new bootstrap.Modal(modalMaterialEl) : null;
    const formMaterial = document.getElementById('formMaterial');

    // Modal de Detalhes
    const modalDetalhesEl = document.getElementById('modalDetalhesMaterial');
    const modalDetalhes = modalDetalhesEl ? new bootstrap.Modal(modalDetalhesEl) : null;
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

    function setupRoleBasedUI_CMA() {
        if (!importContainer) return;

        const podeImportar = rolesComAcessoImportar.includes(userRole);

        if (podeImportar) {
            importContainer.style.display = 'flex'; // Mostra o container
        } else {
            // Garante que esteja oculto
            importContainer.style.setProperty('display', 'none', 'important');
        }
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
            todosOsMateriais.sort((a, b) => a.codigo.localeCompare(b.codigo));
            aplicarFiltrosErenderizar();
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
        }
    }

    function aplicarFiltrosErenderizar() {
        let materiaisFiltrados = [...todosOsMateriais];

        // VERIFICA SE O CAMPO DE BUSCA EXISTE
        if (inputBuscaMaterial) {
            const termoBusca = inputBuscaMaterial.value.toLowerCase().trim();
            if (termoBusca) {
                materiaisFiltrados = materiaisFiltrados.filter(material =>
                    material.codigo.toLowerCase().includes(termoBusca) ||
                    material.descricao.toLowerCase().includes(termoBusca)
                );
            }
        }

        // VERIFICA SE OS FILTROS DE SALDO EXISTEM
        if (selectCondicaoFiltro && inputValorFiltro) {
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
        }

        // VERIFICA SE OS FILTROS DE UNIDADE EXISTEM
        if (checkUnitPC && checkUnitMT) {
            const unidadesSelecionadas = [];
            if (checkUnitPC.checked) unidadesSelecionadas.push('PÇ');
            if (checkUnitMT.checked) unidadesSelecionadas.push('MT');

            if (unidadesSelecionadas.length > 0) {
                materiaisFiltrados = materiaisFiltrados.filter(material =>
                    unidadesSelecionadas.includes(material.unidadeMedida)
                );
            }
        }

        // 1. Salva os dados filtrados no cache
        materiaisFiltradosCache = materiaisFiltrados;
        // 2. Reseta para a primeira página
        paginaAtual = 1;
        // 3. Chama a nova função para renderizar a página
        renderizarPagina();
    }

    function renderizarPagina() {
        const paginationInfo = document.getElementById('pagination-info');
        const materiais = materiaisFiltradosCache;

        if (materiais.length === 0) {
            renderizarTabelaMateriais([]); // Renderiza a tabela vazia
            if (paginationInfo) paginationInfo.textContent = 'Mostrando 0 de 0 itens'; // VERIFICAÇÃO ADICIONADA
            atualizarBotoesPaginacao(1);
            return;
        }

        const totalItens = materiais.length;
        const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(totalItens / linhasPorPagina);
        paginaAtual = Math.max(1, Math.min(paginaAtual, totalPaginas));

        const inicio = linhasPorPagina === 'all' ? 0 : (paginaAtual - 1) * linhasPorPagina;
        const fim = linhasPorPagina === 'all' ? totalItens : inicio + linhasPorPagina;
        const itensDaPagina = materiais.slice(inicio, fim);

        renderizarTabelaMateriais(itensDaPagina); // Renderiza apenas os itens da página
        if (paginationInfo) paginationInfo.textContent = `Página ${paginaAtual} de ${totalPaginas} (${totalItens} itens)`; // VERIFICAÇÃO ADICIONADA
        atualizarBotoesPaginacao(totalPaginas);
    }

    /**
     * Habilita/desabilita os botões de paginação
     */
    function atualizarBotoesPaginacao(totalPaginas) {
        document.getElementById('btnPrimeiraPagina').disabled = paginaAtual <= 1;
        document.getElementById('btnPaginaAnterior').disabled = paginaAtual <= 1;
        document.getElementById('btnProximaPagina').disabled = paginaAtual >= totalPaginas;
        document.getElementById('btnUltimaPagina').disabled = paginaAtual >= totalPaginas;
    }

    /**
     * Adiciona os listeners de evento aos botões de paginação
     */
    function adicionarListenersPaginacao() {
        const rowsPerPageEl = document.getElementById('rowsPerPage');
        if (rowsPerPageEl) {
            rowsPerPageEl.addEventListener('change', (e) => {
                const valor = e.target.value;
                linhasPorPagina = valor === 'all' ? 'all' : parseInt(valor, 10);
                paginaAtual = 1;
                renderizarPagina(); // Re-renderiza a página atual
            });
        }

        const btnPrimeira = document.getElementById('btnPrimeiraPagina');
        if (btnPrimeira) {
            btnPrimeira.addEventListener('click', () => {
                paginaAtual = 1;
                renderizarPagina();
            });
        }

        const btnAnterior = document.getElementById('btnPaginaAnterior');
        if (btnAnterior) {
            btnAnterior.addEventListener('click', () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarPagina();
                }
            });
        }

        const btnProxima = document.getElementById('btnProximaPagina');
        if (btnProxima) {
            btnProxima.addEventListener('click', () => {
                const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(materiaisFiltradosCache.length / linhasPorPagina);
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarPagina();
                }
            });
        }

        const btnUltima = document.getElementById('btnUltimaPagina');
        if (btnUltima) {
            btnUltima.addEventListener('click', () => {
                const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(materiaisFiltradosCache.length / linhasPorPagina);
                paginaAtual = totalPaginas;
                renderizarPagina();
            });
        }
    }
    
    function renderizarTabelaMateriais(materiaisDaPagina) {
        const tbody = tbodyMateriais;
        const thead = tbody.previousElementSibling;

        thead.innerHTML = '';
        tbody.innerHTML = '';

        thead.innerHTML = `
            <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Modelo</th>
                <th>Nº de Série</th>
                <th class="text-center">Unidade</th> 
                <th class="text-center">Quantidade em Estoque</th> 
                <th class="text-center">Custo Médio</th>
                <th class="text-center">Custo Total</th>
            </tr>
        `;

        if (materiaisDaPagina.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Nenhum material encontrado.</td></tr>`;
            return;
        }

        materiaisDaPagina.forEach(material => {
            const tr = document.createElement('tr');
            tr.className = 'material-row';
            tr.dataset.id = material.id;
            tr.style.cursor = 'pointer';

            tr.innerHTML = `
                <td data-label="Código">${material.codigo}</td>
                <td data-label="Descrição">${material.descricao}</td>
                <td data-label="Modelo">${material.modelo || ''}</td>
                <td data-label="Nº de Série">${material.numeroDeSerie || ''}</td>
                <td data-label="Unidade" class="text-center">${material.unidadeMedida}</td>
                <td data-label="Qtd. Estoque" class="text-center">${new Intl.NumberFormat('pt-BR').format(material.saldoFisico)}</td>
                <td data-label="Custo Médio" class="text-center">${formatarMoeda(material.custoMedioPonderado)}</td>
                <td data-label="Custo Total" class="text-center">${formatarMoeda(material.custoTotal)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

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

            // --- CAMPOS DE VISUALIZAÇÃO ATUALIZADOS ---
            if (viewModeFields) {
                viewModeFields.querySelector('[data-field="codigo"]').textContent = material.codigo;
                viewModeFields.querySelector('[data-field="descricao"]').textContent = material.descricao;
                viewModeFields.querySelector('[data-field="modelo"]').textContent = material.modelo || 'N/A';
                viewModeFields.querySelector('[data-field="numeroDeSerie"]').textContent = material.numeroDeSerie || 'N/A';
                viewModeFields.querySelector('[data-field="unidadeMedida"]').textContent = material.unidadeMedida;
                viewModeFields.querySelector('[data-field="empresa"]').textContent = material.empresa;
                viewModeFields.querySelector('[data-field="saldoFisico"]').textContent = material.saldoFisico;
                viewModeFields.querySelector('[data-field="custoMedioPonderado"]').textContent = formatarMoeda(material.custoMedioPonderado);
                viewModeFields.querySelector('[data-field="custoTotal"]').textContent = formatarMoeda(material.custoTotal);
                viewModeFields.querySelector('[data-field="observacoes"]').textContent = material.observacoes || 'N/A';
            }

            // --- CAMPOS DE EDIÇÃO ATUALIZADOS ---
            if (editModeFields) {
                document.getElementById('materialCodigoEditar').value = material.codigo;
                document.getElementById('materialDescricaoEditar').value = material.descricao;
                document.getElementById('materialModeloEditar').value = material.modelo || '';
                document.getElementById('materialNumeroDeSerieEditar').value = material.numeroDeSerie || '';
                document.getElementById('materialObservacoesEditar').value = material.observacoes || '';
            }

            // --- CONTROLE DE ACESSO PARA ABAS E BOTÕES DO MODAL ---
            const tabHistorico = document.getElementById('historico-tab');
            const btnExcluir = modalDetalhesEl.querySelector('.btn-excluir-modal');
            const btnRegistrarEntrada = modalDetalhesEl.querySelector('.btn-registrar-entrada-modal');
            const btnEditar = modalDetalhesEl.querySelector('#btnEditarMaterialModal');

            // --- LÓGICA DE VISIBILIDADE ATUALIZADA ---
            // Oculta todos por padrão
            [tabHistorico, btnExcluir, btnRegistrarEntrada, btnEditar].forEach(el => el.style.display = 'none');

            // Libera com base na Role
            if (temAcessoTotal) {
                [tabHistorico, btnExcluir, btnRegistrarEntrada, btnEditar].forEach(el => el.style.display = 'inline-block');

                // Popula o histórico apenas se o usuário tiver permissão
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
                // Se não tem acesso total, mostra apenas a aba de histórico (mas esconde os botões de ação)
                tabHistorico.style.display = 'block';
                const entradas = material.entradas || [];
                tbodyHistoricoEntradas.innerHTML = entradas.map(e => `
                    <tr>
                        <td>${new Date(e.dataEntrada).toLocaleString('pt-BR')}</td>
                        <td>${e.quantidade}</td>
                        <td>${formatarMoeda(e.custoUnitario)}</td>
                        <td>${e.observacoes || ''}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4" class="text-center">Nenhuma entrada registrada.</td></tr>';
            }
            // --- FIM DO CONTROLE DE ACESSO ---


            btnExcluir.dataset.id = id;
            btnExcluir.dataset.descricao = material.descricao;
            btnRegistrarEntrada.dataset.id = id;
            btnEditar.dataset.id = id;

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

    // --- FORMULÁRIO DE NOVO MATERIAL ATUALIZADO ---
    if (formMaterial) {
        formMaterial.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = modalMaterialEl.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

            const materialData = {
                codigo: document.getElementById('materialCodigo').value,
                descricao: document.getElementById('materialDescricao').value,
                modelo: document.getElementById('materialModelo').value, // Novo
                numeroDeSerie: document.getElementById('materialNumeroDeSerie').value, // Novo
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
            const closestButton = target.closest('button');
            if (!closestButton) return;
            const id = closestButton.dataset.id;

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
                await carregarMateriais();
            } catch (error) {
                mostrarToast(error.message, 'error');
                if (modalExcluir) modalExcluir.hide();
            } finally {
                btnConfirmarExclusao.disabled = false;
                btnConfirmarExclusao.innerHTML = "Sim, Excluir";
            }
        });
    }

    // --- Event Listeners para os filtros ---
    if (inputBuscaMaterial) {
        // MODIFICADO: Chama aplicarFiltrosErenderizar (que agora cuida da paginação)
        inputBuscaMaterial.addEventListener('input', aplicarFiltrosErenderizar);
    }
    if (btnAplicarFiltro) {
        // MODIFICADO: Chama aplicarFiltrosErenderizar
        btnAplicarFiltro.addEventListener('click', aplicarFiltrosErenderizar);
    }
    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', () => {
            selectCondicaoFiltro.selectedIndex = 0;
            inputValorFiltro.value = '';
            checkUnitPC.checked = false;
            checkUnitMT.checked = false;
            // MODIFICADO: Chama aplicarFiltrosErenderizar
            aplicarFiltrosErenderizar();
        });
    }

    // --- TEMPLATE DE IMPORTAÇÃO ATUALIZADO ---
    if (btnBaixarTemplate) {
        btnBaixarTemplate.addEventListener('click', () => {
            // Define os cabeçalhos (APENAS CABEÇALHOS)
            const headers = [
                "ESTOQUE",
                "CÓDIGO",
                "DESCRIÇÃO",
                "MODELO",
                "Nº DE SÉRIE",
                "UNIDADE",
                "SALDO FISICO",
                "CUSTO UNITÁRIO"
            ];

            // Cria a planilha a partir de um Array de Arrays (apenas a linha de header)
            const ws = XLSX.utils.aoa_to_sheet([headers]);

            // Ajusta a largura das colunas
            ws['!cols'] = [
                { wch: 15 }, // ESTOQUE
                { wch: 15 }, // CÓDIGO
                { wch: 40 }, // DESCRIÇÃO
                { wch: 20 }, // MODELO
                { wch: 20 }, // Nº DE SÉRIE
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

    // --- LÓGICA DE IMPORTAÇÃO ATUALIZADA ---
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
                await new Promise(res => setTimeout(res, 500));
                barraProgresso.style.width = '50%';
                barraProgresso.textContent = '50%';
                textoProgresso.textContent = 'Processando no servidor...';

                const response = await fetchComAuth(`${API_BASE_URL}/materiais/importar-legado`, {
                    method: 'POST',
                    body: formData
                });

                barraProgresso.style.width = '100%';
                barraProgresso.textContent = '100%';
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Erro desconhecido no servidor.');
                }

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

                await carregarMateriais();

            } catch (error) {
                textoProgresso.textContent = 'Erro na importação!';
                avisosContainer.classList.remove('d-none');
                listaAvisos.innerHTML = `<li class="list-group-item list-group-item-danger">${error.message}</li>`;
                console.error("Erro na importação de legado CMA:", error);
            } finally {
                btnFecharProgresso.disabled = false;
                importLegadoInput.value = '';
            }
        });
    }

    // --- LÓGICA DE EDIÇÃO (SALVAR) ATUALIZADA ---
    if (formEditarMaterial) {
        formEditarMaterial.addEventListener('submit', async (e) => {
            e.preventDefault();
            const materialId = editMaterialIdInput.value;
            if (!materialId) return;

            btnSalvarEdicaoMaterial.disabled = true;
            btnSalvarEdicaoMaterial.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

            // Payload ATUALIZADO
            const payload = {
                codigo: document.getElementById('materialCodigoEditar').value,
                descricao: document.getElementById('materialDescricaoEditar').value,
                modelo: document.getElementById('materialModeloEditar').value, // Novo
                numeroDeSerie: document.getElementById('materialNumeroDeSerieEditar').value, // Novo
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
                await carregarMateriais();

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                btnSalvarEdicaoMaterial.disabled = false;
                btnSalvarEdicaoMaterial.innerHTML = '<i class="bi bi-check-circle"></i> Salvar Alterações';
                alternarModoModalDetalhes(false);
            }
        });
    }

    // --- Inicialização ---
    if (!temAcessoTotal && btnNovoMaterial) {
        btnNovoMaterial.style.display = 'none';
    }

    setupRoleBasedUI_CMA();
    adicionarListenersPaginacao();
    carregarMateriais();
});