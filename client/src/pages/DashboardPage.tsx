
export default function DashboardPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">Overview</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">
        Dashboard
      </h1>
      <p className="mt-2 text-slate-600">
        Welcome to your workspace. Track projects, tasks, and team activity.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Total projects", "—"],
          ["Active tasks", "—"],
          ["Team members", "—"],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
