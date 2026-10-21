import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  RefreshCw,
  Plus,
  Trash2,
  ClipboardList,
  AlertCircle,
  Pencil,
  GripVertical,
  X,
} from "lucide-react";
import axios from "axios";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";

import {
  getProjectMembers,
  type ProjectMember,
} from "../api/projectMembers.service";

import {
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  reorderProjectTasks,
  type Task,
  type TaskStatus,
} from "../api/tasks.service";

import { connectSocket, useSocketStatus } from "../socket/socket";
import { formatDate } from "../utils/date";

interface SortableTaskCardProps {
  task: Task;
  index: number;
  isReordering: boolean;
  busyTaskId: string | null;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

function SortableTaskCard({
  task,
  index,
  isReordering,
  busyTaskId,
  onEdit,
  onDelete,
  onStatusChange,
}: SortableTaskCardProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: task.id,
    index,
    disabled: isReordering || busyTaskId === task.id,
  });

  const isBusy = busyTaskId === task.id;

  return (
    <article
      ref={ref}
      className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 transition-shadow ${
        isDragging
          ? "opacity-50 ring-2 ring-indigo-500 shadow-lg"
          : "hover:border-slate-300"
      }`}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          
          <button
            ref={handleRef}
            type="button"
            aria-label={`Drag to reorder ${task.title}`}
            disabled={isReordering || isBusy}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 p-1 -ml-1 rounded focus:outline-none touch-none"
          >
            <GripVertical size={18} />
          </button>

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
              <span className="font-medium text-slate-700">
                Position: {task.position}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {task.assignee
                  ? `Assigned to ${task.assignee.name}`
                  : "Unassigned"}
              </span>

              <span>Created {formatDate(task.createdAt)}</span>
            </div>
          </div>
        </div>

        
        <div className="flex shrink-0 items-center gap-2 self-start pl-7 sm:pl-0">
          <button
            type="button"
            onClick={() => onEdit(task)}
            disabled={isBusy || isReordering}
            aria-label={`Edit ${task.title}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={14} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(task)}
            disabled={isBusy || isReordering}
            aria-label={`Delete ${task.title}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      
      <div className="mt-4 border-t border-slate-100 pt-3 pl-7 sm:pl-7">
        <label
          htmlFor={`task-status-${task.id}`}
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          Status
        </label>

        <select
          id={`task-status-${task.id}`}
          value={task.status}
          disabled={isBusy || isReordering}
          onChange={(event) =>
            onStatusChange(task, event.target.value as TaskStatus)
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-500 sm:w-auto disabled:opacity-50"
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        {isBusy && (
          <span className="ml-2 text-xs text-slate-500">Saving...</span>
        )}
      </div>
    </article>
  );
}

interface ProjectTasksProps {
  projectId: string;
  membersVersion?: number;
}

export default function ProjectTasks({
  projectId,
  membersVersion = 0,
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
  const [isReordering, setIsReordering] = useState(false);

  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("Pending");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

 
  const socketStatus = useSocketStatus();
  const isReorderingRef = useRef(isReordering);

  useEffect(() => {
    isReorderingRef.current = isReordering;
  }, [isReordering]);


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

  
  useEffect(() => {
    const socket = connectSocket();

    const joinRoom = () => {
      socket.emit(
        "join_project",
        projectId,
        (response?: { ok: boolean; message?: string; room?: string }) => {
          if (response && !response.ok) {
            console.warn("Unable to join project room:", response.message);
          }
        },
      );
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    const onTaskCreated = (newTask: Task) => {
      if (
        !newTask ||
        typeof newTask !== "object" ||
        typeof newTask.id !== "string"
      ) {
        void handleRefreshTasks();
        return;
      }

      if (newTask.projectId !== projectId) return;

      setTasks((current) => {
        
        if (current.some((t) => t.id === newTask.id)) {
          return current;
        }
        return [...current, newTask].sort(
          (a, b) => a.position - b.position,
        );
      });
    };

    const onTaskUpdated = (updatedTask: Task) => {
      if (
        !updatedTask ||
        typeof updatedTask !== "object" ||
        typeof updatedTask.id !== "string"
      ) {
        void handleRefreshTasks();
        return;
      }

      if (updatedTask.projectId !== projectId) return;

      setTasks((current) => {
        const exists = current.some((t) => t.id === updatedTask.id);
        if (!exists) {
          return [...current, updatedTask].sort(
            (a, b) => a.position - b.position,
          );
        }
        return current.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        );
      });
    };

    const onTaskDeleted = (payload: { id: string; projectId: string }) => {
      if (
        !payload ||
        typeof payload !== "object" ||
        typeof payload.id !== "string"
      ) {
        void handleRefreshTasks();
        return;
      }

      if (payload.projectId !== projectId) return;

      setTasks((current) =>
        current.filter((t) => t.id !== payload.id),
      );

      setEditingTask((currentEditing) => {
        if (currentEditing && currentEditing.id === payload.id) {
          setActionError(
            "The task you were editing was deleted by another user.",
          );
          return null;
        }
        return currentEditing;
      });
    };

    const onTasksReordered = (reorderedTasks: Task[]) => {
      if (!Array.isArray(reorderedTasks)) {
        void handleRefreshTasks();
        return;
      }

      if (
        reorderedTasks.length > 0 &&
        reorderedTasks[0]?.projectId !== projectId
      ) {
        return;
      }

      
      if (isReorderingRef.current) return;

      setTasks(reorderedTasks);
    };

    socket.on("task:created", onTaskCreated);
    socket.on("task:updated", onTaskUpdated);
    socket.on("task:deleted", onTaskDeleted);
    socket.on("tasks:reordered", onTasksReordered);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("task:created", onTaskCreated);
      socket.off("task:updated", onTaskUpdated);
      socket.off("task:deleted", onTaskDeleted);
      socket.off("tasks:reordered", onTasksReordered);

      if (socket.connected) {
        socket.emit("leave_project", projectId, () => {});
      }
    };
  }, [projectId, handleRefreshTasks]);

  
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
  }, [projectId, membersVersion]);

  
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

      setTasks((current) => {
        if (current.some((t) => t.id === task.id)) {
          return current;
        }
        return [...current, task].sort(
          (a, b) => a.position - b.position,
        );
      });

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

  // Delete a task
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

  // Edit task handlers
  function handleOpenEdit(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditAssignedTo(task.assignedTo || "");
    setEditStatus(task.status);
    setEditError("");
  }

  function handleCloseEdit() {
    if (!editSaving) {
      setEditingTask(null);
      setEditError("");
    }
  }

  async function handleSaveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTask) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError("Task title is required.");
      return;
    }

    if (trimmedTitle.length > 200) {
      setEditError("Task title must not exceed 200 characters.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      const updatedTask = await updateProjectTask(projectId, editingTask.id, {
        title: trimmedTitle,
        description: editDescription.trim() || null,
        assignedTo: editAssignedTo || null,
        status: editStatus,
      });

      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id ? updatedTask : item,
        ),
      );
      setEditingTask(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setEditError(
          err.response?.data?.message ||
            "Unable to update task. Please try again.",
        );
      } else {
        setEditError("Unable to update task. Please try again.");
      }
    } finally {
      setEditSaving(false);
    }
  }

  // Drag and drop reorder handler
  async function handleDragEnd(event: DragEndEvent) {
    if (event.canceled) return;

    const newTasks = move(tasks, event);
    const hasOrderChanged = newTasks.some(
      (task, index) => task.id !== tasks[index]?.id,
    );

    if (!hasOrderChanged) return;

    const previousTasks = tasks;
    // Optimistic update with recalculated position values
    const optimisticTasks = newTasks.map((t, idx) => ({
      ...t,
      position: idx + 1,
    }));

    setTasks(optimisticTasks);
    setIsReordering(true);
    setActionError("");

    try {
      const taskIds = optimisticTasks.map((t) => t.id);
      const updated = await reorderProjectTasks(projectId, taskIds);
      setTasks(updated);
    } catch (err: unknown) {
      setTasks(previousTasks);
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Failed to update task order. Reverted changes.",
        );
      } else {
        setActionError("Failed to update task order. Reverted changes.");
      }
    } finally {
      setIsReordering(false);
    }
  }

  return (
    <section className="mt-8">
    
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-slate-900">
              Project tasks
            </h2>

         
            {socketStatus === "connected" ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200"
                title="Real-time updates active"
                aria-label="Real-time connected"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            ) : socketStatus === "connecting" ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200"
                title="Attempting to connect to real-time service"
                aria-label="Real-time reconnecting"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                Reconnecting
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200"
                title="Real-time updates offline (REST fallback active)"
                aria-label="Real-time offline"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Offline
              </span>
            )}

            {isReordering && (
              <span className="text-xs text-indigo-600 font-medium">
                Saving order...
              </span>
            )}
          </div>

          {!loading && !error && (
            <p className="mt-1 text-sm text-slate-500">
              {tasks.length}{" "}
              {tasks.length === 1 ? "task" : "tasks"}
              {tasks.length > 1 && " • Drag handles to reorder"}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleRefreshTasks()}
          disabled={loading || isReordering}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      
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

       
        {actionError && (
          <p role="alert" className="text-sm text-red-600">
            {actionError}
          </p>
        )}

      
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          {creating ? "Creating..." : "Add task"}
        </button>
      </form>

      
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
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                index={index}
                isReordering={isReordering}
                busyTaskId={busyTaskId}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </DragDropProvider>
      )}

      
      {editingTask && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-task-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3
                id="edit-task-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                Edit Task
              </h3>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={editSaving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {editError && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {editError}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-task-title"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-task-title"
                  type="text"
                  required
                  maxLength={200}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-task-description"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Description{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="edit-task-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe what needs to be done..."
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-task-assignee"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Assign to
                  </label>
                  <select
                    id="edit-task-assignee"
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Unassigned</option>
                    {editingTask.assignee &&
                      !members.some(
                        (m) => m.id === editingTask.assignee?.id,
                      ) && (
                        <option value={editingTask.assignee.id}>
                          {editingTask.assignee.name} (Former member)
                        </option>
                      )}
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-task-status"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="edit-task-status"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as TaskStatus)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={editSaving}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving || !editTitle.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
