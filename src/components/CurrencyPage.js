import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
export default function CurrencyPage() {
  const location = useLocation();
  const item = location.state.currency; // Pass the selected currency to this component
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "buy" or "sell"
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [amount, setAmount] = useState(1); // Default amount for buy/sell
  const [orderType, setOrderType] = useState('market'); // "market" or "limit"
  const [price, setPrice] = useState(''); // Price for limit orders
  const [transactionType, setTransactionType] = useState('all'); // Default transaction type set to "all"
  const GetBookSummaryByCurrency=(kind)=>{

    var msg;
    if(kind=='')
    {
      msg = {
        jsonrpc: '2.0',
        id: 9344,
        method: 'public/get_book_summary_by_currency',
        params: {
          currency: item.currency,
        
        },
    }
    
    }
    else
    {
       msg = {
        jsonrpc: '2.0',
        id: 9344,
        method: 'public/get_book_summary_by_currency',
        params: {
          currency: item.currency,
          kind:kind
        },

      }
    }
    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
    ws.onmessage = function (e) {
      const response = JSON.parse(e.data);
      setData(response.result);
    };
    ws.onopen = function () {
      ws.send(JSON.stringify(msg));
    };

    // Cleanup WebSocket on unmount
    return () => ws.close();
  }
  useEffect(() => {
    
    GetBookSummaryByCurrency()
  }, [item]);

  const handleTransactionTypeChange = (e) => {
    setTransactionType(e.target.value); // Update the transaction type state
    const value=e.target.value
    if(value=='all')
      GetBookSummaryByCurrency('')
    else if(value=='spot')
      GetBookSummaryByCurrency('spot')
    else if(value=='future')
      GetBookSummaryByCurrency('future')
    else if(value=='option')
      GetBookSummaryByCurrency('option')
  };

  const openModal = (type, instrument_name) => {
    setModalType(type); // "buy" or "sell"
    setSelectedInstrument(instrument_name);
    setIsModalOpen(true); // Open modal
  };

  const closeModal = () => {
    setIsModalOpen(false); // Close modal
    setAmount(1); // Reset amount
    setPrice(''); // Reset price
    setOrderType('market'); // Reset order type
  };

  const handleConfirm = () => {
    if (modalType === 'buy') {
      buy(selectedInstrument);
    } else if (modalType === 'sell') {
      sell(selectedInstrument);
    }
    closeModal();
  };

  // Function to handle buy operation
  const buy = (instrument_name) => {
    const msg = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 10000),
      method: 'private/buy',
      params: {
        instrument_name: instrument_name,
        amount: amount,
        type: orderType,
        ...(orderType === 'limit' && { price: price }), // Include price only if it's a limit order
      },
    };
    executeOrder(msg);
  };

  // Function to handle sell operation
  const sell = (instrument_name) => {
    const msg = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 10000),
      method: 'private/sell',
      params: {
        instrument_name: instrument_name,
        amount: amount,
        type: orderType,
        ...(orderType === 'limit' && { price: price }), // Include price only if it's a limit order
      },
    };
    executeOrder(msg);
  };

  // WebSocket order execution
  const executeOrder = (msg) => {
    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
    ws.onopen = function () {
      // Ensure authentication before placing an order
      const authMsg = {
        jsonrpc: '2.0',
        id: 1,
        method: 'public/auth',
        params: {
          grant_type: 'client_credentials',
          "client_id": "gkgeDkcn",
          "client_secret": "hXvjtGQuZvryq8hcrphnWp7WIxztPPB0hcDq8z1RyIs"
        },
      };
      ws.send(JSON.stringify(authMsg));

      // Once authenticated, send the order
      ws.onmessage = function (e) {
        const response = JSON.parse(e.data);
        if (response.id === 1 && response.result && response.result.access_token) {
          // Authentication successful, now send the order
          ws.send(JSON.stringify(msg));
        }
        // Handle the order confirmation
        if (response.id !== 1) {
          console.log('Order response:', response);
        }
      };
    };
  };

  return (
    <div>
      <h1 className="text-center m-[100px] font-bold text-4xl">{item.currency}</h1>
        
       
      {/* Transaction Type Selection */}
<div className="mb-4 flex flex-col justify-center items-center"> {/* Center the dropdown */}
  <label htmlFor="transactionType" className="block mb-2">
    Select Transaction Type:
  </label>
  <select
    id="transactionType"
    value={transactionType}
    onChange={handleTransactionTypeChange}
    className="border border-gray-300 p-2 rounded w-1/3" // Set width to half
  >
    <option value="all">All</option>
    <option value="spot">Spot</option>
    <option value="future">Future</option>
    <option value="option">Option</option>
  </select>
</div>

      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Instrument Name</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Base Currency</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">High</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Low</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Mark Price</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Volume</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b border-gray-200">{item.instrument_name}</td>
              <td className="py-2 px-4 border-b border-gray-200">{item.base_currency}</td>
              <td className="py-2 px-4 border-b border-gray-200">{item.high}</td>
              <td className="py-2 px-4 border-b border-gray-200">{item.low}</td>
              <td className="py-2 px-4 border-b border-gray-200">{item.mark_price}</td>
              <td className="py-2 px-4 border-b border-gray-200">{item.volume}</td>
              <td className="py-2 px-4 border-b border-gray-200">
                <div>
                  <button
                    className="p-3 rounded-full bg-green-300 mx-4 "
                    onClick={() => openModal('buy', item.instrument_name)}
                  >
                    Buy
                  </button>
                  <button
                    className="p-3 rounded-full bg-red-300 mx-4 mt-5"
                    onClick={() => openModal('sell', item.instrument_name)}
                  >
                    Sell
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">
              {modalType === 'buy' ? 'Buy' : 'Sell'} {selectedInstrument}
            </h2>
            <div className="mb-4">
              <label htmlFor="amount" className="block mb-2">
                Enter Amount:
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
                min="1"
              />
            </div>

            {/* Order Type Selection */}
            <div className="mb-4">
              <label htmlFor="orderType" className="block mb-2">
                Select Order Type:
              </label>
              <select
                id="orderType"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </div>

            {/* Price Input for Limit Orders */}
            {orderType === 'limit' && (
              <div className="mb-4">
                <label htmlFor="price" className="block mb-2">
                  Enter Limit Price:
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={closeModal} className="bg-gray-300 text-black p-2 rounded">
                Cancel
              </button>
              <button onClick={handleConfirm} className="bg-blue-500 text-white p-2 rounded">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
       <ToastContainer />
    </div>

  );
}
