import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import AlertModal from '../AlertModal';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  receiver?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface UserProfileMessagesProps {
  messages: Message[];
  onSendMessage: (subject: string, content: string) => Promise<void>;
}

const UserProfileMessages: React.FC<UserProfileMessagesProps> = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState({ subject: '', content: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.content.trim()) return;
    
    setSendingMessage(true);
    try {
      await onSendMessage(newMessage.subject, newMessage.content);
      setNewMessage({ subject: '', content: '' });
      setAlertInfo({
        title: 'Message Sent',
        message: 'Your message has been sent successfully.',
        type: 'success'
      });
      setShowAlert(true);
    } catch (error) {
      console.error('Error sending message:', error);
      setAlertInfo({
        title: 'Send Failed',
        message: 'Failed to send message. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
      </div>

      {/* Send New Message */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Send Message</h4>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Subject (optional)"
            value={newMessage.subject}
            onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
          />
          <textarea
            placeholder="Type your message..."
            value={newMessage.content}
            onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
          />
          <button
            onClick={handleSendMessage}
            disabled={sendingMessage || !newMessage.content.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sendingMessage ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>

      {/* Message History */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Message History</h4>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No messages found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {message.subject || 'No Subject'}
                    </h5>
                    <p className="text-sm text-gray-600">
                      From: {message.sender?.first_name} {message.sender?.last_name} ({message.sender?.email})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(message.created_at)}</p>
                    {!message.is_read && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700">{message.content}</p>
              </div>
            ))}
          </div>
        )}
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

export default UserProfileMessages;