import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RefreshCw, Users, UserPlus, Trash2, X } from "lucide-react";
import {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  type ProjectMember,
} from "../api/projectMembers.service";
import { getUsers } from "../api/users.service";
import { useAuth } from "../context/useAuth";
import { formatDate } from "../utils/date";
import type { SafeUser } from "../types/auth";
import axios from "axios";

interface ProjectMembersProps {
  projectId: string;
  onMembersChange?: () => void;
}

export default function ProjectMembers({
  projectId,
  onMembersChange,
}: ProjectMembersProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Add Member Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [workspaceUsers, setWorkspaceUsers] = useState<SafeUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submittingMember, setSubmittingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

  // Remove member loading tracking
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionError("");

    try {
      const data = await getProjectMembers(projectId);
      setMembers(data);
    } catch {
      setError("Unable to load project members. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;

    getProjectMembers(projectId)
      .then((data) => {
        if (!ignore) {
          setMembers(data);
          setError("");
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load project members. Please try again.");
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
  }, [projectId]);

  async function handleOpenAddModal() {
    setIsAddOpen(true);
    setLoadingUsers(true);
    setAddMemberError("");
    setSelectedUserId("");
    setActionSuccess("");

    try {
      const users = await getUsers();
      setWorkspaceUsers(users);
      // Select first available user who is not already a member
      const available = users.filter((u) => !members.some((m) => m.id === u.id));
      if (available.length > 0) {
        setSelectedUserId(available[0].id);
      }
    } catch {
      setAddMemberError("Unable to load workspace users. Please try again.");
    } finally {
      setLoadingUsers(false);
    }
  }

  function handleCloseAddModal() {
    if (!submittingMember) {
      setIsAddOpen(false);
      setAddMemberError("");
    }
  }

  async function handleAddMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUserId) {
      setAddMemberError("Please select a user to add.");
      return;
    }

    setSubmittingMember(true);
    setAddMemberError("");

    try {
      const newMember = await addProjectMember(projectId, selectedUserId);
      setMembers((prev) => [...prev, newMember]);
      setActionSuccess(`${newMember.name} added to the project.`);
      setIsAddOpen(false);
      onMembersChange?.();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setAddMemberError("This user is already a member of the project.");
        } else if (err.response?.status === 403) {
          setAddMemberError("You do not have permission to add project members.");
        } else {
          setAddMemberError(
            err.response?.data?.message || "Failed to add project member.",
          );
        }
      } else {
        setAddMemberError("An unexpected error occurred.");
      }
    } finally {
      setSubmittingMember(false);
    }
  }

  async function handleRemoveMember(member: ProjectMember) {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.name} from this project?`,
    );

    if (!confirmed) return;

    setBusyMemberId(member.id);
    setActionError("");
    setActionSuccess("");

    try {
      await removeProjectMember(projectId, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setActionSuccess(`${member.name} was removed from the project.`);
      onMembersChange?.();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setActionError("You do not have permission to remove project members.");
        } else {
          setActionError(
            err.response?.data?.message || `Failed to remove ${member.name}.`,
          );
        }
      } else {
        setActionError("An unexpected error occurred while removing the member.");
      }
    } finally {
      setBusyMemberId(null);
    }
  }

  const availableUsers = workspaceUsers.filter(
    (u) => !members.some((m) => m.id === u.id),
  );

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Project members
          </h2>
          {!loading && !error && (
            <p className="mt-1 text-sm text-slate-500">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => void handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <UserPlus size={16} />
              Add Member
            </button>
          )}

          {!loading && (
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading project members...
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-white p-6">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Users size={30} className="mx-auto text-slate-400" />
          <p className="mt-3 font-medium text-slate-800">
            No members found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            This project doesn't have any members yet.
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => void handleOpenAddModal()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <UserPlus size={14} />
              Add Member
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                {isAdmin && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                    {member.name}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {member.email}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 capitalize">
                      {member.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {formatDate(member.joined_at)}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(member)}
                        disabled={busyMemberId === member.id}
                        aria-label={`Remove ${member.name}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {busyMemberId === member.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="add-member-title" className="text-lg font-bold text-slate-900">
                Add Project Member
              </h3>
              <button
                type="button"
                onClick={handleCloseAddModal}
                disabled={submittingMember}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              {addMemberError && (
                <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {addMemberError}
                </div>
              )}

              {loadingUsers ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Loading workspace users...
                </p>
              ) : availableUsers.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  All workspace users are already members of this project.
                </p>
              ) : (
                <div>
                  <label
                    htmlFor="select-member-user"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Select User <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-member-user"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) — {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={submittingMember}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMember || availableUsers.length === 0 || !selectedUserId}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
