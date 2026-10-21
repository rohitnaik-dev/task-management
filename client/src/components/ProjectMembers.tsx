
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import {
  getProjectMembers,
  type ProjectMember,
} from "../api/projectMembers.service";

interface ProjectMembersProps {
  projectId: string;
}

export default function ProjectMembers({
  projectId,
}: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError("");

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

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
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

        {!loading && (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      </div>

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
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {member.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {Number.isNaN(Date.parse(member.joined_at))
                      ? "—"
                      : new Date(member.joined_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
