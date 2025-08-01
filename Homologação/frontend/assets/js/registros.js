document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:8080';
    let todasAsLinhas = [];

    const headers = [
        "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", "REGIONAL", "LOTE", "BOQ", "PO", "ITEM",
        "OBJETO CONTRATADO", "UNIDADE", "QUANTIDADE", "VALOR TOTAL OS", "OBSERVAÇÕES", "DATA PO", "LPU", "EQUIPE",
        "VISTORIA", "PLANO VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOBILIZAÇÃO", "INSTALAÇÃO", "PLANO INSTALAÇÃO",
        "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOCUMENTAÇÃO",
        "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", "CÓD. PRESTADOR", "PRESTADOR",
        "VALOR LPU", "GESTOR", "DATA ATIVIDADE", "FATURAMENTO", "SOLICIT ID FAT", "RECEB ID FAT", "ID FATURAMENTO",
        "DATA FAT INPROUT", "SOLICIT FS PORTAL", "DATA FS", "NUM FS", "GATE", "GATE ID", "DATA CRIAÇÃO OS",
    ];

    async function inicializarPagina() {
        const tableHead = document.getElementById('registros-table-head');
        const tableBody = document.getElementById('registros-table-body');
        
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Carregando dados...</td></tr>`;

        try {
            const response = await fetch(`${API_BASE_URL}/os`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
            
            const osData = await response.json();
            
            todasAsLinhas = [];
            osData.forEach(os => {
                if (os.lpus && os.lpus.length > 0) {
                    os.lpus.forEach(itemLpu => {
                        todasAsLinhas.push({ os: os, lpuItem: itemLpu });
                    });
                } else {
                    todasAsLinhas.push({ os: os, lpuItem: null });
                }
            });

            renderizarTabela(todasAsLinhas);

        } catch (error) {
            console.error('Falha ao carregar os registros:', error);
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
        }
    }

    function renderizarTabela(linhasParaRenderizar) {
        const tableBody = document.getElementById('registros-table-body');
        tableBody.innerHTML = '';

        if (linhasParaRenderizar.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Nenhum registro encontrado.</td></tr>`;
            return;
        }
        
        const formatarMoeda = (valor) => (valor || valor === 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : 'N/A';
        const get = (obj, path, defaultValue = 'N/A') => path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : defaultValue), obj);

        linhasParaRenderizar.forEach(linhaData => {
            const { os, lpuItem } = linhaData;
            const lpu = lpuItem ? lpuItem.lpu : null;
            const lancamento = lpuItem ? lpuItem.ultimoLancamento : null;

            const tr = document.createElement('tr');
            
            const celulas = [
                get(os, 'os'), get(os, 'site'), get(os, 'contrato'), get(os, 'segmento.nome'), get(os, 'projeto'),
                get(os, 'gestorTim'), get(os, 'regional'), lpu ? `${get(lpu, 'codigo')} - ${get(lpu, 'nome')}` : 'N/A', get(os, 'lote'), get(os, 'boq'), get(os, 'po'), get(os, 'item'),
                get(os, 'objetoContratado'), get(os, 'unidade'), get(os, 'quantidade'), formatarMoeda(get(os, 'valorTotal', null)),
                get(os, 'observacoes'), get(os, 'dataPo'),
                get(lancamento, 'equipe'),
                get(lancamento, 'vistoria'), get(lancamento, 'planoVistoria'),
                get(lancamento, 'desmobilizacao'), get(lancamento, 'planoDesmobilizacao'),
                get(lancamento, 'instalacao'), get(lancamento, 'planoInstalacao'),
                get(lancamento, 'ativacao'), get(lancamento, 'planoAtivacao'),
                get(lancamento, 'documentacao'), get(lancamento, 'planoDocumentacao'),
                get(lancamento, 'etapa.nomeGeral'), get(lancamento, 'etapa.nomeDetalhado'),
                get(lancamento, 'status'), get(lancamento, 'situacao'), get(lancamento, 'detalheDiario'),
                get(lancamento, 'prestador.codigo'), get(lancamento, 'prestador.nome'), formatarMoeda(get(lancamento, 'valor', null)),
                get(lancamento, 'manager.nome'), get(lancamento, 'dataAtividade'), get(os, 'faturamento'), get(os, 'solitIdFat'),
                get(os, 'recebIdFat'), get(os, 'idFaturamento'), get(os, 'dataFatInprout'), get(os, 'solitFsPortal'),
                get(os, 'dataFs'), get(os, 'numFs'), get(os, 'gate'), get(os, 'gateId'), get(os, 'dataCriacao')
            ];

            tr.innerHTML = celulas.map(celula => `<td>${celula}</td>`).join('');
            tableBody.appendChild(tr);
        });
    }

    function adicionarListenerDeBusca() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function() {
            const termoBusca = this.value.toLowerCase().trim();
            if (!termoBusca) {
                renderizarTabela(todasAsLinhas);
                return;
            }
            const linhasFiltradas = todasAsLinhas.filter(linhaData => {
                const os = linhaData.os;
                return (os.os?.toLowerCase().includes(termoBusca) || os.site?.toLowerCase().includes(termoBusca) || os.contrato?.toLowerCase().includes(termoBusca));
            });
            renderizarTabela(linhasFiltradas);
        });
    }

    // Lógica de importação (mantida como antes)
    const btnImportar = document.getElementById('btnImportar');
    const importFileInput = document.getElementById('importFile');

    btnImportar.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        btnImportar.disabled = true;
        btnImportar.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Importando...`;

        try {
            const [segmentos, contratos] = await Promise.all([
                fetch(`${API_BASE_URL}/segmentos`).then(res => res.json()),
                fetch(`${API_BASE_URL}/contrato`).then(res => res.json())
            ]);

            const todasAsLpus = contratos.flatMap(contrato => contrato.lpus || []);
            const segmentoMap = new Map(segmentos.map(s => [s.nome.toUpperCase(), s.id]));
            const lpuMap = new Map(todasAsLpus.map(l => [l.codigoLpu.toUpperCase(), l.id]));

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonDaPlanilha = XLSX.utils.sheet_to_json(worksheet);

                    const promessasDePost = [];
                    for (const linha of jsonDaPlanilha) {
                        const osData = {
                            os: String(linha['OS'] || '').trim(),
                            site: String(linha['SITE'] || '').trim(),
                            contrato: String(linha['CONTRATO'] || '').trim(),
                            segmentoNome: String(linha['SEGMENTO'] || '').trim().toUpperCase(),
                            projeto: String(linha['PROJETO'] || '').trim(),
                            gestorTim: String(linha['GESTOR TIM'] || '').trim(),
                            regional: String(linha['REGIONAL'] || '').trim(),
                            lote: String(linha['LOTE'] || '').trim(),
                            boq: String(linha['BOQ'] || '').trim(),
                            po: String(linha['PO'] || '').trim(),
                            item: String(linha['ITEM'] || '').trim(),
                            objetoContratado: String(linha['OBJETO CONTRATADO'] || '').trim(),
                            unidade: String(linha['UNIDADE'] || '').trim(),
                            quantidade: parseInt(linha['QUANTIDADE'], 10) || null,
                            valorTotal: parseFloat(linha[' VALOR TOTAL ']) || null,
                            observacoes: String(linha['OBSERVAÇÕES'] || '').trim(),
                            dataPo: linha['DATA PO'] ? excelDateToJSDate(linha['DATA PO']) : null,
                            lpuCodigo: String(linha['LPU'] || '').trim().toUpperCase(),
                        };

                        const segmentoId = segmentoMap.get(osData.segmentoNome);
                        const lpuId = lpuMap.get(osData.lpuCodigo);

                        if (!segmentoId || !lpuId) {
                            console.warn(`Dados não encontrados para a OS "${osData.os}". Pulando.`);
                            continue;
                        }

                        const payload = { ...osData, segmentoId, lpuIds: [lpuId] };
                        delete payload.segmentoNome;
                        delete payload.lpuCodigo;

                        promessasDePost.push(
                            fetch(`${API_BASE_URL}/os`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            })
                        );
                    }

                    if (promessasDePost.length === 0) {
                        throw new Error("Nenhuma linha válida encontrada no arquivo para importação.");
                    }

                    const responses = await Promise.all(promessasDePost);
                    const failedCount = responses.filter(res => !res.ok).length;
                    if (failedCount > 0) {
                        throw new Error(`${failedCount} de ${responses.length} OSs falharam ao serem importadas.`);
                    }
                    
                    const osRecemCriadas = await Promise.all(responses.map(res => res.json()));
                    const novasLinhasParaTabela = osRecemCriadas.flatMap(os => 
                        (os.lpus && os.lpus.length > 0) ? os.lpus.map(lpu => ({
                            os: os,
                            lpuItem: { lpu: { id: lpu.id, codigo: lpu.codigoLpu, nome: lpu.nomeLpu }, ultimoLancamento: null }
                        })) : [{ os: os, lpuItem: null }]
                    );

                    todasAsLinhas.unshift(...novasLinhasParaTabela);
                    renderizarTabela(todasAsLinhas);
                    mostrarToast(`${osRecemCriadas.length} OSs importadas com sucesso!`, 'success');

                } catch (error) {
                    console.error('Erro no processamento do arquivo:', error);
                    mostrarToast(error.message, 'error');
                } finally {
                    btnImportar.disabled = false;
                    btnImportar.innerHTML = `<i class="bi bi-file-earmark-excel me-1"></i> Importar`;
                    importFileInput.value = '';
                }
            };
            reader.readAsArrayBuffer(file);

        } catch (error) {
            console.error('Erro na preparação da importação:', error);
            mostrarToast(error.message, 'error');
            btnImportar.disabled = false;
            btnImportar.innerHTML = `<i class="bi bi-file-earmark-excel me-1"></i> Importar`;
            importFileInput.value = '';
        }
    });
    
    function excelDateToJSDate(excelDate) {
        if (excelDate instanceof Date) {
            const ano = excelDate.getFullYear();
            const mes = String(excelDate.getMonth() + 1).padStart(2, '0');
            const dia = String(excelDate.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        }
        if (typeof excelDate === 'number') {
            const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            const ano = date.getFullYear();
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const dia = String(date.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        }
        return null;
    }
    
    // ==========================================================
    // NOVA SEÇÃO: LÓGICA DE EXPORTAÇÃO PARA CSV
    // ==========================================================
    const btnExportar = document.getElementById('btnExportar');

    btnExportar.addEventListener('click', () => {
        // Usa os dados que já estão na variável `todasAsLinhas`
        if (todasAsLinhas.length === 0) {
            // A função mostrarToast já deve existir no seu global.js
            if (typeof mostrarToast === 'function') {
                mostrarToast('Não há dados para exportar.', 'error');
            } else {
                alert('Não há dados para exportar.');
            }
            return;
        }

        const csvHeaders = headers;
        
        const csvRows = todasAsLinhas.map(linhaData => {
            const { os, lpuItem } = linhaData;
            const lpu = lpuItem ? lpuItem.lpu : null;
            const lancamento = lpuItem ? lpuItem.ultimoLancamento : null;
            
            const get = (obj, path, defaultValue = '') => path.split('.').reduce((a, b) => (a && a[b] != null ? a[b] : defaultValue), obj);
            const formatarMoedaCSV = (valor) => (valor || valor === 0) ? valor.toString().replace('.', ',') : '';

            const row = [
                get(os, 'os'), get(os, 'site'), get(os, 'contrato'), get(os, 'segmento.nome'), get(os, 'projeto'),
                get(os, 'gestorTim'), get(os, 'regional'), lpu ? `${get(lpu, 'codigo')} - ${get(lpu, 'nome')}` : '', get(os, 'lote'), get(os, 'boq'), get(os, 'po'), get(os, 'item'),
                get(os, 'objetoContratado'), get(os, 'unidade'), get(os, 'quantidade'), formatarMoedaCSV(get(os, 'valorTotal', null)),
                get(os, 'observacoes'), get(os, 'dataPo'),
                get(lancamento, 'equipe'),
                get(lancamento, 'vistoria'), get(lancamento, 'planoVistoria'),
                get(lancamento, 'desmobilizacao'), get(lancamento, 'planoDesmobilizacao'),
                get(lancamento, 'instalacao'), get(lancamento, 'planoInstalacao'),
                get(lancamento, 'ativacao'), get(lancamento, 'planoAtivacao'),
                get(lancamento, 'documentacao'), get(lancamento, 'planoDocumentacao'),
                get(lancamento, 'etapa.nomeGeral'), get(lancamento, 'etapa.nomeDetalhado'),
                get(lancamento, 'status'), get(lancamento, 'situacao'), get(lancamento, 'detalheDiario'),
                get(lancamento, 'prestador.codigo'), get(lancamento, 'prestador.nome'), formatarMoedaCSV(get(lancamento, 'valor', null)),
                get(lancamento, 'manager.nome'), get(lancamento, 'dataAtividade'), get(os, 'faturamento'), get(os, 'solitIdFat'),
                get(os, 'recebIdFat'), get(os, 'idFaturamento'), get(os, 'dataFatInprout'), get(os, 'solitFsPortal'),
                get(os, 'dataFs'), get(os, 'numFs'), get(os, 'gate'), get(os, 'gateId'), get(os, 'dataCriacao')
            ];

            return row.map(cell => {
                const cellStr = String(cell);
                if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(';');
        });

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
    });

    // Inicialização da página
    inicializarPagina();
    adicionarListenerDeBusca();
});