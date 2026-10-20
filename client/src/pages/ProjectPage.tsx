
import { useParams } from "react-router";

export default function ProjectPage() {
  const { projectId } = useParams();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Project tasks</h1>
      <p className="mt-2 text-slate-600">
        Project ID: {projectId}
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-medium text-slate-800">No tasks loaded yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Connect this page to your tasks API to display project tasks.
        </p>
      </div>
    </section>
  );
}
