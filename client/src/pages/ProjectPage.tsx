import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  getProjectById,
  updateProject,
  deleteProject,
  type Project,
} from "../api/projects.service";
import ProjectMembers from "../components/ProjectMembers";
import ProjectTasks from "../components/ProjectTasks";
import { useAuth } from "../context/useAuth";
import { Pencil, Trash2, X } from "lucide-react";
import { formatDate } from "../utils/date";
import axios from "axios";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [membersVersion, setMembersVersion] = useState(0);

  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");


  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProject() {
      if (!projectId) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getProjectById(projectId);

        if (active) {
          setProject(data);
        }
      } catch (err: unknown) {
        if (active) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            setError("Project not found.");
          } else if (axios.isAxiosError(err) && err.response?.status === 403) {
            setError("You do not have access to this project.");
          } else {
            setError("Unable to load this project. It may not exist or you may not have access.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  function handleOpenEdit() {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditError("");
    setIsEditOpen(true);
  }

  function handleCloseEdit() {
    if (!savingEdit) {
      setIsEditOpen(false);
      setEditError("");
    }
  }

  async function handleSaveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!project) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Project name cannot be empty.");
      return;
    }

    if (trimmedName.length > 200) {
      setEditError("Project name must not exceed 200 characters.");
      return;
    }

    if (editDescription.length > 5000) {
      setEditError("Project description must not exceed 5000 characters.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const updated = await updateProject(project.id, {
        name: trimmedName,
        description: editDescription.trim() || null,
      });

      setProject(updated);
      setIsEditOpen(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setEditError("You do not have permission to edit this project.");
        } else if (err.response?.status === 404) {
          setEditError("Project no longer exists.");
        } else {
          setEditError(
            err.response?.data?.message || "Failed to update project. Please try again.",
          );
        }
      } else {
        setEditError("An unexpected error occurred.");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteProject() {
    if (!project || deleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setActionError("");

    try {
      await deleteProject(project.id);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setActionError("You do not have permission to delete this project.");
        } else if (err.response?.status === 404) {
          setActionError("Project has already been deleted.");
        } else {
          setActionError(
            err.response?.data?.message || "Failed to delete project. Please try again.",
          );
        }
      } else {
        setActionError("An unexpected error occurred while deleting the project.");
      }
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="p-4 text-slate-600">Loading project...</p>;
  }

  if (error || !project) {
    return (
      <section>
        <p role="alert" className="text-red-700">
          {error || "Project not found."}
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Back to dashboard
        </Link>
      </section>
    );
  }

  return (
    <section>
      <Link
        to="/dashboard"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Dashboard
      </Link>

      {actionError && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Project • Created {formatDate(project.created_at)}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {project.name}
          </h1>
          <p className="mt-2 text-slate-600 whitespace-pre-wrap max-w-3xl">
            {project.description || "No description provided."}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={15} />
              Edit Project
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteProject()}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={15} />
              {deleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        )}
      </div>

      
      <ProjectMembers
        projectId={project.id}
        onMembersChange={() => setMembersVersion((v) => v + 1)}
      />

      
      <ProjectTasks
        projectId={project.id}
        membersVersion={membersVersion}
      />

      
      {isEditOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-project-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="edit-project-title" className="text-lg font-bold text-slate-900">
                Edit project details
              </h3>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={savingEdit}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {editError && (
                <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-project-name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-project-name"
                  type="text"
                  required
                  maxLength={200}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-project-desc"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="edit-project-desc"
                  rows={3}
                  maxLength={5000}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="What is this project about?"
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={savingEdit}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editName.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
