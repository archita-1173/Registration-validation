import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminView.css';

// API URL - this is where we get the registration data from
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AdminView() {
  // State to store all registrations
  const [registrations, setRegistrations] = useState([]);
  // State to show loading message
  const [loading, setLoading] = useState(true);
  // State to store error message
  const [error, setError] = useState(null);

  // This runs when the component first loads
  useEffect(function() {
    fetchRegistrations();
  }, []);

  // Function to get registrations from the backend
  async function fetchRegistrations() {
    try {
      setLoading(true);
      const response = await axios.get(API_URL + '/registrations');
      setRegistrations(response.data);
      setError(null);
    } catch (err) {
      // Handle errors
      let errorMessage = 'Failed to fetch registrations: ';
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = errorMessage + err.response.data.error;
      } else {
        errorMessage = errorMessage + err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Function to get CSS class name for status badge
  function getStatusBadgeClass(status) {
    if (status === 'validated') {
      return 'status-validated';
    } else if (status === 'failed') {
      return 'status-failed';
    } else if (status === 'pending') {
      return 'status-pending';
    } else {
      return '';
    }
  }

  // Function to count pending registrations
  function countPending() {
    let count = 0;
    for (let i = 0; i < registrations.length; i++) {
      if (registrations[i].validation_status === 'pending') {
        count = count + 1;
      }
    }
    return count;
  }

  // Function to count validated registrations
  function countValidated() {
    let count = 0;
    for (let i = 0; i < registrations.length; i++) {
      if (registrations[i].validation_status === 'validated') {
        count = count + 1;
      }
    }
    return count;
  }

  // Function to count failed registrations
  function countFailed() {
    let count = 0;
    for (let i = 0; i < registrations.length; i++) {
      if (registrations[i].validation_status === 'failed') {
        count = count + 1;
      }
    }
    return count;
  }

  // Show loading message while fetching data
  if (loading) {
    return <div className="admin-container">Loading registrations...</div>;
  }

  // Show error message if something went wrong
  if (error) {
    return (
      <div className="admin-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchRegistrations} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Driver Registrations</h1>
        <button onClick={fetchRegistrations} className="refresh-button">Refresh</button>
      </div>
      
      {registrations.length === 0 ? (
        <div className="no-registrations">No registrations found.</div>
      ) : (
        <div className="registrations-table-container">
          <table className="registrations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>License Expiry</th>
                <th>Insurance Expiry</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Validated At</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(function(reg) {
                return (
                  <tr key={reg.id}>
                    <td>{reg.id}</td>
                    <td>{reg.first_name} {reg.last_name}</td>
                    <td>{reg.email}</td>
                    <td>{reg.phone}</td>
                    <td>{new Date(reg.license_expiry_date).toLocaleDateString()}</td>
                    <td>{new Date(reg.insurance_expiry_date).toLocaleDateString()}</td>
                    <td>
                      <span className={'status-badge ' + getStatusBadgeClass(reg.validation_status)}>
                        {reg.validation_status || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(reg.created_at).toLocaleString()}</td>
                    <td>{reg.validated_at ? new Date(reg.validated_at).toLocaleString() : '-'}</td>
                    <td className="notes-cell" title={reg.validation_notes || ''}>
                      {reg.validation_notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="stats">
        <div className="stat-item">
          <strong>Total:</strong> {registrations.length}
        </div>
        <div className="stat-item">
          <strong>Pending:</strong> {countPending()}
        </div>
        <div className="stat-item">
          <strong>Validated:</strong> {countValidated()}
        </div>
        <div className="stat-item">
          <strong>Failed:</strong> {countFailed()}
        </div>
      </div>
    </div>
  );
}

export default AdminView;
