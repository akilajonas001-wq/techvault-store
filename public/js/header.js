/* ===========================================
   HEADER GLOBAL - TechVault
   Busca, dropdown de categorias e menu mobile
   Carregado em todas as páginas da loja
   =========================================== */
(function () {
  'use strict';

  if (typeof searchProducts !== 'function') {
    window.searchProducts = function () {
      const input = document.getElementById('searchInput');
      if (!input) return;
      const q = input.value.trim();
      window.location.href = q ? '/busca?q=' + encodeURIComponent(q) : '/busca';
    };
  }

  if (typeof mobileSearch !== 'function') {
    window.mobileSearch = function () {
      const input = document.getElementById('mobileSearchInput');
      if (!input) return;
      const q = input.value.trim();
      if (q) window.location.href = '/busca?q=' + encodeURIComponent(q);
    };
  }

  window.toggleCategoriesMenu = function (event) {
    if (event) event.stopPropagation();
    const dd = document.getElementById('categoriesDropdown');
    if (!dd) return;
    const willOpen = !dd.classList.contains('open');
    document.querySelectorAll('.header-new .dropdown.open').forEach(function (d) {
      d.classList.remove('open');
    });
    if (willOpen) {
      dd.classList.add('open');
      const toggle = dd.querySelector('.dropdown-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
  };

  window.closeCategoriesMenu = function () {
    const dd = document.getElementById('categoriesDropdown');
    if (!dd) return;
    dd.classList.remove('open');
    const toggle = dd.querySelector('.dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  };

  const CATEGORY_ICONS = {
    'Celulares e Smartphones': 'fa-mobile-alt',
    'Informática': 'fa-laptop',
    'Moda e Vestuário': 'fa-tshirt',
    'Acessórios e Moda': 'fa-tshirt',
    'Esportes e Fitness': 'fa-football-ball',
    'Casa e Decoração': 'fa-couch',
    'Casa e Organização': 'fa-couch',
    'Cozinha e Utensílios': 'fa-utensils',
    'Livros e Papelaria': 'fa-book',
    'Escritório e Papelaria': 'fa-pen',
    'Eletrônicos': 'fa-tv',
    'Beleza e Perfumaria': 'fa-pump-soap',
    'Beleza e Bem-Estar': 'fa-pump-soap',
    'Móveis': 'fa-chair',
    'Games': 'fa-gamepad',
    'Eletrodomésticos': 'fa-blender',
    'Ferramentas': 'fa-tools',
    'Pets': 'fa-paw',
    'Diversos': 'fa-store'
  };

  function categoryIcon(cat) {
    return CATEGORY_ICONS[cat] || 'fa-store';
  }

  function loadHeaderCategories() {
    const menu = document.getElementById('categoriesMenu');
    const mobile = document.getElementById('mobileCategoriesLinks');
    if (!menu && !mobile) return;

    const fallback = '<a class="dropdown-all" href="/busca"><i class="fas fa-store"></i> Ver todos os produtos</a>';

    fetch('/api/categories')
      .then(function (r) { return r.json(); })
      .then(function (cats) {
        if (!Array.isArray(cats)) cats = [];

        if (menu) {
          if (!cats.length) { menu.innerHTML = fallback; return; }
          menu.innerHTML = cats.map(function (c) {
            return '<a href="/busca?categoria=' + encodeURIComponent(c) + '"><i class="fas ' + categoryIcon(c) + '"></i>' + escapeHtml(c) + '</a>';
          }).join('') + '<div class="dropdown-divider"></div>' + fallback;
        }

        if (mobile && cats.length) {
          mobile.innerHTML = '<div class="mobile-nav-cat-title"><i class="fas fa-th-large"></i> Categorias</div>' +
            cats.map(function (c) {
              return '<a href="/busca?categoria=' + encodeURIComponent(c) + '" onclick="toggleMobileMenu()"><i class="fas ' + categoryIcon(c) + '"></i>' + escapeHtml(c) + '</a>';
            }).join('');
        }
      })
      .catch(function () {
        if (menu) menu.innerHTML = fallback;
      });
  }

  document.addEventListener('click', function (e) {
    const dd = document.getElementById('categoriesDropdown');
    if (dd && dd.classList.contains('open') && !dd.contains(e.target)) {
      closeCategoriesMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCategoriesMenu();
  });

  window.addEventListener('scroll', function () {
    if (window.scrollY > 10) closeCategoriesMenu();
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function () {
    loadHeaderCategories();

    const search = document.getElementById('searchInput');
    if (search) {
      search.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') window.searchProducts();
      });
    }

    const msearch = document.getElementById('mobileSearchInput');
    if (msearch) {
      msearch.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') window.mobileSearch();
      });
    }
  });
})();
