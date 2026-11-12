import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { Button, Card, Header, LoadingSpinner } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { workerService } from "../services/api";
import ReportForm from "../components/ReportForm";
import { Avatar, ErrorState } from "../components/ui";

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [worker, setWorker] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setWorker(null);
    setError("");
    workerService
      .getWorkerById(id)
      .then((result) => {
        if (active) setWorker(result);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.data?.message ||
              requestError.message ||
              "Unable to load this worker profile.",
          );
      });
    return () => {
      active = false;
    };
  }, [id, retry]);

  return (
    <div className="page-wrapper">
      <Header
        title="Worker profile"
        subtitle="Meet the people who bring practical skills to your neighbourhood."
        headingLevel={worker ? 2 : 1}
        onBack={() => navigate("/workers")}
      />
      <main className="content-container py-8 md:py-10">
        {!worker && !error && (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {error && (
          <ErrorState
            title="We couldn’t load this profile"
            message={error}
            onRetry={() => setRetry((value) => value + 1)}
          />
        )}
        {worker && (
          <div className="detail-columns">
            <Card className="p-6 md:p-8">
              <Avatar
                name={worker.displayName}
                className="!w-20 !h-20 !text-2xl mb-5"
              />
              <h1 className="font-display text-3xl md:text-4xl">
                {worker.displayName}
              </h1>
              <p className="mt-1 text-lg text-kasi-green font-semibold">
                {worker.headline}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-neutral-700">
                {worker.bio}
              </p>
              <h2 className="mt-6 font-semibold">Service area</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                <MapPin size={16} />
                {worker.city}, {worker.province}
              </p>
              <section className="mt-6">
                <h2 className="font-semibold">Skills</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {worker.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-sm"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="mt-5">
                <h2 className="font-semibold">Service categories</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {worker.serviceCategories.map((category) => (
                    <li
                      key={category}
                      className="rounded-full bg-kasi-green-light px-3 py-1 text-sm"
                    >
                      {category}
                    </li>
                  ))}
                </ul>
              </section>
              <p className="mt-6 text-sm text-neutral-600">
                Contact details are private. Send a message to connect securely.
              </p>
            </Card>
            <aside className="space-y-5">
              <Card className="p-6">
                <MessageCircle
                  size={24}
                  className="mb-4 text-kasi-green"
                  aria-hidden="true"
                />
                <h2 className="font-semibold text-lg">Start a conversation</h2>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Ask about the work you need and discuss availability directly.
                </p>
                {isAuthenticated && user?.id !== worker.ownerId && (
                  <Button
                    type="button"
                    className="mt-5"
                    onClick={() =>
                      navigate(`/messages?participant=${worker.ownerId}`)
                    }
                  >
                    Message worker
                  </Button>
                )}
                {!isAuthenticated && (
                  <Button
                    type="button"
                    className="mt-5 w-full"
                    onClick={() => navigate("/login")}
                  >
                    Log in to connect
                  </Button>
                )}
                {isAuthenticated && user?.id === worker.ownerId && (
                  <Button
                    type="button"
                    className="mt-5 w-full"
                    variant="secondary"
                    onClick={() => navigate("/worker-profile")}
                  >
                    Edit my worker profile
                  </Button>
                )}
                <p className="mt-5 flex items-start gap-2 text-xs text-neutral-600">
                  <ShieldCheck
                    size={16}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  Only your conversation participant can see your messages.
                </p>
              </Card>
              <ReportForm targetType="WORKER_PROFILE" targetId={worker.id} />
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => navigate("/workers")}
              >
                Back to workers
              </Button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
