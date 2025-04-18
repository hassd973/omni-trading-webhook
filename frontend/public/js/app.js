// public/js/app.js
(async function() {
  const balanceEl  = document.getElementById('balance');
  const ordersEl   = document.getElementById('orders');
  const fillsEl    = document.getElementById('fills');
  const ctx        = document.getElementById('chart').getContext('2d');
  let btcChart;

  async function fetchAndRender() {
    try {
      // 1) Fetch backend APIs
      const [acctRes, ordRes, fillRes] = await Promise.all([
        fetch('/api/account'),
        fetch('/api/orders'),
        fetch('/api/fills'),
      ]);
      const acct   = await acctRes.json();
      const orders = await ordRes.json();
      const fills  = await fillRes.json();

      // 2) Render JSON data
      balanceEl.innerHTML = `
        <h2>Balance</h2>
        <pre>${JSON.stringify(acct, null, 2)}</pre>
      `;
      ordersEl.innerHTML = `
        <h2>Open Orders</h2>
        <pre>${JSON.stringify(orders, null, 2)}</pre>
      `;
      fillsEl.innerHTML = `
        <h2>Fills / PnL</h2>
        <pre>${JSON.stringify(fills, null, 2)}</pre>
      `;

      // 3) Fetch BTC 24h prices from CoinGecko
      const btcRes = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'
      );
      const btc = await btcRes.json();
      const times  = btc.prices.map(p => new Date(p[0]).toLocaleTimeString());
      const prices = btc.prices.map(p => p[1]);

      // 4) (Re)draw Chart.js line
      if (!btcChart) {
        btcChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: times,
            datasets: [{
              label: 'BTC/USD (1d)',
              data: prices,
              fill: true,
              borderColor: 'var(--accent)',
              backgroundColor: 'rgba(138,174,247,0.2)',
              tension: 0.3,
            }]
          },
          options: {
            animation: false,
            scales: {
              x: { grid: { color: 'var(--border)' } },
              y: { grid: { color: 'var(--border)' } }
            },
            plugins: {
              legend: { labels: { color: 'var(--text)' } }
            }
          }
        });
      } else {
        btcChart.data.labels = times;
        btcChart.data.datasets[0].data = prices;
        btcChart.update();
      }

    } catch (err) {
      console.error('Fetch/render error', err);
    }
  }

  // initial + refresh every 10s
  fetchAndRender();
  setInterval(fetchAndRender, 10_000);
})();
