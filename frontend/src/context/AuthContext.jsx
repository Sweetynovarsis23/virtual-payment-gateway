import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await authAPI.getProfile();
                setUser(response.data.data.user);
                setWallet(response.data.data.wallet);
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        setUser(user);
        await checkAuth(); // Get wallet info
        return response;
    };

    const register = async (email, password) => {
        const response = await authAPI.register({ email, password });
        const { token, user, wallet } = response.data.data;
        localStorage.setItem('token', token);
        setUser(user);
        setWallet(wallet);
        return response;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setWallet(null);
    };

    const value = {
        user,
        wallet,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
