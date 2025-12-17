// Verifica a URL atual para ajustar o caminho do arquivo sidebar.html
let sidebarPath;

// Se estiver na index.html ou na raiz, usa caminho sem "../"
if (
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('/index')
) {
    sidebarPath = 'pages/extras/sidebar.html'; // Caminho relative para index
} else {
    sidebarPath = '../pages/extras/sidebar.html'; // Caminho relative para páginas dentro de /pages
}

// Carrega dinamicamente o HTML da sidebar
fetch(sidebarPath)
    .then(res => res.text())
    .then(html => {
        // Insere o conteúdo carregado no container
        document.getElementById('sidebar-container').innerHTML = html;

        // === AJUSTA OS LINKS DA SIDEBAR DINAMICAMENTE ===
        const isIndex = window.location.pathname.endsWith('/index.html') ||
            window.location.pathname === '/' ||
            window.location.pathname.endsWith('/index');

        // Corrige os caminhos dos links, se estiver na index
        if (isIndex) {
            const linkIndex = document.querySelector('#sidebar a[href="../index.html"]');
            if (linkIndex) linkIndex.setAttribute('href', 'index.html');

            const linkCps = document.querySelector('#sidebar a[href="cps.html"]');
            if (linkCps) linkCps.setAttribute('href', 'pages/cps.html');

            const linkCms = document.querySelector('#sidebar a[href="cms.html"]');
            if (linkCms) linkCms.setAttribute('href', 'pages/cms.html');

            const linkRegistros = document.querySelector('#sidebar a[href="registros.html"]');
            if (linkRegistros) linkRegistros.setAttribute('href', 'pages/registros.html');

            const linkIndexDB = document.querySelector('#sidebar a[href="indexDB.html"]');
            if (linkIndexDB) linkIndexDB.setAttribute('href', 'pages/indexDB.html');

            const linkGestao = document.querySelector('#sidebar a[href="gestaoAprovacoes.html"]');
            if (linkGestao) linkGestao.setAttribute('href', 'pages/gestaoAprovacoes.html');

            // --- INÍCIO DA VERIFICAÇÃO (PARA LINKS COMENTADOS) ---
            const faturamentoLinkIndex = document.querySelector('#sidebar a[href="faturamento.html"]');
            if (faturamentoLinkIndex) {
                faturamentoLinkIndex.setAttribute('href', 'pages/faturamento.html');
            }

            const gateReportLinkIndex = document.querySelector('#sidebar a[href="gateReport.html"]');
            if (gateReportLinkIndex) {
                gateReportLinkIndex.setAttribute('href', 'pages/gateReport.html');
            }
            // --- FIM DA VERIFICAÇÃO ---
        }

        // ==========================================================
        // CÓDIGO ATUALIZADO PARA CONTROLAR A VISIBILIDADE DOS BOTÕES
        // ==========================================================
        try {
            // 1. Pega a role do usuário do localStorage
            const userRole = (localStorage.getItem("role") || "").trim().toUpperCase();

            // 2. Seleciona os links
            const cpsLink = document.querySelector('#sidebar a[href*="cps.html"]');
            const controleCpsLink = document.querySelector('#sidebar a[href*="controle-cps.html"]'); // Adicionado
            const faturamentoLink = document.querySelector('#sidebar a[href*="faturamento.html"]');
            const gateReportLink = document.querySelector('#sidebar a[href*="gateReport.html"]');

            // 3. Esconde os links que ainda não estão prontos
            if (faturamentoLink) {
                faturamentoLink.parentElement.style.display = 'none';
            }
            if (gateReportLink) {
                gateReportLink.parentElement.style.display = 'none';
            }

            // 4. Verifica se o usuário é MANAGER
            // (Managers não devem ver o Relatório CPS, Faturamento ou Gate Report)
            // (Mas DEVEM ver o novo Controle CPS)
            if (userRole === 'MANAGER') {
                if (cpsLink) {
                    cpsLink.parentElement.style.display = 'none';
                }
                if (faturamentoLink) {
                    faturamentoLink.parentElement.style.display = 'none';
                }
                if (gateReportLink) {
                    gateReportLink.parentElement.style.display = 'none';
                }
            }
            if (userRole === 'DOCUMENTIST') {
                const linksParaEsconder = ['index.html', 'cps.html', 'cms.html', 'registros.html', 'indexDB.html'];
                linksParaEsconder.forEach(href => {
                    const link = document.querySelector(`#sidebar a[href*="${href}"]`);
                    if (link) link.parentElement.style.display = 'none';
                });
            }
        } catch (error) {
            console.error("Falha ao configurar a visibilidade da sidebar:", error);
        }
        // ==========================================================
        // FIM DA ATUALIZAÇÃO
        // ==========================================================


        const toggleButton = document.getElementById('menu-toggle'); // Botão para abrir/fechar o menu
        const sidebar = document.getElementById('sidebar'); // Container da sidebar

        // ==========================================================
        // INÍCIO DA CORREÇÃO PARA FORÇAR NAVEGAÇÃO
        // ==========================================================
        // Adiciona um listener para CADA link dentro da sidebar
        const sidebarLinks = sidebar.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                // 1. Previne o comportamento "estranho" que você está vendo
                e.preventDefault();

                // 2. Força o navegador a carregar a página do link
                window.location.href = this.href;
            });
        });
        // ==========================================================
        // FIM DA CORREÇÃO
        // ==========================================================


        // Adiciona evento de clique no botão para abrir/fechar a sidebar
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique se propague e dispare o evento de "fechar ao clicar fora"
            sidebar.classList.toggle('active'); // Alterna a classe "active" para mostrar/ocultar a sidebar
            toggleButton.classList.toggle('active');
        });

        // Fecha a sidebar automaticamente ao clicar fora dela
        document.addEventListener('click', (e) => {
            const isClickInsideSidebar = sidebar.contains(e.target); // Verifica se clicou dentro da sidebar
            const isClickToggle = toggleButton.contains(e.target);    // Verifica se clicou no botão de toggle

            // Se clicou fora tanto da sidebar quanto do botão, fecha a sidebar
            if (!isClickInsideSidebar && !isClickToggle) {
                sidebar.classList.remove('active');
                toggleButton.classList.remove('active');
            }
        });
    });