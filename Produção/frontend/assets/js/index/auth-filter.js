/**
 * Filtra uma lista de lançamentos com base na role e nos segmentos do usuário logado.
 * @param {Array} lancamentos - A lista completa de lançamentos vinda da API.
 * @returns {Array} A lista de lançamentos filtrada.
 */
function filtrarLancamentosParaUsuario(lancamentos) {
    // Pega os dados do usuário do localStorage
    const role = (localStorage.getItem("role") || "").trim().toUpperCase();
    const userSegmentos = JSON.parse(localStorage.getItem('segmentos')) || [];

    // Se for Admin, Controller ou Assistant, pode ver tudo.
    if (['ADMIN', 'CONTROLLER', 'ASSISTANT'].includes(role)) {
        return lancamentos;
    }

    // Se for Manager ou Coordinator, aplica o filtro por segmento.
    if (['MANAGER', 'COORDINATOR'].includes(role)) {
        if (userSegmentos.length === 0) {
            // Se o usuário não tem segmentos, não pode ver nada.
            return [];
        }

        return lancamentos.filter(lancamento => 
            lancamento?.os?.segmento && userSegmentos.includes(lancamento.os.segmento.id)
        );
    }

    // Se não tiver nenhuma das roles acima, não vê nada por padrão.
    return [];
}