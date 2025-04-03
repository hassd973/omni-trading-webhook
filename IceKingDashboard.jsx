import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function IceKingDashboard() {
  const [balance, setBalance] = useState(null);
  const [positions, setPositions] = useState([]);
  const [btcPrice, setBtcPrice] = useState([]);

  useEffect(() => {
    fetch('/balance')
      .then(res => res.json())
      .then(data => setBalance(data.balances))
      .catch(err => console.error('Balance error:', err));

    fetch('/positions')
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
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 text-white p-4 space-y-6">
      <h1 className="text-4xl font-bold text-center">🧊 ICE KING DASHBOARD 👑</h1>

      <Card className="bg-blue-800 shadow-xl rounded-2xl">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold">Balance</h2>
          {balance ? (
            <pre className="mt-2 whitespace-pre-wrap text-sm">{JSON.stringify(balance, null, 2)}</pre>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-800 shadow-xl rounded-2xl">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold">Open Positions</h2>
          {positions.length > 0 ? (
            <ul className="mt-2 list-disc list-inside text-sm">
              {positions.map((pos, i) => (
                <li key={i}>{pos.symbol} → {pos.side} {pos.size} @ {pos.entryPrice}</li>
              ))}
            </ul>
          ) : (
            <p>No open positions.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-800 shadow-xl rounded-2xl">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold">Live BTC Chart (1 Day)</h2>
          <Line data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}