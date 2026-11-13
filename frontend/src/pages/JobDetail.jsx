import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Briefcase, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { Button, Card, Header, LoadingSpinner } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { jobService } from "../services/api";
import ReportForm from "../components/ReportForm";
import { ErrorState, StatusBadge } from "../components/ui";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState(null);
  const [message, setMessage] = useState("");
  const [applications, setApplications] = useState([]);
  const [showApplications, setShowApplications] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const loadJob = useCallback(async () => {
    setError("");
    try {
      setJob(await jobService.getJobById(id));
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to load this job.",
      );
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const isEmployer = job && user?.id === job.employerId;

  const loadApplications = async () => {
    setIsLoadingApplications(true);
    setError("");
    try {
      setApplications(await jobService.getApplicationsForJob(id));
      setShowApplications(true);
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to load applications.",
      );
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const changeStatus = async (status) => {
    setError("");
    try {
      await jobService.updateJobStatus(id, status);
      await loadJob();
      setNotice(status === "CLOSED" ? "Job closed." : "Job reopened.");
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to update job status.",
      );
    }
  };

  const apply = async (event) => {
    event.preventDefault();
    if (isApplying) return;
    setIsApplying(true);
    setError("");
    try {
      await jobService.applyForJob(id, message);
      setNotice("Your application has been submitted.");
      setMessage("");
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to submit your application.",
      );
    } finally {
      setIsApplying(false);
    }
  };

  const updateApplication = async (applicationId, status) => {
    setError("");
    try {
      await jobService.updateApplicationStatus(id, applicationId, status);
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, status }
            : application,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to update application.",
      );
    }
  };

  return (
    <div className="page-wrapper job-detail pb-12">
      <Header
        eyebrow="Opportunity in your community"
        title="Job details"
        subtitle="An opportunity to put your skills to work, close to home."
        headingLevel={job ? 2 : 1}
        onBack={() => navigate("/jobs")}
      />
      <main className="content-container py-8 md:py-10 space-y-6">
        {!job && !error && (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {error && (
          <ErrorState
            title="We couldn’t complete that request"
            message={error}
            onRetry={loadJob}
          />
        )}
        {notice && (
          <p
            role="status"
            className="rounded-lg border border-neutral-200 bg-kasi-green-light p-4 text-kasi-green"
          >
            {notice}
          </p>
        )}
        {job && (
          <div className="detail-columns">
            <div className="space-y-6 min-w-0">
              <Card className="p-6 md:p-8">
                <StatusBadge status={job.status} />
                <h1 className="mt-5 font-display text-3xl md:text-4xl">
                  {job.title}
                </h1>
                <p className="mt-3 text-neutral-600">
                  {job.employerName} · {job.category}
                </p>
                <div className="flex flex-wrap gap-3 mt-5 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} aria-hidden="true" />
                    {job.city}, {job.province}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 capitalize">
                    {job.employmentType?.replaceAll("_", " ").toLowerCase()}
                  </span>
                </div>
                <div className="border-t border-neutral-200 mt-6 pt-6">
                  <h2 className="font-semibold text-lg mb-3">
                    About this opportunity
                  </h2>
                  <p className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                    {job.description}
                  </p>
                </div>
                <ReportForm targetType="JOB" targetId={job.id} />
              </Card>
              {isEmployer && showApplications && (
                <section aria-label="Job applications">
                  <h2 className="mb-4 font-display text-2xl">
                    Applications ({applications.length})
                  </h2>
                  {applications.length === 0 ? (
                    <Card className="p-6 text-neutral-600">
                      No applications yet.
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((application) => (
                        <Card key={application.id} className="p-6">
                          <h3 className="font-semibold text-lg">
                            {application.applicantName}
                          </h3>
                          <p className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap">
                            {application.message || "No message provided."}
                          </p>
                          <div className="mt-4">
                            <StatusBadge status={application.status}>
                              Status: {application.status}
                            </StatusBadge>
                          </div>
                          {application.status === "PENDING" && (
                            <div className="mt-4 flex gap-2">
                              <Button
                                type="button"
                                onClick={() =>
                                  updateApplication(application.id, "ACCEPTED")
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                  updateApplication(application.id, "REJECTED")
                                }
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
            <aside className="space-y-5 min-w-0">
              <Card className="p-6">
                <Briefcase
                  size={25}
                  className="text-kasi-green mb-4"
                  aria-hidden="true"
                />
                <h2 className="font-display text-2xl">
                  {isEmployer
                    ? "Manage this opportunity"
                    : "Take the next step"}
                </h2>
                {isEmployer ? (
                  <div className="mt-5 flex flex-col gap-3">
                    {job.status === "OPEN" && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(`/jobs/${id}/edit`)}
                      >
                        Edit job
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        changeStatus(job.status === "OPEN" ? "CLOSED" : "OPEN")
                      }
                    >
                      {job.status === "OPEN" ? "Close job" : "Reopen job"}
                    </Button>
                    <Button
                      type="button"
                      onClick={loadApplications}
                      disabled={isLoadingApplications}
                    >
                      {isLoadingApplications ? "Loading…" : "View applications"}
                    </Button>
                  </div>
                ) : job.status === "OPEN" ? (
                  isAuthenticated ? (
                    <form onSubmit={apply} className="mt-5 space-y-4">
                      <label className="block text-sm font-semibold">
                        Application message
                        <textarea
                          aria-label="Application message"
                          className="input-field mt-2 min-h-32"
                          maxLength={1000}
                          placeholder="Introduce yourself and explain how you can help…"
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                        />
                      </label>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isApplying}
                      >
                        {isApplying ? "Submitting…" : "Apply for this job"}
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-neutral-600 mb-4">
                        Join the circle to introduce yourself to the employer.
                      </p>
                      <Link className="btn-primary w-full" to="/login">
                        Sign in to apply
                      </Link>
                    </div>
                  )
                ) : (
                  <p className="mt-4 text-sm text-neutral-600">
                    This job is closed and no longer accepting applications.
                  </p>
                )}
                {!isEmployer && isAuthenticated && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-4 w-full"
                    onClick={() =>
                      navigate(`/messages?participant=${job.employerId}`)
                    }
                  >
                    <MessageCircle size={17} aria-hidden="true" />
                    Message employer
                  </Button>
                )}
                <p className="mt-6 flex items-start gap-2 text-xs text-neutral-600 leading-relaxed">
                  <ShieldCheck
                    size={17}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  Employer contact information is private. Applications are
                  shared only with this job's employer.
                </p>
              </Card>
              {isEmployer && (
                <p className="text-xs text-neutral-600 leading-relaxed px-1">
                  Applicant contact details are private; use messaging to
                  connect.
                </p>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
