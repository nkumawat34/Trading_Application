import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HomePage() {
    const [ws, setWs] = useState(null); 
    const [currencies, setCurrencies] = useState([]);

    const navigate = useNavigate();
   

    const authenticate1 = () => {
      const msg = {
        "jsonrpc": "2.0",
        "id": 9929,
        "method": "public/auth",
        "params": {
          "grant_type": "client_credentials",
          "client_id": "gkgeDkcn",
          "client_secret": "hXvjtGQuZvryq8hcrphnWp7WIxztPPB0hcDq8z1RyIs"
        }
      };
    
      const newWs = new WebSocket('wss://test.deribit.com/ws/api/v2');
      setWs(newWs); 
    
      newWs.onmessage = function (e) {
        const response = JSON.parse(e.data);
    
        if (response.result && response.result.access_token) {
          const token = response.result.access_token;
          localStorage.setItem("accesstoken", token);
          console.log('Extracted token:', token);
          window.location.reload();
        } else {
          console.log('No token found in the response:', response);
        }
      };
    
      newWs.onopen = function () {
        newWs.send(JSON.stringify(msg));
      };
    
      toast.success('Authenticated Successfully!', {
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };
    
    
    const logout = () => {
      const API_KEY = 'gkgeDkcn'; // Replace with your API key
      const API_SECRET = 'hXvjtGQuZvryq8hcrphnWp7WIxztPPB0hcDq8z1RyIs'; // Replace with your API secret
      const accessToken = localStorage.getItem("accesstoken");
    
      if (!accessToken) {
        console.log('No access token found. Cannot log out.');
        toast.error('No access token found. Please log in first.', {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
    
      const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
      
      // Authenticate before sending the logout message
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
        console.log('WebSocket opened for logging out.');
        authenticate(); // Authenticate when connection opens
      };
    
      ws.onmessage = (e) => {
        const response = JSON.parse(e.data);
        console.log('Received:', response);
    
        // Check if authentication is successful
        if (response.id === 1 && response.result && response.result.access_token) {
          console.log('Authentication successful. Proceeding to logout.');
    
          // Send the logout message
          const logoutMsg = {
            jsonrpc: '2.0',
            method: 'private/logout',
            id: 42,
            params: {
              access_token: accessToken,
              invalidate_token: true, // Optionally invalidate the token on the server
            },
          };
          ws.send(JSON.stringify(logoutMsg));
        }
    
        
        // Handle the logout response
        if (response.id === 42) {
          console.log(response.result)
          
            console.log('Logout successful. Clearing access token...');
            localStorage.removeItem("accesstoken");
    
            // Show toast notification only after successful logout
            toast.success('Logout Successfully!', {
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
    
            window.location.reload(); // Reload the page after successful logout
         
        }
      };
    
      ws.onerror = (error) => {
        console.error('WebSocket error during logout:', error);
        toast.error('WebSocket error: ' + error.message, {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      };
    
      ws.onclose = () => {
        console.log('WebSocket closed.');
      };
    };
    
    
       
    

    

    useEffect(() => {
      get_currencies();
    }, []);

    const get_currencies = () => {
      const msg = {
        "jsonrpc": "2.0",
        "id": 7538,
        "method": "public/get_currencies",
        "params": {}
      };

      const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

      ws.onmessage = function (e) {
        const response = JSON.parse(e.data);
        setCurrencies(response.result);
        console.log('Currencies received:', response);
      };

      ws.onopen = function () {
        ws.send(JSON.stringify(msg));
      };
    };

    return (
      <>
        <div className="min-h-screen bg-gray-100 py-10 px-5">
          <h1 className="text-center text-5xl font-bold text-indigo-600 mb-10">
            Deribit Trading Application
          </h1>

          <div className="flex justify-end mb-6 space-x-4">
            {localStorage.getItem("accesstoken") ? (
              <>
                <button
                  className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all duration-300"
                  onClick={() => navigate("openorders")}
                >
                  Open Orders
                </button>
                <button
                  className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all duration-300"
                  onClick={() => navigate("/viewposition")}
                >
                  View Position
                </button>
                <button
                  className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-all duration-300"
                  onClick={() => navigate("/orders")}
                >
                  Orders
                </button>
              </>
            ) : (
              <button
                className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition-all duration-300"
                onClick={authenticate1}
              >
                Authenticate
              </button>
            )}

            {localStorage.getItem("accesstoken") && (
              <button
                className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-all duration-300"
                onClick={logout}
              >
                Logout
              </button>
            )}
          </div>

          <h2 className="text-center text-3xl font-bold mb-4">Currency Information</h2>
          <div className="overflow-x-auto shadow-lg">
            <table className="table-auto w-full border-collapse bg-white rounded-lg overflow-hidden">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-2">Currency Long</th>
                  <th className="px-4 py-2">Coin Type</th>
                  <th className="px-4 py-2">In Cross Collateral Pool</th>
                  <th className="px-4 py-2">Min Confirmations</th>
                  <th className="px-4 py-2">Fee Precision</th>
                  <th className="px-4 py-2">Min Withdrawal Fee</th>
                  <th className="px-4 py-2">Withdrawal Fee</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {currencies.map((item, index) => (
                  <tr
                    key={index}
                    className="bg-gray-50 hover:bg-gray-200 transition-all duration-150 cursor-pointer"
                    onClick={() =>
                      navigate("/currencypage", {
                        state: { currency: item },
                      })
                    }
                  >
                    <td className="px-4 py-2 border">{item.currency_long}</td>
                    <td className="px-4 py-2 border">{item.coin_type}</td>
                    <td className="px-4 py-2 border">
                      {item.in_cross_collateral_pool ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-2 border">{item.min_confirmations}</td>
                    <td className="px-4 py-2 border">{item.fee_precision}</td>
                    <td className="px-4 py-2 border">{item.min_withdrawal_fee}</td>
                    <td className="px-4 py-2 border">{item.withdrawal_fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ToastContainer />
      </>
    );
}
