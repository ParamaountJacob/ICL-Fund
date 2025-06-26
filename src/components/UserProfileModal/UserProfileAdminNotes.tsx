import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AlertModal from '../AlertModal';

interface UserProfileAdminNotesProps {
  notes: string[];
  onAddNote: (note: string) => Promise<void>;
}

const UserProfileAdminNotes: React.FC<UserProfileAdminNotesProps> = ({ notes, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      await onAddNote(newNote);
      setNewNote('');
      setAlertInfo({
        title: 'Note Added',
        message: 'Admin note has been added successfully.',
        type: 'success'
      });
      setShowAlert(true);
    } catch (error) {
      console.error('Error adding note:', error);
      setAlertInfo({
        title: 'Add Note Failed',
        message: 'Failed to add admin note. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <>
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        {notes && notes.length > 0 ? (
          notes.map((note, index) => (
            <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-700">{note}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No admin notes yet.</p>
        )}
      </div>
      
      <div className="pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this user..."
            className="flex-1 p-2 border border-gray-300 rounded text-gray-900 bg-white"
            rows={2}
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote || !newNote.trim()}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            {addingNote ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>
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

export default UserProfileAdminNotes;