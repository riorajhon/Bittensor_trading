import { useState, useEffect, useMemo } from 'react';
import './App.css';

// In dev, Vite proxies /api to backend. In production, set VITE_API_URL if API is on another origin.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = `${API_BASE}/api/subnets`;
const API_PRICE = `${API_BASE}/api/price`;

function formatPrice(s) {
  if (s == null || s === '') return '—';
  const n = parseFloat(s);
  if (Number.isNaN(n)) return s;
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  return n.toExponential(2);
}

function formatPct(s) {
  if (s == null || s === '') return '—';
  const n = parseFloat(s);
  if (Number.isNaN(n)) return s;
  return (n * 100).toFixed(2) + '%';
}

/** Reg cost: neuron_registration_cost / 10^9 (rao → TAO) */
function formatRegCost(s) {
  if (s == null || s === '') return '—';
  const n = parseFloat(s);
  if (Number.isNaN(n)) return '—';
  const tao = n / 1e9;
  if (tao >= 1e6) return (tao / 1e6).toFixed(2) + 'M';
  if (tao >= 1e3) return (tao / 1e3).toFixed(2) + 'K';
  return tao.toFixed(2);
}

function getSortValue(s, key) {
  if (key === 'regCost') {
    const v = s.neuron_registration_cost;
    return v != null && v !== '' ? parseFloat(v) : -1;
  }
  const v = s[key];
  if (v == null || v === '') return key === 'name' ? '' : -1;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return key === 'name' ? v.toLowerCase() : parseFloat(v) || -1;
  return -1;
}

function sortSubnets(list, sortBy, sortAsc) {
  return [...list].sort((a, b) => {
    const va = getSortValue(a, sortBy);
    const vb = getSortValue(b, sortBy);
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    const na = Number(va);
    const nb = Number(vb);
    if (sortAsc) return na - nb;
    return nb - na;
  });
}

// Icons as inline SVG components
function IconGitHub() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795 1.005-.015 1.725.465 2.025 1.065.585 1.005 1.815 1.44 2.955 1.44.705 0 1.41-.075 1.995-.225.06-.54.27-1.065.63-1.485-2.19-.24-4.5-1.095-4.5-4.86 0-1.065.375-1.95 1.005-2.64-.105-.255-.45-1.29.09-2.655 0 0 .825-.27 2.7 1.02.78-.21 1.62-.315 2.46-.315s1.68.105 2.46.315c1.875-1.29 2.7-1.02 2.7-1.02.54 1.365.195 2.4.09 2.655.63.69 1.005 1.56 1.005 2.64 0 3.78-2.31 4.62-4.515 4.86.36.315.675.93.675 1.875 0 1.35-.015 2.445-.015 2.775 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
function IconDiscord() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}
function IconExternal() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

const TAOSTATS_CHART = (netuid) => `https://taostats.io/subnets/${netuid}/chart`;

export default function App() {
  const [subnets, setSubnets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('netuid');
  const [sortAsc, setSortAsc] = useState(true);
  const [taoPrice, setTaoPrice] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubnets = useMemo(() => {
    if (!searchQuery.trim()) return subnets;
    const q = searchQuery.trim().toLowerCase();
    return subnets.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.subnet_name || '').toLowerCase().includes(q)
    );
  }, [subnets, searchQuery]);

  const sortedSubnets = useMemo(
    () => sortSubnets(filteredSubnets, sortBy, sortAsc),
    [filteredSubnets, sortBy, sortAsc]
  );

  function handleSort(key) {
    if (key === 'links') return;
    setSortBy(key);
    setSortAsc((prev) => (prev && sortBy === key ? false : true));
  }

  async function fetchSubnets() {
    setError(null);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      setSubnets(json.data || []);
      setLastRefreshTime((prev) => prev ?? new Date());
    } catch (e) {
      setError(e.message);
      setSubnets([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API}/refresh`, { method: 'POST' });
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      await fetchSubnets();
      setLastRefreshTime(new Date());
      return json;
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchSubnets();
  }, []);

  // TAO price every 1 second
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(API_PRICE);
        if (!res.ok) return;
        const json = await res.json();
        const item = json?.data?.[0];
        if (item) setTaoPrice({ price: item.price, percent_change_24h: item.percent_change_24h });
      } catch (_) {}
    }
    fetchPrice();
    const id = setInterval(fetchPrice, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">
            <span className="logo-icon">τ</span>
            Bittensor Dashboard
          </h1>
          <nav className="nav">
            <span className="nav-item active">Subnets</span>
          </nav>
          <div className="header-search">
            <input
              type="text"
              className="search-input"
              placeholder="Search by subnet name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search by subnet name"
            />
          </div>
          {taoPrice && (
            <div className="tao-price">
              <span className="tao-price-label">Bittensor</span>
              <span className="tao-price-value">${taoPrice.price}</span>
              {taoPrice.percent_change_24h != null && (
                <span className={parseFloat(taoPrice.percent_change_24h) >= 0 ? 'tao-price-change up' : 'tao-price-change down'}>
                  {parseFloat(taoPrice.percent_change_24h).toFixed(2)}%
                </span>
              )}
            </div>
          )}
          <div className="header-actions">
            <span className="refresh-time">
              {lastRefreshTime
                ? `Last refreshed: ${lastRefreshTime.toLocaleTimeString()}`
                : loading
                  ? 'Loading…'
                  : 'Last refreshed: —'}
            </span>
            <button
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {error && (
            <div className="banner error">
              {error}
            </div>
          )}
          {loading ? (
            <div className="loading">Loading subnets…</div>
          ) : subnets.length === 0 ? (
            <div className="empty">
              No subnets in database. Click <strong>Refresh</strong> to fetch from taostats.io (1–128).
            </div>
          ) : (
            <div className="card table-card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort('netuid')}>
                        # {sortBy === 'netuid' && (sortAsc ? '↑' : '↓')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('name')}>
                        Name {sortBy === 'name' && (sortAsc ? '↑' : '↓')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('rank')}>
                        Rank {sortBy === 'rank' && (sortAsc ? '↑' : '↓')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('price')}>
                        Alpha price {sortBy === 'price' && (sortAsc ? '↑' : '↓')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('projected_emission')}>
                        Emissions {sortBy === 'projected_emission' && (sortAsc ? '↑' : '↓')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('incentive_burn')}>
                        Incentive burn {sortBy === 'incentive_burn' && (sortAsc ? '↑' : '↓')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('regCost')}>
                        Reg cost (τ) {sortBy === 'regCost' && (sortAsc ? '↑' : '↓')}
                      </th>
                      <th>Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubnets.map((s) => {
                      const burnPct = s.incentive_burn != null && s.incentive_burn !== '' ? parseFloat(s.incentive_burn) * 100 : null;
                      const isBurn100 = burnPct >= 100;
                      return (
                      <tr key={s.netuid}>
                        <td className="num">
                          <a href={TAOSTATS_CHART(s.netuid)} target="_blank" rel="noopener noreferrer" className="subnet-link">
                            {s.netuid}
                          </a>
                        </td>
                        <td>
                          <a
                            href={TAOSTATS_CHART(s.netuid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="name name-with-tooltip subnet-link"
                            title={s.description || ''}
                          >
                            {s.name || s.subnet_name || '—'}
                            {s.symbol && <span className="symbol"> {s.symbol}</span>}
                          </a>
                        </td>
                        <td className="num">{s.rank != null ? s.rank : '—'}</td>
                        <td className="num">{formatPrice(s.price)}</td>
                        <td className="num">{formatPct(s.projected_emission)}</td>
                        <td className={`num ${isBurn100 ? 'burn-100' : ''}`}>{formatPct(s.incentive_burn)}</td>
                        <td className="num">{formatRegCost(s.neuron_registration_cost)}</td>
                        <td className="links-cell">
                          {s.github && (
                            <a href={s.github} target="_blank" rel="noopener noreferrer" className="link-icon" title="GitHub" aria-label="GitHub">
                              <IconGitHub />
                            </a>
                          )}
                          {s.discord_url && (
                            <a href={`https://discord.gg/${s.discord_url}`} target="_blank" rel="noopener noreferrer" className="link-icon" title="Discord" aria-label="Discord">
                              <IconDiscord />
                            </a>
                          )}
                          {s.subnet_contact && (
                            <a href={s.subnet_contact.startsWith('mailto:') ? s.subnet_contact : `mailto:${s.subnet_contact}`} target="_blank" rel="noopener noreferrer" className="link-icon" title="Contact" aria-label="Contact">
                              <IconMail />
                            </a>
                          )}
                          {s.subnet_url && (
                            <a href={s.subnet_url} target="_blank" rel="noopener noreferrer" className="link-icon" title="Subnet URL" aria-label="Subnet URL">
                              <IconExternal />
                            </a>
                          )}
                          {!s.github && !s.discord_url && !s.subnet_contact && !s.subnet_url && '—'}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          Data from <a href="https://taostats.io" target="_blank" rel="noopener noreferrer">taostats.io</a>
        </div>
      </footer>
    </div>
  );
}
