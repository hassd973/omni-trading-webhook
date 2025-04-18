async function fetchAndRender() {
  try {
    const [acctRes, ordRes, fillRes, btcRes] = await Promise.all([
      fetch('/api/account'),
      fetch('/api/orders'),
      fetch('/api/fills'),
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1')
    ]);
    const acct = await acctRes.json();
    const orders = await ordRes.json();
    const fills = await fillRes.json();
    const btc = await btcRes.json();

    document.getElementById('balance').innerHTML =
      `<h2>Balance</h2><pre>${JSON.stringify(acct, null, 2)}</pre>`;

    document.getElementById('orders').innerHTML =
      `<h2>Open Orders</h2><pre>${JSON.stringify(orders, null, 2)}</pre>`;

    document.getElementById('fills').innerHTML =
      `<h2>Fills / PnL</h2><pre>${JSON.stringify(fills, null, 2)}</pre>`;

    const ctx = document.getElementById('chart').getContext('2d');
    const times = btc.prices.map(p => new Date(p[0]).toLocaleTimeString());
    const prices = btc.prices.map(p => p[1]);
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: times,
        datasets: [{
          label: 'BTC/USD (1d)',
          data: prices,
          fill: true,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88,166,255,0.2)',
        }]
      },
      options: { animation: false, responsive: true, maintainAspectRatio: false }
    });

  } catch (e) {
    console.error(e);
  }
}

fetchAndRender();
setInterval(fetchAndRender, 10000);
