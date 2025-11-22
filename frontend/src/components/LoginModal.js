import React, { useState } from 'react';
import axios from 'axios';
import './LoginModal.css';

const LoginModal = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!email || !password) {
      setMessage('Please fill in all fields');
      setIsError(true);
      return;
    }

    if (!email.includes('@')) {
      setMessage("Please include an '@' in the email address.");
      setIsError(true);
      return;
    }

    if (!isLogin) {
      if (!firstName || !lastName) {
        setMessage('Please fill in all fields');
        setIsError(true);
        return;
      }

      // Regex Validations
      const nameRegex = /^[a-zA-Z]+$/;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.(com|net|org|ca)$/;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/;

      if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        setMessage('First and Last Name must contain only letters (A-Z, a-z).');
        setIsError(true);
        return;
      }

      if (!emailRegex.test(email)) {
        setMessage('Email domain must be gmail, yahoo, hotmail, or outlook with .com, .net, .org, or .ca extension.');
        setIsError(true);
        return;
      }

      if (!passwordRegex.test(password)) {
        setMessage('Password must be 8-32 characters, with at least 1 uppercase, 1 lowercase, and 1 number.');
        setIsError(true);
        return;
      }
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    // If registering, use email as username
    const payload = isLogin 
      ? { username: email, password } 
      : { username: email, password, firstName, lastName, email };

    try {
      const res = await axios.post(`http://localhost:8080${endpoint}`, payload);
      if (isLogin) {
        onLoginSuccess(res.data.username);
        onClose();
      } else {
        setMessage('Registration successful! Please login.');
        setIsError(false);
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'An error occurred');
      setIsError(true);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title">{isLogin ? 'LOGIN' : 'REGISTER'}</h2>
        <p className="modal-subtitle">
          {isLogin ? 'Enter your email and password to login' : 'Enter your information to register'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off" noValidate>
          {!isLogin && (
            <div className="name-row">
              <div className="input-group">
                <label>First name</label>
                <input
                  type="text"
                  placeholder="Please enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label>Last name</label>
                <input
                  type="text"
                  placeholder="Please enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Please enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Please enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="submit-btn">
            {isLogin ? 'LOGIN NOW' : 'REGISTER NOW'}
          </button>
        </form>

        {message && <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>}
        
        <p className="toggle-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
