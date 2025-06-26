import React, { useState } from 'react';
import { DollarSign, TrendingUp, Target, Edit, Save } from 'lucide-react';
import AlertModal from '../AlertModal';

interface UserProfileInvestmentProfileProps {
  netWorth: string;
  annualIncome: string;
  riskTolerance: string;
  iraAccounts: string;
  investmentGoals: string;
  onSave: (data: {
    net_worth: string;
    annual_income: string;
    risk_tolerance: string;
    ira_accounts: string;
    investment_goals: string;
  }) => Promise<void>;
}

const UserProfileInvestmentProfile: React.FC<UserProfileInvestmentProfileProps> = ({
  netWorth,
  annualIncome,
  riskTolerance,
  iraAccounts,
  investmentGoals,
  onSave
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
  const [formData, setFormData] = useState({
    net_worth: netWorth,
    annual_income: annualIncome,
    risk_tolerance: riskTolerance,
    ira_accounts: iraAccounts,
    investment_goals: investmentGoals
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setAlertInfo({
        title: 'Profile Updated',
        message: 'Investment profile has been updated successfully.',
        type: 'success'
      });
      setShowAlert(true);
      setEditing(false);
    } catch (error) {
      console.error('Error saving investment profile:', error);
      setAlertInfo({
        title: 'Update Failed',
        message: 'Failed to update investment profile. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Investment Profile</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
        )}
      </div>
      
      {editing ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Worth</label>
              <select
                name="net_worth"
                value={formData.net_worth}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
              >
                <option value="">Select range</option>
                <option value="$500K - $1M">$500K - $1M</option>
                <option value="$1M - $5M">$1M - $5M</option>
                <option value="$5M - $10M">$5M - $10M</option>
                <option value="$10M+">$10M+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
              <select
                name="annual_income"
                value={formData.annual_income}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
              >
                <option value="">Select range</option>
                <option value="$200K - $500K">$200K - $500K</option>
                <option value="$500K - $1M">$500K - $1M</option>
                <option value="$1M - $2M">$1M - $2M</option>
                <option value="$2M+">$2M+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tolerance</label>
              <select
                name="risk_tolerance"
                value={formData.risk_tolerance}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
              >
                <option value="">Select option</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IRA/401(k) Accounts</label>
              <textarea
                name="ira_accounts"
                value={formData.ira_accounts}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
                placeholder="List retirement accounts"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Goals</label>
              <textarea
                name="investment_goals"
                value={formData.investment_goals}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
                placeholder="Investment objectives"
              />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              {saving ? 'Saving...' : 'Save'}
              <Save className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {formData.net_worth && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="text-gray-900">Net Worth: {formData.net_worth}</span>
              </div>
            )}
            {formData.annual_income && (
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <span className="text-gray-900">Annual Income: {formData.annual_income}</span>
              </div>
            )}
            {formData.risk_tolerance && (
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-gray-900">Risk Tolerance: {formData.risk_tolerance}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {formData.ira_accounts && (
              <div>
                <span className="text-sm font-medium text-gray-600">IRA/401(k) Accounts:</span>
                <p className="text-gray-900 mt-1">{formData.ira_accounts}</p>
              </div>
            )}
            {formData.investment_goals && (
              <div>
                <span className="text-sm font-medium text-gray-600">Investment Goals:</span>
                <p className="text-gray-900 mt-1">{formData.investment_goals}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    
    <AlertModal
      isOpen={showAlert}
      onClose={() => setShowAlert(false)}
      title={alertInfo.title}
      message={alertInfo.message}
      type={alertInfo.type}
    />
    </>
  );
};

export default UserProfileInvestmentProfile;