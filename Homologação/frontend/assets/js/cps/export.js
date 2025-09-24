document.getElementById('exportBtn').addEventListener('click', function() {
    // Pega a tabela e os dados filtrados que estão sendo exibidos
    const table = document.getElementById('table-cps');
    const activeTab = document.querySelector('#table-tabs .nav-link.active').dataset.tableView;
    const segmentoFiltro = document.getElementById('segment-select-filter').value;
    
    if (!table || !window.fullData) {
        console.error('Tabela ou dados para exportação não encontrados!');
        alert('Não há dados para exportar.');
        return;
    }

    let headers = [];
    let rows = [];

    // Lógica para exportar a visualização correta (Prestadores ou Lançamentos)
    if (activeTab === 'prestadores') {
        headers = ["Código do Prestador", "Prestador", "Valor Total"];
        const dadosFiltrados = filterDataBySegment(window.fullData, segmentoFiltro).consolidadoPorPrestador || [];
        
        dadosFiltrados.sort((a, b) => b.valorTotal - a.valorTotal); // Garante a mesma ordenação da tela

        rows = dadosFiltrados.map(prest => [
            prest.codPrestador || '',
            prest.prestadorNome || '',
            (prest.valorTotal || 0).toString().replace('.', ',') // Formato numérico para Excel BR
        ]);

    } else { // Exportando a visão de Lançamentos Detalhados
        headers = [
            "DATA ATIVIDADE", "OS", "SITE", "CONTRATO", "SEGMENTO", "PROJETO", "GESTOR TIM", 
            "REGIONAL", "LOTE", "BOQ", "PO", "ITEM", "OBJETO CONTRATADO", "UNIDADE", 
            "QUANTIDADE", "VALOR TOTAL", "OBSERVAÇÕES", "DATA PO", "LPU", "EQUIPE", 
            "VISTORIA", "PLANO DE VISTORIA", "DESMOBILIZAÇÃO", "PLANO DESMOB.", "INSTALAÇÃO", 
            "PLANO INST.", "ATIVAÇÃO", "PLANO ATIVAÇÃO", "DOCUMENTAÇÃO", "PLANO DOC.", 
            "ETAPA GERAL", "ETAPA DETALHADA", "STATUS", "SITUAÇÃO", "DETALHE DIÁRIO", 
            "CÓD PRESTADOR", "PRESTADOR", "VALOR PAGO", "KEY", "ADIANTAMENTO"
        ];
        
        const dadosFiltrados = filterDataBySegment(window.fullData, segmentoFiltro).lancamentosDetalhados || [];

        // Função para formatar data para o padrão que o Excel entende (YYYY-MM-DD)
        const formatarDataParaExcel = (dataStr) => {
            if (!dataStr || !dataStr.includes('/')) return '';
            const [dia, mes, ano] = dataStr.split('/');
            return `${ano}-${mes}-${dia}`;
        };

        rows = dadosFiltrados.map(lanc => [
            formatarDataParaExcel(lanc.dataAtividade),
            lanc.os || '', lanc.site || '', lanc.contrato || '', lanc.segmento || '',
            lanc.projeto || '', lanc.gestorTim || '', lanc.regional || '', lanc.lote || '',
            lanc.boq || '', lanc.po || '', lanc.item || '', lanc.objetoContratado || '',
            lanc.unidade || '', lanc.quantidade || '', 
            (lanc.valorTotal || 0).toString().replace('.', ','),
            lanc.observacoes || '',
            formatarDataParaExcel(lanc.dataPo),
            lanc.lpu || '', lanc.equipe || '', lanc.vistoria || '',
            formatarDataParaExcel(lanc.planoDeVistoria),
            lanc.desmobilizacao || '',
            formatarDataParaExcel(lanc.planoDeDesmobilizacao),
            lanc.instalacao || '',
            formatarDataParaExcel(lanc.planoDeInstalacao),
            lanc.ativacao || '',
            formatarDataParaExcel(lanc.planoDeAtivacao),
            lanc.documentacao || '',
            formatarDataParaExcel(lanc.planoDeDocumentacao),
            lanc.etapaGeral || '', lanc.etapaDetalhada || '', lanc.status || '',
            lanc.situacao || '', lanc.detalheDiario || '', lanc.codPrestador || '',
            lanc.prestador || '',
            (lanc.valor || 0).toString().replace('.', ','),
            lanc.key || '',
            (lanc.valorAdiantamento || 0).toString().replace('.', ',')
        ]);
    }

    // Monta o conteúdo CSV
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => {
            const cellStr = String(cell ?? '').replace(/(\r\n|\n|\r)/gm, " ").trim();
            // Se a célula contém o separador, aspas ou quebra de linha, a envolve em aspas duplas
            if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(';'))
    ].join('\n');

    // Cria e baixa o arquivo
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_cps.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});