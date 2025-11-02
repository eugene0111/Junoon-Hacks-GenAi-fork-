import React from "react";
import { Outlet } from "react-router-dom";
import BuyerHeader from "./BuyerHeader";

const BuyerLayout = () => {
  return (
    <div className="font-sans bg-gray-50 py-4 min-h-screen">
      <BuyerHeader />
      <main className="main-page-content flex-1 overflow-y-auto pt-4 pb-8"></main>
      <Outlet />
      {}
    </div>
  );
};

export default BuyerLayout;
