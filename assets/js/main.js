// Parker Healthcare Allocation Lab — JS

// NCBI API key helper (injected by Jekyll from _data/api_keys.yml)
function pubmedApiParam() {
  return (typeof NCBI_API_KEY !== 'undefined' && NCBI_API_KEY) ? '&api_key=' + NCBI_API_KEY : '';
}

// --- GitHub Auth (Lab Resources) ---
var AUTH_PROXY = 'https://hca-cms-oauth.wparker.workers.dev';
var AUTH_KEYS = {
  token: 'hca_github_token',
  username: 'hca_github_username',
  avatar: 'hca_github_avatar'
};

function getAuthState() {
  var token = localStorage.getItem(AUTH_KEYS.token);
  if (!token) return null;
  return {
    token: token,
    username: localStorage.getItem(AUTH_KEYS.username) || '',
    avatar: localStorage.getItem(AUTH_KEYS.avatar) || ''
  };
}

function setAuthState(token, username, avatar) {
  localStorage.setItem(AUTH_KEYS.token, token);
  localStorage.setItem(AUTH_KEYS.username, username);
  localStorage.setItem(AUTH_KEYS.avatar, avatar);
}

function clearAuthState() {
  localStorage.removeItem(AUTH_KEYS.token);
  localStorage.removeItem(AUTH_KEYS.username);
  localStorage.removeItem(AUTH_KEYS.avatar);
}

function loginRedirect() {
  window.location.href = AUTH_PROXY + '/auth?site_login=true';
}

function initAuthUI() {
  // Parse hash fragment on callback return (token comes in #auth_token=...&username=...&avatar=...)
  if (window.location.hash && window.location.hash.indexOf('auth_token=') !== -1) {
    var hashParams = new URLSearchParams(window.location.hash.substring(1));
    var authToken = hashParams.get('auth_token');
    var username = hashParams.get('username');
    var avatar = hashParams.get('avatar');
    if (authToken) {
      setAuthState(authToken, username || '', avatar || '');
      // Clear hash from URL without triggering navigation
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // Parse query params for auth errors
  var urlParams = new URLSearchParams(window.location.search);
  var authError = urlParams.get('auth_error');
  if (authError) {
    var errorEl = document.getElementById('auth-error');
    if (errorEl) {
      var msg = 'Login failed.';
      if (authError === 'not_member') {
        msg = 'Access denied. You must be a member of the Healthcare-Allocation-Lab GitHub organization.';
      } else if (authError === 'github_api') {
        msg = 'Could not verify your GitHub account. Please try again.';
      } else if (authError === 'server_error') {
        msg = 'An unexpected error occurred. Please try again.';
      }
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
    // Clean error from URL
    history.replaceState(null, '', window.location.pathname);
  }

  var auth = getAuthState();
  var loginBtn = document.getElementById('nav-login-btn');
  var userMenu = document.getElementById('nav-user-menu');
  var resourcesLink = document.getElementById('nav-resources-link');

  if (auth) {
    // Logged in
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      var avatarImg = document.getElementById('nav-user-avatar');
      var nameSpan = document.getElementById('nav-user-name');
      if (avatarImg) avatarImg.src = auth.avatar;
      if (nameSpan) nameSpan.textContent = auth.username;
    }
    if (resourcesLink) resourcesLink.style.display = '';

    // Gate resources page content
    var resourcesLogin = document.getElementById('resources-login');
    var resourcesContent = document.getElementById('resources-content');
    if (resourcesLogin) resourcesLogin.style.display = 'none';
    if (resourcesContent) resourcesContent.style.display = '';

    // Validate token on resources page
    if (document.getElementById('resources-content')) {
      validateToken(auth.token);
    }
  } else {
    // Logged out
    if (loginBtn) loginBtn.style.display = '';
    if (userMenu) userMenu.style.display = 'none';
    if (resourcesLink) resourcesLink.style.display = 'none';

    // Gate resources page content
    var resourcesLogin2 = document.getElementById('resources-login');
    var resourcesContent2 = document.getElementById('resources-content');
    if (resourcesLogin2) resourcesLogin2.style.display = '';
    if (resourcesContent2) resourcesContent2.style.display = 'none';
  }

  // Bind login button
  if (loginBtn) {
    loginBtn.addEventListener('click', loginRedirect);
  }

  // Bind resources page login button
  var resourcesLoginBtn = document.getElementById('resources-login-btn');
  if (resourcesLoginBtn) {
    resourcesLoginBtn.addEventListener('click', loginRedirect);
  }

  // Bind logout button
  var logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      clearAuthState();
      window.location.reload();
    });
  }
}

function validateToken(token) {
  fetch('https://api.github.com/user', {
    headers: { Authorization: 'Bearer ' + token }
  }).then(function (res) {
    if (!res.ok) {
      clearAuthState();
      window.location.reload();
    }
  }).catch(function () {
    // Network error — don't clear, user may be offline
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // GitHub auth UI
  initAuthUI();

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Alumni section expand/collapse
  var alumniBtn = document.querySelector('.alumni-toggle');
  var alumniList = document.querySelector('.alumni-list');
  if (alumniBtn && alumniList) {
    alumniBtn.addEventListener('click', function () {
      alumniList.classList.toggle('show');
      alumniBtn.classList.toggle('open');
      var expanded = alumniList.classList.contains('show');
      alumniBtn.setAttribute('aria-expanded', expanded);
      alumniBtn.querySelector('.arrow').textContent = expanded ? '\u25BC' : '\u25B6';
    });
  }

  // Spotlight image lightbox
  initSpotlightLightbox();

  // PubMed Publications Widget (homepage + research page)
  var widget = document.getElementById('pubmed-widget');
  if (widget) {
    initPubMed();
  }

  // Member profile publications (cached Parker WF set, filtered by member)
  var memberPubs = document.getElementById('member-pubs');
  if (memberPubs && memberPubs.dataset.pubmedName) {
    initMemberPubSearch(memberPubs);
  }
});

// --- Spotlight Image Lightbox ---
function initSpotlightLightbox() {
  var images = document.querySelectorAll('.research-spotlight-image');
  if (images.length === 0) return;

  // Create lightbox element once
  var lightbox = document.createElement('div');
  lightbox.className = 'spotlight-lightbox';
  lightbox.innerHTML = '<button class="spotlight-lightbox-close" aria-label="Close">&times;</button><img src="" alt="">';
  document.body.appendChild(lightbox);

  var lbImg = lightbox.querySelector('img');

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt;
    lightbox.classList.add('open');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
  }

  images.forEach(function (img) {
    img.addEventListener('click', function (e) {
      e.stopPropagation();
      openLightbox(img.src, img.alt);
    });
  });

  lightbox.addEventListener('click', closeLightbox);
  lbImg.addEventListener('click', function (e) { e.stopPropagation(); closeLightbox(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
}

// --- Shared: render a PubMed article as HTML list item ---
function renderPubItem(a, uid) {
  var authors = (a.authors || []).map(function (au) { return au.name; }).join(', ');
  var year = (a.pubdate || '').substring(0, 4);
  var doi = '';
  if (a.elocationid && a.elocationid.indexOf('doi:') === 0) {
    doi = a.elocationid.substring(4).trim();
  } else {
    (a.articleids || []).forEach(function (aid) {
      if (aid.idtype === 'doi') doi = aid.value;
    });
  }
  var link = doi
    ? 'https://doi.org/' + doi
    : 'https://pubmed.ncbi.nlm.nih.gov/' + uid + '/';
  var cite = a.fulljournalname || a.source || '';
  if (year) cite += '. ' + year;
  if (a.volume) {
    cite += '; ' + a.volume;
    if (a.issue) cite += '(' + a.issue + ')';
  }
  if (a.pages) cite += ': ' + a.pages;
  return '<li class="pubmed-item">'
    + '<div class="pubmed-item-title"><a href="' + link + '" target="_blank" rel="noopener">' + (a.title || '') + '</a></div>'
    + '<div class="pubmed-item-authors">' + authors + '</div>'
    + '<div class="pubmed-item-journal">' + cite + '</div>'
    + '</li>';
}

// --- PubMed E-utilities Integration (main widget) ---
function initPubMed() {
  var PER_PAGE = 10;
  var currentPage = 1;
  var allArticles = [];
  var filteredArticles = [];

  var resultsEl = document.getElementById('pubmed-results');
  var countEl = document.getElementById('pubmed-count');
  var paginationEl = document.getElementById('pubmed-pagination');
  var filterInput = document.getElementById('pubmed-filter');
  var yearSelect = document.getElementById('pubmed-year-filter');

  // Step 1: Search PubMed for author
  var searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
    + '?db=pubmed&retmode=json&retmax=200&sort=pub_date'
    + '&term=Parker+WF%5BAuthor%5D+AND+%28%22University+of+Chicago%22%5BAffiliation%5D'
    + '+OR+allocation+OR+transplant+OR+organ+OR+ventilator+OR+CLIF+OR+SOFA%29'
    + pubmedApiParam();

  fetch(searchUrl)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var ids = data.esearchresult.idlist;
      if (!ids || ids.length === 0) {
        resultsEl.innerHTML = '<p style="color:var(--text-light);">No publications found.</p>';
        return;
      }
      // Step 2: Fetch summaries
      var summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'
        + '?db=pubmed&retmode=json&id=' + ids.join(',')
        + pubmedApiParam();
      return fetch(summaryUrl);
    })
    .then(function (r) { return r ? r.json() : null; })
    .then(function (data) {
      if (!data) return;
      var uids = data.result.uids;
      allArticles = uids.map(function (uid) {
        var a = data.result[uid];
        var authors = (a.authors || []).map(function (au) { return au.name; }).join(', ');
        var year = (a.pubdate || '').substring(0, 4);
        var doi = '';
        if (a.elocationid && a.elocationid.indexOf('doi:') === 0) {
          doi = a.elocationid.substring(4).trim();
        } else {
          (a.articleids || []).forEach(function (aid) {
            if (aid.idtype === 'doi') doi = aid.value;
          });
        }
        return {
          uid: uid,
          title: a.title || '',
          authors: authors,
          journal: a.fulljournalname || a.source || '',
          year: year,
          volume: a.volume || '',
          issue: a.issue || '',
          pages: a.pages || '',
          doi: doi
        };
      });

      // Populate year filter
      var years = {};
      allArticles.forEach(function (a) { if (a.year) years[a.year] = true; });
      Object.keys(years).sort().reverse().forEach(function (y) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
      });

      applyFilter();
    })
    .catch(function () {
      resultsEl.innerHTML = '<p style="color:var(--text-light);">Could not load publications. Visit <a href="https://scholar.google.com/citations?user=jaBF4DEAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a> for the full list.</p>';
    });

  // Filter and render
  function applyFilter() {
    var q = (filterInput.value || '').toLowerCase();
    var yr = yearSelect.value;
    filteredArticles = allArticles.filter(function (a) {
      if (yr && a.year !== yr) return false;
      if (q) {
        var text = (a.title + ' ' + a.authors + ' ' + a.journal).toLowerCase();
        return text.indexOf(q) !== -1;
      }
      return true;
    });
    currentPage = 1;
    render();
  }

  function render() {
    var total = filteredArticles.length;
    var totalPages = Math.ceil(total / PER_PAGE);
    var start = (currentPage - 1) * PER_PAGE;
    var page = filteredArticles.slice(start, start + PER_PAGE);

    countEl.textContent = total + ' publication' + (total !== 1 ? 's' : '') + ' found';

    if (page.length === 0) {
      resultsEl.innerHTML = '<p style="color:var(--text-light); padding:16px 0;">No matching publications.</p>';
      paginationEl.innerHTML = '';
      return;
    }

    var html = '<ul class="pubmed-list">';
    page.forEach(function (a) {
      var link = a.doi
        ? 'https://doi.org/' + a.doi
        : 'https://pubmed.ncbi.nlm.nih.gov/' + a.uid + '/';
      var cite = a.journal;
      if (a.year) cite += '. ' + a.year;
      if (a.volume) {
        cite += '; ' + a.volume;
        if (a.issue) cite += '(' + a.issue + ')';
      }
      if (a.pages) cite += ': ' + a.pages;
      html += '<li class="pubmed-item">'
        + '<div class="pubmed-item-title"><a href="' + link + '" target="_blank" rel="noopener">' + a.title + '</a></div>'
        + '<div class="pubmed-item-authors">' + a.authors + '</div>'
        + '<div class="pubmed-item-journal">' + cite + '</div>'
        + '</li>';
    });
    html += '</ul>';
    resultsEl.innerHTML = html;

    // Pagination
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }
    var pHtml = '';
    if (currentPage > 1) {
      pHtml += '<button data-page="' + (currentPage - 1) + '">&laquo; Prev</button>';
    }
    var startP = Math.max(1, currentPage - 3);
    var endP = Math.min(totalPages, currentPage + 3);
    for (var i = startP; i <= endP; i++) {
      pHtml += '<button data-page="' + i + '"' + (i === currentPage ? ' class="active"' : '') + '>' + i + '</button>';
    }
    if (currentPage < totalPages) {
      pHtml += '<button data-page="' + (currentPage + 1) + '">Next &raquo;</button>';
    }
    paginationEl.innerHTML = pHtml;
  }

  // Event listeners
  filterInput.addEventListener('input', debounce(applyFilter, 300));
  yearSelect.addEventListener('change', applyFilter);
  paginationEl.addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.page) {
      currentPage = parseInt(e.target.dataset.page, 10);
      render();
      document.getElementById('pubmed-widget').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }
}

// --- Member Profile Publications (cached Parker WF set, filtered per member) ---
// Fetches Parker WF's full publication set once, caches in sessionStorage,
// then filters by author name matching for each member profile.

var PARKER_PUBS_CACHE_KEY = 'parkerWF_pubs_v1';

function getParkerPubs() {
  // Return cached data if available
  var cached = sessionStorage.getItem(PARKER_PUBS_CACHE_KEY);
  if (cached) {
    return Promise.resolve(JSON.parse(cached));
  }

  var searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
    + '?db=pubmed&retmode=json&retmax=200&sort=pub_date'
    + '&term=Parker+WF%5BAuthor%5D+AND+%28%22University+of+Chicago%22%5BAffiliation%5D'
    + '+OR+allocation+OR+transplant+OR+organ+OR+ventilator+OR+CLIF+OR+SOFA%29'
    + pubmedApiParam();

  return fetch(searchUrl)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var ids = data.esearchresult.idlist;
      if (!ids || ids.length === 0) return [];
      var summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'
        + '?db=pubmed&retmode=json&id=' + ids.join(',')
        + pubmedApiParam();
      return fetch(summaryUrl)
        .then(function (r) { return r.json(); })
        .then(function (sumData) {
          var uids = sumData.result.uids;
          var articles = uids.map(function (uid) {
            var a = sumData.result[uid];
            a._uid = uid;
            return a;
          });
          // Cache in sessionStorage
          try { sessionStorage.setItem(PARKER_PUBS_CACHE_KEY, JSON.stringify(articles)); } catch (e) {}
          return articles;
        });
    });
}

// Check if a member's name appears in an article's author list.
// Uses exact match on pubmed_name, with last-name + first-initial fallback.
function matchMemberInAuthors(article, pubmedName) {
  var authors = article.authors || [];
  var nameLower = pubmedName.toLowerCase();
  // Parse last name and first initial from pubmed_name (e.g. "White MH" → "white", "m")
  var parts = pubmedName.split(/\s+/);
  var lastName = (parts[0] || '').toLowerCase();
  var firstInitial = (parts[1] || '').charAt(0).toLowerCase();

  for (var i = 0; i < authors.length; i++) {
    var aName = authors[i].name || '';
    // Exact match
    if (aName.toLowerCase() === nameLower) return true;
    // Fallback: last name + first initial (catches "White M" vs "White MH")
    if (firstInitial && lastName) {
      var aParts = aName.split(/\s+/);
      var aLast = (aParts[0] || '').toLowerCase();
      var aFirstInit = (aParts[1] || '').charAt(0).toLowerCase();
      if (aLast === lastName && aFirstInit === firstInitial) return true;
    }
  }
  return false;
}

function initMemberPubSearch(container) {
  var pubmedName = container.dataset.pubmedName;
  if (!pubmedName) return;

  var isPI = (pubmedName === 'Parker WF');

  getParkerPubs()
    .then(function (articles) {
      if (!articles || articles.length === 0) {
        container.innerHTML = '<p style="color:var(--text-light);">No publications found.</p>';
        return;
      }

      // PI profile: show all publications
      // Member profile: filter to papers where member is a co-author
      var matches = isPI ? articles : articles.filter(function (a) {
        return matchMemberInAuthors(a, pubmedName);
      });

      if (matches.length === 0) {
        container.innerHTML = '<p style="color:var(--text-light);">No lab publications found on PubMed.</p>';
        return;
      }

      var html = '<ul class="pubmed-list">';
      matches.forEach(function (a) {
        html += renderPubItem(a, a._uid);
      });
      html += '</ul>';
      container.innerHTML = html;
    })
    .catch(function () {
      container.innerHTML = '<p style="color:var(--text-light);">Could not load publications.</p>';
    });
}
