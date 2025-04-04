# TradingView to ApeX Pro/Omni Order Bot

This Node.js bot listens for TradingView webhook alerts and automatically places orders on the ApeX Pro exchange (part of the ApeX Omni platform). It allows you to automate your TradingView strategies on the ApeX decentralized exchange with minimal setup. The bot can run on a cloud host (via Render) or on your local machine.

## Quick Setup

### Deploy on Render (Cloud Hosting)

1. **Fork or Import Repo:** Get the repository code (e.g., via GitHub). On [Render](https://render.com), click **New > Web Service** and import the repo URL.
2. **Configure Service:** Choose the **main** branch and set the environment to use the provided `Dockerfile` (Render may auto-detect this).
3. **Add Environment Variables:** In Render, go to **Environment** settings. Add a new _Secret File_ named `.env` (or add variables individually) containing the required config keys (see **Environment Variables** below).
4. **Deploy:** Click **Create Web Service**. Once deployed, copy the service URL. If you open this URL in a browser, you should see a readiness message (e.g. **“apexpro Account Ready: true”**), indicating the bot is connected to your account.

Use the Render service URL as the webhook endpoint in your TradingView alert (in the alert settings, enable Webhook URL and paste the URL).

### Run Locally

1. **Clone the Repo:** Download or clone the project code to your machine.
2. **Install Dependencies:** In the project folder, run `npm install` (or `yarn install`) to install required packages.
3. **Set Environment Variables:** Create a `.env` file in the project root with the keys described in **Environment Variables** below.
4. **Start the Bot:** Run `npm start` (or `yarn start`). The server will start (by default on port **3000**). 

   If running locally, you’ll need to expose the port to the internet for TradingView. You can use a tool like **ngrok** to get a public URL that tunnels to your `localhost:3000`. For example, after installing ngrok, run `ngrok http 3000` and use the generated HTTPS URL as your webhook endpoint.

## TradingView Alert Example

When creating a TradingView alert, use the **Webhook URL** (your Render URL or ngrok URL) and set the alert **Message** to a JSON payload. For example:

```json
{
  "exchange": "apexpro",
  "strategy": "testStrategy",
  "market": "BTC-USDC",
  "size": "{{strategy.order.contracts}}",
  "order": "{{strategy.order.action}}",
  "position": "{{strategy.market_position}}",
  "price": "{{strategy.order.price}}"
}
```

## Environment Variables

The bot requires several environment variables to authenticate with your ApeX Pro account:

- `ETH_ADDRESS`
- `STARK_PUBLIC_KEY`
- `STARK_PRIVATE_KEY`
- `API_KEY`
- `API_PASSPHRASE`
- `API_SECRET`
- `ACCOUNT_ID`

Optional:
- `TRADINGVIEW_PASSPHRASE` – Webhook security check
- `SENTRY_DNS` – For error monitoring (optional)

## How to Test

- Open your Render URL or localhost to check that the bot is running.
- Send a TradingView alert using the example payload above.
- Check logs to confirm the order was processed.

That’s it! 🎉 You're ready to trade on ApeX using your TradingView alerts.