import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function IceKingDashboard() {
  const [balance, setBalance] = useState(null);
  const [positions, setPositions] = useState([]);
  const [btcPrice, setBtcPrice] = useState([]);

  useEffect(() => {
    fetch('https://omni-trading-webhook.onrender.com/balance')
      .then(res => res.json())
      .then(data => setBalance(data.balances))
      .catch(err => console.error('Balance error:', err));

    fetch('https://omni-trading-webhook.onrender.com/positions')
      .then(res => res.json())
      .then(data => setPositions(data.openPositions))
      .catch(err => console.error('Positions error:', err));

    const fetchBTC = async () => {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1');
      const data = await res.json();
      setBtcPrice(data.prices);
    };
    fetchBTC();
  }, []);

  const chartData = {
    labels: btcPrice.map(p => new Date(p[0]).toLocaleTimeString()),
    datasets: [
      {
        label: 'BTC/USD',
        data: btcPrice.map(p => p[1]),
        fill: true,
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        borderColor: '#00f0ff',
        tension: 0.4,
      },
    ],
  };

  return (
    <div style={{ background: 'linear-gradient(to bottom, #001f3f, #0074D9)', color: 'white', padding: '2rem', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', textAlign: 'center' }}>🧊 ICE KING DASHBOARD 👑</h1>
      <section>
        <h2>Balance</h2>
        <pre>{balance ? JSON.stringify(balance, null, 2) : 'Loading...'}</pre>
      </section>
      <section>
        <h2>Open Positions</h2>
        {positions.length > 0 ? (
          <ul>
            {positions.map((pos, i) => (
              <li key={i}>{pos.symbol} → {pos.side} {pos.size} @ {pos.entryPrice}</li>
            ))}
          </ul>
        ) : <p>No open positions.</p>}
      </section>
      <section>
        <h2>Live BTC Chart (1 Day)</h2>
        <Line data={chartData} />
      </section>
    </div>
  );
}
