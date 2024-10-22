import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
export default function OpenOrders() {
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editOrderData, setEditOrderData] = useState(null); // Holds order data for editing
  const [editPrice, setEditPrice] = useState(''); // Holds edited price
  const [editAmount, setEditAmount] = useState(''); // Holds edited amount

  const API_KEY = 'gkgeDkcn'; // Replace with your API key
  const API_SECRET = 'hXvjtGQuZvryq8hcrphnWp7WIxztPPB0hcDq8z1RyIs'; // Replace with your API secret

  const get_all_open_orders = (ws) => {
    const openOrdersMsg = {
      jsonrpc: '2.0',
      id: 1953,
      method: 'private/get_open_orders',
      params: {},
    };

    ws.send(JSON.stringify(openOrdersMsg));
  };

  const authenticate = (ws) => {
    const authMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'public/auth',
      params: {
        grant_type: 'client_credentials',
        client_id: API_KEY,
        client_secret: API_SECRET,
      },
    };

    ws.send(JSON.stringify(authMsg));
  };

  const setupWebSocket = () => {
    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

    ws.onopen = () => {
      console.log('WebSocket connection opened.');
      authenticate(ws); // Authenticate on open
    };

    ws.onmessage = (e) => {
      const response = JSON.parse(e.data);
      console.log('Received from server:', response);

      // Handle authentication response
      if (response.id === 1) {
        if (response.result?.access_token) {
          console.log('Authentication successful! Fetching open orders.');
          get_all_open_orders(ws); // Fetch open orders after authentication
        } else {
          console.error('Authentication failed:', response.error);
        }
      }

      // Handle open orders response
      if (response.id === 1953) {
        setOrders(response.result || []);
      }

      // Handle cancel order response
      if (response.id === 2) {
        console.log('Cancel Order Response:', response);
        setOrders((prev) => prev.filter((order) => order.order_id !== response.params.order_id)); // Remove canceled order from UI
      }

      // Handle edit order response
      if (response.id === 3) {
        console.log('Edit Order Response:', response);
        setIsModalOpen(false); // Close modal after edit
        get_all_open_orders(ws); // Refresh orders list
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
    };
  };

  const cancelOrder = (order_id) => {
    const cancelOrderMsg = {
      jsonrpc: '2.0',
      id: 2,
      method: 'private/cancel',
      params: {
        order_id,
      },
    };

    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
    ws.onopen = () => {
      authenticate(ws); // Authenticate before canceling the order
      ws.onmessage = (e) => {
        const response = JSON.parse(e.data);
        if (response.id === 1 && response.result?.access_token) {
          ws.send(JSON.stringify(cancelOrderMsg)); // Send cancel order message
        }
      };
    };
    toast.success('Order Cancelled!', {
      //position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const editOrder = (order_id, price, amount) => {
    const editOrderMsg = {
      jsonrpc: '2.0',
      id: 3,
      method: 'private/edit',
      params: {
        order_id,
        price: parseFloat(price),
        amount: parseFloat(amount),
      },
    };

    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
    ws.onopen = () => {
      authenticate(ws); // Authenticate before editing the order
      ws.onmessage = (e) => {
        const response = JSON.parse(e.data);
        if (response.id === 1 && response.result?.access_token) {
          ws.send(JSON.stringify(editOrderMsg)); // Send edit order message
        }
      };
    };

    toast.success('Order Edited Sucessfully!', {
      //position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const openEditModal = (order) => {
    setEditOrderData(order);
    setEditPrice(order.price);
    setEditAmount(order.amount);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    setupWebSocket(); // Setup WebSocket on mount
  }, []);

  return (
    <div>
      <h1 className="text-center font-bold text-4xl mb-8">Open Orders</h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Instrument</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Price</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Amount</th>
            <th className="py-2 px-4 border-b border-gray-200 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b border-gray-200">{order.instrument_name}</td>
              <td className="py-2 px-4 border-b border-gray-200">{order.price}</td>
              <td className="py-2 px-4 border-b border-gray-200">{order.amount}</td>
              <td className="py-2 px-4 border-b border-gray-200">
                <button
                  className="bg-blue-500 text-white p-2 rounded mr-2"
                  onClick={() => openEditModal(order)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white p-2 rounded"
                  onClick={() => cancelOrder(order.order_id)}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Edit Order: {editOrderData.instrument_name}</h2>
            <div className="mb-4">
              <label htmlFor="price" className="block mb-2">Price:</label>
              <input
                type="number"
                id="price"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="amount" className="block mb-2">Amount:</label>
              <input
                type="number"
                id="amount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
              />
            </div>
            <div className="flex justify-end">
              <button className="bg-gray-400 text-white p-2 rounded mr-2" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white p-2 rounded"
                onClick={() => editOrder(editOrderData.order_id, editPrice, editAmount)}
              >
                Confirm Edit
              </button>
            </div>
          </div>
        </div>
      )}
       <ToastContainer />
    </div>
  );
}
