import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ArtisanHeader from "./ArtisanHeader";
import Footer from "./Footer";
import Mic from "../Mic";

const ArtisanLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="main-bg min-h-screen font-sans flex flex-col justify-between">
      <div>
        {}
        <ArtisanHeader user={user} logout={logout} />

        {}
        <main className="main-page-content flex-1 overflow-y-auto pt-4 pb-8">
          {}
          <Outlet />
        </main>
      </div>

      {}
      
      <Mic />
    </div>
  );
};

export default ArtisanLayout;
