import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../contexts/AuthContext';
import { Users, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const roleColors = {
  admin: { bg: '#1B4332', text: 'white' },
  farmer: { bg: '#52796F', text: 'white' },
  agriculture_officer: { bg: '#457B9D', text: 'white' },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || []);
    } catch (err) {
      if (err.response?.status === 403) toast.error('Admin access required');
      else toast.error('Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to delete'); }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 lg:p-8" data-testid="users-page-no-access">
        <Card className="border border-[#E2E8F0] shadow-none">
          <CardContent className="py-16 text-center">
            <ShieldAlert size={40} className="mx-auto text-[#E07A5F] mb-3" strokeWidth={1.5} />
            <p className="text-lg font-semibold text-[#1E293B]">Admin Access Required</p>
            <p className="text-sm text-[#94A3B8] mt-1">You need admin privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="loading-spinner" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="users-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">User Management</h1>
        <p className="text-sm text-[#475569] mt-1">{users.length} registered users</p>
      </div>

      <Card className="border border-[#E2E8F0] shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E2E8F0]">
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Email</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Role</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Joined</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const rc = roleColors[u.role] || roleColors.farmer;
                  return (
                    <TableRow key={u.id} className="border-[#E2E8F0] hover:bg-[#F3F2EE]">
                      <TableCell className="text-sm font-medium text-[#1E293B]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: rc.bg }}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          {u.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">{u.email}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: rc.bg, color: rc.text }} className="text-xs capitalize">
                          {u.role?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[#94A3B8]">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        {u.id !== currentUser?._id && u.id !== currentUser?.id && (
                          <Button variant="ghost" size="sm" onClick={() => deleteUser(u.id, u.name)} data-testid={`delete-user-${u.id}`} className="text-[#E07A5F] hover:text-[#E07A5F] hover:bg-[#E07A5F]/10">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
