import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Orders = () => {
  const [positions, setPositions] = useState([]); // State to store positions
  const [error, setError] = useState(null); // State to store any errors
  const [editPosition, setEditPosition] = useState(null); // Store the position being edited
  const [editSize, setEditSize] = useState(''); // State to hold edited size

  useEffect(() => {
    const API_KEY = 'gkgeDkcn'; // Replace with your API key
    const API_SECRET = 'hXvjtGQuZvryq8hcrphnWp7WIxztPPB0hcDq8z1RyIs'; // Replace with your API secret

    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

    // Authentication function
    const authenticate = () => {
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

    // Handle incoming messages
    ws.onmessage = (e) => {
      const response = JSON.parse(e.data);
      console.log('Received from server:', response);

      // Handle authentication response
      if (response.id === 1) {
        if (response.result && response.result.access_token) {
          console.log('Authentication successful!');

          // Fetch positions after successful authentication
          fetchPositions('BTC');
          fetchPositions('ETH');
        } else {
          console.error('Authentication failed:', response.error);
          setError('Authentication failed');
        }
      }

      // Handle position results
      if (response.result) {
        if (Array.isArray(response.result)) {
          setPositions((prev) => filterPositions([...prev, ...response.result]));
        } else {
          setPositions((prev) => filterPositions([...prev, response.result]));
        }
      }
    };

    // Fetch positions for given currencies
    const fetchPositions = (currency) => {
      const msg = {
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 10000),
        method: 'private/get_positions',
        params: {
          currency: currency,
          
        },
      };
      ws.send(JSON.stringify(msg));
    };

    // Handle WebSocket connection open
    ws.onopen = () => {
      console.log('WebSocket connection opened.');
      authenticate();
    };

    // Handle WebSocket errors
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket error');
    };

    // Handle WebSocket connection closing
    ws.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Function to filter positions based on criteria
  const filterPositions = (positions) => {
    const uniquePositions = new Map();
    
    positions.forEach(position => {
      // Add only unique positions based on instrument_name
      if (position.size > 0 && position.instrument_name !== '') {
        uniquePositions.set(position.instrument_name, position);
      }
    });

    return Array.from(uniquePositions.values());
  };

  // Function to edit a position
  const handleEditPosition = (position) => {
    setEditPosition(position); // Set the current position to be edited
    setEditSize(position.size); // Initialize size with current value
  };

  // Function to save the edited position
  const saveEdit = () => {
    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
    const editMsg = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 10000),
      method: 'private/edit_position', // Hypothetical API call for edit
      params: {
        instrument_name: editPosition.instrument_name,
        new_size: editSize,
      },
    };
    ws.onopen = () => ws.send(JSON.stringify(editMsg));
    ws.onmessage = () => {
      console.log('Position edited successfully.');
      setEditPosition(null); // Close modal after editing
      setPositions((prev) => filterPositions(prev)); // Update positions after edit
      ws.close();
    };
  };

  // Function to cancel a position
  const cancelPosition = (instrument_name) => {
    const API_KEY = 'gkgeDkcn'; // Replace with your API key
    const API_SECRET = 'hXvjtGQuZvryq8hcrphnWp7WIxztPPB0hcDq8z1RyIs'; // Replace with your API secret
  
    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
  
    // Authenticate before sending cancel message
    const authenticate = () => {
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
  
    ws.onopen = () => {
      console.log('WebSocket opened for cancelling position.');
      authenticate(); // Authenticate when connection opens
    };
  
    ws.onmessage = (e) => {
      const response = JSON.parse(e.data);
      console.log('Received:', response);
  
      // Check if authentication is successful
      if (response.id === 1 && response.result && response.result.access_token) {
        console.log('Authentication successful. Proceeding to cancel position.');
  
        // After authentication, send the cancel position message
        const cancelMsg = {
          jsonrpc: '2.0',
          id: 6130,
          method: 'private/close_position',
          params: {
            instrument_name: instrument_name,
            type: 'market',
          },
        };
        ws.send(JSON.stringify(cancelMsg));
      }
  
      // Handle the cancel position response
      if (response.id === 6130) {
        console.log('Position cancelled successfully:', response);
        setPositions((prev) => filterPositions(prev.filter((pos) => pos.instrument_name !== instrument_name))); // Remove cancelled position and filter
        ws.close(); // Close WebSocket after canceling position
      }
    };
  
    ws.onerror = (error) => {
      console.error('WebSocket error during cancellation:', error);
    };
  
    ws.onclose = () => {
      console.log('WebSocket closed.');
    };
    toast.success('Order Cancelled Successfully!', {
      //position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <h1 className="text-center font-bold text-5xl text-gray-800 mb-10">View Positions</h1>
      {error && <p className="text-red-500 text-center">{error}</p>}

      {positions.length > 0 ? (
        <div className="max-w-6xl mx-auto px-4 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Instrument: {position.instrument_name}</h2>
              <p className="text-gray-600 mb-2">
                <strong>Size:</strong> {position.size}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Mark Price:</strong> {position.mark_price}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Kind:</strong> {position.kind}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Leverage:</strong> {position.leverage}
              </p>

              {/* Edit & Cancel Buttons */}
              <div className="mt-4 flex justify-center">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => cancelPosition(position.instrument_name)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">Loading positions...</p>
      )}

      {/* Edit Modal */}
      {editPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Edit Position</h2>
            <label className="block mb-2">
              Size:
              <input
                type="number"
                className="border border-gray-300 rounded p-2 w-full"
                value={editSize}
                onChange={(e) => setEditSize(e.target.value)}
              />
            </label>
            <div className="flex justify-center">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={() => setEditPosition(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
       <ToastContainer />
    </div>
  );
};

export default Orders;
