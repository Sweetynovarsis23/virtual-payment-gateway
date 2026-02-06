import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaLandmark, FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">
                    <FaLandmark className="brand-icon" />
                    <div className="brand-content">
                        <span className="brand-text">Virtual Payment Gateway</span>
                        <span className="brand-subtitle">Government Treasury Platform</span>
                    </div>
                </Link>

                <div className="navbar-menu">
                    {user && (
                        <>
                            <div className="navbar-user">
                                <FaUser className="user-icon" />
                                <span className="user-email">{user.email}</span>
                                {user.role === 'admin' && (
                                    <span className="admin-badge">Administrator</span>
                                )}
                            </div>
                            <button onClick={handleLogout} className="btn-logout">
                                <FaSignOutAlt /> Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
