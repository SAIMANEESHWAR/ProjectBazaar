            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white">Edit User</h2>
                                <button
                                    onClick={handleCloseEditModal}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-blue-100 text-sm mt-1">{editingUser.name} ({editingUser.email})</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {updateSuccess && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p className="text-green-800 font-semibold">User updated successfully!</p>
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editFormData.status}
                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                    disabled={isUpdating}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="active">Active</option>
                                    <option value="blocked">Blocked (Inactive)</option>
                                    <option value="deleted">Deleted (Suspended)</option>
                                </select>
                                <p className="text-sm text-gray-500 mt-2">
                                    Active: User can access the platform<br />
                                    Blocked: User account is temporarily blocked<br />
                                    Deleted: User account is suspended/deleted
                                </p>
                            </div>

                            {/* Credits */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    Credits
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editFormData.credits}
                                    onChange={(e) => setEditFormData({ ...editFormData, credits: parseInt(e.target.value) || 0 })}
                                    disabled={isUpdating}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="text-sm text-gray-500 mt-2">Current credits: {editingUser.credits || 0}</p>
                            </div>

                            {/* Account Locked Until */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    Account Locked Until (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editFormData.accountLockedUntil ? new Date(editFormData.accountLockedUntil).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setEditFormData({ 
                                        ...editFormData, 
                                        accountLockedUntil: e.target.value ? new Date(e.target.value).toISOString() : null 
                                    })}
                                    disabled={isUpdating}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div className="flex items-center gap-3 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditFormData({ ...editFormData, accountLockedUntil: null })}
                                        disabled={isUpdating}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Clear Lock
                                    </button>
                                    {editFormData.accountLockedUntil && (
                                        <p className="text-sm text-gray-600">
                                            Locked until: {new Date(editFormData.accountLockedUntil).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Leave empty or clear to unlock the account immediately</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCloseEditModal}
                                    disabled={isUpdating}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateUser}
                                    disabled={isUpdating}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Update User
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

