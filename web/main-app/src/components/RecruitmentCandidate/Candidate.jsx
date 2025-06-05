import { useState } from "react";
import "../../css/RecruitmentCandidate.css";
import EndavaLogo from "../../assets/images/endava-logo.png";
import NotificationIcon from "../../assets/icons/notification.png";
import FilterIcon from "../../assets/icons/filter.png";
import JobCard from "./JobCard";
import TopHeader from "./TopHeader";
import JobDetailDrawer from "./JobDetailDrawer";

const allJobs = [
  {
    title: "Senior Technical Business Analyst",
    location: "Ho Chi Minh City, Vietnam",
    date: "May 26, 2025",
    referral: true,
    ref: "REF479E",
    experience: "5+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ],
    additionalInformation: [
      "Discover some of the global benefits that empower our people to become the best version of themselves:",
      "Finance: Competitive salary package, share plan, value-based recognition awards, referral bonus;",
      "Career Development: Career coaching, global career opportunities, non-linear career paths, internal development programmes for management and technical leadership;",
      "Learning Opportunities: Complex projects, rotations, internal tech communities, training, certifications, coaching, online learning platforms subscriptions, pass-it-on sessions, workshops, conferences;",
      "Work-Life Balance: Hybrid work and flexible working hours, employee assistance programme;",
      "Health: Global internal wellbeing programme, access to wellbeing apps;",
      "Community: Global internal tech communities, hobby clubs and interest groups, inclusion and diversity programmes, events and celebrations.",
      "Annual leave encashment;",
      "13th month salary;",
      "Premium annual health check & Extra health & accident insurance;",
      "Welcome kit and gift-giving frequency;",
      "Attractive benefits of Trade Union;",
      "Exciting English programme.",
      "Discover some of the global benefits that empower our people to become the best version of themselves:"
    ],
    hiringManager: "Co Le",
    recruiter: "Thuy Ho"
  },
  {
    title: "Senior Fullstack Developer (.NET + React)",
    location: "Bangkok, Thailand",
    date: "May 21, 2025",
    referral: true,
    ref: "REF1239O",
    experience: "4+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ],
    additionalInformation: [
      "Discover some of the global benefits that empower our people to become the best version of themselves:",
      "Finance: Competitive salary package, share plan, value-based recognition awards, referral bonus;",
      "Career Development: Career coaching, global career opportunities, non-linear career paths, internal development programmes for management and technical leadership;",
      "Learning Opportunities: Complex projects, rotations, internal tech communities, training, certifications, coaching, online learning platforms subscriptions, pass-it-on sessions, workshops, conferences;",
      "Work-Life Balance: Hybrid work and flexible working hours, employee assistance programme;",
      "Health: Global internal wellbeing programme, access to wellbeing apps;",
      "Community: Global internal tech communities, hobby clubs and interest groups, inclusion and diversity programmes, events and celebrations.",
      "Annual leave encashment;",
      "13th month salary;",
      "Premium annual health check & Extra health & accident insurance;",
      "Welcome kit and gift-giving frequency;",
      "Attractive benefits of Trade Union;",
      "Exciting English programme.",
      "Discover some of the global benefits that empower our people to become the best version of themselves:"
    ],
    hiringManager: "Co Le",
    recruiter: "Thuy Ho"
  },
  {
    title: "C Developers (Network, Linux)",
    location: "Kuala Lumpur, Malaysia",
    date: "May 12, 2025",
    referral: false,
    ref: "REF1553T",
    experience: "3+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ],
    additionalInformation: [
      "Discover some of the global benefits that empower our people to become the best version of themselves:",
      "Finance: Competitive salary package, share plan, value-based recognition awards, referral bonus;",
      "Career Development: Career coaching, global career opportunities, non-linear career paths, internal development programmes for management and technical leadership;",
      "Learning Opportunities: Complex projects, rotations, internal tech communities, training, certifications, coaching, online learning platforms subscriptions, pass-it-on sessions, workshops, conferences;",
      "Work-Life Balance: Hybrid work and flexible working hours, employee assistance programme;",
      "Health: Global internal wellbeing programme, access to wellbeing apps;",
      "Community: Global internal tech communities, hobby clubs and interest groups, inclusion and diversity programmes, events and celebrations.",
      "Annual leave encashment;",
      "13th month salary;",
      "Premium annual health check & Extra health & accident insurance;",
      "Welcome kit and gift-giving frequency;",
      "Attractive benefits of Trade Union;",
      "Exciting English programme.",
      "Discover some of the global benefits that empower our people to become the best version of themselves:"
    ],
    hiringManager: "Co Le",
    recruiter: "Thuy Ho"
  },
  {
    title: "Senior Developer (Java)",
    location: "Singapore",
    date: "May 6, 2025",
    referral: true,
    ref: "REF212X",
    experience: "5+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ],
    additionalInformation: [
      "Discover some of the global benefits that empower our people to become the best version of themselves:",
      "Finance: Competitive salary package, share plan, value-based recognition awards, referral bonus;",
      "Career Development: Career coaching, global career opportunities, non-linear career paths, internal development programmes for management and technical leadership;",
      "Learning Opportunities: Complex projects, rotations, internal tech communities, training, certifications, coaching, online learning platforms subscriptions, pass-it-on sessions, workshops, conferences;",
      "Work-Life Balance: Hybrid work and flexible working hours, employee assistance programme;",
      "Health: Global internal wellbeing programme, access to wellbeing apps;",
      "Community: Global internal tech communities, hobby clubs and interest groups, inclusion and diversity programmes, events and celebrations.",
      "Annual leave encashment;",
      "13th month salary;",
      "Premium annual health check & Extra health & accident insurance;",
      "Welcome kit and gift-giving frequency;",
      "Attractive benefits of Trade Union;",
      "Exciting English programme.",
      "Discover some of the global benefits that empower our people to become the best version of themselves:"
    ],
    hiringManager: "Co Le",
    recruiter: "Thuy Ho"
  },
  {
    title: "Development Lead (Java)",
    location: "Sydney, Australia",
    date: "May 6, 2025",
    referral: false,
    ref: "REF206G",
    experience: "7+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ]
  },
  {
    title: "Automation Tester",
    location: "Tokyo, Japan",
    date: "Apr 2, 2025",
    referral: true,
    ref: "REF142T",
    experience: "3+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ]
  },
  {
    title: "UI/UX Designer",
    location: "Toronto, Canada",
    date: "Apr 1, 2025",
    referral: false,
    ref: "REF891Z",
    experience: "4+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ]
  },
  {
    title: "Backend Developer (Node.js)",
    location: "Berlin, Germany",
    date: "Mar 28, 2025",
    referral: true,
    ref: "REF302D",
    experience: "4+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ]
  },
  {
    title: "Frontend Developer (React)",
    location: "New York, USA",
    date: "Mar 20, 2025",
    referral: true,
    ref: "REF883Y",
    experience: "3+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ]
  },
  {
    title: "DevOps Engineer",
    location: "London, UK",
    date: "Mar 15, 2025",
    referral: false,
    ref: "REF604B",
    experience: "5+ years",
    companyDescription: "Technology is our how. And people are our why. For over two decades, we have been harnessing technology to drive meaningful change.By combining world-class engineering, industry expertise and a people-centric mindset, we consult and partner with leading brands from various industries to create dynamic platforms and intelligent digital experiences that drive innovation and transform businesses. From prototype to real-world impact - be part of a global shift by doing work that matters.",
    jobDescription: "Analysis teams identify client needs, analyze processes, and propose solutions to align with strategic goals. While fostering efficiency and ensuring organizational success through systematic approaches, they also mediate between clients and engineering teams to ensure project clarity. As a Senior Technical Business Analyst at Endava, you will be challenged to work alongside passionate individuals, who always strive to continuously improve and who share the same vision on what \"done\" work signifies. You will be a member of a team that interacts frequently with the client and the team members. You will work in an agile environment, close to the business and to the development team(s) and help them focus on delivering value to the customers.",
    responsibilities: [
      "Analyze and document business requirements",
      "Collaborate with development team",
      "Facilitate workshops"
    ],
    qualifications: [
      "5+ years experience in business analysis",
      "Strong communication skills",
      "Fluent English"
    ]
  }
];

const Candidate = () => {
  const [searchText, setSearchText] = useState("");
  const [referralOnly, setReferralOnly] = useState(false);
  const [location, setLocation] = useState("All");
  const [experience, setExperience] = useState("All");
  const [showRefModal, setShowRefModal] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState("");
  const [filteredByRef, setFilteredByRef] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const locations = [...new Set(allJobs.map((job) => job.location))];
  const experiences = [...new Set(allJobs.map((job) => job.experience))];

  const filteredJobs = allJobs.filter((job) => {
    return (
      job.title.toLowerCase().includes(searchText.toLowerCase()) &&
      (referralOnly ? job.referral : true) &&
      (location === "All" || job.location === location) &&
      (experience === "All" || job.experience === experience)
    );
  });

  const visibleJobs = filteredByRef ?? filteredJobs;

  const handleRefSearch = () => {
    const match = allJobs.find(
      (job) => job.ref.toLowerCase() === refCodeInput.toLowerCase()
    );
    setFilteredByRef(match ? [match] : []);
    setShowRefModal(false);
  };

  const handleFilterClearSearch = () => {
    setSearchText("");
    setReferralOnly(false);
    setLocation("All");
    setExperience("All");
    setFilteredByRef(null);
  };

  return (
    <>
      <TopHeader />

      <div className="search-toolbar">
        <div className="search-left">
          <input
            className="search-input"
            type="text"
            placeholder="Search"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setFilteredByRef(null);
            }}
          />
          <button className="ref-code-link" onClick={() => setShowRefModal(true)}>
            Use a REF code
          </button>
          <div className="internal-switch-container">
            <label className="switch">
              <input
                type="checkbox"
                checked={referralOnly}
                onChange={(e) => setReferralOnly(e.target.checked)}
              />
              <span className="slider" />
            </label>
            <span className="switch-label">Internal jobs only</span>
          </div>
          <p className="job-count">
            Showing {visibleJobs.length} of {allJobs.length} jobs
          </p>
        </div>

        <div className="search-right">
          <div className="alert-section">
            <img src={NotificationIcon} alt="Job alert" className="bell-icon" />
            <span className="alert-label">Job alert</span>
            <span className="divider">|</span>
            <a href="#referral" className="referral-link">
              How to make a referral <span className="help-icon">?</span>
            </a>
          </div>
          <div className="sort-select">
            <span className="sort-label">Sort:</span>
            <select defaultValue="Posted Date">
              <option value="Posted Date">Posted Date</option>
              <option value="Title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {showRefModal && (
        <div className="ref-modal-overlay">
          <div className="ref-modal">
            <h3>Use a REF code</h3>
            <p className="ref-description">
              REF codes are provided by your internal hiring team.
            </p>
            <input
              type="text"
              className="ref-input"
              placeholder="For example: REF84O"
              value={refCodeInput}
              onChange={(e) => setRefCodeInput(e.target.value)}
            />
            <div className="ref-buttons">
              <button onClick={() => setShowRefModal(false)}>Cancel</button>
              <button className="search-btn" onClick={handleRefSearch}>
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="recruitment-layout">
        <div className="filter-sidebar">
          <h3 className="filter-title">
            <img src={FilterIcon} alt="Filter" className="filter-title-icon" />
            Filters
          </h3>

          <div className="filter-group">
            <label>Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="All">All</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="All">All</option>
              {experiences.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Other filters</label>
            <div className="checkbox-label">
              <input
                type="checkbox"
                id="referral"
                checked={referralOnly}
                onChange={(e) => setReferralOnly(e.target.checked)}
              />
              <label htmlFor="referral">Referral only</label>
            </div>
          </div>

          <div className="filter-group">
            <button className="clear-filter-btn" onClick={handleFilterClearSearch}>
              <img src={FilterIcon} alt="Clear Filters" className="filter-icon" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="job-list">
          <h2 className="page-title">Available Job Listings</h2>
          {visibleJobs.length === 0 ? (
            <p className="no-result">No job found for this REF code.</p>
          ) : (
            visibleJobs.map((job, idx) => (
              <JobCard key={idx} job={job} logo={EndavaLogo} onClick={setSelectedJob} />
            ))
          )}
        </div>
      </div>

      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  );
};

export default Candidate;
