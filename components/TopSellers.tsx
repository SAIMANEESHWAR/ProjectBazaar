import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getAllFreelancers } from "../services/freelancersApi";
import type { Freelancer, BrowseProject } from "../types/browse";
import { useAuth, useNavigation } from "../App";
import verifiedFreelanceSvg from "../lottiefiles/verified_freelance.svg";
import { GET_USER_DETAILS_ENDPOINT } from "../services/buyerApi";

// User/seller projects API (marketplace projects, not bid-request projects)
const GET_ALL_PROJECTS_ENDPOINT = "https://vwqfgtwerj.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Admin_Buyer";

interface ApiUserProject {
  projectId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  sellerId: string;
  sellerEmail: string;
  status: string;
  adminApproved?: boolean;
  adminApprovalStatus?: string;
  uploadedAt: string;
  purchasesCount?: number;
  likesCount?: number;
  viewsCount?: number;
}

type ViewMode = "freelancers" | "projects";

const TopSellers: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("freelancers");
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [projects, setProjects] = useState<BrowseProject[]>([]);
  const [isLoadingFreelancers, setIsLoadingFreelancers] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const { isLoggedIn } = useAuth();
  const { navigateTo } = useNavigation();

  // Fetch real profile picture
  const fetchUserProfile = useCallback(async (freelancerId: string) => {
    try {
      const response = await fetch(GET_USER_DETAILS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: freelancerId }),
      });
      const data = await response.json();
      const user = data.data || data.user || data;
      if (!user || data.success === false) return undefined;
      const profilePicture =
        user.profilePictureUrl ??
        user.profilePicture ??
        user.profileImage ??
        user.profile_picture ??
        user.avatar ??
        user.photoURL ??
        user.imageUrl ??
        user.photo;
      const name = user.fullName || user.name;
      return { profileImage: profilePicture || undefined, name: name || undefined };
    } catch {
      return undefined;
    }
  }, []);

  // Load freelancers
  useEffect(() => {
    const load = async () => {
      try {
        const result = await getAllFreelancers(50, 0, true);
        if (result.freelancers.length > 0) {
          const filtered = result.freelancers.filter((f) => {
            const nameLower = f.name?.toLowerCase() || "";
            const usernameLower = f.username?.toLowerCase() || "";
            const isTestOrAdmin =
              nameLower.includes("test") ||
              nameLower.includes("admin") ||
              usernameLower.includes("test") ||
              usernameLower.includes("admin");
            return !isTestOrAdmin;
          });

          const candidates = filtered.slice(0, 20);
          setFreelancers(candidates.slice(0, 8));

          const enriched = await Promise.all(
            candidates.map(async (f) => {
              if (!f.id) return f;
              const profile = await fetchUserProfile(f.id);
              if (profile) {
                return {
                  ...f,
                  ...(profile.profileImage && { profileImage: profile.profileImage }),
                  ...(profile.name && { name: profile.name }),
                };
              }
              return f;
            })
          );

          const hasRealImage = (url?: string) =>
            !!url && url.trim() !== "" && !url.includes("dicebear") && !url.includes("placeholder");

          enriched.sort((a, b) => {
            const aReal = hasRealImage(a.profileImage) ? 0 : 1;
            const bReal = hasRealImage(b.profileImage) ? 0 : 1;
            return aReal - bReal;
          });

          setFreelancers(enriched.slice(0, 8));
        }
      } catch (err) {
        console.error("Error fetching freelancers:", err);
      } finally {
        setIsLoadingFreelancers(false);
      }
    };
    load();
  }, [fetchUserProfile]);

  // Load user/seller projects (marketplace projects, not bid-request projects)
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(GET_ALL_PROJECTS_ENDPOINT);
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        if (!data.success || !Array.isArray(data.projects)) {
          setProjects([]);
          return;
        }
        const isApproved = (p: ApiUserProject) =>
          p.adminApprovalStatus === "approved" ||
          p.status === "approved" ||
          (p.adminApproved === true && (p.status === "active" || p.status === "live"));
        const mapped: BrowseProject[] = data.projects
          .filter((p: ApiUserProject) => p.title && isApproved(p))
          .map((p: ApiUserProject) => ({
            id: p.projectId,
            title: p.title,
            description: p.description || "",
            type: "fixed" as const,
            budget: { min: p.price, max: p.price, currency: "INR" },
            skills: Array.isArray(p.tags) ? p.tags : [],
            bidsCount: p.purchasesCount ?? 0,
            postedAt: p.uploadedAt || new Date().toISOString(),
            postedTimeAgo: "",
            ownerId: p.sellerId,
            ownerEmail: p.sellerEmail,
            category: p.category,
            status: "open",
            thumbnailUrl: p.thumbnailUrl,
          }));
        const sorted = [...mapped]
          .sort((a, b) => (b.bidsCount || 0) - (a.bidsCount || 0))
          .slice(0, 8);
        setProjects(sorted);
      } catch (err) {
        console.error("Error fetching user projects:", err);
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    load();
  }, []);

  const handleClick = () => {
    if (!isLoggedIn) {
      navigateTo("auth");
    } else {
      navigateTo(viewMode === "freelancers" ? "browseFreelancers" : "browseProjects");
    }
  };

  const AvatarWithFallback: React.FC<{ src: string; name: string }> = ({ src, name }) => {
    const [imgFailed, setImgFailed] = React.useState(false);
    const hasImage = src && src.trim() !== "";

    const getInitials = (n: string) =>
      n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    return (
      <div className="w-[72px] h-[72px] rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-white/10 group-hover:ring-orange-500/40 transition-all duration-300 bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
        {hasImage && !imgFailed ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-white font-bold text-lg select-none">{getInitials(name)}</span>
        )}
      </div>
    );
  };

  const ProjectImageBlock: React.FC<{ project: BrowseProject }> = ({ project }) => {
    const [imgFailed, setImgFailed] = React.useState(false);
    const hasImage = !!(project.thumbnailUrl && project.thumbnailUrl.trim() !== "");
    const categoryColors: Record<string, string> = {
      "web development": "from-blue-600/80 to-cyan-500/80",
      "full stack development": "from-violet-600/80 to-fuchsia-500/80",
      "data science & ml": "from-emerald-600/80 to-teal-500/80",
      "game development": "from-red-600/80 to-orange-500/80",
      "mobile development": "from-indigo-600/80 to-blue-500/80",
      "devops": "from-amber-600/80 to-yellow-500/80",
      "ui/ux design": "from-pink-600/80 to-rose-500/80",
    };
    const cat = (project.category || "").toLowerCase();
    const gradient = categoryColors[cat] || "from-orange-600/80 to-amber-500/80";
    const categoryIcons: Record<string, React.ReactNode> = {
      "web development": (
        <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
      ),
      "full stack development": (
        <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25" /></svg>
      ),
      "data science & ml": (
        <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>
      ),
      "game development": (
        <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c-1.108-.128-2.03-.786-2.03-1.899V4.874c0-.978.673-1.822 1.585-2.101a7.492 7.492 0 014.69 0c.912.28 1.585 1.123 1.585 2.101V6.087z" /></svg>
      ),
    };
    const icon = categoryIcons[cat] || (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
    );
    if (hasImage && !imgFailed) {
      return (
        <div className="w-full h-32 relative bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        </div>
      );
    }
    return (
      <div className={`w-full h-32 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -left-2 -bottom-2 w-14 h-14 rounded-full bg-white/10" />
        {icon}
      </div>
    );
  };

  const isLoading = viewMode === "freelancers" ? isLoadingFreelancers : isLoadingProjects;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/4 -top-20 w-[500px] h-[500px] bg-orange-500/5 dark:bg-orange-500/8 rounded-full blur-[180px]" />
        <div className="absolute right-1/4 bottom-0 w-[400px] h-[400px] bg-orange-600/5 dark:bg-orange-600/6 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-5 md:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-[2.8rem] font-bold tracking-[-0.02em] leading-tight mb-4">
            <span className="text-gray-900 dark:text-white">Discover </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              Top Talent & Projects
            </span>
          </h2>
          <p className="text-gray-500 dark:text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Find the best freelancers to hire or browse open projects to bid on
          </p>
        </motion.div>

        {/* Toggle Switch */}
        <div className="flex flex-col items-center mb-12">
          {/* Animated curved arrow — right-curved, minimal, thick & smooth stroke */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            animate={{ x: [0, 10, 0] }}
            transition={{ x: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
            className="text-orange-500 dark:text-orange-400 mb-1"
          >
            <svg className="w-14 h-14 md:w-16 md:h-16 rotate-[45deg] drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 38 C10 38 10 14 36 14" />
              <path d="M30 8 L36 14 L30 20" />
            </svg>
          </motion.div>

          <div className="flex items-center gap-0">
            <span
              className={`text-base md:text-lg font-semibold italic cursor-pointer transition-colors duration-300 px-4 ${viewMode === "freelancers" ? "text-orange-500" : "text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60"
                }`}
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              onClick={() => setViewMode("freelancers")}
            >
              Top Freelancers
            </span>

            {/* Toggle pill */}
            <motion.button
              onClick={() => setViewMode(viewMode === "freelancers" ? "projects" : "freelancers")}
              className="relative w-[80px] h-[40px] rounded-full cursor-pointer transition-all duration-300 mx-2 shadow-lg"
              animate={{
                backgroundColor: viewMode === "freelancers" ? "#f97316" : "#3b82f6",
                boxShadow: viewMode === "freelancers" ? "0 10px 25px -5px rgba(249,115,22,0.3)" : "0 10px 25px -5px rgba(59,130,246,0.3)",
              }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="absolute top-[5px] w-[30px] h-[30px] bg-white rounded-full shadow-md"
                animate={{ left: viewMode === "freelancers" ? "5px" : "45px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>

            <span
              className={`text-base md:text-lg font-semibold italic cursor-pointer transition-colors duration-300 px-4 ${viewMode === "projects" ? "text-blue-500" : "text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60"
                }`}
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              onClick={() => setViewMode("projects")}
            >
              Top Projects
            </span>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-gray-200 dark:bg-white/5 p-5">
                  <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-white/10 mx-auto mb-3" />
                  <div className="h-4 bg-gray-300 dark:bg-white/10 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-3 bg-gray-300 dark:bg-white/10 rounded w-1/2 mx-auto mb-4" />
                </div>
              ))}
            </motion.div>
          ) : viewMode === "freelancers" ? (
            /* Freelancers Grid */
            <motion.div
              key="freelancers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
            >
              {freelancers.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6 }}
                  onClick={handleClick}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/[0.08] backdrop-blur-sm p-5 md:p-6 text-center hover:border-orange-500/30 hover:shadow-lg dark:hover:bg-[#1c1c1c] transition-all duration-400 h-full flex flex-col shadow-sm dark:shadow-none">
                    {/* Avatar */}
                    <div className="relative mx-auto mb-4">
                      <AvatarWithFallback src={f.profileImage} name={f.name} />
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#0a0a0a]" />
                    </div>

                    {/* Name & Verified */}
                    <div className="flex items-center justify-center gap-1">
                      <h3 className="text-sm md:text-[0.95rem] font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-300 transition-colors leading-tight truncate">
                        {f.name}
                      </h3>
                      <img src={verifiedFreelanceSvg} alt="Verified" className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <p className="text-gray-500 dark:text-white/40 text-xs mt-0.5 truncate">
                      {f.location?.city
                        ? `${f.location.city}, ${f.location.country}`
                        : f.location?.country || "Remote"}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1 mt-2.5">
                      <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-gray-800 dark:text-white text-xs font-semibold">{f.rating?.toFixed(1) || "5.0"}</span>
                      <span className="text-gray-400 dark:text-white/30 text-[10px]">({f.reviewsCount || 0})</span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap justify-center gap-1 mt-3 min-h-[24px]">
                      {f.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 text-[10px] font-medium bg-orange-50 dark:bg-white/[0.06] text-orange-600 dark:text-white/60 rounded-full border border-orange-100 dark:border-white/[0.06]">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Hourly Rate */}
                    <div className="mt-auto pt-3 border-t border-gray-100 dark:border-white/[0.06] mt-3">
                      <span className="text-orange-500 dark:text-orange-400 text-sm font-bold">₹{f.hourlyRate || "—"}</span>
                      <span className="text-gray-400 dark:text-white/30 text-[10px] ml-0.5">/hr</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Projects Grid — same layout as Top Freelancers for dark mode consistency */
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
            >
              {projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6 }}
                  onClick={handleClick}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/[0.08] backdrop-blur-sm overflow-hidden hover:border-orange-500/30 hover:shadow-lg dark:hover:bg-[#1c1c1c] transition-all duration-400 h-full flex flex-col shadow-sm dark:shadow-none">
                    {/* Project image (same visual weight as freelancer avatar in dark mode) */}
                    <ProjectImageBlock project={p} />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Category badge */}
                      {p.category && (
                        <span className="self-start px-2 py-0.5 text-[10px] font-semibold uppercase bg-orange-500/15 text-orange-400 rounded-full mb-2">
                          {p.category}
                        </span>
                      )}

                      {/* Title */}
                      <h3 className="text-sm md:text-[0.95rem] font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-300 transition-colors leading-snug line-clamp-2 mb-1.5">
                        {p.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-500 dark:text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">
                        {p.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="px-2 py-0.5 text-[10px] font-medium bg-orange-50 dark:bg-white/[0.06] text-orange-600 dark:text-white/60 rounded-full border border-orange-100 dark:border-white/[0.06]">
                            {skill}
                          </span>
                        ))}
                        {p.skills.length > 3 && (
                          <span className="text-gray-400 dark:text-white/30 text-[10px]">+{p.skills.length - 3}</span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                        <div>
                          <span className="text-orange-500 dark:text-orange-400 text-sm font-bold">
                            ₹{p.budget?.min ?? 0}
                          </span>
                          {(p.budget?.min !== p.budget?.max) && (
                            <span className="text-gray-400 dark:text-white/30 text-[10px] ml-0.5">
                              - ₹{p.budget?.max ?? 0}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-white/40 text-[11px]">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                          </svg>
                          {p.bidsCount || 0} purchases
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm rounded-full transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35"
          >
            {viewMode === "freelancers" ? "Browse All Freelancers" : "Browse All Projects"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default TopSellers;
