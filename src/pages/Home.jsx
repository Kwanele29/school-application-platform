import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FileText,
  Bell,
  Users,
  MapPin,
  GraduationCap,
  ArrowRight,
  School,
  ShieldCheck,
} from "lucide-react";
import forParentsImg from "../assets/for-parents.png";
import forSchoolsImg from "../assets/for-schools.png";
import forAdminsImg from "../assets/for-admin.png";
import "./Home.css";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Find Schools", href: "#find-schools" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

const FEATURES = [
  {
    icon: Search,
    tone: "green",
    title: "Discover Schools",
    description: "Find nearby schools with open applications.",
  },
  {
    icon: FileText,
    tone: "orange",
    title: "Apply Online",
    description: "Complete your application without traveling.",
  },
  {
    icon: Bell,
    tone: "blue",
    title: "Get Notifications",
    description: "Receive acceptance, meeting and update alerts.",
  },
  {
    icon: Users,
    tone: "purple",
    title: "One Platform",
    description: "Parents, schools and admins — all in one place.",
  },
];

const AUDIENCE_CARDS = [
  {
    icon: Users,
    tone: "blue",
    image: forParentsImg,
    title: "For Parents",
    description:
      "Search schools, apply online, track your applications and get real-time updates.",
    cta: "Get Started",
    href: "/register",
  },
  {
    icon: School,
    tone: "green",
    image: forSchoolsImg,
    title: "For Schools",
    description:
      "Manage your school profile, post applications, review and accept applications.",
    cta: "School Login",
    href: "/register",
  },
  {
    icon: ShieldCheck,
    tone: "purple",
    image: forAdminsImg,
    title: "For Administrators",
    description:
      "Verify new schools, monitor activity and keep the platform running smoothly.",
    cta: "Admin Login",
    href: "/login",
  },
];

export default function Home() {
  const [location, setLocation] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    console.log("Searching schools:", { location, gradeLevel });
    // TODO: navigate to /find-schools?location=...&grade=...
  };

  return (
    <div className="home">
      {/* ---------- Navbar ---------- */}
      <header className="navbar">
        <a className="navbar__brand" href="#home">
          <span className="navbar__logo" aria-hidden="true">
            <GraduationCap size={26} strokeWidth={2} />
          </span>
          <span className="navbar__brand-text">
            School
            <br />
            Application Platform
          </span>
        </a>

        <nav className="navbar__links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={
                link.label === "Home"
                  ? "navbar__link navbar__link--active"
                  : "navbar__link"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar__actions">
          <Link to="/login" className="btn btn--ghost">
            Login
          </Link>
          <Link to="/register" className="btn btn--accent">
            Sign Up
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="hero" id="home">
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow">Better access. Brighter futures.</p>
          <h1 className="hero__heading">
            Find the Right School.
            <br />
            <span className="hero__heading-accent">Apply with Ease.</span>
          </h1>
          <p className="hero__subheading">
            Discover local schools, check open applications, apply online
            from the comfort of your home, and stay updated every step of
            the way.
          </p>

          <form className="hero__search" onSubmit={handleSearch}>
            <label className="hero__search-field">
              <MapPin size={18} className="hero__search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Enter your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Enter your location"
              />
            </label>

            <span className="hero__search-divider" aria-hidden="true" />

            <label className="hero__search-field">
              <GraduationCap
                size={18}
                className="hero__search-icon"
                aria-hidden="true"
              />
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                aria-label="Select grade level"
              >
                <option value="">Select grade level</option>
                <option value="grade-r">Grade R</option>
                <option value="foundation">Foundation Phase</option>
                <option value="intermediate">Intermediate Phase</option>
                <option value="senior">Senior Phase</option>
                <option value="fet">FET Phase</option>
              </select>
            </label>

            <button type="submit" className="btn btn--accent hero__search-btn">
              <Search size={18} strokeWidth={2.5} aria-hidden="true" />
              Search Schools
            </button>
          </form>
        </div>

        <p className="hero__tagline" aria-hidden="true">
          More opportunities
          <br />
          for every child
        </p>
      </section>

      {/* ---------- Feature strip ---------- */}
      <section className="features" aria-label="How the platform helps">
        {FEATURES.map(({ icon: Icon, tone, title, description }) => (
          <div className="feature" key={title}>
            <span className={`feature__icon feature__icon--${tone}`}>
              <Icon size={22} strokeWidth={2} aria-hidden="true" />
            </span>
            <h3 className="feature__title">{title}</h3>
            <p className="feature__description">{description}</p>
          </div>
        ))}
      </section>

      {/* ---------- Audience section ---------- */}
      <section className="audience" id="about">
        <div className="audience__bg-wave" aria-hidden="true" />
        <div className="audience__intro">
          <p className="audience__eyebrow">Who is this for?</p>
          <h2 className="audience__heading">
            A platform for parents, schools and administrators.
          </h2>
          <p className="audience__description">
            We make the school application process simpler, faster and more
            accessible — especially for rural communities.
          </p>
        </div>

        <div className="audience__cards">
          {AUDIENCE_CARDS.map(
            ({ icon: Icon, tone, image, title, description, cta, href }) => (
              <article className="audience-card" key={title}>
                <img
                  src={image}
                  alt=""
                  className="audience-card__image"
                  loading="lazy"
                />
                <span
                  className={`audience-card__icon audience-card__icon--${tone}`}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="audience-card__body">
                  <h3 className="audience-card__title">{title}</h3>
                  <p className="audience-card__description">{description}</p>
                  <Link
                    to={href}
                    className={`btn btn--solid btn--solid-${tone} audience-card__cta`}
                  >
                    {cta}
                    <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            )
          )}
        </div>
      </section>
    </div>
  );
}