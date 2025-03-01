import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigator from './components/views/nav/navigator';
import Dashboard from './components/views/Homepage_dashboard/dashboard';
import LoginRegister from './components/views/LoginRegister/LoginRegister';
import Healthcare from './components/views/Healthcare_page/healthcare';
import Plant_page from './components/views/Plant_page/plant';
import './components/assests/css/output.css'; // Import Tailwind CSS
import './App.css';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <div className="app-container">
      {!isLoginPage && (
        <div className="navigator-container">
          <Navigator />
        </div>
      )}
      <div className={isLoginPage ? "content full-content" : "content"}>
        <Routes>
          <Route path="/" element={<LoginRegister />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/healthcare" element={<Healthcare />} />
          <Route path="/plant" element={<Plant_page />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;