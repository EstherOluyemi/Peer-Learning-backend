import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();
const USE_MOCK_AUTH = false; // Set to false when backend is ready

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserFromResponse = (response, fallbackRole) => {
    if (!response) return null;
    const data = response.data || response;
    
    // Check for "user" or "tutor" keys as per backend controllers
    const userPayload = data.user || data.tutor || data?.data?.user || data?.data?.tutor || data?.data || null;
    if (!userPayload) return null;
    
    // Normalize role: backend returns "student" but frontend uses "learner"
    // Also handle cases where userPayload might not have role yet (tutor responses in controller.md)
    let normalizedRole = userPayload.role || fallbackRole;
    if (normalizedRole === 'student') {
      normalizedRole = 'learner';
    }
    
    return { ...userPayload, role: normalizedRole };
  };

  const getTokenFromResponse = (response) => {
    if (!response) return null;
    const data = response.data || response;
    return data.token || data?.data?.token || null;
  };

  // Check for stored user on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('peerlearn_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Trust localStorage on refresh - don't verify with backend
          // Backend auth will be checked on actual API calls via 401 responses
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('peerlearn_user');
          localStorage.removeItem('peerlearn_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials, role = null) => {
    // Mock authentication
    if (USE_MOCK_AUTH) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const foundUser = Object.values(mockUsers).find(
            u => u.email === credentials.email && u.password === credentials.password
          );
          
          if (foundUser) {
            const userData = { ...foundUser };
            setUser(userData);
            localStorage.setItem('peerlearn_user', JSON.stringify({ 
              id: userData.id, 
              role: userData.role,
              name: userData.name 
            }));
            resolve(userData);
          } else {
            reject(new Error('Invalid email or password'));
          }
        }, 500); // Simulate network delay
      });
    }

    // Real API authentication
    try {
      console.log('🔐 Login attempt with credentials:', { email: credentials.email, role });
      
      // If role is provided, use the specific endpoint
      if (role) {
        const endpoint = role === 'tutor' ? '/v1/tutor/auth/login' : '/v1/learner/auth/login';
        console.log('📍 Using endpoint:', endpoint);
        const response = await api.post(endpoint, credentials);
        console.log('✅ Login response:', response);
        const userData = getUserFromResponse(response, role);
        console.log('👤 Extracted user data:', userData);
        if (!userData) {
          throw new Error('Invalid auth response');
        }
        const token = getTokenFromResponse(response);
        if (token) {
          localStorage.setItem('peerlearn_token', token);
        }
        setUser(userData);
        localStorage.setItem('peerlearn_user', JSON.stringify({ 
          id: userData.id, 
          role: userData.role,
          name: userData.name 
        }));
        return userData;
      }

      // If no role is provided, try learner first, then tutor
      console.log('📍 No role specified, trying learner first...');
      try {
        const response = await api.post('/v1/learner/auth/login', credentials);
        console.log('✅ Learner login response:', response);
        const userData = getUserFromResponse(response, 'learner');
        console.log('👤 Learner user data:', userData);
        if (!userData) {
          throw new Error('Invalid auth response');
        }
        const token = getTokenFromResponse(response);
        if (token) {
          localStorage.setItem('peerlearn_token', token);
        }
        setUser(userData);
        localStorage.setItem('peerlearn_user', JSON.stringify({ 
          id: userData.id, 
          role: userData.role,
          name: userData.name 
        }));
        return userData;
      } catch (learnerError) {
        // If learner login fails, try tutor
        console.log('❌ Learner login failed, trying tutor...');
        try {
          const response = await api.post('/v1/tutor/auth/login', credentials);
          console.log('✅ Tutor login response:', response);
          const userData = getUserFromResponse(response, 'tutor');
          console.log('👤 Tutor user data:', userData);
          if (!userData) {
            throw new Error('Invalid auth response');
          }
          const token = getTokenFromResponse(response);
          if (token) {
            localStorage.setItem('peerlearn_token', token);
          }
          setUser(userData);
          localStorage.setItem('peerlearn_user', JSON.stringify({ 
            id: userData.id, 
            role: userData.role,
            name: userData.name 
          }));
          return userData;
        } catch (tutorError) {
          // If both fail, throw the original error (usually 401)
          throw learnerError;
        }
      }
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (userData, role = 'learner') => {
    try {
      const endpoint = role === 'tutor' ? '/v1/tutor/auth/register' : '/v1/learner/auth/register';
      console.log('Registering as:', role, 'to endpoint:', endpoint);
      const response = await api.post(endpoint, userData);
      console.log('Registration response:', response);
      
      // Token is now in HTTP-only cookie
      const newUser = getUserFromResponse(response, role);
      console.log('Extracted user from response:', newUser);
      if (!newUser) {
        throw new Error('Invalid auth response');
      }
      const token = getTokenFromResponse(response);
      if (token) {
        localStorage.setItem('peerlearn_token', token);
        console.log('Token saved to localStorage');
      }
      setUser(newUser);
      // Store only non-sensitive user info and role
      const storedData = { 
        id: newUser.id, 
        role: newUser.role,
        name: newUser.name 
      };
      localStorage.setItem('peerlearn_user', JSON.stringify(storedData));
      console.log('User data saved to localStorage:', storedData);
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const role = user?.role || JSON.parse(localStorage.getItem('peerlearn_user'))?.role || 'learner';
      const endpoint = role === 'tutor' ? '/v1/tutor/auth/logout' : '/v1/learner/auth/logout';
      await api.post(endpoint);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('peerlearn_user');
      localStorage.removeItem('peerlearn_token');
    }
  };

  // Update user function
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    // Keep role and ID in localStorage
    localStorage.setItem('peerlearn_user', JSON.stringify({ 
      id: updatedUser.id, 
      role: updatedUser.role,
      name: updatedUser.name 
    }));
  };

  // Check if user is tutor/learner
  const isTutor = user?.role === 'tutor';
  const isLearner = user?.role === 'learner';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isTutor,
    isLearner,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};