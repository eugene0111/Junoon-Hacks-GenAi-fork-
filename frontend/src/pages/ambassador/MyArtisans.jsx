import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { User, ShieldCheck, Mail } from "lucide-react";

const ArtisanCardSkeleton = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
    <div className="flex items-center">
      <div className="w-16 h-16 rounded-full bg-gray-200 mr-4"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

const MyArtisans = () => {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentorshipStatuses, setMentorshipStatuses] = useState({});

  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      setError("");
      try {
        // First, get all artisans
        const artisansResponse = await api.get("/users/artisans/nearest");
        const allArtisans = artisansResponse.data.artisans || [];
        
        // Then, get mentorship status for each artisan
        const statusPromises = allArtisans.map(artisan => 
          api.get(`/mentorship/status/${artisan.id}`)
            .then(res => ({ id: artisan.id, status: res.data.status }))
            .catch(() => ({ id: artisan.id, status: 'available' }))
        );

        const statuses = await Promise.all(statusPromises);
        const statusMap = {};
        statuses.forEach(({ id, status }) => {
          statusMap[id] = status;
        });

        // Filter only artisans that you are mentoring
        const mentoredArtisans = allArtisans.filter(
          artisan => statusMap[artisan.id] === 'active'
        );

        setArtisans(mentoredArtisans);
        setMentorshipStatuses(statusMap);
      } catch (err) {
        console.error("Failed to fetch artisans:", err);
        setError("Could not load your mentored artisans. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchArtisans();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        My Mentored Artisans
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <ArtisanCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>
      ) : artisans.length === 0 ? (
        <p className="text-gray-600">
          You are not currently mentoring any artisans.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artisans.map((artisan) => (
            <div
              key={artisan.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <img
                  src={
                    artisan.profile?.avatar ||
                    `https://ui-avatars.com/api/?name=${artisan.name}&background=random`
                  }
                  alt={artisan.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    {artisan.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {artisan.artisanProfile?.craftSpecialty?.join(", ") ||
                      "Craftsman"}
                  </p>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <ShieldCheck size={14} className="mr-1" />
                    Verified Artisan
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link
                  to={`/seller/${artisan.id}`}
                  className="flex-1 text-center bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-md text-sm hover:bg-gray-200 transition"
                >
                  View Profile
                </Link>
                <a
                  href={`mailto:${artisan.email}`}
                  className="flex-1 text-center bg-blue-500 text-white font-semibold py-2 px-4 rounded-md text-sm hover:bg-blue-600 transition"
                >
                  Contact
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyArtisans;
