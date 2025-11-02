import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User, Bell, Search, X, ArrowLeft, Menu } from "lucide-react";
import { useMobileSidebar } from "../../context/MobileSidebarContext";

const CartIcon = () => {
  const { cartCount } = useCart();
  return (
    <div className="relative">
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 
             2.293c-.63.63-.184 1.707.707 1.707H17m0 
             0a2 2 0 100 4 2 2 0 000-4zm-8 
             2a2 2 0 11-4 0 2 2 0 014 0z"
        ></path>
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-google-red text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </div>
  );
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "tween", duration: 0.1, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { type: "tween", duration: 0.08, ease: "easeIn" },
  },
};
const simpleFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const BuyerHeader = () => {
  const { user, logout, notifications, markNotificationAsRead } = useAuth();
  const { openSidebar } = useMobileSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  const unreadCount = user ? notifications.filter((n) => !n.isRead).length : 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideProfile =
        profileRef.current && !profileRef.current.contains(event.target);
      const clickedOutsideNotif =
        notifRef.current && !notifRef.current.contains(event.target);

      if (clickedOutsideProfile) setIsProfileOpen(false);
      if (clickedOutsideNotif) setIsNotifOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [isSearchActive]);

  const activateSearch = () => setIsSearchActive(true);
  const deactivateSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/buyer/market/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      deactivateSearch();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markNotificationAsRead(notification.id);
    setIsNotifOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleHashLink = (e, hash) => {
    e.preventDefault();
    const targetPath = "/buyer/market";
    if (location.pathname === targetPath) {
      const el = document.getElementById(hash.substring(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`${targetPath}${hash}`);
    }
  };

  const renderProfileControls = () => {
    if (!user) {
      return (
        <button className="flex items-center text-sm font-medium text-gray-700 hover:text-google-blue">
          <User size={20} className="mr-1" />
          Sign In
        </button>
      );
    }

    return (
      <>
        {}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-full hover:bg-gray-100 transition relative"
          >
            <Bell className="h-6 w-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full text-white flex items-center justify-center text-[8px]">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl z-[60] border border-gray-200"
              >
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">
                  Notifications
                </h3>
                <ul className="flex flex-col max-h-80 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <li
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition ${
                          !notif.isRead ? "bg-blue-50" : ""
                        }`}
                      >
                        <p className="text-sm text-gray-700">{notif.message}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-center text-sm text-gray-500">
                      You have no new notifications.
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {}
        <div className="relative" ref={profileRef}>
          <div
            className={`p-0.5 rounded-full bg-gradient-to-r from-google-blue via-google-red to-google-yellow transition-all duration-300 ${
              isProfileOpen ? "animate-pulse" : ""
            }`}
          >
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="block rounded-full focus:outline-none bg-white p-px"
            >
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-google-blue">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </button>
          </div>
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl py-2 z-[60] border border-gray-200"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="flex flex-col space-y-1 mt-1 px-1">
                  <NavLink
                    to="/buyer/profile"
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User size={16} className="mr-2" /> My Profile
                  </NavLink>
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={16} className="mr-2" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
    );
  };

  return (
    <header className="main-app-header fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm z-50 shadow-sm border-b border-gray-200 overflow-visible">
      <div className="w-full h-16 px-4 sm:px-6 md:px-8">
        <div className="h-full flex items-center justify-between space-x-4 relative">
          {}
          <div className="flex items-center justify-start h-full flex-shrink-0">
            <button
            onClick={openSidebar}
            className="p-2 rounded-full hover:bg-gray-100 mr-2 md:hidden"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
            <AnimatePresence initial={false} mode="wait">
              {isSearchActive ? (
                <motion.button
                  key="backButton"
                  variants={simpleFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  onClick={deactivateSearch}
                  className="p-2 rounded-full hover:bg-gray-100 mr-2 md:mr-4"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-700" />
                </motion.button>
              ) : (
                <motion.div
                  key="logo"
                  variants={simpleFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <Link
                    to="/buyer/market"
                    className="flex items-center space-x-3 flex-shrink-0"
                  >
                    <img
                      src="/logo.png"
                      alt="KalaGhar Logo"
                      className="h-10 w-10 object-contain"
                    />
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tighter hidden sm:block">
                      कला<span className="text-google-blue">Ghar</span>
                    </h1>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {}
          <div className="flex-grow flex items-center justify-center h-full absolute inset-x-0 mx-auto max-w-lg md:max-w-xl lg:max-w-2xl px-4 pointer-events-none">
            <AnimatePresence initial={false} mode="wait">
              {!isSearchActive ? (
                <motion.nav
                  key="nav"
                  variants={simpleFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="hidden md:flex items-center h-full space-x-7 pointer-events-auto"
                >
                  <NavLink
                    to="/buyer/market"
                    end
                    onClick={(e) => {
                      if (
                        location.pathname === "/buyer/market" &&
                        !location.hash
                      ) {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center h-full text-sm font-medium transition-colors duration-150 ease-in-out border-b-2 ${
                        isActive && !location.hash
                          ? "text-google-blue border-google-blue"
                          : "text-gray-600 border-transparent hover:text-google-blue"
                      }`
                    }
                  >
                    Shop
                  </NavLink>
                  <NavLink
                    to="/buyer/new-ideas"
                    className={({ isActive }) =>
                      `flex items-center h-full text-sm font-medium transition-colors duration-150 ease-in-out border-b-2 ${
                        isActive
                          ? "text-google-blue border-google-blue"
                          : "text-gray-600 border-transparent hover:text-google-blue"
                      }`
                    }
                  >
                    New Ideas
                  </NavLink>
                  <NavLink
                    to="/buyer/our-artisans"
                    className={({ isActive }) =>
                      `flex items-center h-full text-sm font-medium transition-colors duration-150 ease-in-out border-b-2 ${
                        isActive
                          ? "text-google-blue border-google-blue"
                          : "text-gray-600 border-transparent hover:text-google-blue"
                      }`
                    }
                  >
                    Our Artisans
                  </NavLink>
                </motion.nav>
              ) : (
                <motion.form
                  key="search"
                  variants={simpleFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  onSubmit={handleSearchSubmit}
                  className="w-full h-10 flex items-center bg-gray-100 rounded-lg px-3 focus-within:bg-white focus-within:ring-1 focus-within:ring-google-blue transition-all pointer-events-auto"
                >
                  <Search className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search KalaGhar..."
                    className="w-full h-full text-base bg-transparent focus:outline-none border-none ring-0 placeholder-gray-500 text-gray-800"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-1 rounded-full text-gray-500 hover:bg-gray-200 ml-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {}
          <div className="flex items-center justify-end h-full flex-shrink-0">
            <div className="flex items-center space-x-4">
              <AnimatePresence initial={false} mode="wait">
                {!isSearchActive && (
                  <motion.button
                    key="searchIcon"
                    variants={simpleFade}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={activateSearch}
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                  >
                    <Search className="h-6 w-6 text-gray-700" />
                  </motion.button>
                )}
              </AnimatePresence>

              <Link
                to="/buyer/cart"
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <CartIcon />
              </Link>
              {renderProfileControls()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BuyerHeader;
