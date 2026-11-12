import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, Store, Wrench, Briefcase } from "lucide-react";
import { Button } from "../components";
import { ShopArt } from "../components/ui";

export default function Onboarding() {
  const navigate = useNavigate();
  return (
    <main className="intro-layout content-container">
      <div className="intro-copy">
        <p className="eyebrow flex gap-2 items-center">
          <MapPin size={14} aria-hidden="true" />
          Your neighbourhood, connected
        </p>
        <h1 className="editorial-title">
          Good things.
          <br />
          Closer to home.
        </h1>
        <p className="text-neutral-600 leading-relaxed text-lg max-w-lg">
          Big possibilities begin with the people around you. Welcome to your
          community’s marketplace.
        </p>
        <div className="intro-features">
          <p>
            <Store size={20} aria-hidden="true" />
            <span>Discover the businesses that make your kasi.</span>
          </p>
          <p>
            <Wrench size={20} aria-hidden="true" />
            <span>Find local workers and practical skills.</span>
          </p>
          <p>
            <Briefcase size={20} aria-hidden="true" />
            <span>Explore opportunities close to home.</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 mt-8">
          <Button onClick={() => navigate("/welcome")}>
            Continue <ArrowRight size={17} aria-hidden="true" />
          </Button>
          <Link className="btn-secondary" to="/home">
            Explore as a guest
          </Link>
        </div>
      </div>
      <div className="intro-art" aria-hidden="true">
        <ShopArt />
        <p>
          Our communities.
          <br />
          <span>Our possibilities.</span>
        </p>
      </div>
    </main>
  );
}
