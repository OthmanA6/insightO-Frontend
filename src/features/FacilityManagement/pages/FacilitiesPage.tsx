import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Sparkles, Plus, MapPin } from 'lucide-react';
import api from '@/shared/api/axiosInstance';
import { toast } from 'sonner';
import { Modal } from '@/shared/components/ui/Modal';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu';
import { MoreVertical, Edit3, Trash2 } from 'lucide-react';

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
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
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

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newFacility.name,
        description: newFacility.description,
        category: newFacility.category,
        ...(newFacility.managed_by ? { managed_by: newFacility.managed_by } : {})
      };
      if (editingFacility) {
        await api.patch(`/facilities/${editingFacility._id}`, payload);
        toast.success('Facility updated successfully');
      } else {
        await api.post('/facilities', payload);
        toast.success('Facility created successfully');
      }
      setIsModalOpen(false);
      setNewFacility({ name: '', description: '', managed_by: '', category: 'Other' });
      setEditingFacility(null);
      fetchFacilities();
    } catch (err) {
      toast.error(editingFacility ? 'Failed to update facility' : 'Failed to create facility');
    }
  };

  const openEditModal = (facility: Facility, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFacility(facility);
    setNewFacility({
      name: facility.name,
      description: facility.description || '',
      managed_by: facility.managed_by?._id || '',
      category: facility.category || 'Other'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this facility?")) {
      try {
        await api.delete(`/facilities/${id}`);
        toast.success("Facility deleted successfully");
        fetchFacilities();
      } catch (err) {
        toast.error("Failed to delete facility");
      }
    }
  };

  return (
    <div className="min-h-screen text-content p-8">
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
            onClick={() => {
              setEditingFacility(null);
              setNewFacility({ name: '', description: '', managed_by: '', category: 'Other' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Facility
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
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6 text-indigo-400" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button onClick={(e) => e.stopPropagation()} className="h-8 w-8 rounded-lg hover:bg-panel-hover flex items-center justify-center text-content-muted">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-app border-panel">
                    <DropdownMenuItem 
                      onClick={(e) => openEditModal(facility, e)}
                      className="flex items-center gap-2 text-indigo-400 font-medium cursor-pointer hover:bg-panel-hover"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleDelete(facility._id, e)}
                      className="flex items-center gap-2 text-red-400 font-medium cursor-pointer hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingFacility(null);
          setNewFacility({ name: '', description: '', managed_by: '', category: 'Other' });
        }}
        title={editingFacility ? "Edit Facility" : "Create New Facility"}
      >
        <form onSubmit={handleSaveFacility} className="space-y-4">
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
              {editingFacility ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
