
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  FolderKanban,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  getProjects,
  type Project,
} from "../api/projects.service";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      setError("Unable to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <section>
      <p className="text-sm text-slate-500">Overview</p>

      <h1 className="mt-1 text-2xl font-bold text-slate-900">
        Dashboard
      </h1>

      <p className="mt-2 text-slate-600">
        Welcome to your workspace. Track your projects and team activity.
      </p>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Your projects
          </h2>

          {!loading && (
            <button
              type="button"
              onClick={() => void loadProjects()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div
            role="status"
            className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600"
          >
            Loading projects...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-white p-6"
          >
            <p className="font-medium text-red-700">
              Couldn't load projects
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadProjects()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <FolderKanban
              size={32}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-3 font-semibold text-slate-900">
              No projects yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              You don't have any projects available yet.
              Check back later or contact your administrator.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${encodeURIComponent(project.id)}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                    <FolderKanban size={22} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
                  />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {project.name}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {project.description || "No description provided."}
                </p>

                <p className="mt-4 text-xs text-slate-400">
                  Created{" "}
                  {Number.isNaN(Date.parse(project.created_at))
                    ? "date unavailable"
                    : new Date(project.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
