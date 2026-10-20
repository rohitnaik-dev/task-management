
export default function UsersPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">User management</h1>
      <p className="mt-2 text-slate-600">
        Manage workspace users and their roles.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                User records will appear here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
