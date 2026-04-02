/**
 * Example: Optimized ClientsPage Component
 * Shows how to use React Query, debouncing, and other optimizations
 */

import React, { useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import ClientForm from '../components/clients/ClientForm';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import {
  useClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useDebouncedSearch,
  useClientStatsQuery
} from '../hooks/useCRMOptimizations';

const ClientsPage = () => {
  const { isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: ''
  });

  // Use debounced search - dramatically reduces API calls
  const [searchInput, setSearchInput] = useDebouncedSearch(
    useCallback((value) => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, []),
    500 // Wait 500ms after user stops typing before searching
  );

  // Query with automatic caching and deduplication
  const { data: clientsData, isLoading, error, refetch } = useClientsQuery(filters);
  const { data: statsData } = useClientStatsQuery();

  // Mutations with automatic cache invalidation
  const createMutation = useCreateClientMutation(onOperationSuccess);
  const updateMutation = useUpdateClientMutation(editData?._id, onOperationSuccess);
  const deleteMutation = useDeleteClientMutation(() => refetch());

  function onOperationSuccess() {
    setShowForm(false);
    setEditData(null);
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  const handleFormSubmit = (data) => {
    if (editData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        Error loading clients: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        {isAdmin && (
          <button
            onClick={() => { setEditData(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlus /> Add Client
          </button>
        )}
      </div>

      {/* Stats */}
      {statsData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Total Clients</div>
            <div className="text-2xl font-bold">{statsData.stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Active</div>
            <div className="text-2xl font-bold text-green-600">{statsData.stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Leads</div>
            <div className="text-2xl font-bold text-yellow-600">{statsData.stats.leads}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Churned</div>
            <div className="text-2xl font-bold text-red-600">{statsData.stats.churned}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search - with debouncing */}
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
            <option value="churned">Churned</option>
          </select>

          {/* Limit per page */}
          <select
            value={filters.limit}
            onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clientsData?.data?.clients?.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{client.firstName} {client.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.phone}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(client.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      title="View"
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => window.location.href = `/clients/${client._id}`}
                    >
                      <FiEye size={18} />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          title="Edit"
                          onClick={() => { setEditData(client); setShowForm(true); }}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDelete(client._id, `${client.firstName} ${client.lastName}`)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {clientsData?.data?.currentPage} of {clientsData?.data?.totalPages} 
              ({clientsData?.data?.count} of {clientsData?.data?.total})
            </div>
            <div className="space-x-2">
              <button
                disabled={clientsData?.data?.currentPage === 1}
                onClick={() => handlePageChange(clientsData.data.currentPage - 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={clientsData?.data?.currentPage >= clientsData?.data?.totalPages}
                onClick={() => handlePageChange(clientsData.data.currentPage + 1)}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ClientForm
          initialData={editData}
          onClose={() => { setShowForm(false); setEditData(null); }}
          onSubmit={handleFormSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};

export default ClientsPage;
