import React, { useEffect, useState } from 'react';
import CurrencyPage from './components/CurrencyPage';
import { BrowserRouter,Route,Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import Orders from './components/Orders';
import ViewPosition from './components/ViewPosition';
import OpenOrders from './components/OpenOrders';
export default function App() {
 
  return (

      <BrowserRouter>
    <Routes>
      <Route exact path="/" element={<HomePage />} />
      <Route exact path='/currencypage' element={<CurrencyPage/>}/>
      <Route exact path='/orders' element={<Orders/>}/>
      <Route exact path='/viewposition' element={<ViewPosition/>}/>
      <Route exact path='/openorders' element={<OpenOrders/>}/>
    </Routes>
    
  </BrowserRouter>
    
  );
}
