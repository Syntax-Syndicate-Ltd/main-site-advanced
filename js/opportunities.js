/* ================================================================
   SYNTAX SYNDICATE — OPPORTUNITIES MODULE
   State Management · Multi-Collection Logic · Ad System
   ================================================================ */

// DB and Auth are accessed from the global window scope

const state = {
  allPosts: [],
  filteredPosts: [],
  ads: [],
  category: 'all',
  searchQuery: '',
  location: '',
  experience: '',
  loading: true
};

const UI = {
  grid: document.getElementById('oppGrid'),
  tabs: document.querySelectorAll('.opp-tab'),
  searchInput: document.getElementById('searchInput'),
  filterToggleBtn: document.getElementById('filter-toggle-btn'),
  filterPanel: document.getElementById('filter-panel'),
  filterBadge: document.getElementById('filter-badge'),
  resultCount: document.getElementById('result-count'),
  filterResultCount: document.getElementById('filter-count'),
  adBanner: document.getElementById('ad-banner'),
  filters: {
    location: document.getElementById('filterLocation'),
    experience: document.getElementById('filterExperience')
  }
};

async function init() {
  renderSkeletons();
  setupEventListeners();
  handleUrlParams();
  await Promise.all([loadData(), loadAds()]);
  updateTabCounts();
  renderTopAd();
}

async function loadData() {
  state.loading = true;
  try {
    state.allPosts = await DB.fetchAllOpportunities();
    applyFilters();
  } catch (err) {
    console.error('Failed to load opportunities:', err);
    UI.grid.innerHTML = '<div class="empty-state"><h3>Failed to load opportunities</h3><p>Please try again later.</p></div>';
  } finally {
    state.loading = false;
  }
}

async function loadAds() {
  try {
    state.ads = await DB.getDocs('ss_ads');
  } catch (err) {
    console.error('Failed to load ads:', err);
  }
}

function setupEventListeners() {
  UI.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      UI.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.category = tab.dataset.cat;
      
      const url = new URL(window.location);
      url.searchParams.set('cat', state.category);
      window.history.pushState({}, '', url);
      applyFilters();
    });
  });

  UI.searchInput?.addEventListener('input', SS.debounce(() => {
    state.searchQuery = UI.searchInput.value.toLowerCase();
    applyFilters();
  }, 300));

  UI.filters.location?.addEventListener('change', () => {
    state.location = UI.filters.location.value;
    applyFilters();
  });

  UI.filters.experience?.addEventListener('change', () => {
    state.experience = UI.filters.experience.value;
    applyFilters();
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    UI.searchInput.value = '';
    UI.filters.location.value = '';
    UI.filters.experience.value = '';
    state.searchQuery = '';
    state.location = '';
    state.experience = '';
    applyFilters();
  });

  UI.filterToggleBtn?.addEventListener('click', () => {
    const isOpen = UI.filterPanel.classList.toggle('open');
    UI.filterToggleBtn.classList.toggle('open', isOpen);
    UI.filterToggleBtn.classList.toggle('active', isOpen);
  });
}

function handleUrlParams() {
  const cat = SS.getQueryParam('cat');
  if (cat) {
    const tab = Array.from(UI.tabs).find(t => t.dataset.cat === cat);
    if (tab) {
      UI.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.category = cat;
    }
  }
}

function updateTabCounts() {
  const counts = { all: state.allPosts.length };
  state.allPosts.forEach(p => {
    counts[p._collection] = (counts[p._collection] || 0) + 1;
  });

  Object.entries(counts).forEach(([id, num]) => {
    const el = document.getElementById(`tab-count-${id.replace('ss_', '') || id}`);
    if (el) el.textContent = num;
  });
}

function applyFilters() {
  state.filteredPosts = state.allPosts.filter(post => {
    const matchesCat = state.category === 'all' || post._collection === state.category;
    const matchesSearch = (post.title || '').toLowerCase().includes(state.searchQuery) ||
                          (post.company || post.organizer || '').toLowerCase().includes(state.searchQuery);
    const matchesLoc = !state.location || (post.location || '').includes(state.location);
    const matchesExp = !state.experience || (post.experienceLevel || '') === state.experience;

    return matchesCat && matchesSearch && matchesLoc && matchesExp;
  });

  const filterCount = [state.searchQuery, state.location, state.experience].filter(Boolean).length;
  if (UI.filterBadge) {
    UI.filterBadge.textContent = filterCount;
    UI.filterBadge.classList.toggle('show', filterCount > 0);
  }

  if (UI.resultCount) UI.resultCount.textContent = `${state.filteredPosts.length} results`;
  if (UI.filterResultCount) UI.filterResultCount.textContent = `${state.filteredPosts.length} found`;

  render();
}

function renderTopAd() {
  const topAds = state.ads.filter(a => a.placement === 'top');
  if (topAds.length === 0) {
    UI.adBanner?.classList.add('hidden');
    return;
  }

  const ad = topAds[Math.floor(Math.random() * topAds.length)];
  UI.adBanner.innerHTML = `
    <div class="ad-banner-img-wrap">
      ${ad.imagePath ? `<img src="${ad.imagePath}" alt="${ad.title}">` : '<i class="bi bi-megaphone"></i>'}
    </div>
    <div class="ad-banner-info">
      <div class="ad-banner-title">${ad.title}</div>
      <div class="ad-banner-sub">Sponsored • ${ad.platform || 'Partner'}</div>
    </div>
    <div class="ad-banner-label">AD</div>
    <button class="filter-toggle-btn active" style="margin-left:auto; border-radius:6px; font-size:12px;" onclick="window.open('${ad.redirectLink}','_blank')">Learn More</button>
  `;
  UI.adBanner.classList.remove('hidden');
}

function render() {
  if (!UI.grid) return;
  if (state.filteredPosts.length === 0) {
    UI.grid.innerHTML = '<div class="empty-state"><i class="bi bi-search"></i><h3>No matches found</h3><p>Try adjusting your search or filters.</p></div>';
    return;
  }
  UI.grid.innerHTML = state.filteredPosts.map(post => renderCard(post)).join('');
}

function renderCard(post) {
  const cfg = Auth.CATEGORY_CONFIG[post._collection] || { label: 'Explore', badgeClass: 'badge-jobs', emoji: '⚡' };
  const time = SS.formatDateRelative(post.postedAt);
  const company = post.company || post.organizer || post.platform || 'Verified Partner';
  const loc = post.location || post.venue || 'Remote / Hybrid';
  const image = post.imagePath || '';

  return `
    <a href="details.html?id=${post.id}&col=${post._collection}" class="opp-card">
      <div class="opp-card-img">
        ${image ? `<img src="${image}" alt="${post.title}" onerror="this.outerHTML='<span class=\'opp-card-emoji\'>${cfg.emoji || '⚡'}</span>'">` : `<span class="opp-card-emoji">${cfg.emoji || '⚡'}</span>`}
      </div>
      <div class="opp-card-body">
        <div class="opp-card-header-row">
          <span class="badge ${cfg.badgeClass}">${cfg.label}</span>
          <span class="opp-card-time">${time}</span>
        </div>
        <h3 class="opp-card-title">${SS.truncateText(post.title, 60)}</h3>
        <div class="opp-card-company">
          <i class="bi bi-building"></i>
          <span>${company}</span>
        </div>
        <div class="opp-card-tags">
          <span class="opp-card-tag"><i class="bi bi-geo-alt"></i> ${loc}</span>
          ${post.experienceLevel ? `<span class="opp-card-tag"><i class="bi bi-bar-chart"></i> ${post.experienceLevel}</span>` : ''}
          ${post.duration ? `<span class="opp-card-tag"><i class="bi bi-clock"></i> ${post.duration}</span>` : ''}
          ${post.prizePool ? `<span class="opp-card-tag"><i class="bi bi-trophy"></i> ${post.prizePool}</span>` : ''}
        </div>
        <p class="opp-card-desc">${SS.truncateText(post.description || 'No description provided.', 110)}</p>
      </div>
      <div class="opp-card-footer">
        <span style="font-size:11px; color:var(--opp-text3); text-transform:uppercase; font-weight:700;">${post._collection.replace('ss_', '')}</span>
        <span style="color:var(--opp-primary); font-weight:700; font-size:13px;">View Details <i class="bi bi-arrow-right"></i></span>
      </div>
    </a>
  `;
}

function renderSkeletons() {
  UI.grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton">
      <div class="skel-img"></div>
      <div class="skel-body">
        <div class="skel-line xs"></div>
        <div class="skel-line"></div>
        <div class="skel-line s"></div>
      </div>
    </div>
  `).join('');
}

init();
