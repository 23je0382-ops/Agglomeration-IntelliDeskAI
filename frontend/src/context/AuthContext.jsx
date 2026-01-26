import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Verify token and get user info
            fetch('http://127.0.0.1:8000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Invalid token');
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

    const login = async (email, password) => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await res.json();
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
            const res = await fetch('http://127.0.0.1:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Registration failed');
            }

            const data = await res.json();
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
        <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
