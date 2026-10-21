
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Plus,
  Trash2,
  ClipboardList,
  AlertCircle,
} from "lucide-react";

import {
  getProjectMembers,
  type ProjectMember,
} from "../api/projectMembers.service";

import {
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  type Task,
  type TaskStatus,
} from "../api/tasks.service";

interface ProjectTasksProps {
  projectId: string;
}

export default function ProjectTasks({
  projectId,
}: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [membersError, setMembersError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  // Load project tasks.
  const handleRefreshTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjectTasks(projectId);
      setTasks(data);
    } catch {
      setError("Unable to load project tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;

    getProjectTasks(projectId)
      .then((data) => {
        if (!ignore) {
          setTasks(data);
          setError("");
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load project tasks. Please try again.");
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

  // Load project members for the assignment dropdown.
  useEffect(() => {
    let active = true;

    getProjectMembers(projectId)
      .then((data) => {
        if (active) {
          setMembers(data);
          setMembersError("");
        }
      })
      .catch(() => {
        if (active) {
          setMembersError(
            "Unable to load project members. Please try again.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  // Create a task.
  async function handleCreateTask(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setActionError("Task title is required.");
      return;
    }

    setCreating(true);
    setActionError("");

    try {
      const task = await createProjectTask(projectId, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        assignedTo: assignedTo || undefined,
      });

      setTasks((current) =>
        [...current, task].sort(
          (a, b) => a.position - b.position,
        ),
      );

      setTitle("");
      setDescription("");
      setAssignedTo("");
    } catch {
      setActionError(
        "Unable to create the task. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  // Update a task's status.
  async function handleStatusChange(
    task: Task,
    status: TaskStatus,
  ) {
    setBusyTaskId(task.id);
    setActionError("");

    try {
      const updatedTask = await updateProjectTask(
        projectId,
        task.id,
        { status },
      );

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? updatedTask : item,
        ),
      );
    } catch {
      setActionError(
        `Unable to update "${task.title}". Please try again.`,
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  // Delete a task.
  async function handleDeleteTask(task: Task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    );

    if (!confirmed) return;

    setBusyTaskId(task.id);
    setActionError("");

    try {
      await deleteProjectTask(projectId, task.id);

      setTasks((current) =>
        current.filter((item) => item.id !== task.id),
      );
    } catch {
      setActionError(
        `Unable to delete "${task.title}". Please try again.`,
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Project tasks
          </h2>

          {!loading && !error && (
            <p className="mt-1 text-sm text-slate-500">
              {tasks.length}{" "}
              {tasks.length === 1 ? "task" : "tasks"}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleRefreshTasks()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Create Task Form */}
      <form
        onSubmit={handleCreateTask}
        className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <h3 className="font-medium text-slate-900">
          Create a task
        </h3>

        {/* Title */}
        <div>
          <label
            htmlFor="task-title"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Title
          </label>

          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Implement login API"
            maxLength={200}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="task-description"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Description{" "}
            <span className="font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <textarea
            id="task-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe what needs to be done..."
            rows={3}
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Assignee */}
        <div>
          <label
            htmlFor="task-assignee"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Assign to
          </label>

          <select
            id="task-assignee"
            value={assignedTo}
            onChange={(event) =>
              setAssignedTo(event.target.value)
            }
            disabled={!!membersError}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Unassigned</option>

            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          {membersError && (
            <div className="mt-2">
              <p role="alert" className="text-sm text-red-600">
                {membersError}
              </p>

              <button
                type="button"
                onClick={() => {
                  setMembersError("");
                  setMembers([]);
                  setActionError("");
                  // Member loading is retriggered by the effect
                  // when projectId changes; reload explicitly below.
                  void getProjectMembers(projectId)
                    .then(setMembers)
                    .catch(() =>
                      setMembersError(
                        "Unable to load project members. Please try again.",
                      ),
                    );
                }}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Retry loading members
              </button>
            </div>
          )}
        </div>

        {/* Action Error */}
        {actionError && (
          <p role="alert" className="text-sm text-red-600">
            {actionError}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          {creating ? "Creating..." : "Add task"}
        </button>
      </form>

      {/* Task List States */}
      {loading ? (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600"
        >
          Loading project tasks...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-white p-6"
        >
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => void handleRefreshTasks()}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <ClipboardList
            size={32}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 font-medium text-slate-800">
            No tasks yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Create your first task using the form above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold text-slate-900">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Position: {task.position}</span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {task.assignee
                        ? `Assigned to ${task.assignee.name}`
                        : "Unassigned"}
                    </span>

                    <span>
                      Created{" "}
                      {Number.isNaN(Date.parse(task.createdAt))
                        ? "—"
                        : new Date(
                            task.createdAt,
                          ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDeleteTask(task)}
                  disabled={busyTaskId === task.id}
                  aria-label={`Delete ${task.title}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>

              {/* Task Status */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <label
                  htmlFor={`task-status-${task.id}`}
                  className="mb-1 block text-xs font-medium text-slate-500"
                >
                  Status
                </label>

                <select
                  id={`task-status-${task.id}`}
                  value={task.status}
                  disabled={busyTaskId === task.id}
                  onChange={(event) =>
                    void handleStatusChange(
                      task,
                      event.target.value as TaskStatus,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 sm:w-auto disabled:opacity-50"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">
                    In Progress
                  </option>
                  <option value="Completed">Completed</option>
                </select>

                {busyTaskId === task.id && (
                  <span className="ml-2 text-xs text-slate-500">
                    Saving...
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
