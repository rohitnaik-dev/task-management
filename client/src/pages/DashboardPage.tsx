import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  FolderKanban,
  ArrowRight,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import {
  getProjects,
  createProject,
  type Project,
} from "../api/projects.service";
import axios from "axios";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create project modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleRefresh = useCallback(async () => {
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
    let ignore = false;

    getProjects()
      .then((data) => {
        if (!ignore) {
          setProjects(data);
          setError("");
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load projects. Please try again.");
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

  async function handleCreateProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      setFormError("Project name is required.");
      return;
    }

    if (trimmedName.length > 200) {
      setFormError("Project name must not exceed 200 characters.");
      return;
    }

    if (projectDescription.length > 5000) {
      setFormError("Project description must not exceed 5000 characters.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const newProject = await createProject({
        name: trimmedName,
        description: projectDescription.trim() || null,
      });

      setProjects((prev) => [newProject, ...prev]);
      setProjectName("");
      setProjectDescription("");
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(
          err.response?.data?.message || "Failed to create project. Please try again.",
        );
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred while creating the project.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenModal() {
    setProjectName("");
    setProjectDescription("");
    setFormError("");
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    if (!submitting) {
      setIsModalOpen(false);
      setFormError("");
    }
  }

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Your projects
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create Project
            </button>

            {!loading && (
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            )}
          </div>
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
              onClick={() => void handleRefresh()}
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
              Get started by creating your first project.
            </p>

            <button
              type="button"
              onClick={handleOpenModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create Project
            </button>
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

                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
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

      {/* Create Project Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="create-project-title" className="text-lg font-bold text-slate-900">
                Create new project
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              {formError && (
                <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="project-name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="project-name"
                  type="text"
                  required
                  maxLength={200}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="project-desc"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="project-desc"
                  rows={3}
                  maxLength={5000}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="What is this project about?"
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !projectName.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
