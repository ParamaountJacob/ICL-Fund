import React, { useState } from 'react';
import { Video, Phone, Trash2, AlertCircle } from 'lucide-react';
import { deleteConsultationRequest, type UserRole } from '../../lib/supabase';
import AlertModal from '../AlertModal';

interface ConsultationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  consultation_type: 'video' | 'phone';
  preferred_date?: string;
  preferred_time?: string;
  suggested_investment_amount?: number;
  notes?: string;
  status: string;
  created_at: string;
}

interface UserProfileConsultationRequestsProps {
  consultationRequests: ConsultationRequest[];
  onDeleteConsultationRequest?: () => void; // Callback to refresh requests after deletion
  currentUserRole?: UserRole; // Current logged-in admin's role
}

const UserProfileConsultationRequests: React.FC<UserProfileConsultationRequestsProps> = ({ 
  consultationRequests,
  onDeleteConsultationRequest = () => {},
  currentUserRole = 'user'
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleDelete = async (requestId: string) => {
    if (currentUserRole !== 'admin') {
      setAlertInfo({
        title: 'Permission Denied', 
        message: 'Only the main admin can delete consultation requests.', 
        type: 'error' 
      });
      setShowAlert(true);
      return;
    }

    setAlertInfo({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this consultation request?',
      type: 'info'
    });
    setShowAlert(true);

    try {
      await deleteConsultationRequest(requestId);
      setAlertInfo({
        title: 'Request Deleted',
        message: 'Consultation request has been successfully deleted.',
        type: 'success'
      });
      setShowAlert(true);
      onDeleteConsultationRequest(); // Refresh the list
    } catch (error) {
      console.error('Error deleting consultation request:', error);
      setAlertInfo({
        title: 'Deletion Failed',
        message: 'Failed to delete consultation request: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  return (
    <>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Requests</h3>
      {consultationRequests.length === 0 ? (
        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">No consultation requests found.</p>
      ) : (
        <div className="space-y-4">
          {consultationRequests.map((consultation) => (
            <div key={consultation.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {consultation.consultation_type === 'video' ? (
                    <Video className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Phone className="w-4 h-4 text-green-600" />
                  )}
                  <span className="font-medium text-gray-900 capitalize">
                    {consultation.consultation_type} Consultation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(consultation.status)}
                  {currentUserRole === 'admin' && (
                    <button
                      onClick={() => handleDelete(consultation.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Consultation Request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Requested: {formatDate(consultation.created_at)}</p>
                  {consultation.preferred_date && consultation.preferred_time && (
                    <p className="text-gray-600">
                      Preferred: {formatDate(consultation.preferred_date)} at {consultation.preferred_time}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {consultation.suggested_investment_amount && (
                    <p className="text-gray-600">
                      Investment Interest: ${consultation.suggested_investment_amount.toLocaleString()}
                    </p>
                  )}
                  {consultation.phone && (
                    <p className="text-gray-600">Phone: {consultation.phone}</p>
                  )}
                </div>
              </div>
              {consultation.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {consultation.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
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

export default UserProfileConsultationRequests;