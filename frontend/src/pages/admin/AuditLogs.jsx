import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import '../user/UserDashboard.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await adminAPI.getAuditLogs();
            setLogs(response.data.data.logs);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (status) => {
        switch (status) {
            case 'SUCCESS': return 'status-green';
            case 'FAILED': return 'status-red';
            default: return 'status-orange';
        }
    };

    if (loading) {
        return <div className="loading">Loading audit logs...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title">📜 Audit Logs</h1>

            <div className="card transactions-card">
                <div className="card-header">
                    <span className="card-icon">🔍</span>
                    <h3>System Activity Log</h3>
                </div>

                <div className="transactions-table">
                    {logs.length === 0 ? (
                        <div className="empty-state">
                            <p>No audit logs found</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Resource</th>
                                    <th>Status</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{formatDateTime(log.timestamp)}</td>
                                        <td>{log.userEmail}</td>
                                        <td><strong>{log.action}</strong></td>
                                        <td>{log.resource || 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge ${getActionColor(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="txn-id">{log.ipAddress || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="transaction-summary">
                    Showing {logs.length} audit entries
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
