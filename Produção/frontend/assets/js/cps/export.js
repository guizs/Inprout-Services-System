document.getElementById('exportBtn').addEventListener('click', function() {
    let table = document.getElementById('table-cps');
    if (!table) {
        console.error('Tabela para exportação não encontrada!');
        return;
    }

    let csv = [];
    // Pega os cabeçalhos da tabela
    let headers = [];
    table.querySelectorAll('thead th').forEach(th => headers.push(th.innerText));
    csv.push(headers.join(';'));

    // Pega as linhas de dados
    table.querySelectorAll('tbody tr').forEach(row => {
        let rowData = [];
        row.querySelectorAll('td').forEach(td => {
            // Limpa o texto para evitar quebras de linha e excesso de espaços
            let text = td.innerText.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, ' ').trim();
            rowData.push(text);
        });
        csv.push(rowData.join(';'));
    });

    let csvContent = 'data:text/csv;charset=utf-8,' + csv.join('\n');
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'relatorio_cps.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});