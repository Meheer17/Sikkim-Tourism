'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsersCog, 
  faSearch, 
  faUser,
  faBuilding,
  faShield,
  faSpinner,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '@/lib/axios';
import Sidebar from '@/components/Sidebar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'business' | 'admin';
  approved: boolean;
  created_at: string;
}

const ROLE_OPTIONS = [
  {
    role: 'user',
    title: 'User',
    description: 'Regular user with basic access to book services and explore places',
    icon: faUser,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  {
    role: 'business',
    title: 'Business',
    description: 'Can create and manage business services, view bookings and revenue',
    icon: faBuilding,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  {
    role: 'admin',
    title: 'Admin',
    description: 'Full system access including user management and platform settings',
    icon: faShield,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const skip = (page - 1) * itemsPerPage;
      const response = await axiosInstance.get<User[]>('/api/v1/users', {
        params: { skip, limit: itemsPerPage }
      });
      
      if (append) {
        setUsers(prev => [...prev, ...response.data]);
      } else {
        setUsers(response.data);
      }
      
      setHasMore(response.data.length === itemsPerPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMoreUsers = () => {
    if (!loadingMore && hasMore) {
      loadUsers(currentPage + 1, true);
    }
  };

  const filterUsers = () => {
    if (searchQuery.trim()) {
      const filtered = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowRoleModal(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole || selectedRole === selectedUser.role) {
      setShowRoleModal(false);
      return;
    }

    if (!confirm(`Are you sure you want to change ${selectedUser.name}'s role to ${selectedRole}?`)) {
      return;
    }

    setProcessingId(selectedUser.id);
    try {
      const response = await axiosInstance.put(`/api/v1/users/${selectedUser.id}/role`, {
        role: selectedRole
      });
      
      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, role: selectedRole as any } : u))
      );
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role');
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLE_OPTIONS.find(r => r.role === role) || ROLE_OPTIONS[0];
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faUsersCog} className="text-blue-500" />
            User Management
          </h1>
          <p className="text-gray-600 mt-2">Assign and manage user roles</p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faUsersCog} className="text-blue-600 text-xl mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">About Roles</h3>
              <p className="text-blue-800 text-sm">
                Roles determine user permissions and access levels. Choose carefully as this affects what users can do.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="relative">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-gray-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FontAwesomeIcon icon={faUsersCog} className="text-6xl text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No users found</h2>
            <p className="text-gray-600">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              return (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${roleInfo.bgColor}`}>
                      <span className={`font-semibold ${roleInfo.color}`}>
                        {roleInfo.title}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">Tap to change role →</span>
                  </div>
                </div>
              );
            })}
            
            {/* Pagination Controls */}
            {!loading && !searchQuery && filteredUsers.length > 0 && hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMoreUsers}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Role Selection Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Change Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            {/* Current Role */}
            <div className="p-6 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-2">Current Role</p>
              <div className={`inline-flex px-4 py-2 rounded-full ${getRoleInfo(selectedUser.role).bgColor}`}>
                <span className={`font-semibold ${getRoleInfo(selectedUser.role).color}`}>
                  {getRoleInfo(selectedUser.role).title}
                </span>
              </div>
            </div>

            {/* Role Options */}
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-600 mb-4">Select New Role</p>
              <div className="space-y-3">
                {ROLE_OPTIONS.map((option) => (
                  <div
                    key={option.role}
                    onClick={() => setSelectedRole(option.role)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRole === option.role
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${option.bgColor}`}>
                        <FontAwesomeIcon icon={option.icon} className={`text-xl ${option.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{option.title}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      {selectedRole === option.role && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={selectedRole === selectedUser.role || processingId === selectedUser.id}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {processingId === selectedUser.id ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
