import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "../components";
import { ShopArt } from "../components/ui";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <main className="intro-layout content-container">
      <div>
        <p className="eyebrow flex items-center gap-2">
          <MapPin size={15} aria-hidden="true" />
          404 / A little off the path
        </p>
        <h1 className="editorial-title">Page not found</h1>
        <p className="text-neutral-600 leading-relaxed max-w-md">
          The page you’re looking for may have moved, or the link might be out
          of date. There’s still plenty to discover in your circle.
        </p>
        <div className="flex flex-wrap gap-3 mt-7">
          <Button onClick={() => navigate("/home")}>
            Go Home
            <ArrowRight size={17} aria-hidden="true" />
          </Button>
          <Button variant="secondary" onClick={() => navigate("/explore")}>
            Explore businesses
          </Button>
        </div>
      </div>
      <div className="intro-art" aria-hidden="true">
        <ShopArt />
        <p>
          Let’s find your
          <br />
          <span>way back home.</span>
        </p>
      </div>
    </main>
  );
}
