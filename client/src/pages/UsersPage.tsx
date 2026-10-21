import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Shield, User, AlertCircle, CheckCircle } from "lucide-react";
import { getUsers, updateUserRole } from "../api/users.service";
import { useAuth } from "../context/useAuth";
import type { SafeUser, UserRole } from "../types/auth";
import axios from "axios";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionError("");

    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError("Unable to load workspace users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getUsers()
      .then((data) => {
        if (!ignore) {
          setUsers(data);
          setError("");
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load workspace users. Please try again.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleRoleChange(targetUser: SafeUser, newRole: UserRole) {
    if (targetUser.role === newRole) return;

    if (currentUser?.id === targetUser.id && newRole !== "admin") {
      setActionError("You cannot remove your own Admin role.");
      return;
    }

    setUpdatingUserId(targetUser.id);
    setActionError("");
    setActionSuccess("");

    try {
      const updated = await updateUserRole(targetUser.id, newRole);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, role: updated.role } : u,
        ),
      );

      setActionSuccess(`Role updated for ${targetUser.name} to ${newRole}.`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to update user role.",
        );
      } else {
        setActionError("An unexpected error occurred while updating user role.");
      }
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage workspace users and their permissions.
          </p>
        </div>

        {!loading && (
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      </div>

      {actionSuccess && (
        <div role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle size={16} className="shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading users...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-white p-6">
            <p className="font-medium text-red-700">Couldn't load users</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <User size={32} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-900">No users found</h3>
            <p className="mt-1 text-sm text-slate-500">
              There are no user accounts in this workspace.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Email</th>
                  <th className="px-5 py-3.5 font-medium">Current Role</th>
                  <th className="px-5 py-3.5 font-medium">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((targetUser) => {
                  const isCurrent = currentUser?.id === targetUser.id;
                  const isBusy = updatingUserId === targetUser.id;

                  return (
                    <tr key={targetUser.id} className="hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{targetUser.name}</span>
                          {isCurrent && (
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {targetUser.email}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                            targetUser.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {targetUser.role === "admin" && <Shield size={12} />}
                          {targetUser.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={targetUser.role}
                            disabled={isBusy}
                            onChange={(e) =>
                              void handleRoleChange(
                                targetUser,
                                e.target.value as UserRole,
                              )
                            }
                            aria-label={`Change role for ${targetUser.name}`}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:opacity-50"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          {isBusy && (
                            <span className="text-xs text-slate-400">
                              Updating...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
