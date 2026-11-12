import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button, Card, Header, LoadingSpinner } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { jobService } from "../services/api";

const initialForm = {
  title: "",
  description: "",
  category: "",
  employmentType: "FULL_TIME",
  city: "",
  province: "",
};

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(!id);

  useEffect(() => {
    if (!id) return;
    jobService
      .getJobById(id)
      .then((job) => {
        if (job.employerId !== user?.id) {
          setError("Only the employer who posted this job may edit it.");
          return;
        }
        setForm({
          title: job.title,
          description: job.description,
          category: job.category,
          employmentType: job.employmentType,
          city: job.city,
          province: job.province,
        });
        setCanEdit(true);
      })
      .catch((requestError) =>
        setError(
          requestError.data?.message ||
            requestError.message ||
            "Unable to load this job.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [id, user?.id]);

  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const job = id
        ? await jobService.updateJob(id, form)
        : await jobService.createJob(form);
      navigate(`/jobs/${job.id}`);
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to save this job.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header
        title={id ? "Edit job" : "Post a job"}
        subtitle="Connect an opportunity with the right person in your community."
        onBack={() => navigate(id ? `/jobs/${id}` : "/jobs")}
      />
      <main className="content-container py-8 md:py-10">
        {isLoading ? (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="detail-columns">
            <Card className="p-6 md:p-8">
              <h2 className="font-display text-2xl mb-2">
                An opportunity worth sharing.
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                Give applicants a clear picture of the work and where it
                happens.
              </p>
              {error && (
                <p role="alert" className="mb-4 text-red-700">
                  <AlertCircle className="inline mr-2" />
                  {error}
                </p>
              )}
              {canEdit && (
                <form className="space-y-4" onSubmit={submit}>
                  <label className="block text-sm font-semibold">
                    Job title
                    <input
                      name="title"
                      className="input-field mt-1"
                      maxLength={120}
                      required
                      value={form.title}
                      onChange={updateField}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Description
                    <textarea
                      name="description"
                      className="input-field mt-1 min-h-40"
                      maxLength={4000}
                      required
                      value={form.description}
                      onChange={updateField}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Service category
                    <input
                      name="category"
                      className="input-field mt-1"
                      maxLength={60}
                      required
                      value={form.category}
                      onChange={updateField}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Employment type
                    <select
                      name="employmentType"
                      className="input-field mt-1"
                      value={form.employmentType}
                      onChange={updateField}
                    >
                      <option value="FULL_TIME">Full time</option>
                      <option value="PART_TIME">Part time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="TEMPORARY">Temporary</option>
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">
                      Township or city
                      <input
                        name="city"
                        className="input-field mt-1"
                        maxLength={100}
                        required
                        value={form.city}
                        onChange={updateField}
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Province
                      <input
                        name="province"
                        className="input-field mt-1"
                        maxLength={100}
                        required
                        value={form.province}
                        onChange={updateField}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-neutral-600">
                    Your contact details are not shown publicly with the job
                    listing.
                  </p>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving…" : id ? "Save changes" : "Publish job"}
                  </Button>
                </form>
              )}
            </Card>
            <aside className="marketplace-card p-6 bg-kasi-green-light">
              <p className="eyebrow mb-3">Make a good connection</p>
              <h2 className="font-display text-2xl mb-4">
                Clear details. Better applications.
              </h2>
              <ul className="space-y-4 text-sm text-neutral-700 leading-relaxed">
                <li>
                  Use a specific job title and describe what needs to be done.
                </li>
                <li>Include the skills and experience that would help.</li>
                <li>Choose the right work arrangement and location.</li>
                <li>
                  Your contact details stay private. Review applications and
                  connect through Messages.
                </li>
              </ul>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
