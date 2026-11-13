import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, MapPin } from "lucide-react";
import { Button } from "../components";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <main className="intro-layout content-container">
      <div className="intro-art warm" aria-hidden="true">
        <img src="/images/storefront.webp" alt="" />
        <p>
          A little more local.
          <br />
          <span>A lot more connected.</span>
        </p>
      </div>
      <div className="intro-copy">
        <p className="eyebrow flex items-center gap-2">
          <Heart size={14} aria-hidden="true" />
          There’s a place for you here
        </p>
        <h1 className="editorial-title">
          Welcome to
          <br />
          the circle.
        </h1>
        <p className="text-lg leading-relaxed text-neutral-600">
          Find your next local favourite, share your skills, or take the next
          step. Your community is a good place to start.
        </p>
        <div className="grid gap-3 mt-8 max-w-sm">
          <Button className="w-full" onClick={() => navigate("/login")}>
            Login to Account
            <ArrowRight size={17} aria-hidden="true" />
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => navigate("/register")}
          >
            Create Account
          </Button>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="link-text py-3 text-sm"
          >
            Continue as Guest
          </button>
        </div>
        <p className="flex items-center gap-2 text-xs text-neutral-600 mt-8">
          <MapPin size={15} aria-hidden="true" />
          Built around South African communities.
        </p>
      </div>
    </main>
  );
}
