import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, UserPlus, Shield, Briefcase, User as UserIcon } from 'lucide-react';
import { teamService } from '../../services/analyticsService';
import { User, UserRole } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';

export const Team: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF' as UserRole
  });

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await teamService.list();
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await teamService.create(formData);
      if (res.data.success) {
        setModalOpen(false);
        loadTeam();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await teamService.updateRole(userId, { role: newRole });
      loadTeam();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Team & Role-Based Access Control</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Manage enterprise operators, role permissions (Admin, Staff, Customer), and security privileges.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          icon={<Plus className="h-4 w-4 text-chartreuse" />}
        >
          Add Staff Member
        </Button>
      </div>

      {loading ? (
        <Loader rows={4} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
              <tr>
                <th className="px-5 py-3.5">Member & Email</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Permission Scope</th>
                <th className="px-5 py-3.5 text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordergrey">
              {users.map((u) => (
                <tr key={u.id || (u as any)._id} className="hover:bg-ivory/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt="avatar"
                        className="h-8 w-8 rounded-full object-cover border border-bordergrey"
                      />
                      <div>
                        <p className="font-semibold text-obsidian">{u.name}</p>
                        <p className="text-[11px] text-slategrey">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'ADMIN' ? 'bg-obsidian text-chartreuse' : u.role === 'STAFF' ? 'bg-forest text-white' : 'bg-ivory text-forest border border-bordergrey'
                    }`}>
                      {u.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                      {u.role === 'STAFF' && <Briefcase className="h-3 w-3" />}
                      {u.role === 'CUSTOMER' && <UserIcon className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slategrey">
                    {u.role === 'ADMIN' && 'Full administrative privilege across all products, subscriptions, billing and audit logs'}
                    {u.role === 'STAFF' && 'Customer management, quotations, subscription viewing, and payment recording'}
                    {u.role === 'CUSTOMER' && 'Restricted to self-service portal, own invoices, and plan change requests'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id || (u as any)._id, e.target.value as UserRole)}
                      className="rounded-lg border border-bordergrey p-1 text-xs outline-none bg-white font-semibold"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="CUSTOMER">CUSTOMER</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Team Operator"
        subtitle="Provision an enterprise staff or administrator profile."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-obsidian mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Corporate Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Temporary Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Role Permission</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full rounded-lg border border-bordergrey p-2 outline-none bg-white"
            >
              <option value="STAFF">STAFF (Customer & Payments Management)</option>
              <option value="ADMIN">ADMIN (Full Cloud Control)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Create Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
