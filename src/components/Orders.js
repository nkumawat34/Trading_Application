import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
export default function Orders() {
  const [instruments, setInstruments] = useState([]);
  const [trades, setTrades] = useState({}); // Store trades by instrument name

  const currencies = ['BTC', 'ETH', 'USD', 'USDT']; // Support for BTC, ETH, USD, USDT

  useEffect(() => {
    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

    ws.onopen = () => {
      console.log('WebSocket connection opened.');

      // Step 1: Fetch all instruments for each currency
      currencies.forEach((currency, index) => {
        const instrumentRequest = {
          jsonrpc: '2.0',
          id: index + 1, // Unique request ID for each currency
          method: 'public/get_instruments',
          params: {
            currency: currency,
            kind: 'future', // Change to "option" if you want option instruments
            expired: false,
          },
        };

        ws.send(JSON.stringify(instrumentRequest));
      });
    };

    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);

      // Step 2: Process the response for the instrument request
      if (response.id && Array.isArray(response.result)) { // Check if result is an array
        const fetchedInstruments = response.result.map((instrument) => ({
          name: instrument.instrument_name,
          currency: instrument.currency,
        }));
        setInstruments((prevInstruments) => [
          ...prevInstruments,
          ...fetchedInstruments,
        ]);

        // Now request trades for each instrument
        fetchedInstruments.forEach((instrument, index) => {
          const tradeRequest = {
            jsonrpc: '2.0',
            id: instruments.length + index + 2, // Unique ID for each trade request
            method: 'public/get_last_trades_by_instrument',
            params: {
              instrument_name: instrument.name,
              count: 10, // Fetch the last 100 trades
            },
          };

          ws.send(JSON.stringify(tradeRequest));
        });
      } else if (response.error) {
        console.error(`Error fetching instruments: ${response.error.message}`);
      } else {
        console.warn(`Unexpected response format:`, response);
      }

      // Step 3: Handle the trade responses
      if (response.id > 1 && response.result && response.result.trades) {
        const instrumentName = response.result.trades[0]?.instrument_name;

        // Ensure trades array is not empty before trying to access it
        if (instrumentName && response.result.trades.length > 0) {
          setTrades((prevTrades) => ({
            ...prevTrades,
            [instrumentName]: response.result.trades,
          }));
        } else {
          console.warn(`No trades found for instrument ID: ${response.id}`);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    return () => {
      ws.close(); // Cleanup WebSocket connection on component unmount
    };
  }, []);

  return (
    <div>
      <h1 className="text-center font-bold text-4xl mt-5">Orders</h1>
      <div className="mt-10 p-5">
        {instruments.length > 0 ? (
          instruments.map((instrument, index) => (
            <div key={index} className="mb-5 border-b pb-5">
              <h2 className="text-2xl font-semibold">
                {instrument.name} ({instrument.currency})
              </h2>
              <h3 className="font-bold">Last Trades:</h3>
              {trades[instrument.name] ? (
                trades[instrument.name].map((trade, idx) => (
                  <p key={idx}>
                    Price: {trade.price}, Amount: {trade.amount}, Timestamp:{' '}
                    {new Date(trade.timestamp).toLocaleString()}
                  </p>
                ))
              ) : (
                <p>Loading trades...</p>
              )}
            </div>
          ))
        ) : (
          <p>Loading instruments...</p>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
