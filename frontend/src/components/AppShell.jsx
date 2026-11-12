import { createElement, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Store,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BottomNavigation } from "./index";
import { Avatar } from "./ui";

const destinations = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/explore", label: "Businesses", icon: Store },
  { to: "/workers", label: "Workers", icon: Wrench },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
];

export function Brand() {
  return (
    <Link className="brand" to="/home" aria-label="KasiCircle home">
      <span className="brand-mark" aria-hidden="true">
        k
      </span>
      <span>
        KasiCircle<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef(null);
  const menuButtonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    if (accountRef.current) accountRef.current.open = false;
  }, [location.pathname, location.search]);

  useEffect(() => {
    const closeMenus = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      const account = accountRef.current;
      if (
        account?.open &&
        (event.type === "keydown" || !account.contains(event.target))
      ) {
        account.open = false;
        if (event.type === "keydown") account.querySelector("summary")?.focus();
      }
      if (event.type === "keydown" && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeMenus);
    };
  }, [menuOpen]);

  return (
    <header className="app-header">
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Marketplace">
          {destinations.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="icon-button hidden sm:inline-flex"
            to="/explore"
            aria-label="Search marketplace"
          >
            <Search size={20} />
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                className="icon-button hidden sm:inline-flex"
                to="/messages"
                aria-label="Messages"
              >
                <MessageCircle size={20} />
              </Link>
              <Link
                className="icon-button"
                to="/notifications"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </Link>
              <details className="account-dropdown" ref={accountRef}>
                <summary aria-label="Account menu">
                  <Avatar
                    name={`${user?.firstName || ""} ${user?.lastName || ""}`}
                    className="!w-10 !h-10"
                  />
                  <ChevronDown size={14} className="hidden sm:block" />
                </summary>
                <div className="account-panel">
                  <p className="px-3 py-3 text-sm border-b border-neutral-200 mb-1">
                    <strong className="block">
                      {user?.firstName} {user?.lastName}
                    </strong>
                    <span className="text-xs text-neutral-600">
                      Your community account
                    </span>
                  </p>
                  <Link to="/profile">
                    <User size={17} />
                    My profile
                  </Link>
                  {user?.accountType === "BUSINESS" && (
                    <Link to="/business-profile">
                      <Store size={17} />
                      Manage my business
                    </Link>
                  )}
                  {user?.accountType === "WORKER" && (
                    <Link to="/worker-profile">
                      <Wrench size={17} />
                      Manage my worker profile
                    </Link>
                  )}
                  <Link to="/my-applications">
                    <Briefcase size={17} />
                    My applications
                  </Link>
                  {user?.role === "ADMIN" && (
                    <Link to="/admin/reports">
                      <ShieldCheck size={17} />
                      Content reports
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/welcome");
                    }}
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link className="text-sm font-semibold py-3 px-2" to="/login">
                Log in
              </Link>
              <Link
                className="btn-primary hidden sm:inline-flex"
                to="/register"
              >
                Join the circle
              </Link>
            </>
          )}
          <button
            className="icon-button lg:hidden"
            type="button"
            ref={menuButtonRef}
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-marketplace-menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="mobile-menu" id="mobile-marketplace-menu">
          <nav aria-label="Mobile marketplace">
            {destinations.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {createElement(item.icon, { size: 19, "aria-hidden": true })}
                {item.label}
              </NavLink>
            ))}
            <Link to="/explore">
              <Search size={19} aria-hidden="true" />
              Search marketplace
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <User size={19} aria-hidden="true" />
                Create account
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div>
          <Brand />
          <p className="mt-3 text-sm">Good things. Closer to home.</p>
          <p className="mt-1 text-xs">
            Made for our South African communities.
          </p>
        </div>
        <nav aria-label="Footer">
          <Link to="/explore">Local businesses</Link>
          <Link to="/workers">Local skills</Link>
          <Link to="/jobs">Local opportunities</Link>
        </nav>
      </div>
    </footer>
  );
}

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const authRoute = [
    "/",
    "/onboarding",
    "/welcome",
    "/login",
    "/register",
  ].includes(pathname);
  const active =
    pathname.startsWith("/workers") || pathname === "/worker-profile"
      ? "workers"
      : pathname.startsWith("/jobs") || pathname === "/my-applications"
        ? "jobs"
        : pathname.startsWith("/businesses") || pathname === "/explore"
          ? "explore"
          : pathname === "/messages"
            ? "messages"
            : pathname === "/home"
              ? "home"
              : "profile";
  return (
    <div className={`app-body ${authRoute ? "auth-route" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppHeader />
      <div id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        {children}
      </div>
      <AppFooter />
      {!authRoute && <BottomNavigation active={active} onNavigate={navigate} />}
    </div>
  );
}
