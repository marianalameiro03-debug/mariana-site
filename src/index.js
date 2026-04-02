import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LiteratureGapFinder from './LiteratureGapFinder';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/gap-finder" element={<LiteratureGapFinder />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
