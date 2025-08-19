//Formata os campos de valores para REAL
const valorInput = document.getElementById('valorAtividade');

function formatarParaReal(valor) {
    const numero = parseFloat(valor.replace(/\D/g, '')) / 100;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', '').trim();
}

function limparValorFormatado(valor) {
    return valor.replace(/\D/g, '');
}

valorInput.addEventListener('input', (e) => {
    let valorLimpo = limparValorFormatado(e.target.value);
    e.target.value = formatarParaReal(valorLimpo);
});