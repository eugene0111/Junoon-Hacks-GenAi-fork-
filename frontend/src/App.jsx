import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/ui/AnimatedPage";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/scrolltotop.jsx";
import GoogleTranslateWidget from "./components/ui/GoogleTranslateWidget.jsx";
import { MobileSidebarProvider } from "./context/MobileSidebarContext";
import { MobileSidebar } from "./components/layout/MobileSidebar";
import Loader from "./components/ui/Loader";

const Header = lazy(() => import("./components/layout/Header.jsx"));
const Footer = lazy(() => import("./components/layout/Footer.jsx"));
const ArtisanLayout = lazy(() =>
  import("./components/layout/ArtisanLayout.jsx")
);
const AmbassadorLayout = lazy(() =>
  import("./components/layout/AmbassadorLayout.jsx")
);
const InvestorLayout = lazy(() =>
  import("./components/layout/InvestorLayout.jsx")
);
const BuyerLayout = lazy(() => import("./components/layout/BuyerLayout.jsx"));
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const AmbassadorPage = lazy(() => import("./pages/ambassador.jsx"));
const ArtisanPage = lazy(() => import("./pages/artisan.jsx"));
const SellerPage = lazy(() => import("./pages/common/SellerPage.jsx"));
const ProductPage = lazy(() => import("./pages/common/ProductPage.jsx"));
const BuyerMarket = lazy(() => import("./pages/buyermarket/buyermarket.jsx"));
const CartPage = lazy(() => import("./pages/buyermarket/cartpage.jsx"));
const NewIdeasPage = lazy(() => import("./pages/buyermarket/newIdeas.jsx"));
const OurArtisansPage = lazy(() =>
  import("./pages/buyermarket/ourArtisans.jsx")
);
const ArtisanDashboard = lazy(() =>
  import("./pages/artisan/ArtisanDashboard.jsx")
);
const MyProductsPage = lazy(() => import("./pages/artisan/MyProductsPage.jsx"));
const ProductEditPage = lazy(() =>
  import("./pages/artisan/ProductEditPage.jsx")
);
const ArtisanProfilePage = lazy(() =>
  import("./pages/artisan/ArtisanProfilePage.jsx")
);
const MyOrdersPage = lazy(() => import("./pages/artisan/MyOrdersPage.jsx"));
const IdeaSubmissionPage = lazy(() =>
  import("./pages/artisan/IdeaSubmissionPage.jsx")
);
const GrantsPage = lazy(() => import("./pages/artisan/GrantsPage.jsx"));
const AITrendsPage = lazy(() => import("./pages/artisan/AITrendsPage.jsx"));
const CommunityPage = lazy(() => import("./pages/artisan/CommunityPage.jsx"));
const LogiPage = lazy(() => import("./pages/artisan/LogiPage.jsx"));
const DiscussionPage = lazy(() => import("./pages/artisan/DiscussionPage.jsx"));
const DiscussionThreadPage = lazy(() =>
  import("./pages/artisan/DiscussionThreadPage.jsx")
);
const ReviewsPage = lazy(() => import("./pages/artisan/ReviewsPage.jsx"));
const RawMaterialsPage = lazy(() =>
  import("./pages/artisan/RawMaterialsPage.jsx")
);
const MaterialsCatalogPage = lazy(() =>
  import("./pages/artisan/MaterialsCatalogPage.jsx")
);
const AmbassadorDashboard = lazy(() =>
  import("./pages/ambassador/Dashboard.jsx")
);
const MyArtisans = lazy(() => import("./pages/ambassador/MyArtisans.jsx"));
const CommunityHub = lazy(() => import("./pages/ambassador/CommunityHub.jsx"));
const Profile = lazy(() => import("./pages/ambassador/Profile.jsx"));
const FindArtisans = lazy(() => import("./pages/ambassador/FindArtisans.jsx"));
const InvestorDashboard = lazy(() =>
  import("./pages/investor/InverstorDashboard.jsx")
);
const BrowseArtisans = lazy(() =>
  import("./pages/investor/BrowseArtisans.jsx")
);
const InvestmentPortfolio = lazy(() =>
  import("./pages/investor/InvestmentPortfolio.jsx")
);
const InvestorProfile = lazy(() =>
  import("./pages/investor/InvestorProfile.jsx")
);

const AppLayout = () => {
  const location = useLocation();
  const hideFor = ["/artisan", "/ambassador", "/investor", "/buyer"];
  const shouldHide = hideFor.some((path) => location.pathname.startsWith(path));

  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        {!shouldHide && <Header />}
      </Suspense>

      <GoogleTranslateWidget />
      <MobileSidebar />
      <main>
        <AnimatePresence mode="wait">
          <Suspense fallback={<Loader fullPage />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/ambassador-page"
                element={
                  <AnimatedPage>
                    <AmbassadorPage />
                  </AnimatedPage>
                }
              />
              <Route
                path="/artisan-page"
                element={
                  <AnimatedPage>
                    <ArtisanPage />
                  </AnimatedPage>
                }
              />
              <Route
                path="/seller/:artisanId"
                element={
                  <AnimatedPage>
                    <SellerPage />
                  </AnimatedPage>
                }
              />
              <Route
                path="/product/:id"
                element={
                  <AnimatedPage>
                    <ProductPage />
                  </AnimatedPage>
                }
              />
              <Route
                path="/artisan/*"
                element={
                  <ProtectedRoute role="artisan">
                    <ArtisanLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="dashboard"
                  element={
                    <AnimatedPage>
                      <ArtisanDashboard />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="products"
                  element={
                    <AnimatedPage>
                      <MyProductsPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="products/new"
                  element={
                    <AnimatedPage>
                      <ProductEditPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <AnimatedPage>
                      <MyOrdersPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="ideas/new"
                  element={
                    <AnimatedPage>
                      <IdeaSubmissionPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="grant"
                  element={
                    <AnimatedPage>
                      <GrantsPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="trends"
                  element={
                    <AnimatedPage>
                      <AITrendsPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="community"
                  element={
                    <AnimatedPage>
                      <CommunityPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="discussions"
                  element={
                    <AnimatedPage>
                      <DiscussionPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="discussions/:id"
                  element={
                    <AnimatedPage>
                      <DiscussionThreadPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="logistics"
                  element={
                    <AnimatedPage>
                      <LogiPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <AnimatedPage>
                      <ArtisanProfilePage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="reviews"
                  element={
                    <AnimatedPage>
                      <ReviewsPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="raw-materials"
                  element={
                    <AnimatedPage>
                      <RawMaterialsPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="materials-catalog"
                  element={
                    <AnimatedPage>
                      <MaterialsCatalogPage />
                    </AnimatedPage>
                  }
                />
              </Route>
              <Route
                path="/buyer/*"
                element={
                  <ProtectedRoute role="buyer">
                    <BuyerLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="market"
                  element={
                    <AnimatedPage>
                      <BuyerMarket />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="cart"
                  element={
                    <AnimatedPage>
                      <CartPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="products"
                  element={
                    <AnimatedPage>
                      <MyProductsPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="product/:id"
                  element={
                    <AnimatedPage>
                      <ProductPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="seller/:artisanId"
                  element={
                    <AnimatedPage>
                      <SellerPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="new-ideas"
                  element={
                    <AnimatedPage>
                      <NewIdeasPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="our-artisans"
                  element={
                    <AnimatedPage>
                      <OurArtisansPage />
                    </AnimatedPage>
                  }
                />
              </Route>
              <Route
                path="/ambassador/*"
                element={
                  <ProtectedRoute role="ambassador">
                    <AmbassadorLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="dashboard"
                  element={
                    <AnimatedPage>
                      <AmbassadorDashboard />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="artisans"
                  element={
                    <AnimatedPage>
                      <MyArtisans />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="community"
                  element={
                    <AnimatedPage>
                      <CommunityHub />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <AnimatedPage>
                      <Profile />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="find-artisans"
                  element={
                    <AnimatedPage>
                      <FindArtisans />
                    </AnimatedPage>
                  }
                />
              </Route>
              <Route
                path="/investor/*"
                element={
                  <ProtectedRoute roles={["investor"]}>
                    <InvestorLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="dashboard"
                  element={
                    <AnimatedPage>
                      <InvestorDashboard />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="browse-artisans"
                  element={
                    <AnimatedPage>
                      <BrowseArtisans />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="portfolio"
                  element={
                    <AnimatedPage>
                      <InvestmentPortfolio />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="seller/:artisanId"
                  element={
                    <AnimatedPage>
                      <SellerPage />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <AnimatedPage>
                      <InvestorProfile />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="product/:id"
                  element={
                    <AnimatedPage>
                      <ProductPage />
                    </AnimatedPage>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      <Suspense fallback={null}>{!shouldHide && <Footer />}</Suspense>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <MobileSidebarProvider>
            <ScrollToTop />
            <AppLayout />
          </MobileSidebarProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
