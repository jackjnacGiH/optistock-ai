import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Scan from './pages/Scan';
import ProductSearch from './pages/ProductSearch';
import History from './pages/History';
import AiAnalysis from './pages/AiAnalysis';
import Debug from './pages/Debug';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="scan" element={<Scan />} />
                    <Route path="search" element={<ProductSearch />} />
                    <Route path="history" element={<History />} />
                    <Route path="ai-analysis" element={<AiAnalysis />} />
                    <Route path="debug" element={<Debug />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
