
import { NavLink } from "react-router";
import { LayoutDashboard, FolderKanban, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-slate-200 bg-white p-4 transition-transform
          md:static md:z-auto md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 px-2 text-xl font-bold text-slate-900">
          WorkSpace
        </div>

        <nav className="space-y-2">
          <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <NavLink to="/projects/demo" className={linkClass} onClick={onClose}>
            <FolderKanban size={18} /> Projects
          </NavLink>

          {user?.role === "admin" && (
            <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
              <Users size={18} /> Users
            </NavLink>
          )}
        </nav>

        <div className="mt-auto border-t border-slate-200 px-2 pt-4 text-sm text-slate-500">
          Signed in as {user?.name ?? "User"}
        </div>
      </aside>
    </>
  );
}
