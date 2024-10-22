import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
export default function HomePage() {
    const [ws, setWs] = useState(null); // State to hold WebSocket instance
    const [currencies,setCurrencies]=useState([])
    const [token,setToken]=useState('')    
    const navigate=useNavigate()
    const authenticate = () => {
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
      setWs(newWs); // Save WebSocket instance to state
  
      newWs.onmessage = function (e) {
        // Parse the response from the server
        const response = JSON.parse(e.data);
  
        // Check if the response contains the token
        if (response.result && response.result.access_token) {
          const token = response.result.access_token;
          localStorage.setItem("accesstoken", token);
          setToken(token)
          console.log('Extracted token:', token);
        } else {
          console.log('No token found in the response:', response);
        }
      };
  
      newWs.onopen = function () {
        // Send the authentication message
        newWs.send(JSON.stringify(msg));
      };
    //  window.location.reload()
    };
  
    const logout = () => {
      const accessToken = localStorage.getItem("accesstoken");
      localStorage.removeItem("accesstoken")
      setToken('')
      // Check if accessToken is present
      if (!accessToken) {
        console.log('No access token found, user might already be logged out.');
        return;
      }
  
      console.log('Logging out with access token:', accessToken);
  
      if (!ws) {
        console.log('WebSocket is not initialized. Please authenticate first.');
        return;
      }
  
      // Logout message payload
      const msg = {
        "jsonrpc": "2.0",
        "method": "private/logout",
        "id": 42,
        "params": {
          "access_token": accessToken,
          "invalidate_token": true
        }
      };
  
      // Handle incoming messages
      ws.onmessage = function (e) {
        const response = JSON.parse(e.data);
        console.log('Received from server:', response);
  
        // Check if the logout was successful
        if (response.result && response.result === 'success') {
          console.log('Logout successful, clearing access token...');
          localStorage.removeItem("accesstoken");
        } else {
          console.log('Logout failed:', response);
        }
      };
  
      // Send the logout message if WebSocket is open
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else {
        console.log('WebSocket is not open.');
      }
  
      // Handle WebSocket close
      ws.onclose = function () {
        localStorage.removeItem("accesstoken")
        console.log('WebSocket connection closed.');
      };
  
      // Handle WebSocket errors
      ws.onerror = function (error) {
        console.log('WebSocket error:', error);
      };

      //window.location.reload()
    };
    
    useEffect(()=>{
    //  authenticate()
      get_currencies()
    },[])
    const get_currencies=()=>{
      var msg = 
  {
    "jsonrpc" : "2.0",
    "id" : 7538,
    "method" : "public/get_currencies",
    "params" : {
  
    }
  };
  
  var ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
  
  ws.onmessage = function (e) {
      // do something with the response...
  
      const response = JSON.parse(e.data);
      setCurrencies(response.result)
      console.log('received from server : ', response);
  };
  ws.onopen = function () {
  
    
      ws.send(JSON.stringify(msg));
  };
    }
  return (
    <>
    <h1 className='text-center text-4xl font-bold'>Deribit Trading Application</h1>
    <div className='flex justify-end mt-5'>
     { token?<div><button className='p-3 bg-red-300 rounded-full ml-4 float mx-4' onClick={()=>navigate("openorders")} >Open Orders</button> 
    <button className='p-3 bg-red-300 rounded-full ml-4 float mx-4 mt-5' onClick={()=>navigate("/viewposition")}>View Position</button>
      <button className='p-3 bg-red-300 rounded-full ml-4 float mx-4 mt-5' onClick={()=>navigate("/orders")}>Orders</button></div>:""}
      {token?<button className='p-3 bg-red-300 rounded-full ml-4 float mx-4 mt-5' onClick={logout}>
        Logout
      </button>:<button className='p-3 bg-red-300 rounded-full ml-4 float mx-4 mt-5' onClick={authenticate}>
        Authenticate
      </button>}
     
    </div>
    <h1 className="text-center text-2xl font-bold mb-4">Currency Information</h1>
    <table className="table-auto w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          <th className="border px-4 py-2">Currency Long</th>
          <th className="border px-4 py-2">Coin Type</th>
          <th className="border px-4 py-2">In Cross Collateral Pool</th>
          <th className="border px-4 py-2">Min Confirmations</th>
          <th className="border px-4 py-2">Fee Precision</th>
          <th className="border px-4 py-2">Min Withdrawal Fee</th>
          <th className="border px-4 py-2">Withdrawal Fee</th>
        </tr>
      </thead>
      <tbody>
        {currencies.map((item, index) => (
          <tr key={index} onClick={()=>{
            console.log(item.currency)
            navigate("/currencypage",{state:{
            currency:item
          }})}}>
            <td className="border px-4 py-2">{item.currency_long}</td>
            <td className="border px-4 py-2">{item.coin_type}</td>
            <td className="border px-4 py-2">{item.in_cross_collateral_pool ? 'Yes' : 'No'}</td>
            <td className="border px-4 py-2">{item.min_confirmations}</td>
            <td className="border px-4 py-2">{item.fee_precision}</td>
            <td className="border px-4 py-2">{item.min_withdrawal_fee}</td>
            <td className="border px-4 py-2">{item.withdrawal_fee}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <ToastContainer />
    </>
  )
}
