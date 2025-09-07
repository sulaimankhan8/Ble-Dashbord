import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DownloadApp from "./DownloadApp";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/download" element={<DownloadApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
