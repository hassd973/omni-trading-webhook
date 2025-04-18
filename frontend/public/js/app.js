// wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const balanceEl   = document.getElementById('balance');
  const ordersEl    = document.getElementById('orders');
  const fillsEl     = document.getElementById('fills');
  const chartCanvas = document.getElementById('chart').getContext('2d');
  let btcChart;

  async function fetchAndRender() {
    try {
      const [acctRes, ordRes, fillRes, btcRes] = await Promise.all([
        fetch('/api/account'),
        fetch('/api/orders'),
        fetch('/api/fills'),
        fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1')
      ]);
      if (!acctRes.ok) throw new Error('Account fetch failed');
      if (!ordRes.ok)  throw new Error('Orders fetch failed');
      if (!fillRes.ok) throw new Error('Fills fetch failed');

      const acct   = await acctRes.json();
      const orders = await ordRes.json();
      const fills  = await fillRes.json();
      const btc    = await btcRes.json();

      // render JSON blobs
      balanceEl.innerHTML = `<h2>Balance</h2><pre>${JSON.stringify(acct, null, 2)}</pre>`;
      ordersEl.innerHTML  = `<h2>Open Orders</h2><pre>${JSON.stringify(orders, null, 2)}</pre>`;
      fillsEl.innerHTML   = `<h2>Fills / PnL</h2><pre>${JSON.stringify(fills, null, 2)}</pre>`;

      // prepare BTC chart data
      const times  = btc.prices.map(p => new Date(p[0]).toLocaleTimeString());
      const prices = btc.prices.map(p => p[1]);

      // if chart already exists, just update its data
      if (btcChart) {
        btcChart.data.labels    = times;
        btcChart.data.datasets[0].data = prices;
        btcChart.update();
      } else {
        // first time: create it
        btcChart = new Chart(chartCanvas, {
          type: 'line',
          data: {
            labels: times,
            datasets: [{
              label: 'BTC/USD (1d)',
              data: prices,
              fill: true,
              borderColor: '#58a6ff',
              backgroundColor: 'rgba(88,166,255,0.2)',
              tension: 0.3
            }]
          },
          options: {
            animation: false,
            scales: {
              x: { grid: { color: '#30363d' } },
              y: { grid: { color: '#30363d' } }
            },
            plugins: {
              legend: { labels: { color: '#c9d1d9' } }
            }
          }
        });
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    }
  }

  // initial load + auto‑refresh
  fetchAndRender();
  setInterval(fetchAndRender, 10_000);
});
