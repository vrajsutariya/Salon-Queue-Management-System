import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { JoinQueue } from './pages/JoinQueue';
import { MyStatus } from './pages/MyStatus';
import { Reception } from './pages/Reception';
import { BarberView } from './pages/BarberView';
import { WaitingAreaTV } from './pages/WaitingAreaTV';
import { AdminSettings } from './pages/AdminSettings';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--bg-dark)' }}>
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/join" element={<JoinQueue />} />
              <Route path="/status/:id" element={<MyStatus />} />
              <Route path="/status" element={<Navigate to="/join" replace />} />
              <Route path="/reception" element={<Reception />} />
              <Route path="/barber/:name" element={<BarberView />} />
              <Route path="/barber" element={<Navigate to="/barber/Rahul" replace />} />
              <Route path="/display" element={<WaitingAreaTV />} />
              <Route path="/admin" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
