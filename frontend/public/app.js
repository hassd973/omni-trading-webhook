async function fetchAndRender() {
  try {
    const [acctRes, posRes, histRes, btcRes] = await Promise.all([
      fetch('/api/account'),
      fetch('/api/positions'),
      fetch('/api/history'),
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1')
    ]);
    const acct = await acctRes.json();
    const positions = await posRes.json();
    const history = await histRes.json();
    const btc = await btcRes.json();

    document.getElementById('balance').innerHTML =
      `<h2>Balance</h2><pre>${JSON.stringify(acct, null, 2)}</pre>`;

    document.getElementById('positions').innerHTML =
      `<h2>Open Positions</h2><pre>${JSON.stringify(positions, null, 2)}</pre>`;

    document.getElementById('history').innerHTML =
      `<h2>Trade History</h2><pre>${JSON.stringify(history, null, 2)}</pre>`;

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
      options: {
        animation: false,
        scales: {
          x: { grid: { color: '#222' }, ticks: { color: '#c9d1d9' } },
          y: { grid: { color: '#222' }, ticks: { color: '#c9d1d9' } }
        }
      }
    });
  } catch (e) {
    console.error(e);
  }
}

fetchAndRender();
setInterval(fetchAndRender, 10000);