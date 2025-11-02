import React, { createContext, useContext, useState, useMemo } from "react";


const MobileSidebarContext = createContext();

export const MobileSidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  
  const value = useMemo(
    () => ({
      isSidebarOpen,
      openSidebar: () => setIsSidebarOpen(true),
      closeSidebar: () => setIsSidebarOpen(false),
      toggleSidebar: () => setIsSidebarOpen((prev) => !prev),
    }),
    [isSidebarOpen]
  );

  return (
    <MobileSidebarContext.Provider value={value}>
      {children}
    </MobileSidebarContext.Provider>
  );
};


export const useMobileSidebar = () => {
  const context = useContext(MobileSidebarContext);
  if (!context) {
    throw new Error(
      "useMobileSidebar must be used within a MobileSidebarProvider"
    );
  }
  return context;
};