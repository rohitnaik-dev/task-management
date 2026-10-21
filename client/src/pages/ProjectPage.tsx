
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { api } from "../api/client";
import type { Project } from "../api/projects.service";
import ProjectMembers from "../components/ProjectMembers";
import ProjectTasks from "../components/ProjectTasks";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const response = await api.get<{ project: Project }>(
          `/projects/${encodeURIComponent(projectId)}`,
        );

        if (active) {
          setProject(response.data.project);
        }
      } catch {
        if (active) {
          setError("Unable to load this project. It may not exist or you may not have access.");
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

    <p className="mt-5 text-sm text-slate-500">Project</p>

    <h1 className="mt-1 text-2xl font-bold text-slate-900">
      {project.name}
    </h1>

    <p className="mt-2 text-slate-600">
      {project.description || "No description provided."}
    </p>

    {/* Project members */}
    <ProjectMembers projectId={project.id} />

    {/* Project tasks */}
    <ProjectTasks projectId={project.id} />
  </section>
);
}
