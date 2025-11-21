import React, { useState } from 'react';
import './App.css';
import DriverRegistrationForm from './components/DriverRegistrationForm';
import AdminView from './components/AdminView';

function App() {
  const [view, setView] = useState('register'); // 'register' or 'admin'

  return (
    <div className="App">
      <nav className="app-nav">
        <button 
          className={view === 'register' ? 'nav-button active' : 'nav-button'}
          onClick={() => setView('register')}
        >
          Register Driver
        </button>
        <button 
          className={view === 'admin' ? 'nav-button active' : 'nav-button'}
          onClick={() => setView('admin')}
        >
          View Registrations
        </button>
      </nav>
      
      {view === 'register' ? (
        <div className="container">
          <h1>Driver Registration</h1>
          <p className="subtitle">Please fill out the form below to register as a driver</p>
          <DriverRegistrationForm />
        </div>
      ) : (
        <AdminView />
      )}
    </div>
  );
}

export default App;

