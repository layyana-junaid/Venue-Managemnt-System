// import './App.css'

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import VerifyEmail from './pages/Verify-email';
import Dashboard from './pages/Dashboard';

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('user', user?.user?.role)
  const isAuthenticated = !!user;
  const isAdmin = user?.user?.role === 'admin';

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                isAdmin ? <Dashboard /> : <Home />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
