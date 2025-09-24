document.addEventListener('DOMContentLoaded', function () {

    const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();
    const API_BASE_URL = 'http://3.128.248.3:8080';
    let isImportCancelled = false;
    let todasAsLinhas = [];

    // Variáveis de estado para a paginação
    let paginaAtual = 1;
    let linhasPorPagina = 10; // Valor inicial
    let gruposFiltradosCache = []; // Cache para os GRUPOS filtrados

    // Funções utilitárias
    const get = (obj, path, defaultValue = '-') => {
        const value = path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : undefined), obj);
        return value !== undefined ? value : defaultValue;
    };
    const formatarMoeda = (valor) => {
        if (valor === null || valor === undefined || isNaN(Number(valor))) {
            return '-';
        }
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };
    const formatarData = (dataStr) => {
        if (!dataStr) return '-';
        return dataStr.split(' ')[0];
    };

    // Definição das colunas da tabela
    const colunasCompletas = ["OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LPU", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO", "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO", "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR", "VALOR", "GESTOR", "SITUAÇÃO", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO", "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS", "KEY"];
    const colunasPorRole = {
        'MANAGER': colunasCompletas,
        'DEFAULT': colunasCompletas
    };
    const headers = colunasPorRole[userRole] || colunasPorRole['DEFAULT'];

    const dataMapping = {
        "OS": (linha) => get(linha, 'os.os'), "SITE": (linha) => get(linha, 'detalhe.site'),
        "CONTRATO": (linha) => get(linha, 'detalhe.contrato'), "SEGMENTO": (linha) => get(linha, 'os.segmento.nome'),
        "PROJETO": (linha) => get(linha, 'os.projeto'), "GESTOR TIM": (linha) => get(linha, 'os.gestorTim'),
        "REGIONAL": (linha) => get(linha, 'detalhe.regional'), "LPU": (linha) => get(linha, 'detalhe.lpu.codigoLpu'),
        "LOTE": (linha) => get(linha, 'detalhe.lote'), "BOQ": (linha) => get(linha, 'detalhe.boq'),
        "PO": (linha) => get(linha, 'detalhe.po'), "ITEM": (linha) => get(linha, 'detalhe.item'),
        "OBJETO CONTRATADO": (linha) => get(linha, 'detalhe.lpu.nomeLpu'), "UNIDADE": (linha) => get(linha, 'detalhe.unidade'),
        "QUANTIDADE": (linha) => get(linha, 'detalhe.quantidade'), "VALOR TOTAL OS": (linha) => formatarMoeda(get(linha, 'detalhe.valorTotal')),
        "OBSERVAÇÕES": (linha) => get(linha, 'detalhe.observacoes'), "DATA PO": (linha) => get(linha, 'detalhe.dataPo'),
        "VISTORIA": (linha) => get(linha, 'ultimoLancamento.vistoria'), "PLANO VISTORIA": (linha) => get(linha, 'ultimoLancamento.planoVistoria'),
        "DESMOBILIZAÇÃO": (linha) => get(linha, 'ultimoLancamento.desmobilizacao'), "PLANO DESMOBILIZAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoDesmobilizacao'),
        "INSTALAÇÃO": (linha) => get(linha, 'ultimoLancamento.instalacao'), "PLANO INSTALAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoInstalacao'),
        "ATIVAÇÃO": (linha) => get(linha, 'ultimoLancamento.ativacao'), "PLANO ATIVAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoAtivacao'),
        "DOCUMENTAÇÃO": (linha) => get(linha, 'ultimoLancamento.documentacao'), "PLANO DOCUMENTAÇÃO": (linha) => get(linha, 'ultimoLancamento.planoDocumentacao'),
        "ETAPA GERAL": (linha) => {
            const etapa = get(linha, 'ultimoLancamento.etapa', null);
            return etapa ? `${etapa.codigoGeral} - ${etapa.nomeGeral}` : '-';
        },
        "ETAPA DETALHADA": (linha) => {
            const etapa = get(linha, 'ultimoLancamento.etapa', null);
            return etapa ? `${etapa.indiceDetalhado} - ${etapa.nomeDetalhado}` : '-';
        },
        "STATUS": (linha) => get(linha, 'ultimoLancamento.status'), "DETALHE DIÁRIO": (linha) => get(linha, 'ultimoLancamento.detalheDiario'),
        "CÓD. PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.codigo'), "PRESTADOR": (linha) => get(linha, 'ultimoLancamento.prestador.nome'),
        "VALOR": (linha) => formatarMoeda(get(linha, 'ultimoLancamento.valor')), "GESTOR": (linha) => get(linha, 'ultimoLancamento.manager.nome'),
        "SITUAÇÃO": (linha) => get(linha, 'ultimoLancamento.situacao'), "DATA ATIVIDADE": (linha) => get(linha, 'ultimoLancamento.dataAtividade'),
        "FATURAMENTO": (linha) => get(linha, 'detalhe.faturamento'), "SOLICIT ID FAT": (linha) => get(linha, 'detalhe.solitIdFat'),
        "RECEB ID FAT": (linha) => get(linha, 'detalhe.recebIdFat'), "ID FATURAMENTO": (linha) => get(linha, 'detalhe.idFaturamento'),
        "DATA FAT INPROUT": (linha) => get(linha, 'detalhe.dataFatInprout'), "SOLICIT FS PORTAL": (linha) => get(linha, 'detalhe.solitFsPortal'),
        "DATA FS": (linha) => get(linha, 'detalhe.dataFs'), "NUM FS": (linha) => get(linha, 'detalhe.numFs'),
        "GATE": (linha) => get(linha, 'detalhe.gate'), "GATE ID": (linha) => get(linha, 'detalhe.gateId'),
        "DATA CRIAÇÃO OS": (linha) => formatarData(get(linha, 'os.dataCriacao')), "KEY": (linha) => get(linha, 'detalhe.key')
    };

    async function inicializarPagina() {
        const accordionContainer = document.getElementById('accordion-registros');
        accordionContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2 text-muted">Buscando registros...</p>
            </div>`;

        try {
            const response = await fetchComAuth(`${API_BASE_URL}/os`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (!response.ok) throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);

            const osData = await response.json();
            const userSegmentos = JSON.parse(localStorage.getItem('segmentos')) || [];
            let osDataFiltrada = osData;

            if (['MANAGER', 'COORDINATOR'].includes(userRole)) {
                osDataFiltrada = (userSegmentos.length > 0)
                    ? osData.filter(os => os.segmento && userSegmentos.includes(os.segmento.id))
                    : [];
            }

            todasAsLinhas = [];
            osDataFiltrada.forEach(os => {
                const osInfo = { ...os, detalhes: undefined };
                if (os.detalhes && os.detalhes.length > 0) {

                    const detalhesAtivos = os.detalhes.filter(detalhe => detalhe.statusRegistro !== 'INATIVO');

                    detalhesAtivos.forEach(detalhe => {
                        todasAsLinhas.push({
                            os: os,
                            detalhe: detalhe,
                            ultimoLancamento: detalhe.ultimoLancamento
                        });
                    });

                } else {
                    todasAsLinhas.push({ os: os, detalhe: null, ultimoLancamento: null });
                }
            });

            renderizarTabelaComFiltro();

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            accordionContainer.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados. Verifique o console.</div>`;
        }
    }

    function renderizarTabela() {
        const accordionContainer = document.getElementById('accordion-registros');
        const paginationInfo = document.getElementById('pagination-info');
        accordionContainer.innerHTML = '';

        const grupos = gruposFiltradosCache;

        if (grupos.length === 0) {
            accordionContainer.innerHTML = `<div class="text-center p-4 text-muted">Nenhum registro encontrado.</div>`;
            paginationInfo.textContent = 'Mostrando 0 de 0 grupos';
            atualizarBotoesPaginacao(1);
            return;
        }

        const totalGrupos = grupos.length;
        const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(totalGrupos / linhasPorPagina);
        paginaAtual = Math.max(1, Math.min(paginaAtual, totalPaginas));

        const inicio = linhasPorPagina === 'all' ? 0 : (paginaAtual - 1) * linhasPorPagina;
        const fim = linhasPorPagina === 'all' ? totalGrupos : inicio + linhasPorPagina;
        const gruposDaPagina = grupos.slice(inicio, fim);

        const frag = document.createDocumentFragment();

        gruposDaPagina.forEach((grupo, index) => {
            const uniqueId = `${grupo.id}-${index}`;
            const item = document.createElement('div');
            item.className = 'accordion-item';

            // ===== INÍCIO DA CORREÇÃO E NOVOS CÁLCULOS =====
            // O valor total da OS é a soma do valor de todos os seus detalhes (linhas da planilha).
            const valorTotalOS = get(grupo.linhas[0], 'os.detalhes', [])
                .reduce((sum, d) => sum + (d.valorTotal || 0), 0);

            // O Total CPS é a soma dos valores dos últimos lançamentos APROVADOS de cada linha.
            const valorTotalCPS = grupo.linhas
                .filter(l => l.ultimoLancamento && l.ultimoLancamento.situacaoAprovacao === 'APROVADO')
                .reduce((sum, l) => sum + (get(l, 'ultimoLancamento.valor', 0) || 0), 0);

            // Pega o custo de material diretamente do objeto OS (calculado no backend).
            const custoTotalMateriais = get(grupo.linhas[0], 'os.custoTotalMateriais', 0) || 0;

            // O novo percentual considera tanto o CPS quanto o custo de material.
            const percentual = valorTotalOS > 0 ? ((valorTotalCPS + custoTotalMateriais) / valorTotalOS) * 100 : 0;
            // ===== FIM DA CORREÇÃO E NOVOS CÁLCULOS =====

            let kpiHTML = '';
            if (userRole !== 'MANAGER') {
                kpiHTML = `
                <div class="header-kpi-wrapper">
                    <div class="header-kpi"><span class="kpi-label">Total OS</span><span class="kpi-value">${formatarMoeda(valorTotalOS)}</span></div>
                    <div class="header-kpi"><span class="kpi-label">Total CPS</span><span class="kpi-value">${formatarMoeda(valorTotalCPS)}</span></div>
                    <div class="header-kpi"><span class="kpi-label">Total Material</span><span class="kpi-value">${formatarMoeda(custoTotalMateriais)}</span></div>
                    <div class="header-kpi"><span class="kpi-label">%</span><span class="kpi-value kpi-percentage">${percentual.toFixed(2)}%</span></div>
                </div>`;
            }

            const headerHTML = `
            <h2 class="accordion-header" id="heading-${uniqueId}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${uniqueId}">
                    <div class="header-content">
                        <div class="header-title-wrapper"><span class="header-title-project">${grupo.projeto}</span><span class="header-title-os">${grupo.os}</span></div>
                        ${kpiHTML}
                        <span class="badge bg-primary header-badge">${grupo.linhas.length} itens</span>
                    </div>
                </button>
            </h2>`;

            const headersComAcoes = (userRole === 'ADMIN' || userRole === 'ASSISTANT') ? [...headers, "AÇÕES"] : headers;

            const bodyRowsHTML = grupo.linhas.map(linhaData => {
                const cellsHTML = headersComAcoes.map(header => {
                    if (header === "AÇÕES") {
                        const detalheId = get(linhaData, 'detalhe.id', '');
                        const chave = get(linhaData, 'detalhe.key', '-');
                        const semChave = chave === '-' || chave === '' || chave === null;
                        const btnEditar = `<button class="btn btn-sm btn-outline-primary btn-edit-key" data-id="${detalheId}" title="Editar Chave Externa" ${!semChave ? 'disabled' : ''}><i class="bi bi-pencil-fill"></i></button>`;
                        const btnExcluir = `<button class="btn btn-sm btn-outline-danger btn-delete-registro" data-id="${detalheId}" title="Excluir Registro"><i class="bi bi-trash-fill"></i></button>`;
                        return `<td><div class="d-flex justify-content-center gap-2">${btnEditar} ${btnExcluir}</div></td>`;
                    }
                    const func = dataMapping[header];
                    const valor = func ? func(linhaData) : '-';
                    let classes = '';
                    if (["VISTORIA", "DESMOBILIZAÇÃO", "INSTALAÇÃO", "ATIVAÇÃO", "DOCUMENTAÇÃO"].includes(header)) {
                        classes += ' status-cell';
                        if (valor === 'OK') classes += ' status-ok'; else if (valor === 'NOK') classes += ' status-nok'; else if (valor === 'N/A') classes += ' status-na';
                    }
                    if (header === "DETALHE DIÁRIO") classes += ' detalhe-diario-cell';
                    return `<td class="${classes}">${valor}</td>`;
                }).join('');
                return `<tr>${cellsHTML}</tr>`;
            }).join('');

            const bodyHTML = `
            <div id="collapse-${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#accordion-registros">
                <div class="accordion-body">
                    <div class="table-responsive">
                        <table class="table modern-table table-sm">
                            <thead><tr>${headersComAcoes.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                            <tbody>${bodyRowsHTML}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;

            item.innerHTML = headerHTML + bodyHTML;
            frag.appendChild(item);
        });

        accordionContainer.appendChild(frag);
        paginationInfo.textContent = `Página ${paginaAtual} de ${totalPaginas} (${totalGrupos} grupos)`;
        atualizarBotoesPaginacao(totalPaginas);
    }

    function renderizarTabelaComFiltro() {
        const termoBusca = document.getElementById('searchInput').value.toLowerCase().trim();
        const linhasFiltradas = termoBusca
            ? todasAsLinhas.filter(linhaData => {
                const textoPesquisavel = [
                    get(linhaData, 'os.os', ''), get(linhaData, 'detalhe.site', ''),
                    get(linhaData, 'detalhe.contrato', ''), get(linhaData, 'os.projeto', ''),
                    get(linhaData, 'detalhe.lpu.nomeLpu', ''), get(linhaData, 'detalhe.lpu.codigoLpu', '')
                ].join(' ').toLowerCase();
                return textoPesquisavel.includes(termoBusca);
            })
            : todasAsLinhas;

        const agrupado = Object.values(linhasFiltradas.reduce((acc, linha) => {
            const chaveGrupo = `${get(linha, 'os.projeto', 'Sem Projeto')} / ${get(linha, 'os.os', 'Sem OS')}`;
            if (!acc[chaveGrupo]) {
                acc[chaveGrupo] = {
                    linhas: [],
                    projeto: get(linha, 'os.projeto', 'Sem Projeto'),
                    os: get(linha, 'os.os', 'Sem OS'),
                    id: get(linha, 'os.id', 'sem-id')
                };
            }
            acc[chaveGrupo].linhas.push(linha);
            return acc;
        }, {}));

        gruposFiltradosCache = agrupado;
        paginaAtual = 1; // Reseta para a primeira página a cada novo filtro
        renderizarTabela();
    }

    function atualizarBotoesPaginacao(totalPaginas) {
        document.getElementById('btnPrimeiraPagina').disabled = paginaAtual <= 1;
        document.getElementById('btnPaginaAnterior').disabled = paginaAtual <= 1;
        document.getElementById('btnProximaPagina').disabled = paginaAtual >= totalPaginas;
        document.getElementById('btnUltimaPagina').disabled = paginaAtual >= totalPaginas;
    }

    function adicionarListenersPaginacao() {
        document.getElementById('rowsPerPage').addEventListener('change', (e) => {
            const valor = e.target.value;
            linhasPorPagina = valor === 'all' ? 'all' : parseInt(valor, 10);
            paginaAtual = 1; // Volta para a primeira página ao mudar a quantidade de itens
            renderizarTabela();
        });
        document.getElementById('btnPrimeiraPagina').addEventListener('click', () => {
            paginaAtual = 1;
            renderizarTabela();
        });
        document.getElementById('btnPaginaAnterior').addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarTabela();
            }
        });
        document.getElementById('btnProximaPagina').addEventListener('click', () => {
            const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(gruposFiltradosCache.length / linhasPorPagina);
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarTabela();
            }
        });
        document.getElementById('btnUltimaPagina').addEventListener('click', () => {
            const totalPaginas = linhasPorPagina === 'all' ? 1 : Math.ceil(gruposFiltradosCache.length / linhasPorPagina);
            paginaAtual = totalPaginas;
            renderizarTabela();
        });
    }

    function adicionarListenersDeAcoes() {
        const accordionContainer = document.getElementById('accordion-registros');
        const modalEditarKey = new bootstrap.Modal(document.getElementById('modalEditarKey'));
        const modalConfirmarExclusao = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));

        accordionContainer.addEventListener('click', function (e) {
            const btnEdit = e.target.closest('.btn-edit-key');
            const btnDelete = e.target.closest('.btn-delete-registro');

            if (btnEdit) {
                const detalheId = btnEdit.dataset.id;
                document.getElementById('editKeyDetalheId').value = detalheId;
                document.getElementById('novaKeyValue').value = '';
                modalEditarKey.show();
            }

            if (btnDelete) {
                const detalheId = btnDelete.dataset.id;
                document.getElementById('deleteDetalheId').value = detalheId;
                modalConfirmarExclusao.show();
            }
        });

        // Lógica para salvar a nova KEY
        document.getElementById('formEditarKey').addEventListener('submit', async function (e) {
            e.preventDefault();
            const detalheId = document.getElementById('editKeyDetalheId').value;
            const novaChave = document.getElementById('novaKeyValue').value;
            const btnSalvar = document.getElementById('btnSalvarNovaKey');

            btnSalvar.disabled = true;
            btnSalvar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;

            try {
                const response = await fetchComAuth(`${API_BASE_URL}/os/detalhe/${detalheId}/key`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: novaChave })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao salvar a chave.');
                }

                mostrarToast('Chave atualizada com sucesso!', 'success');
                modalEditarKey.hide();
                await inicializarPagina(); // Recarrega os dados

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = 'Salvar Chave';
            }
        });

        // Lógica para confirmar a exclusão
        document.getElementById('btnConfirmarExclusaoDefinitiva').addEventListener('click', async function () {
            const detalheId = document.getElementById('deleteDetalheId').value;
            const btnConfirmar = this;

            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Excluindo...`;

            try {
                const response = await fetchComAuth(`${API_BASE_URL}/os/detalhe/${detalheId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao excluir o registro.');
                }

                mostrarToast('Registro excluído com sucesso!', 'success');
                modalConfirmarExclusao.hide();
                await inicializarPagina(); // Recarrega os dados

            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                btnConfirmar.disabled = false;
                btnConfirmar.innerHTML = 'Sim, Excluir';
            }
        });
    }

    const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
    if (btnDownloadTemplate) {
        btnDownloadTemplate.addEventListener('click', () => {
            const templateFilePath = '../assets/templates/template_importacao_os.xlsx';
            const link = document.createElement('a');
            link.href = templateFilePath;
            link.setAttribute('download', 'template_importacao_os.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    const btnImportar = document.getElementById('btnImportar');
    const importFileInput = document.getElementById('importFile');

    if (btnImportar && importFileInput) {
        const modalProgressoEl = document.getElementById('modalProgressoImportacao');
        const modalProgresso = new bootstrap.Modal(modalProgressoEl);
        const textoProgresso = document.getElementById('textoProgressoImportacao');
        const barraProgresso = document.getElementById('barraProgressoImportacao');
        const errosContainer = document.getElementById('errosImportacaoContainer');
        const listaErros = document.getElementById('listaErrosImportacao');
        const btnFecharProgresso = document.getElementById('btnFecharProgressoImportacao');
        const btnCancelarImportacao = document.getElementById('btnCancelarImportacao');

        btnCancelarImportacao.addEventListener('click', () => {
            isImportCancelled = true;
            textoProgresso.textContent = "Cancelando importação...";
        });

        btnImportar.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            isImportCancelled = false;
            textoProgresso.textContent = 'Lendo arquivo...';
            barraProgresso.style.width = '0%';
            barraProgresso.textContent = '0%';
            errosContainer.classList.add('d-none');
            listaErros.innerHTML = '';
            btnFecharProgresso.disabled = true;
            btnCancelarImportacao.classList.remove('d-none');
            modalProgresso.show();

            try {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet);

                if (rows.length === 0) throw new Error("A planilha está vazia.");

                let linhasProcessadas = 0;
                let errosGerais = [];
                const TAMANHO_LOTE = 100;

                for (let i = 0; i < rows.length; i += TAMANHO_LOTE) {
                    if (isImportCancelled) {
                        textoProgresso.textContent = 'Importação cancelada pelo usuário.';
                        break;
                    }

                    const lote = rows.slice(i, i + TAMANHO_LOTE);

                    const response = await fetchComAuth(`${API_BASE_URL}/os/importar-lote`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(lote)
                    });

                    if (response.status === 207) {
                        const errosDoLote = await response.json();
                        errosGerais.push(...errosDoLote.map(e => `Linha (aprox.) ${i + 1}: ${e}`));
                    } else if (!response.ok) {
                        throw new Error(`Erro no servidor ao processar o lote a partir da linha ${i + 1}.`);
                    }

                    linhasProcessadas += lote.length;
                    const porcentagem = Math.round((linhasProcessadas / rows.length) * 100);
                    barraProgresso.style.width = `${porcentagem}%`;
                    barraProgresso.textContent = `${porcentagem}%`;
                    textoProgresso.textContent = `Processando... ${linhasProcessadas} de ${rows.length} linhas concluídas.`;
                }

                if (!isImportCancelled) {
                    if (errosGerais.length > 0) {
                        textoProgresso.textContent = `Importação concluída com ${errosGerais.length} erro(s).`;
                        errosContainer.classList.remove('d-none');
                        listaErros.innerHTML = errosGerais.map(e => `<li class="list-group-item list-group-item-danger">${e}</li>`).join('');
                    } else {
                        textoProgresso.textContent = 'Importação concluída com sucesso!';
                    }
                }

                await inicializarPagina();

            } catch (error) {
                console.error('Erro na importação:', error);
                textoProgresso.textContent = 'Erro Crítico na Importação!';
                errosContainer.classList.remove('d-none');
                listaErros.innerHTML = `<li class="list-group-item list-group-item-danger">${error.message}</li>`;
            } finally {
                btnFecharProgresso.disabled = false;
                btnCancelarImportacao.classList.add('d-none');
                importFileInput.value = '';
            }
        });
    }

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        const modalProgressoEl = document.getElementById('modalProgressoExportacao');
        const modalProgresso = new bootstrap.Modal(modalProgressoEl);
        const textoProgresso = document.getElementById('textoProgresso');
        const barraProgresso = document.getElementById('barraProgresso');

        const atualizarProgresso = (processados, total) => {
            const porcentagem = total > 0 ? Math.round((processados / total) * 100) : 0;
            textoProgresso.textContent = `Processando linha ${processados} de ${total}...`;
            barraProgresso.style.width = `${porcentagem}%`;
            barraProgresso.textContent = `${porcentagem}%`;
            barraProgresso.setAttribute('aria-valuenow', porcentagem);
        };

        const processarEmLotes = (dados, tamanhoLote, callback) => {
            return new Promise(resolve => {
                let indice = 0;
                function processarLote() {
                    const fim = Math.min(indice + tamanhoLote, dados.length);
                    for (let i = indice; i < fim; i++) {
                        callback(dados[i]);
                    }
                    indice = fim;
                    atualizarProgresso(indice, dados.length);
                    if (indice < dados.length) {
                        setTimeout(processarLote, 0);
                    } else {
                        resolve();
                    }
                }
                processarLote();
            });
        };

        btnExportar.addEventListener('click', async () => {
            const linhasParaExportar = todasAsLinhas;
            if (linhasParaExportar.length === 0) {
                mostrarToast('Não há dados para exportar.', 'error');
                return;
            }

            modalProgresso.show();
            atualizarProgresso(0, linhasParaExportar.length);

            try {
                const csvHeaders = headers; // Usa os headers já definidos no escopo
                const csvRows = [];

                // Função para formatar data para um padrão universal (YYYY-MM-DD)
                const formatarDataParaExcel = (dataStr) => {
                    if (!dataStr) return '';
                    if (dataStr.includes('/')) {
                        const partes = dataStr.split(' ')[0].split('/');
                        if (partes.length === 3) {
                            return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                        }
                    }
                    return dataStr; // Retorna o original se não estiver no formato esperado
                };

                await processarEmLotes(linhasParaExportar, 200, (linhaData) => {
                    const row = csvHeaders.map(header => {
                        // Pega a função de mapeamento para o cabeçalho atual
                        const func = dataMapping[header];
                        if (!func) return '-'; // Se não houver mapeamento, retorna um hífen

                        // Executa a função de mapeamento para obter o valor formatado para a tela
                        let cellValue = func(linhaData);

                        // ===== INÍCIO DA CORREÇÃO E LÓGICA DE EXPORTAÇÃO =====
                        // Sobrescreve a formatação para valores numéricos e datas
                        if (header === "VALOR TOTAL OS") {
                            const rawValue = get(linhaData, 'detalhe.valorTotal', 0) || 0;
                            return rawValue.toString().replace('.', ',');
                        }
                        if (header === "VALOR") {
                            const rawValue = get(linhaData, 'ultimoLancamento.valor', 0) || 0;
                            return rawValue.toString().replace('.', ',');
                        }
                        // Para datas, usamos a função específica para Excel
                        if (header.toUpperCase().includes('DATA') || header.toUpperCase().includes('PLANO')) {
                            const rawDate = func(linhaData); // Pega o valor que seria exibido
                            return formatarDataParaExcel(rawDate);
                        }
                        // ===== FIM DA CORREÇÃO E LÓGICA DE EXPORTAÇÃO =====

                        return cellValue; // Retorna o valor formatado para as outras colunas
                    });

                    const rowString = row.map(cell => {
                        const cellStr = String(cell ?? '').replace(/(\r\n|\n|\r)/gm, " ").trim();
                        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
                            return `"${cellStr.replace(/"/g, '""')}"`;
                        }
                        return cellStr;
                    }).join(';');
                    csvRows.push(rowString);
                });


                textoProgresso.textContent = 'Gerando arquivo...';

                const csvContent = [csvHeaders.join(';'), ...csvRows].join('\n');
                const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'relatorio_registros.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (error) {
                console.error("Erro durante a exportação:", error);
                mostrarToast('Ocorreu um erro ao gerar o arquivo de exportação.', 'error');
            } finally {
                setTimeout(() => modalProgresso.hide(), 1000);
            }
        });
    }

    if (userRole === 'MANAGER') {
        const containerBotoes = document.getElementById('botoes-acao');
        if (containerBotoes) {
            containerBotoes.classList.add('d-none');
        }
    }

    inicializarPagina();
    document.getElementById('searchInput').addEventListener('input', renderizarTabelaComFiltro);
    adicionarListenersPaginacao();
    adicionarListenersDeAcoes();
});