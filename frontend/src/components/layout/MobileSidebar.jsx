

import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useMobileSidebar } from "../../context/MobileSidebarContext";


const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};


const panelVariants = {
  visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  hidden: { x: "-100%", transition: { type: "easeOut", duration: 0.2 } },
};

export const MobileSidebar = () => {
  const { isSidebarOpen, closeSidebar } = useMobileSidebar();
  const location = useLocation();

  

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
         
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeSidebar} // This is correct
            className="fixed inset-0 bg-black/50 z-[60]"
          />

         
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-white z-[70] shadow-xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg">Menu</h2>
                <button
                  onClick={closeSidebar} 
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col p-4 space-y-2">
                <NavLink
                  to="/buyer/market"
                  end
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg text-base font-medium ${
                      isActive
                        ? "bg-google-blue/10 text-google-blue"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
               
                  onClick={closeSidebar}
                >
                  Shop
                </NavLink>
                <NavLink
                  to="/buyer/new-ideas"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg text-base font-medium ${
                      isActive
                        ? "bg-google-blue/10 text-google-blue"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                  
                  onClick={closeSidebar}
                >
                  New Ideas
                </NavLink>
                <NavLink
                  to="/buyer/our-artisans"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg text-base font-medium ${
                      isActive
                        ? "bg-google-blue/10 text-google-blue"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                
                  onClick={closeSidebar}
                >
                  Our Artisans
                </NavLink>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};