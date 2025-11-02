import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useMobileSidebar } from "../../context/MobileSidebarContext";
import { useAuth } from "../../context/AuthContext";


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
  const { user } = useAuth();

  const artisanLinks = [
    { name: 'Dashboard', to: '/artisan/dashboard' },
    { name: 'My Products', to: '/artisan/products' },
    { name: 'Orders', to: '/artisan/orders' },
    { name: 'New Idea', to: '/artisan/ideas/new' },
    { name: 'AI Trends', to: '/artisan/trends' },
    { name: 'Funding', to: '/artisan/grant' },
    { name: 'Community', to: '/artisan/community' },
    { name: 'Logistics', to: '/artisan/logistics' },
    { name: 'My Reviews', to: '/artisan/reviews' },
  ];

  const ambassadorLinks = [
    { name: "Dashboard", to: "/ambassador/dashboard" },
    { name: "My Artisans", to: "/ambassador/artisans" },
    { name: "Find Artisans", to: "/ambassador/find-artisans" },
    { name: "Community Hub", to: "/ambassador/community" },
  ];

  const investorLinks = [
    { name: "Dashboard", to: "/investor/dashboard" },
    { name: "Browse Artisans", to: "/investor/browse-artisans" },
    { name: "My Portfolio", to: "/investor/portfolio" },
  ];

  const buyerLinks = [
    { name: 'Shop', to: '/buyer/market' },
    { name: 'New Ideas', to: '/buyer/new-ideas' },
    { name: 'Our Artisans', to: '/buyer/our-artisans' },
  ];

  let navLinks = buyerLinks;
  if (user) {
    switch (user.role) {
      case 'artisan': navLinks = artisanLinks; break;
      case 'ambassador': navLinks = ambassadorLinks; break;
      case 'investor': navLinks = investorLinks; break;
      default: navLinks = buyerLinks;
    }
  }

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeSidebar}
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
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg">Menu</h2>
                <button
                  onClick={closeSidebar} 
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              <nav className="flex flex-col p-4 space-y-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
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
                    {link.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};