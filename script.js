const icons = {
  chart: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/></svg>',
  boxes: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  settings: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.4.5.75.9 1 .32.2.7.3 1.1.3h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-2 1Z"/></svg>',
  calculator: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>',
  shield: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>',
  book: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/></svg>',
  compare: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3v18M16 3v18"/><path d="M3 8h10M11 16h10"/></svg>',
  bookmark: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>'
};

const pillars = [
  { title: 'Practical', body: 'Tools should solve real business, academic, and operational problems.', icon: 'calculator' },
  { title: 'Accessible', body: 'No specialist software or complicated setup should be required.', icon: 'settings' },
  { title: 'Transparent', body: 'Show formulas, assumptions, explanations, and calculation logic where appropriate.', icon: 'book' },
  { title: 'Decision-Focused', body: 'Results should provide useful interpretation, not only a number.', icon: 'chart' }
];

const problems = [
  {
    title: 'How much stock should I order?',
    detail: 'Recommended method: EOQ Calculator',
    href: '#tools'
  },
  {
    title: 'Which inventory items need the most control?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'How can I forecast seasonal demand?',
    detail: 'Recommended tool: Exponential Smoothing',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html'
  },
  {
    title: 'Which supplier presents the highest risk?',
    detail: 'Recommended tool: Kraljic Matrix',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html'
  },
  {
    title: 'Is this investment financially viable?',
    detail: 'Recommended category: Finance',
    href: '#categories'
  },
  {
    title: 'How capable is my manufacturing process?',
    detail: 'Recommended category: Quality and Engineering',
    href: '#categories'
  },
  {
    title: 'How can I plan project tasks over time?',
    detail: 'Recommended tool: Gantt Chart Planner',
    href: 'Gantt%20Chart/Gantt_Chart.html'
  }
];

const categories = [
  { title: 'Inventory and Supply Chain', benefit: 'Optimize stock, service levels, purchasing, and supplier decisions.', count: 'Tool count placeholder', icon: 'boxes' },
  { title: 'Forecasting', benefit: 'Identify trends, seasonality, and future demand.', count: 'Tool count placeholder', icon: 'chart' },
  { title: 'Operations', benefit: 'Evaluate capacity, productivity, queues, and process performance.', count: 'Tool count placeholder', icon: 'settings' },
  { title: 'Statistics', benefit: 'Analyze relationships, distributions, samples, and uncertainty.', count: 'Tool count placeholder', icon: 'compare' },
  { title: 'Finance', benefit: 'Assess investments, costs, returns, and business viability.', count: 'Tool count placeholder', icon: 'calculator' },
  { title: 'Quality and Engineering', benefit: 'Measure process capability, reliability, variation, and performance.', count: 'Tool count placeholder', icon: 'shield' },
  { title: 'Project Management', benefit: 'Plan schedules, resources, risk, and project economics.', count: 'Tool count placeholder', icon: 'settings' },
  { title: 'Business Analysis', benefit: 'Compare scenarios and support strategic decisions.', count: 'Tool count placeholder', icon: 'chart' }
];

const tools = [
  {
    name: 'ABC Analysis',
    description: 'Classify inventory items according to their contribution to total consumption value.',
    category: 'Inventory Management',
    input: 'Item demand, unit cost, annual usage',
    output: 'Classification table and Pareto chart',
    cta: 'Open ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    name: 'EOQ Calculator',
    description: 'Estimate the order quantity that balances ordering and holding costs.',
    category: 'Inventory Management',
    input: 'Demand, order cost, holding cost',
    output: 'Recommended order quantity'
  },
  {
    name: 'Safety Stock Calculator',
    description: 'Estimate reserve stock needed to protect service levels under uncertainty.',
    category: 'Supply Chain',
    input: 'Demand variability, lead time, service level',
    output: 'Safety stock recommendation'
  },
  {
    name: 'Reorder Point Calculator',
    description: 'Calculate when replenishment should be triggered based on demand and lead time.',
    category: 'Inventory Management',
    input: 'Lead time demand and safety stock',
    output: 'Reorder point threshold'
  },
  {
    name: 'Demand Forecasting',
    description: 'Create practical demand forecasts from historical patterns.',
    category: 'Forecasting',
    input: 'Historical demand series',
    output: 'Forecast values and trend view'
  },
  {
    name: 'Holt-Winters Forecasting',
    description: 'Forecast demand with trend and seasonality using exponential smoothing.',
    category: 'Forecasting',
    input: 'Seasonal time series',
    output: 'Seasonal forecast and parameters',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html'
  },
  {
    name: 'Kraljic Matrix',
    description: 'Segment suppliers and purchases by supply risk and profit impact.',
    category: 'Procurement',
    input: 'Risk and impact ratings',
    output: 'Portfolio quadrant and strategy',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html'
  },
  {
    name: 'Break-Even Analysis',
    description: 'Find the volume or revenue needed to cover fixed and variable costs.',
    category: 'Finance',
    input: 'Price, fixed cost, variable cost',
    output: 'Break-even quantity and margin'
  },
  {
    name: 'Gantt Chart Planner',
    description: 'Plan task dates, progress, and milestones on a project timeline.',
    category: 'Project Management',
    input: 'Tasks, dates, progress, milestones',
    output: 'Gantt timeline and JSON plan export',
    href: 'Gantt%20Chart/Gantt_Chart.html'
  }
];

const trust = [
  { title: 'Method Notes', body: 'Each tool is being built with plain-language guidance on what the method does, when to use it, and how to read the result.', icon: 'book' },
  { title: 'Browser-Based Work', body: 'Current tools run in the browser, so typical calculations can be completed without installing specialist software.', icon: 'shield' },
  { title: 'Useful Outputs', body: 'Results are shown as practical tables, charts, summaries, or classifications so users can act on more than a single number.', icon: 'chart' },
  { title: 'Room to Improve', body: 'Formula notes, assumptions, limitations, and examples will continue to be expanded as the tool library matures.', icon: 'settings' }
];

const learning = [
  { title: 'Guides', body: 'Clear method introductions that explain when and why to use each analytical approach.', icon: 'book' },
  { title: 'Worked Examples', body: 'Step-by-step examples that connect formulas to real operating decisions.', icon: 'calculator' },
  { title: 'Method Comparisons', body: 'Side-by-side comparisons that help users choose the right technique.', icon: 'compare' }
];

const roadmap = [
  { title: 'Available Now', body: 'Core supply chain and inventory tools.' },
  { title: 'Expanding', body: 'Forecasting, statistics, finance, operations, and engineering tools.' },
  { title: 'Future Vision', body: 'Saved analyses, comparison workspaces, reusable templates, and collaborative decision support.' }
];

const searchItems = [
  ...tools.map((tool) => ({
    title: tool.name,
    detail: `${tool.category} • ${tool.output}`,
    href: tool.href || '#tools'
  })),
  ...categories.map((category) => ({ title: category.title, detail: category.benefit, href: '#categories' })),
  ...problems.map((problem) => ({ title: problem.title, detail: problem.detail, href: problem.href })),
  { title: 'EOQ', detail: 'Economic order quantity method', href: '#tools' },
  { title: 'Exponential Smoothing', detail: 'Forecasting • Simple, Holt, and Holt-Winters smoothing', href: 'Exponential%20Smoothing/Exponential_Smoothing.html' },
  { title: 'Regression', detail: 'Statistical relationship analysis', href: '#tools' },
  { title: 'NPV', detail: 'Investment viability method', href: '#tools' }
];

function renderCards(selector, items, template) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = items.map(template).join('');
}

function initRenderedContent() {
  renderCards('[data-render="pillars"]', pillars, (item) => `
    <article class="pillar-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);

  renderCards('[data-render="problems"]', problems, (problem) => `
    <button type="button" data-problem="${problem.title}">${problem.title}</button>
  `);

  renderCards('[data-render="categories"]', categories, (item) => `
    <article class="category-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <span class="card-meta">${item.count}</span>
      <p>${item.benefit}</p>
      <a class="card-link" href="#tools" aria-label="Explore ${item.title} category">Explore category</a>
    </article>
  `);

  renderCards('[data-render="tools"]', tools, (tool) => `
    <article class="tool-card">
      <div class="tool-card-header">
        <div>
          <span class="card-meta">${tool.category}</span>
          <h3>${tool.name}</h3>
        </div>
        <button class="bookmark-button" type="button" aria-label="Save ${tool.name} placeholder">${icons.bookmark}</button>
      </div>
      <p>${tool.description}</p>
      <div class="tool-meta">
        <span><strong>Input:</strong> ${tool.input}</span>
        <span><strong>Output:</strong> ${tool.output}</span>
      </div>
      <a class="card-link" href="${tool.href || '#'}" aria-label="${tool.cta || `Open ${tool.name}`}">${tool.cta || `Open ${tool.name}`}</a>
    </article>
  `);

  renderCards('[data-render="trust"]', trust, (item) => `
    <article class="trust-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);

  renderCards('[data-render="learning"]', learning, (item) => `
    <article class="learning-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);

  renderCards('[data-render="roadmap"]', roadmap, (item) => `
    <article>
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });
}

function initMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    menu.hidden = true;
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    menu.hidden = isOpen;
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

function getSearchResults(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results = searchItems.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(normalized));
  return results.slice(0, 7);
}

function renderSearchResults(query = '') {
  const target = document.querySelector('[data-search-results]');
  if (!target) return;
  if (!query.trim()) {
    target.innerHTML = '<p class="search-empty">Start typing a tool, method, or business problem.</p>';
    return;
  }

  const results = getSearchResults(query);
  target.innerHTML = results.length
    ? results.map((item) => {
      const label = item.detail.toLowerCase().startsWith('recommended') ? '<em>Recommended</em>' : '';
      return `<a href="${item.href}">${label}<strong>${item.title}</strong><span>${item.detail}</span></a>`;
    }).join('')
    : '<p class="search-empty">No exact match yet. Try a method, category, or practical question.</p>';
}

function initSearch() {
  const modal = document.querySelector('[data-search-modal]');
  const input = document.querySelector('[data-search-input]');
  const openButtons = document.querySelectorAll('[data-search-open]');
  const closeButtons = document.querySelectorAll('[data-search-close]');
  if (!modal || !input) return;

  const openSearch = () => {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    renderSearchResults(input.value);
    window.setTimeout(() => input.focus(), 0);
  };

  const closeSearch = () => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  openButtons.forEach((button) => button.addEventListener('click', openSearch));
  closeButtons.forEach((button) => button.addEventListener('click', closeSearch));
  input.addEventListener('input', () => renderSearchResults(input.value));
  document.querySelector('[data-search-results]')?.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link?.getAttribute('href')?.startsWith('#')) closeSearch();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape' && !modal.hidden) closeSearch();
  });

  document.addEventListener('click', (event) => {
    const problem = event.target.closest('[data-problem]');
    if (!problem) return;
    input.value = problem.dataset.problem;
    openSearch();
  });
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (element) => {
    const target = Number(element.dataset.count || 0);
    const prefix = element.dataset.prefix || '';
    const duration = 900;
    const start = performance.now();

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${prefix}${Math.round(target * eased)}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach((counter) => {
      counter.textContent = `${counter.dataset.prefix || ''}${counter.dataset.count}`;
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.55 });

  counters.forEach((counter) => observer.observe(counter));
}

function initNewsletter() {
  const form = document.querySelector('[data-newsletter]');
  const message = document.querySelector('[data-form-message]');
  if (!form || !message) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = new FormData(form).get('email')?.toString().trim() || '';
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    message.classList.remove('error', 'success');

    if (!valid) {
      message.textContent = 'Enter a valid email address to subscribe.';
      message.classList.add('error');
      form.querySelector('input')?.focus();
      return;
    }

    message.textContent = 'Thanks. This placeholder form is ready to connect to an email service.';
    message.classList.add('success');
    form.reset();
  });
}

initRenderedContent();
initHeader();
initMobileMenu();
initSearch();
initCounters();
initNewsletter();
