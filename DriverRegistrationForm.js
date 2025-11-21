import React, { useState } from 'react';
import axios from 'axios';
import './DriverRegistrationForm.css';

// API URL - this is where we send the form data
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function DriverRegistrationForm() {
  // State variables for each form field
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  
  // State variables for uploaded files
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [insuranceDoc, setInsuranceDoc] = useState(null);
  
  // State variables for error messages
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [licenseExpiryDateError, setLicenseExpiryDateError] = useState('');
  const [insuranceExpiryDateError, setInsuranceExpiryDateError] = useState('');
  const [licenseDocError, setLicenseDocError] = useState('');
  const [insuranceDocError, setInsuranceDocError] = useState('');
  
  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitMessageType, setSubmitMessageType] = useState('');

  // Function to handle first name input change
  function handleFirstNameChange(event) {
    setFirstName(event.target.value);
    setFirstNameError(''); // Clear error when user types
  }

  // Function to handle last name input change
  function handleLastNameChange(event) {
    setLastName(event.target.value);
    setLastNameError('');
  }

  // Function to handle email input change
  function handleEmailChange(event) {
    setEmail(event.target.value);
    setEmailError('');
  }

  // Function to handle phone input change
  function handlePhoneChange(event) {
    setPhone(event.target.value);
    setPhoneError('');
  }

  // Function to handle license expiry date change
  function handleLicenseExpiryDateChange(event) {
    setLicenseExpiryDate(event.target.value);
    setLicenseExpiryDateError('');
  }

  // Function to handle insurance expiry date change
  function handleInsuranceExpiryDateChange(event) {
    setInsuranceExpiryDate(event.target.value);
    setInsuranceExpiryDateError('');
  }

  // Function to handle license document file selection
  function handleLicenseDocChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      setLicenseDoc(event.target.files[0]);
      setLicenseDocError('');
    }
  }

  // Function to handle insurance document file selection
  function handleInsuranceDocChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      setInsuranceDoc(event.target.files[0]);
      setInsuranceDocError('');
    }
  }

  // Function to validate all form fields
  function validateForm() {
    let isValid = true;

    // Check if first name is empty
    if (firstName.trim() === '') {
      setFirstNameError('First name is required');
      isValid = false;
    }

    // Check if last name is empty
    if (lastName.trim() === '') {
      setLastNameError('Last name is required');
      isValid = false;
    }

    // Check if email is empty
    if (email.trim() === '') {
      setEmailError('Email is required');
      isValid = false;
    } else {
      // Check if email format is valid
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        setEmailError('Please enter a valid email address');
        isValid = false;
      }
    }

    // Check if phone is empty
    if (phone.trim() === '') {
      setPhoneError('Phone number is required');
      isValid = false;
    } else {
      // Check if phone has valid characters
      const phonePattern = /^[\d\s\-\+\(\)]+$/;
      if (!phonePattern.test(phone)) {
        setPhoneError('Please enter a valid phone number');
        isValid = false;
      }
    }

    // Check if license expiry date is empty
    if (licenseExpiryDate === '') {
      setLicenseExpiryDateError('License expiry date is required');
      isValid = false;
    } else {
      // Check if date is in the future
      const expiryDate = new Date(licenseExpiryDate);
      const today = new Date();
      if (expiryDate < today) {
        setLicenseExpiryDateError('License expiry date must be in the future');
        isValid = false;
      }
    }

    // Check if insurance expiry date is empty
    if (insuranceExpiryDate === '') {
      setInsuranceExpiryDateError('Insurance expiry date is required');
      isValid = false;
    } else {
      // Check if date is in the future
      const expiryDate = new Date(insuranceExpiryDate);
      const today = new Date();
      if (expiryDate < today) {
        setInsuranceExpiryDateError('Insurance expiry date must be in the future');
        isValid = false;
      }
    }

    // Check if license document is selected
    if (licenseDoc === null) {
      setLicenseDocError('License document is required');
      isValid = false;
    } else {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(licenseDoc.type)) {
        setLicenseDocError('License document must be JPEG, PNG, or PDF');
        isValid = false;
      }
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024;
      if (licenseDoc.size > maxSize) {
        setLicenseDocError('License document must be less than 10MB');
        isValid = false;
      }
    }

    // Check if insurance document is selected
    if (insuranceDoc === null) {
      setInsuranceDocError('Insurance document is required');
      isValid = false;
    } else {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(insuranceDoc.type)) {
        setInsuranceDocError('Insurance document must be JPEG, PNG, or PDF');
        isValid = false;
      }
      // Check file size
      const maxSize = 10 * 1024 * 1024;
      if (insuranceDoc.size > maxSize) {
        setInsuranceDocError('Insurance document must be less than 10MB');
        isValid = false;
      }
    }

    return isValid;
  }

  // Function to handle form submission
  async function handleSubmit(event) {
    event.preventDefault(); // Prevent page from refreshing
    
    // Clear previous messages
    setSubmitMessage('');
    setSubmitMessageType('');

    // Validate form before submitting
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    // Set submitting state to show loading
    setIsSubmitting(true);

    try {
      // Create FormData object to send files
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', firstName);
      formDataToSend.append('lastName', lastName);
      formDataToSend.append('email', email);
      formDataToSend.append('phone', phone);
      formDataToSend.append('licenseExpiryDate', licenseExpiryDate);
      formDataToSend.append('insuranceExpiryDate', insuranceExpiryDate);
      formDataToSend.append('licenseDoc', licenseDoc);
      formDataToSend.append('insuranceDoc', insuranceDoc);

      // Send data to backend API
      const response = await axios.post(API_URL + '/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show success message
      setSubmitMessage('Registration successful! Your documents will be validated within the next hour.');
      setSubmitMessageType('success');

      // Reset all form fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setLicenseExpiryDate('');
      setInsuranceExpiryDate('');
      setLicenseDoc(null);
      setInsuranceDoc(null);

      // Reset file input elements
      document.getElementById('licenseDoc').value = '';
      document.getElementById('insuranceDoc').value = '';

    } catch (error) {
      // Show error message
      let errorText = 'Registration failed. Please try again.';
      if (error.response && error.response.data && error.response.data.error) {
        errorText = error.response.data.error;
      }
      setSubmitMessage(errorText);
      setSubmitMessageType('error');
    } finally {
      // Always set submitting to false when done
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="form-group">
        <label htmlFor="firstName">First Name *</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={firstName}
          onChange={handleFirstNameChange}
          className={firstNameError ? 'error' : ''}
        />
        {firstNameError && <span className="error-message">{firstNameError}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="lastName">Last Name *</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={lastName}
          onChange={handleLastNameChange}
          className={lastNameError ? 'error' : ''}
        />
        {lastNameError && <span className="error-message">{lastNameError}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={handleEmailChange}
          className={emailError ? 'error' : ''}
        />
        {emailError && <span className="error-message">{emailError}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone *</label>
        <input
          type="text"
          id="phone"
          name="phone"
          value={phone}
          onChange={handlePhoneChange}
          className={phoneError ? 'error' : ''}
          placeholder="+1 (555) 123-4567"
        />
        {phoneError && <span className="error-message">{phoneError}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="licenseDoc">License Document *</label>
        <input
          type="file"
          id="licenseDoc"
          name="licenseDoc"
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          onChange={handleLicenseDocChange}
          className={licenseDocError ? 'error' : ''}
        />
        {licenseDocError && <span className="error-message">{licenseDocError}</span>}
        {licenseDoc && (
          <span className="file-name">Selected: {licenseDoc.name}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="licenseExpiryDate">License Expiry Date *</label>
        <input
          type="date"
          id="licenseExpiryDate"
          name="licenseExpiryDate"
          value={licenseExpiryDate}
          onChange={handleLicenseExpiryDateChange}
          className={licenseExpiryDateError ? 'error' : ''}
        />
        {licenseExpiryDateError && (
          <span className="error-message">{licenseExpiryDateError}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="insuranceDoc">Insurance Document *</label>
        <input
          type="file"
          id="insuranceDoc"
          name="insuranceDoc"
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          onChange={handleInsuranceDocChange}
          className={insuranceDocError ? 'error' : ''}
        />
        {insuranceDocError && <span className="error-message">{insuranceDocError}</span>}
        {insuranceDoc && (
          <span className="file-name">Selected: {insuranceDoc.name}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="insuranceExpiryDate">Insurance Expiry Date *</label>
        <input
          type="date"
          id="insuranceExpiryDate"
          name="insuranceExpiryDate"
          value={insuranceExpiryDate}
          onChange={handleInsuranceExpiryDateChange}
          className={insuranceExpiryDateError ? 'error' : ''}
        />
        {insuranceExpiryDateError && (
          <span className="error-message">{insuranceExpiryDateError}</span>
        )}
      </div>

      {submitMessage && (
        <div className={'submit-status ' + submitMessageType}>
          {submitMessage}
        </div>
      )}

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Registration'}
      </button>
    </form>
  );
}

export default DriverRegistrationForm;

