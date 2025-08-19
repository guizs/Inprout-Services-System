async function inicializarPrestadores() {
    const form = document.getElementById("formAdicionarPrestador");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const getValor = (id) => {
                const elemento = document.getElementById(id);
                return elemento?.value?.trim() || null;
            };

            const prestador = {
                codigoPrestador: Number(document.getElementById("codigoPrestador").value) || null,
                prestador: getValor("nomePrestador"),
                codigoPrestador: Number(getValor("codigoPrestador")) || null,
                prestador: getValor("nomePrestador"),
                razaoSocial: getValor("razaoSocial"),
                cidade: getValor("cidadePrestador"),
                uf: getValor("ufPrestador"),
                regiao: getValor("regionalPrestador"),
                rg: getValor("rgPrestador"),
                cpf: getValor("cpfPrestador"),
                cnpj: getValor("cnpjPrestador"),
                codigoBanco: getValor("codigoBanco"),
                banco: getValor("bancoPrestador"),
                agencia: getValor("agenciaPrestador"),
                conta: getValor("contaPrestador"),
                tipoDeConta: getValor("tipoConta"),
                telefone: getValor("telefonePrestador"),
                email: getValor("emailPrestador"),
                tipoPix: getValor("tipoChavePix"),
                chavePix: getValor("chavePix"),
                observacoes: getValor("observacoesPrestador")
            };

            try {
                const response = await fetch("http://3.128.248.3:8080/index/prestadores", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(prestador)
                });

                if (!response.ok) {
                    // Lança um erro para ser pego pelo catch
                    throw new Error("Erro ao salvar o prestador.");
                }

                await response.json();

                // CORRIGIDO: Usando a função de toast para sucesso
                mostrarToast("Prestador salvo com sucesso!", "success");

                form.reset();

                // Recarrega a tabela para mostrar o novo prestador
                await carregarTabelaPrestadores(colunas);

                const modal = bootstrap.Modal.getInstance(document.getElementById("modalAdicionarPrestador"));
                modal.hide();

            } catch (error) {
                // É bom manter o console.error para você ver os detalhes do erro no console
                console.error(error);

                // CORRIGIDO: Usando a função de toast para erro
                mostrarToast("Erro ao salvar o prestador.", "error");
            }
        });
    }

    const role = localStorage.getItem("role");
    const colunasPorRole = {
        ADMIN: ['codigoPrestador', 'prestador', 'razaoSocial', 'cidade', 'uf', 'regiao', 'cpf', 'cnpj', 'telefone', 'email', 'tipoPix', 'chavePix', 'observacoes'],
        COORDINATOR: ['codigoPrestador', 'prestador', 'cidade', 'uf', 'regiao', 'telefone', 'email'],
        MANAGER: ['codigoPrestador', 'prestador', 'cidade', 'uf', 'regiao', 'telefone', 'email'],
        CONTROLLER: ['codigoPrestador', 'prestador', 'cidade', 'uf', 'regiao', 'telefone', 'email'],
        ASSISTANT: ['codigoPrestador', 'prestador', 'razaoSocial', 'cidade', 'uf', 'regiao', 'cpf', 'cnpj', 'telefone', 'email', 'tipoPix', 'chavePix', 'observacoes']
    };

    const colunas = colunasPorRole[role] ?? ['codigoPrestador', 'prestador']; // fallback

    await carregarTabelaPrestadores(colunas);

    function formatarCampo(campo) {
        return campo.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
}

async function carregarTabelaPrestadores(camposOriginais) {
    const thead = document.getElementById("thead-prestadores");
    const tbody = document.getElementById("tbody-prestadores");

    const campos = ['status', ...camposOriginais];

    const titulosFormatados = {
        status: 'Status',
        codigoPrestador: "Código",
        prestador: "Prestador",
        razaoSocial: "Razão Social",
        cidade: "Cidade",
        uf: "UF",
        regiao: "Região",
        cpf: "CPF",
        cnpj: "CNPJ",
        telefone: "Telefone",
        email: "E-mail",
        tipoPix: "Tipo de PIX",
        chavePix: "Chave PIX",
        observacoes: "Observações"
    };

    try {
        // --- INÍCIO DA ALTERAÇÃO ---

        // 1. Busca TODOS os prestadores de um único endpoint.
        // A lista já virá do backend ordenada pelo ID.
        const response = await fetch("http://3.128.248.3:8080/index/prestadores");

        if (!response.ok) {
            throw new Error("Erro ao buscar prestadores.");
        }

        const todosOsPrestadores = await response.json();

        // 2. O sort no frontend não é mais necessário! A ordem vem do servidor.

        // --- FIM DA ALTERAÇÃO ---

        if (!Array.isArray(todosOsPrestadores) || todosOsPrestadores.length === 0) {
            thead.innerHTML = "<tr><th>Nenhum dado encontrado</th></tr>";
            tbody.innerHTML = "";
            return;
        }

        thead.innerHTML = `
            <tr>
                ${campos.map(campo => `<th>${titulosFormatados[campo] || campo}</th>`).join("")}
            </tr>
        `;

        tbody.innerHTML = todosOsPrestadores.map(prestador => {
            const linhaHtml = campos.map(campo => {
                if (campo === 'status') {
                    // Esta lógica agora funcionará perfeitamente para todos os prestadores
                    const statusClass = prestador.ativo ? 'active' : 'inactive';
                    return `<td><span class="status-indicator ${statusClass}"></span></td>`;
                }
                return `<td>${prestador[campo] ?? ""}</td>`;
            }).join("");

            return `<tr>${linhaHtml}</tr>`;
        }).join("");

    } catch (err) {
        console.error("Erro:", err);
        thead.innerHTML = "<tr><th>Erro ao carregar dados</th></tr>";
        tbody.innerHTML = "";
    }
}

/**
 * Busca a lista de prestadores da API e popula um elemento <select>.
 * @param {HTMLSelectElement} elementoSelect - O elemento <select> a ser preenchido.
 */
async function preencherSelectComPrestadores(elementoSelect) {
    // URL do seu endpoint de prestadores
    const urlPrestadores = "http://3.128.248.3:8080/index/prestadores";

    try {
        const response = await fetch(urlPrestadores);
        if (!response.ok) {
            throw new Error("Não foi possível carregar a lista de prestadores.");
        }
        const prestadores = await response.json();

        // Limpa o select e adiciona a opção padrão
        elementoSelect.innerHTML = '<option value="">Selecione o prestador</option>';

        // Itera sobre a lista de prestadores e cria as opções
        prestadores.forEach(prestador => {
            const opt = document.createElement("option");

            // O 'value' da opção deve ser o ID único do prestador
            opt.value = prestador.id;

            // O texto visível será no formato "Código - Nome"
            opt.textContent = `${prestador.codigoPrestador} - ${prestador.prestador}`;

            elementoSelect.appendChild(opt);
        });

    } catch (error) {
        console.error("Erro ao preencher select de prestadores:", error);
        // Em caso de erro, exibe uma mensagem dentro do select
        elementoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        mostrarToast(error.message, 'error');
    }
}

function configurarModaisPrestadores() {
    // --- Modal de Edição de Prestador ---
    const modalEditar = document.getElementById("modalEditarPrestador");
    if (modalEditar) {
        modalEditar.addEventListener("show.bs.modal", () => {
            const selectParaEditar = document.getElementById("selectPrestadorEditar");
            if (selectParaEditar) {
                preencherSelectComPrestadores(selectParaEditar);
            }
        });
    }

    // --- Modal de Desativação de Prestador ---
    const modalDesativar = document.getElementById("modalDesativarPrestador");
    if (modalDesativar) {
        modalDesativar.addEventListener("show.bs.modal", () => {
            const selectParaDesativar = document.getElementById("selectPrestadorDesativar");
            if (selectParaDesativar) {
                preencherSelectComPrestadores(selectParaDesativar);
            }
        });
    }
}

function configurarModalDesativarPrestador() {
    const modalEl = document.getElementById("modalDesativarPrestador");
    const form = document.getElementById("formDesativarPrestador");
    const select = document.getElementById("selectPrestadorDesativar");
    const btnConfirmar = document.getElementById("btnConfirmarDesativar");
    const aviso = document.getElementById("avisoPrestadorSelecionado");

    if (!modalEl) {
        return;
    }

    modalEl.addEventListener('show.bs.modal', () => {
        preencherSelectComPrestadores(select);
        select.value = '';
        aviso.classList.add('d-none');
        btnConfirmar.disabled = true;
    });

    select.addEventListener('change', () => {
        const prestadorSelecionado = select.value;
        if (prestadorSelecionado) {
            aviso.classList.remove('d-none');
            btnConfirmar.disabled = false;
        } else {
            aviso.classList.add('d-none');
            btnConfirmar.disabled = true;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prestadorId = select.value;
        if (!prestadorId) {
            mostrarToast("Por favor, selecione um prestador para desativar.", "warning");
            return;
        }
        toggleLoader(true);

        try {
            // --- INÍCIO DA CORREÇÃO ---
            // 1. Busca todos os prestadores para encontrar o código
            const prestadoresResponse = await fetch("http://3.128.248.3:8080/index/prestadores/ativos");
            const prestadores = await prestadoresResponse.json();
            const prestadorSelecionado = prestadores.find(p => p.id == prestadorId);

            if (!prestadorSelecionado) {
                throw new Error('Não foi possível encontrar o prestador selecionado.');
            }

            const prestadorCodigo = prestadorSelecionado.codigoPrestador;

            // 2. Usa o CÓDIGO na URL, como o backend espera
            const response = await fetch(`http://3.128.248.3:8080/index/prestadores/desativar/${prestadorCodigo}`, {
                method: 'PUT',
            });
            // --- FIM DA CORREÇÃO ---

            if (!response.ok) {
                throw new Error('Falha ao desativar o prestador. Tente novamente.');
            }

            mostrarToast("Prestador desativado com sucesso!", 'success');
            bootstrap.Modal.getInstance(modalEl).hide();

            const colunas = getColunasAtuaisPorRole();
            await carregarTabelaPrestadores(colunas);

        } catch (error) {
            console.error("Erro ao desativar prestador:", error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false);
        }
    });
}

/**
 * Busca a lista de prestadores INATIVOS da API e popula um elemento <select>.
 * @param {HTMLSelectElement} elementoSelect - O elemento <select> a ser preenchido.
 */
async function preencherSelectComPrestadoresDesativados(elementoSelect) {
    const urlPrestadoresDesativados = "http://3.128.248.3:8080/index/prestadores/desativados";

    try {
        const response = await fetch(urlPrestadoresDesativados);
        if (!response.ok) {
            throw new Error("Não foi possível carregar a lista de prestadores desativados.");
        }
        const prestadores = await response.json();

        elementoSelect.innerHTML = '<option value="">Selecione o prestador desativado</option>';

        if (prestadores.length === 0) {
            elementoSelect.innerHTML = '<option value="">Nenhum prestador inativo</option>';
            return;
        }

        prestadores.forEach(prestador => {
            const opt = document.createElement("option");
            opt.value = prestador.id;
            opt.textContent = `${prestador.codigoPrestador} - ${prestador.prestador}`;
            elementoSelect.appendChild(opt);
        });

    } catch (error) {
        console.error("Erro ao preencher select de prestadores desativados:", error);
        elementoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        mostrarToast(error.message, 'error');
    }
}

function configurarModalAtivarPrestador() {
    const modalEl = document.getElementById("modalAtivarPrestador");
    const form = document.getElementById("formAtivarPrestador");
    const select = document.getElementById("selectPrestadorAtivar");
    const btnConfirmar = document.getElementById("btnConfirmarAtivar");
    const aviso = document.getElementById("avisoPrestadorSelecionadoAtivar");

    if (!modalEl) {
        return;
    }

    modalEl.addEventListener('show.bs.modal', () => {
        // Usamos a nova função para mostrar apenas prestadores inativos
        preencherSelectComPrestadoresDesativados(select);

        // Reseta o estado do modal
        select.value = '';
        aviso.classList.add('d-none');
        btnConfirmar.disabled = true;
    });

    select.addEventListener('change', () => {
        if (select.value) {
            aviso.classList.remove('d-none');
            btnConfirmar.disabled = false;
        } else {
            aviso.classList.add('d-none');
            btnConfirmar.disabled = true;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prestadorId = select.value;
        if (!prestadorId) {
            mostrarToast("Por favor, selecione um prestador para ativar.", "warning");
            return;
        }
        toggleLoader(true);

        try {
            // --- INÍCIO DA CORREÇÃO ---
            // 1. Busca os prestadores INATIVOS para encontrar o código
            const prestadoresResponse = await fetch("http://3.128.248.3:8080/index/prestadores/desativados");
            const prestadores = await prestadoresResponse.json();
            const prestadorSelecionado = prestadores.find(p => p.id == prestadorId);

            if (!prestadorSelecionado) {
                throw new Error('Não foi possível encontrar o prestador selecionado.');
            }

            const prestadorCodigo = prestadorSelecionado.codigoPrestador;

            // 2. Usa o CÓDIGO na URL
            const response = await fetch(`http://3.128.248.3:8080/index/prestadores/ativar/${prestadorCodigo}`, {
                method: 'PUT',
            });
            // --- FIM DA CORREÇÃO ---

            if (!response.ok) {
                throw new Error('Falha ao ativar o prestador. Tente novamente.');
            }

            mostrarToast("Prestador ativado com sucesso!", 'success');
            bootstrap.Modal.getInstance(modalEl).hide();

            const colunas = getColunasAtuaisPorRole();
            await carregarTabelaPrestadores(colunas);

        } catch (error) {
            console.error("Erro ao ativar prestador:", error);
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false);
        }
    });
}

/**
 * Retorna a lista de nomes de colunas de prestadores com base
 * na 'role' do usuário armazenada no localStorage.
 * @returns {string[]} Um array com os nomes das colunas.
 */
function getColunasAtuaisPorRole() {
    const colunasPorRole = {
        ADMIN: ['codigoPrestador', 'prestador', 'razaoSocial', 'cidade', 'uf', 'regiao', 'cpf', 'cnpj', 'telefone', 'email', 'tipoPix', 'chavePix', 'observacoes'],
        COORDINATOR: ['codigoPrestador', 'prestador', 'cidade', 'uf', 'regiao', 'telefone', 'email'],
        MANAGER: ['codigoPrestador', 'prestador', 'cidade', 'uf', 'regiao', 'telefone', 'email'],
        CONTROLLER: ['codigoPrestador', 'prestador', 'cidade', 'uf', 'regiao', 'telefone', 'email'],
        ASSISTANT: ['codigoPrestador', 'prestador', 'razaoSocial', 'cidade', 'uf', 'regiao', 'cpf', 'cnpj', 'telefone', 'email', 'tipoPix', 'chavePix', 'observacoes']
    };

    // Pega a role, garante que não seja nula, remove espaços e converte para maiúsculas.
    const role = (localStorage.getItem("role") || "").trim().toUpperCase();

    // Retorna as colunas para a role encontrada ou o valor padrão.
    return colunasPorRole[role] ?? ['codigoPrestador', 'prestador'];
}

/**
 * Configura a lógica completa do modal de Edição de Prestador,
 * usando o padrão de interruptor e com o mapeamento de campos corrigido.
 */
function configurarModalEditarPrestador() {
    // 1. Referências aos elementos
    const modalEl = document.getElementById("modalEditarPrestador");
    if (!modalEl) return;

    const selectEl = document.getElementById("selectPrestadorEditar");
    const formCampos = document.getElementById("formCamposPrestador");
    const formEl = document.getElementById("formEditarPrestador");
    const btnSalvar = document.getElementById("btnSalvarEdicaoPrestador");
    let todosOsPrestadores = [];

    // --- A CORREÇÃO ESTÁ AQUI ---
    // 2. Mapeamento explícito das chaves do JSON para os IDs do HTML
    const mapeamentoCampos = {
        codigoPrestador: 'codigoPrestador_Editar',
        prestador: 'nomePrestador_Editar', // Chave 'prestador' no JSON vai para o campo 'nomePrestador_Editar'
        razaoSocial: 'razaoSocial_Editar',
        cidade: 'cidadePrestador_Editar', // Chave 'cidade' no JSON vai para 'cidadePrestador_Editar'
        uf: 'ufPrestador_Editar',
        regiao: 'regionalPrestador_Editar', // Chave 'regiao' no JSON vai para 'regionalPrestador_Editar'
        rg: 'rgPrestador_Editar',
        cpf: 'cpfPrestador_Editar',
        cnpj: 'cnpjPrestador_Editar',
        codigoBanco: 'codigoBanco_Editar',
        banco: 'bancoPrestador_Editar',
        agencia: 'agenciaPrestador_Editar',
        conta: 'contaPrestador_Editar',
        tipoDeConta: 'tipoConta_Editar',
        telefone: 'telefonePrestador_Editar',
        email: 'emailPrestador_Editar',
        tipoPix: 'tipoChavePix_Editar',
        chavePix: 'chavePix_Editar',
        observacoes: 'observacoesPrestador_Editar'
    };

    /**
     * Função auxiliar para popular os campos do formulário usando o mapeamento.
     */
    const preencherFormularioEdicao = (prestador) => {
        for (const key in prestador) {
            const campoId = mapeamentoCampos[key]; // Busca o ID correto no nosso mapa
            if (campoId) {
                const campo = document.getElementById(campoId);
                if (campo) {
                    campo.value = prestador[key] ?? '';
                }
            }
        }
    };

    // O restante do código permanece o mesmo, pois já está correto.
    const resetarFormulario = () => {
        formCampos.querySelectorAll('input:not([readonly]):not(.toggle-editar), select, textarea').forEach(input => {
            input.disabled = true;
        });
        formCampos.querySelectorAll('.toggle-editar').forEach(toggle => {
            toggle.checked = false;
        });
    };

    modalEl.addEventListener('show.bs.modal', async () => {
        formCampos.classList.add('d-none');
        btnSalvar.disabled = true;
        selectEl.value = '';
        resetarFormulario();
        try {
            toggleLoader(true);
            await preencherSelectComPrestadores(selectEl);
            const response = await fetch("http://3.128.248.3:8080/index/prestadores");
            todosOsPrestadores = await response.json();
        } catch (error) {
            mostrarToast("Erro ao preparar modal de edição.", "error");
        } finally {
            toggleLoader(false);
        }
    });

    selectEl.addEventListener('change', () => {
        const prestadorId = parseInt(selectEl.value);
        if (!prestadorId) {
            formCampos.classList.add('d-none');
            btnSalvar.disabled = true;
            return;
        }
        const prestador = todosOsPrestadores.find(p => p.id === prestadorId);
        if (prestador) {
            resetarFormulario();
            preencherFormularioEdicao(prestador);
            formCampos.classList.remove('d-none');
            btnSalvar.disabled = false;
        }
    });

    formCampos.addEventListener('change', (e) => {
        if (e.target.classList.contains('toggle-editar')) {
            const targetSelector = e.target.getAttribute('data-target');
            const inputTarget = document.querySelector(targetSelector);
            if (inputTarget) {
                inputTarget.disabled = !e.target.checked;
                if (e.target.checked) {
                    inputTarget.focus();
                }
            }
        }
    });

    // O submit já estava pegando os IDs corretos, então não precisa mudar.
    formEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        toggleLoader(true);
        const prestadorId = parseInt(selectEl.value);
        if (!prestadorId) { toggleLoader(false); return; }

        const dadosAtualizados = {};
        for (const key in mapeamentoCampos) {
            const campo = document.getElementById(mapeamentoCampos[key]);
            if (campo) {
                let valor = campo.value;
                // Se o campo for um SELECT e o valor for uma string vazia, converte para null
                if (campo.tagName === 'SELECT' && valor === '') {
                    valor = null;
                }
                dadosAtualizados[key] = valor;
            }
        }
        dadosAtualizados.id = prestadorId;
        dadosAtualizados.ativo = todosOsPrestadores.find(p => p.id === prestadorId)?.ativo;


        try {
            const response = await fetch(`http://3.128.248.3:8080/index/prestadores/${prestadorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });
            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.message || "Falha ao atualizar o prestador.");
            }
            mostrarToast("Prestador atualizado com sucesso!", 'success');
            bootstrap.Modal.getInstance(modalEl).hide();
            await carregarTabelaPrestadores(getColunasAtuaisPorRole());
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            toggleLoader(false);
        }
    });
}