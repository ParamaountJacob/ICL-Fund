import React, { useState } from 'react';
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
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Video,
  PhoneCall
} from 'lucide-react';
import type { Lead } from '../../types/crm';

interface LeadCardProps {
  lead: Lead;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onSelect: (lead: Lead) => void;
  isSelected?: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onUpdate, onSelect, isSelected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(lead);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal_sent': return 'bg-purple-100 text-purple-800';
      case 'closed_won': return 'bg-emerald-100 text-emerald-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'contacted': return <MessageSquare className="w-4 h-4" />;
      case 'qualified': return <CheckCircle className="w-4 h-4" />;
      case 'proposal_sent': return <FileText className="w-4 h-4" />;
      case 'closed_won': return <TrendingUp className="w-4 h-4" />;
      case 'closed_lost': return <Clock className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'consultation': return lead.consultation_type === 'video' ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />;
      case 'website': return <Mail className="w-4 h-4" />;
      case 'referral': return <User className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const handleSave = () => {
    onUpdate(lead.id, editData);
    setIsEditing(false);
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer ${
        isSelected ? 'border-gold shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(lead)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getSourceIcon(lead.source)}
                <span className="capitalize">{lead.source}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(lead.status)}`}>
              {getStatusIcon(lead.status)}
              {lead.status.replace('_', ' ').toUpperCase()}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{lead.email}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        {/* Investment Interest */}
        {lead.investment_interest && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-600">
              {formatCurrency(lead.investment_interest)} interest
            </span>
          </div>
        )}

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {lead.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
            {lead.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{lead.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Last Contact */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex justify-between">
            <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
            {lead.last_contact_date && (
              <span>Last contact: {new Date(lead.last_contact_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Quick Edit Form */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
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
            
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-gold text-white text-sm rounded hover:bg-gold/90"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LeadCard;