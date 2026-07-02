import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Sparkles, Plus, MapPin } from 'lucide-react';
import api from '@/shared/api/axiosInstance';
import { toast } from 'sonner';
import { Modal } from '@/shared/components/ui/Modal';
import { Badge } from '@/shared/components/ui/badge';

interface Facility {
  _id: string;
  name: string;
  description?: string;
  managed_by?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  category?: string;
}

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({ name: '', description: '', managed_by: '', category: 'Other' });
  const [users, setUsers] = useState<any[]>([]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/facilities');
      setFacilities(res.data.data.facilities);
    } catch (err) {
      toast.error('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users?role=ADMIN&role=HOD'); // Use admin users endpoint with filters
        const retrieved = res.data.data.users || res.data.data || [];
        const filtered = retrieved.filter((u: any) => u.role === 'ADMIN' || u.role === 'HOD');
        setUsers(filtered);
      } catch (err) {
        // Fallback or ignore
      }
    };
    fetchUsers();
  }, []);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newFacility.name,
        description: newFacility.description,
        category: newFacility.category,
        ...(newFacility.managed_by ? { managed_by: newFacility.managed_by } : {})
      };
      await api.post('/facilities', payload);
      toast.success('Facility created successfully');
      setIsModalOpen(false);
      setNewFacility({ name: '', description: '', managed_by: '', category: 'Other' });
      fetchFacilities();
    } catch (err) {
      toast.error('Failed to create facility');
    }
  };

  return (
    <div className="min-h-screen bg-app text-content p-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-content-muted mb-6 font-medium">
        <button onClick={() => navigate('/dashboard/forms-surveys')} className="hover:text-content transition-colors">Forms & Surveys</button>
        <span className="text-content-muted/50">/</span>
        <span className="text-content">Custom Facilities</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Custom Facilities & Entities</h1>
          <p className="text-content/60">Manage custom evaluations for transportation, cafeterias, etc.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Facility
          </button>
          <button 
            onClick={() => navigate('/builder?target=facility')}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-panel border border-panel-hover rounded-xl transition-all font-medium text-sm"
          >
            Blank Form
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4" />
            Create with AI
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {facilities.map((facility) => (
            <div
              key={facility._id}
              onClick={() => navigate(`/dashboard/facilities/${facility._id}`)}
              className="group cursor-pointer bg-panel border border-panel rounded-2xl p-6 transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 relative"
            >
              <Badge className="absolute top-4 right-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20">{facility.category || 'Other'}</Badge>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-content mb-2">{facility.name}</h3>
              <p className="text-sm text-content/60 line-clamp-2 mb-4 h-10">
                {facility.description || 'No description provided.'}
              </p>
              <div className="pt-4 border-t border-panel flex items-center gap-2">
                <MapPin className="w-4 h-4 text-content/40" />
                <span className="text-xs text-content/60 font-medium">
                  {facility.managed_by
                    ? `Manager: ${facility.managed_by.firstName} ${facility.managed_by.lastName}`
                    : 'No manager assigned'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Facility"
      >
        <form onSubmit={handleCreateFacility} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content/80 mb-1">Name</label>
            <input
              type="text"
              required
              value={newFacility.name}
              onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
              className="w-full bg-app border border-panel-hover rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Main Cafeteria"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content/80 mb-1">Description</label>
            <textarea
              value={newFacility.description}
              onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
              className="w-full bg-app border border-panel-hover rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
              placeholder="Facility description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content/80 mb-1">Category</label>
            <select
              value={newFacility.category}
              onChange={(e) => setNewFacility({ ...newFacility, category: e.target.value })}
              className="w-full bg-app border border-panel-hover rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Service">Service</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Event">Event</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content/80 mb-1">Facility Manager (Optional)</label>
            <select
              value={newFacility.managed_by}
              onChange={(e) => setNewFacility({ ...newFacility, managed_by: e.target.value })}
              className="w-full bg-app border border-panel-hover rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">None</option>
              {users.map(u => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.firstName} {u.lastName} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-content/80 hover:bg-panel border border-transparent hover:border-panel-hover rounded-xl transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
