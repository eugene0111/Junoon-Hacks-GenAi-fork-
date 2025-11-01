import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMobileSidebar } from "../../context/MobileSidebarContext";
import { Menu } from "lucide-react";

const Header = ({ onLoginClick }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { openSidebar } = useMobileSidebar();

  return (
    <header className="main-app-header fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button
            onClick={openSidebar}
            className="p-2 rounded-full hover:bg-gray-100 mr-2 md:hidden"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        <Link to="/" className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Kalaghar Logo"
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-800 tracking-tighter">
            कला<span className="text-google-blue">Ghar</span>
          </h1>
        </Link>

        <nav className="hidden md:flex space-x-8 text-gray-700 font-medium">
          <a
            href="#WhatIsKalaGhar"
            className="hover:text-google-blue transition"
          >
            About
          </a>
          <a
            href="#findyourplace"
            className="hover:text-google-blue transition"
          >
            Join as
          </a>
          <a
            href="#ExplainerCarousel"
            className="hover:text-google-blue transition"
          >
            Features
          </a>
          <a href="#roles" className="hover:text-google-blue transition">
            Apply Now
          </a>
          <a href="#contact" className="hover:text-google-blue transition">
            Contact
          </a>
        </nav>

        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-gray-700">
              Welcome, {user.name}!
            </span>
            <Link
              to={
                user.role === "artisan" ? "/artisan/dashboard" : "/buyer/market"
              }
              className="bg-google-blue text-white font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={logout}
              className="bg-google-red text-white font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-google-green text-white font-semibold px-6 py-2 rounded-lg hover:bg-google-red transition-colors duration-300 transform hover:scale-105"
          >
            Login / Signup
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
