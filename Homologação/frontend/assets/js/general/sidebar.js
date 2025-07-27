// Verifica a URL atual para ajustar o caminho do arquivo sidebar.html
let sidebarPath;

// Se estiver na index.html ou na raiz, usa caminho sem "../"
if (
  window.location.pathname.endsWith('/index.html') ||
  window.location.pathname === '/' ||
  window.location.pathname.endsWith('/index')
) {
  sidebarPath = 'pages/extras/sidebar.html'; // Caminho relativo para index
} else {
  sidebarPath = '../pages/extras/sidebar.html'; // Caminho relativo para páginas dentro de /pages
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
      document.querySelector('#sidebar a[href="../index.html"]').setAttribute('href', 'index.html');
      document.querySelector('#sidebar a[href="cps.html"]').setAttribute('href', 'pages/cps.html');
      document.querySelector('#sidebar a[href="cms.html"]').setAttribute('href', 'pages/cms.html');
      document.querySelector('#sidebar a[href="registros.html"]').setAttribute('href', 'pages/registros.html');
      document.querySelector('#sidebar a[href="indexDB.html"]').setAttribute('href', 'pages/indexDB.html');
      document.querySelector('#sidebar a[href="gestaoAprovacoes.html"]').setAttribute('href', 'pages/gestaoAprovacoes.html');
    }

    const toggleButton = document.getElementById('menu-toggle'); // Botão para abrir/fechar o menu
    const sidebar = document.getElementById('sidebar'); // Container da sidebar

    // Adiciona evento de clique no botão para abrir/fechar a sidebar
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Impede que o clique se propague e dispare o evento de "fechar ao clicar fora"
      sidebar.classList.toggle('active'); // Alterna a classe "active" para mostrar/ocultar a sidebar
      toggleButton.classList.toggle('active');
    });

    // Fecha a sidebar automaticamente ao clicar fora dela
    document.addEventListener('click', (e) => {
      const isClickInsideSidebar = sidebar.contains(e.target); // Verifica se clicou dentro da sidebar
      const isClickToggle = toggleButton.contains(e.target);   // Verifica se clicou no botão de toggle

      // Se clicou fora tanto da sidebar quanto do botão, fecha a sidebar
      if (!isClickInsideSidebar && !isClickToggle) {
        sidebar.classList.remove('active');
        toggleButton.classList.remove('active');
      }
    });
  });
