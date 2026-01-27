import { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Verify token and get user info
            fetchAPI('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(userData => {
                    setUser(userData);
                })
                .catch(() => {
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    const refreshUser = async () => {
        if (!token) return;
        try {
            const userData = await fetchAPI('/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(userData);
        } catch (err) {
            console.error("Failed to refresh user:", err);
        }
    };

    const login = async (email, password) => {
        try {
            const data = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            setUser(data.user);
            return true;
        } catch (error) {
            throw error;
        }
    };

    const register = async (email, password, name) => {
        try {
            const data = await fetchAPI('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, name })
            });
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            setUser(data.user);
            return true;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            register,
            logout,
            refreshUser,
            loading,
            isAuthenticated: !!user,
            isAdmin: user?.role?.trim().toLowerCase() === 'admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

