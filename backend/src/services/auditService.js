import { AuditLog } from '../models/AuditLog.js';

/**
 * Audit Service - Logs all critical actions
 */
export class AuditService {
    /**
     * Log an action
     * @param {object} logData - Audit log data
     */
    static async log(logData) {
        try {
            const auditLog = new AuditLog({
                userId: logData.userId,
                action: logData.action,
                resource: logData.resource,
                ipAddress: logData.ipAddress,
                userAgent: logData.userAgent,
                status: logData.status || 'success',
                metadata: logData.metadata
            });

            await auditLog.save();
        } catch (error) {
            // Don't throw error if audit logging fails - just log it
            console.error('Audit logging error:', error);
        }
    }

    /**
     * Get audit logs with filters
     * @param {object} filters - Query filters
     * @param {number} limit - Number of records
     * @returns {Array} - Audit log entries
     */
    static async getLogs(filters = {}, limit = 100) {
        try {
            return await AuditLog.find(filters)
                .populate('userId', 'email')
                .sort({ timestamp: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            throw error;
        }
    }
}
