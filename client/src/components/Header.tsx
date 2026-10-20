
import { Bell, Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export default function Header({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-slate-800">Workspace</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Bell size={19} />
        </button>

        <span className="hidden text-sm text-slate-600 sm:block">
          {user?.name}
        </span>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
