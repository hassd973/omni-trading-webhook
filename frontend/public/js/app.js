async function fetchAndRender() {
  try {
    const [acctRes, ordRes, fillRes] = await Promise.all([
      fetch('/api/account'),
      fetch('/api/orders'),
      fetch('/api/fills')
    ]);
    const acct = await acctRes.json();
    const positions = await ordRes.json();
    const fills = await fillRes.json();

    document.getElementById('balance').innerHTML =
      `<h2>Balance</h2><pre>${JSON.stringify(acct, null, 2)}</pre>`;
    document.getElementById('orders').innerHTML =
      `<h2>Positions</h2><pre>${JSON.stringify(positions, null, 2)}</pre>`;
    document.getElementById('fills').innerHTML =
      `<h2>PnL</h2><pre>${JSON.stringify(fills, null, 2)}</pre>`;
  } catch (e) {
    console.error(e);
  }
}

// init TradingView widget
function initTVWidget() {
  new TradingView.widget({
    container_id: "tv_chart_container",
    autosize: true,
    symbol: "BINANCE:BTCUSDT",
    theme: "dark",
    style: 1,
    locale: "en",
    toolbar_bg: "#161b22",
    hide_legend: false,
    allow_symbol_change: true,
    details: true,
    studies: ["MACD@tv-basicstudies"]
  });
}

fetchAndRender();
setInterval(fetchAndRender, 10000);
initTVWidget();
