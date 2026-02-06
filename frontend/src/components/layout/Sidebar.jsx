import { NavLink } from 'react-router-dom';
import {
    FaChartLine,
    FaMoneyBillWave,
    FaPaperPlane,
    FaLandmark,
    FaHistory,
    FaTachometerAlt,
    FaUsers,
    FaExchangeAlt,
    FaUniversity,
    FaClipboardList
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isAdmin }) => {
    const userMenuItems = [
        { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
        { path: '/payin', icon: FaMoneyBillWave, label: 'Add Money' },
        { path: '/payout', icon: FaPaperPlane, label: 'Send Money' },
        { path: '/pay-tax', icon: FaLandmark, label: 'Pay Tax' },
        { path: '/history', icon: FaHistory, label: 'History' }
    ];

    const adminMenuItems = [
        { path: '/admin', icon: FaChartLine, label: 'Dashboard' },
        { path: '/admin/users', icon: FaUsers, label: 'Users' },
        { path: '/admin/transactions', icon: FaExchangeAlt, label: 'Transactions' },
        { path: '/admin/treasury', icon: FaUniversity, label: 'Treasury' },
        { path: '/admin/audit-logs', icon: FaClipboardList, label: 'Audit Logs' }
    ];

    const menuItems = isAdmin ? adminMenuItems : userMenuItems;

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? 'sidebar-link active' : 'sidebar-link'
                            }
                        >
                            <IconComponent className="sidebar-icon" />
                            <span className="sidebar-label">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
