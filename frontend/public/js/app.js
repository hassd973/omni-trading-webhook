// public/js/app.js
async function fetchAndRender() {
  try {
    // 1) Fetch your back‑end endpoints
    const [acctRes, ordRes, fillRes, btcRes] = await Promise.all([
      fetch('/api/account'),
      fetch('/api/orders'),
      fetch('/api/fills'),
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1')
    ]);
    const acct   = await acctRes.json();
    const orders = await ordRes.json();
    const fills  = await fillRes.json();
    const btc    = await btcRes.json();

    // 2) Render text sections
    document.getElementById('balance').innerHTML =
      `<h2>Balance</h2><pre>${JSON.stringify(acct, null, 2)}</pre>`;
    document.getElementById('orders').innerHTML =
      `<h2>Open Orders</h2><pre>${JSON.stringify(orders, null, 2)}</pre>`;
    document.getElementById('fills').innerHTML =
      `<h2>Fills / PnL</h2><pre>${JSON.stringify(fills, null, 2)}</pre>`;

    // 3) Render BTC chart
    const ctx = document.getElementById('chart').getContext('2d');
    const labels = btc.prices.map(p => new Date(p[0]).toLocaleTimeString());
    const data   = btc.prices.map(p => p[1]);

    // destroy old chart if present
    if (window.btcChart) {
      window.btcChart.destroy();
    }

    window.btcChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'BTC/USD (1d)',
          data,
          fill: true,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88,166,255,0.2)',
          tension: 0.3,
        }]
      },
      options: {
        animation: false,
        scales: {
          x: { ticks: { color: '#c9d1d9' }, grid: { color: '#30363d' } },
          y: { ticks: { color: '#c9d1d9' }, grid: { color: '#30363d' } }
        },
        plugins: {
          legend: { labels: { color: '#c9d1d9' } }
        }
      }
    });

  } catch (err) {
    console.error('Fetch/render error', err);
  }
}

// initial load + refresh every 10s
fetchAndRender();
setInterval(fetchAndRender, 10_000);
