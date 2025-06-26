import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Tag, 
  MessageSquare, 
  Edit,
  Save,
  Plus,
  Clock,
  FileText,
  CheckCircle,
  X,
  Video,
  PhoneCall,
  Trash2
} from 'lucide-react';
import type { Lead, CRMActivity } from '../../types/crm';
import { addLeadActivity, getLeadActivities, deleteCrmLead } from '../../lib/crm';
import AlertModal from '../AlertModal';

interface LeadDetailsProps {
  lead: Lead;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onClose: () => void;
  onDelete?: (id: string) => void; // Optional callback for when a lead is deleted
}

const LeadDetails: React.FC<LeadDetailsProps> = ({ lead, onUpdate, onClose, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(lead);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [newActivity, setNewActivity] = useState({
    type: 'note' as const,
    description: '',
    outcome: '',
    next_action: ''
  });
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [lead.id]);

  const loadActivities = async () => {
    try {
      const data = await getLeadActivities(lead.id);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleSave = () => {
    onUpdate(lead.id, editData);
    setIsEditing(false);
  };

  const handleAddActivity = async () => {
    try {
      await addLeadActivity({
        lead_id: lead.id,
        ...newActivity,
        created_by: 'admin' // In a real app, this would be the current user
      });
      
      setNewActivity({
        type: 'note',
        description: '',
        outcome: '',
        next_action: ''
      });
      setShowActivityForm(false);
      loadActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleDeleteLead = async () => {
    setAlertInfo({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete lead "${lead.name}"? This will also delete all associated activities.`,
      type: 'info'
    });
    setShowAlert(true);
  };

  const confirmDeleteLead = async () => {
    setDeleting(true);
    try {
      await deleteCrmLead(lead.id);
      setAlertInfo({
        title: 'Lead Deleted',
        message: 'Lead and all associated activities have been successfully deleted.',
        type: 'success'
      });
      setShowAlert(true);
      
      // Close the modal after a short delay
      setTimeout(() => {
        if (onDelete) onDelete(lead.id);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error deleting lead:', error);
      setAlertInfo({
        title: 'Deletion Failed',
        message: 'Failed to delete lead: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error'
      });
      setShowAlert(true);
      setDeleting(false);
    }
  };

  const addCallNote = (note: string) => {
    const updatedNotes = [...(editData.call_notes || []), note];
    setEditData({...editData, call_notes: updatedNotes});
  };

  const addTag = (tag: string) => {
    if (!editData.tags?.includes(tag)) {
      const updatedTags = [...(editData.tags || []), tag];
      setEditData({...editData, tags: updatedTags});
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = editData.tags?.filter(tag => tag !== tagToRemove) || [];
    setEditData({...editData, tags: updatedTags});
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'document_sent': return <FileText className="w-4 h-4" />;
      case 'follow_up': return <Clock className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Lead Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteLead}
              disabled={deleting}
              className="p-2 hover:bg-red-100 rounded text-red-600"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {lead.consultation_type === 'video' ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                <span className="capitalize">{lead.source}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-600" />
              <span>{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-600" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status and Investment */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {isEditing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                className="admin-select w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            ) : (
              <span className="text-sm font-medium capitalize">{lead.status.replace('_', ' ')}</span>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accredited</label>
            {isEditing ? (
              <select
                value={editData.accredited?.toString() || 'null'}
                onChange={(e) => setEditData({...editData, accredited: e.target.value === 'null' ? null : e.target.value === 'true'})}
                className="admin-select w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
              >
                <option value="null">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <span className="text-sm">
                {lead.accredited === null ? 'Unknown' : lead.accredited ? 'Yes' : 'No'}
              </span>
            )}
          </div>
        </div>

        {/* Investment Interest */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Investment Interest</label>
          {isEditing ? (
            <input
              type="number"
              value={editData.investment_interest || ''}
              onChange={(e) => setEditData({...editData, investment_interest: parseInt(e.target.value) || undefined})}
              className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
              placeholder="Investment amount"
            />
          ) : (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(lead.investment_interest)}
              </span>
            </div>
          )}
        </div>

        {/* Contact Origin */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Origin</label>
          {isEditing ? (
            <input
              type="text"
              value={editData.contact_origin}
              onChange={(e) => setEditData({...editData, contact_origin: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
            />
          ) : (
            <span className="text-sm">{lead.contact_origin}</span>
          )}
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {editData.tags?.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center gap-1">
                {tag}
                {isEditing && (
                  <button onClick={() => removeTag(tag)} className="text-red-500 hover:text-red-700">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-1">
              <button onClick={() => addTag('hot_lead')} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">+ Hot Lead</button>
              <button onClick={() => addTag('qualified')} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">+ Qualified</button>
              <button onClick={() => addTag('follow_up')} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">+ Follow Up</button>
            </div>
          )}
        </div>

        {/* Call Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
          <div className="space-y-2 mb-2">
            {editData.call_notes?.map((note, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                {note}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a note..."
                className="flex-1 p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCallNote(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-gold text-white py-2 px-4 rounded hover:bg-gold/90 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditData(lead);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Activities Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Activities</h3>
            <button
              onClick={() => setShowActivityForm(!showActivityForm)}
              className="p-2 bg-gold text-white rounded hover:bg-gold/90"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Activity Form */}
          {showActivityForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="space-y-3">
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value as any})}
                  className="admin-select w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="document_sent">Document Sent</option>
                  <option value="follow_up">Follow Up</option>
                </select>
                
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  placeholder="Activity description..."
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                  rows={3}
                />
                
                <input
                  type="text"
                  value={newActivity.outcome}
                  onChange={(e) => setNewActivity({...newActivity, outcome: e.target.value})}
                  placeholder="Outcome (optional)"
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                />
                
                <input
                  type="text"
                  value={newActivity.next_action}
                  onChange={(e) => setNewActivity({...newActivity, next_action: e.target.value})}
                  placeholder="Next action (optional)"
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={handleAddActivity}
                    className="px-3 py-1 bg-gold text-white rounded text-sm hover:bg-gold/90"
                  >
                    Add Activity
                  </button>
                  <button
                    onClick={() => setShowActivityForm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Activities List */}
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  {getActivityIcon(activity.type)}
                  <span className="font-medium text-sm capitalize">{activity.type.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{activity.description}</p>
                {activity.outcome && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Outcome:</strong> {activity.outcome}
                  </p>
                )}
                {activity.next_action && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Next:</strong> {activity.next_action}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
    
    <AlertModal
      isOpen={showAlert}
      onClose={() => {
        if (alertInfo.title === 'Confirm Deletion') {
          setShowAlert(false);
        } else if (alertInfo.title === 'Lead Deleted') {
          // Do nothing, let the timeout handle it
        } else {
          setShowAlert(false);
        }
      }}
      title={alertInfo.title}
      message={alertInfo.message}
      type={alertInfo.type}
    />
    </>
  );
};

export default LeadDetails;