async function fetchJson(path) {
  const r = await fetch(path, { cache: 'no-store' });
  if (!r.ok) throw new Error(`fetch_failed:${path}:${r.status}`);
  return await r.json();
}

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) n.appendChild(c);
  return n;
}

function pillForPriority(p) {
  const v = (p || '').toUpperCase();
  const cls = v === 'P0' ? 'p0' : v === 'P1' ? 'p1' : v === 'P2' ? 'p2' : 'p3';
  return el('span', { class: `pill ${cls}`, text: v || 'P?' });
}

function renderBoard(tasks) {
  const columns = [
    { key: 'Backlog', title: 'Backlog' },
    { key: 'Next', title: 'Next' },
    { key: 'Doing', title: 'Doing' },
    { key: 'Blocked', title: 'Blocked' },
    { key: 'Done', title: 'Done' },
  ];

  const byStatus = new Map(columns.map(c => [c.key, []]));
  for (const t of tasks) {
    const s = (t.status || '').trim();
    if (!byStatus.has(s)) continue;
    byStatus.get(s).push(t);
  }

  // Stable ordering: priority then task_id
  const prioRank = (p) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[(p || '').toUpperCase()] ?? 9);
  for (const [k, arr] of byStatus.entries()) {
    arr.sort((a, b) => {
      const d = prioRank(a.priority) - prioRank(b.priority);
      if (d !== 0) return d;
      return String(a.task_id || '').localeCompare(String(b.task_id || ''));
    });
  }

  const board = document.getElementById('board');
  board.innerHTML = '';

  for (const c of columns) {
    const col = el('div', { class: 'col' }, [el('h3', { text: c.title })]);
    const arr = byStatus.get(c.key) || [];
    for (const t of arr) {
      const title = `${t.project || ''}${t.project && t.title ? ' — ' : ''}${t.title || ''}`.trim();
      const header = el('div', { class: 'titleRow' }, [
        el('div', { class: 'taskTitle', text: title || '(untitled)' }),
        pillForPriority(t.priority),
      ]);

      const smallBits = [];
      if (t.task_id) smallBits.push(`#${t.task_id}`);
      if (t.owner_email) smallBits.push(`owner: ${t.owner_email}`);
      if (t.blocker) smallBits.push(`blocked: ${t.blocker}`);

      const links = [];
      if (Array.isArray(t.links)) {
        for (const L of t.links) {
          if (!L || !L.href) continue;
          const a = el('a', { href: L.href, target: '_blank', rel: 'noreferrer', text: L.label || L.href });
          links.push(a);
        }
      }

      const small = el('div', { class: 'small' });
      small.textContent = smallBits.join(' · ');
      if (links.length) {
        small.appendChild(document.createElement('br'));
        const span = document.createElement('span');
        span.append(...links.reduce((acc, a, idx) => {
          if (idx) acc.push(document.createTextNode(' · '));
          acc.push(a);
          return acc;
        }, []));
        small.appendChild(span);
      }

      const item = el('div', { class: 'cardItem' }, [header, small]);
      col.appendChild(item);
    }
    board.appendChild(col);
  }
}

async function renderDiagrams() {
  const [regsense, ptr] = await Promise.all([
    fetch('diagrams/regsense.mmd', { cache: 'no-store' }).then(r => r.text()),
    fetch('diagrams/personal-trading-review.mmd', { cache: 'no-store' }).then(r => r.text()),
  ]);
  document.getElementById('mmd-regsense').textContent = regsense;
  document.getElementById('mmd-ptr').textContent = ptr;
}

async function main() {
  const data = await fetchJson('data/tasks.json');
  document.getElementById('meta').textContent = `Last updated: ${data.last_updated_utc} · tasks: ${data.tasks.length}`;
  renderBoard(data.tasks);

  const linksList = document.getElementById('linksList');
  if (Array.isArray(data.links)) {
    for (const L of data.links) {
      const li = document.createElement('li');
      const a = el('a', { href: L.href, target: '_blank', rel: 'noreferrer', text: L.label || L.href });
      li.appendChild(a);
      linksList.appendChild(li);
    }
  }

  await renderDiagrams();
}

main().catch((e) => {
  console.error(e);
  const meta = document.getElementById('meta');
  if (meta) meta.textContent = `Error loading dashboard data: ${String(e)}`;
});
