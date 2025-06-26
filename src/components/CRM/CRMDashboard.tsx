import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Search, 
  Filter,
  Plus,
  Download,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { Lead, CRMStats } from '../../types/crm';
import { getLeads, updateLead, getCRMStats, deleteCrmLead } from '../../lib/crm';
import LeadCard from './LeadCard';
import LeadDetails from './LeadDetails';
import AlertModal from '../AlertModal';

const CRMDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const loadData = async () => {
    try {
      const [leadsData, statsData] = await Promise.all([
        getLeads(),
        getCRMStats()
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading CRM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      await updateLead(id, updates);
      setLeads(leads.map(lead => 
        lead.id === id ? { ...lead, ...updates } : lead
      ));
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, ...updates });
      }
      // Reload stats
      const newStats = await getCRMStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = (leadId: string) => {
    // Remove the lead from the local state
    setLeads(leads.filter(lead => lead.id !== leadId));
    setFilteredLeads(filteredLeads.filter(lead => lead.id !== leadId));
    setSelectedLead(null);
    
    // Reload stats
    getCRMStats().then(setStats);
    
    setAlertInfo({
      title: 'Lead Deleted',
      message: 'Lead and all associated activities have been successfully deleted.',
      type: 'success'
    });
    setShowAlert(true);
  };

  const exportLeads = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Source', 'Investment Interest', 'Created Date'],
      ...filteredLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone || '',
        lead.status,
        lead.source,
        lead.investment_interest?.toString() || '',
        new Date(lead.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_leads}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversion_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pipeline_value)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gold" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.this_month_conversions}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="admin-select px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold text-gray-900 bg-white"
            >
              <option value="all">All Sources</option>
              <option value="consultation">Consultation</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="calendar">Calendar</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportLeads}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onUpdate={handleUpdateLead}
              onSelect={setSelectedLead}
              isSelected={selectedLead?.id === lead.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Lead Details Sidebar */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetails
            lead={selectedLead}
            onUpdate={handleUpdateLead}
            onDelete={handleDeleteLead}
            onClose={() => setSelectedLead(null)}
          />
        )}
      </AnimatePresence>
      
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
      />
    </div>
  );
};

export default CRMDashboard;