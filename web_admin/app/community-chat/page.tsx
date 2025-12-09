'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComments, 
  faPaperPlane, 
  faFlag, 
  faEyeSlash, 
  faEye, 
  faTrash, 
  faSpinner,
  faUsers,
  faShield,
  faExclamationTriangle,
  faSearch,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

interface MessageWithUser {
  id: string;
  text: string;
  uid: string;
  cid: string;
  created_at: string;
  status: 'active' | 'hidden' | 'deleted' | 'flagged';
  flagged_count: number;
  user_name: string;
  user_avatar: string;
}

interface Community {
  id: string;
  name: string;
  decription: string;
}

export default function CommunityChat() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCommunities();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      loadMessages();
      loadOnlineCount();
      
      // Poll for new messages every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        loadMessages(false);
        loadOnlineCount();
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedCommunity]);

  useEffect(() => {
    filterMessages();
  }, [messages, showFlaggedOnly, searchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<Community[]>('/api/v1/communities/', {
        params: { skip: 0, limit: 50 }
      });
      setCommunities(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedCommunity(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (showLoading = true) => {
    if (!selectedCommunity) return;

    try {
      if (showLoading) setLoading(true);
      const response = await axiosInstance.get<MessageWithUser[]>(
        `/api/v1/message/chat/${selectedCommunity.id}`,
        { params: { skip: 0, limit: 100 } }
      );
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadOnlineCount = async () => {
    if (!selectedCommunity) return;

    try {
      const response = await axiosInstance.get<{ online_count: number }>(
        `/api/v1/message/online/${selectedCommunity.id}`
      );
      setOnlineCount(response.data.online_count || 0);
    } catch (error) {
      console.error('Failed to load online count:', error);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (showFlaggedOnly) {
      filtered = filtered.filter(m => m.status === 'flagged' || m.flagged_count > 0);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        m => m.text.toLowerCase().includes(query) || 
             m.user_name.toLowerCase().includes(query)
      );
    }

    setFilteredMessages(filtered);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCommunity || sending) return;

    setSending(true);
    try {
      await axiosInstance.post('/api/v1/message/', {
        text: newMessage.trim(),
        cid: selectedCommunity.id
      });
      setNewMessage('');
      await loadMessages(false);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleModerateMessage = async (messageId: string, action: 'hide' | 'restore' | 'delete') => {
    const actionText = action === 'hide' ? 'hide' : action === 'restore' ? 'restore' : 'delete';
    if (!confirm(`Are you sure you want to ${actionText} this message?`)) return;

    setProcessingId(messageId);
    try {
      await axiosInstance.post(`/api/v1/message/${messageId}/moderate`, null, {
        params: { action }
      });
      await loadMessages(false);
    } catch (error: any) {
      alert(error.response?.data?.detail || `Failed to ${actionText} message`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to permanently delete this message?')) return;

    setProcessingId(messageId);
    try {
      await axiosInstance.delete(`/api/v1/message/${messageId}`);
      await loadMessages(false);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete message');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !selectedCommunity) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FontAwesomeIcon icon={faComments} className="text-blue-600 text-2xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Community Chat</h1>
                <p className="text-sm text-gray-600">
                  Monitor and moderate community conversations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  {onlineCount} Online
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Community Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Communities</h3>
              <div className="space-y-2">
                {communities.map(community => (
                  <button
                    key={community.id}
                    onClick={() => setSelectedCommunity(community)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedCommunity?.id === community.id
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-900'
                        : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faUsers} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{community.name}</p>
                        <p className="text-xs text-gray-500 truncate">{community.decription}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            {selectedCommunity && (
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedCommunity.name}</h2>
                    <p className="text-sm text-gray-600">{selectedCommunity.decription}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                      <FontAwesomeIcon 
                        icon={faSearch} 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      />
                    </div>
                    
                    {/* Filter Flagged */}
                    <button
                      onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        showFlaggedOnly
                          ? 'bg-red-100 text-red-700 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FontAwesomeIcon icon={faFilter} />
                      Flagged Only
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-gray-400" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faComments} className="text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-600">
                      {showFlaggedOnly ? 'No flagged messages' : 'No messages yet'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`bg-white rounded-lg shadow-sm p-4 ${
                        message.status === 'hidden' ? 'opacity-50 border-2 border-yellow-300' : ''
                      } ${(message.status === 'flagged' || message.flagged_count > 0) ? 'border-2 border-red-300' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {message.user_avatar || message.user_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{message.user_name || 'Unknown User'}</span>
                              <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                              {(message.status === 'flagged' || message.flagged_count > 0) && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                  <FontAwesomeIcon icon={faFlag} className="mr-1" />
                                  Flagged
                                </span>
                              )}
                              {message.status === 'hidden' && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                  <FontAwesomeIcon icon={faEyeSlash} className="mr-1" />
                                  Hidden
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700">{message.text}</p>
                          </div>
                        </div>

                        {/* Moderation Actions */}
                        <div className="flex items-center gap-2">
                          {message.status === 'active' && (
                            <button
                              onClick={() => handleModerateMessage(message.id, 'hide')}
                              disabled={processingId === message.id}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Hide message"
                            >
                              <FontAwesomeIcon icon={faEyeSlash} />
                            </button>
                          )}
                          {message.status === 'hidden' && (
                            <button
                              onClick={() => handleModerateMessage(message.id, 'restore')}
                              disabled={processingId === message.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Restore message"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={processingId === message.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete message"
                          >
                            {processingId === message.id ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                              <FontAwesomeIcon icon={faTrash} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            {selectedCommunity && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message as admin..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      disabled={sending}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FontAwesomeIcon icon={faShield} className="text-blue-600" />
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors"
                  >
                    {sending ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
