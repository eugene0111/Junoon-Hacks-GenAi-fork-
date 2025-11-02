const BaseService = require("./BaseService");
const UserService = require("./UserService");
const MentorshipService = require("./MentorshipService");

class AmbassadorService extends BaseService {
  constructor() {
    super("users");
    this.userService = UserService;
  }

  async createApplication(applicationData) {
    const dataToSave = {
      ...applicationData,
      status: "pending",
      submittedAt: new Date(),
    };
    return await this.create(dataToSave);
  }

  async getDashboardSummary(ambassadorId) {
    try {
      const activeMentorships = await MentorshipService.findMany({
        ambassadorId: ambassadorId,
        status: "active",
      });
      const artisanIds = activeMentorships.map((m) => m.artisanId);

      let artisans = [];
      if (artisanIds.length > 0) {
        artisans = await this.userService.findMany({ id: { in: artisanIds } });
      }

      const artisansOnboarded = artisans.length;

      const pendingRequests = await MentorshipService.findMany({
        ambassadorId: ambassadorId,
        status: "pending",
      });
      const pendingApprovals = pendingRequests.length;

      const totalArtisanEarnings = artisans.reduce(
        (sum, artisan) => sum + (artisan.sales || 0) * 150,
        0
      );

      const topArtisans = artisans
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          name: a.name,
          value: a.sales || 0,
          profilePic: a.profilePic || "default-pic.png",
        }));

      const artisansData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Artisans Onboarded",
            data: [0, 0, 0, 0, 0, artisansOnboarded],
            backgroundColor: "rgba(139, 92, 246, 0.5)",
            borderColor: "rgba(139, 92, 246, 1)",
            borderWidth: 1,
          },
        ],
      };

      const recentActivities = [
        {
          id: 1,
          description: `You have ${artisansOnboarded} artisans under you`,
          time: "1 hour ago",
        },
        {
          id: 2,
          description: `You have ${pendingApprovals} pending approvals`,
          time: "2 hours ago",
        },
        { id: 3, description: `Welcome to your dashboard!`, time: "1 day ago" },
      ];

      const stats = [
        { name: "Artisans Onboarded", value: artisansOnboarded, icon: "Users" },
        { name: "Pending Approvals", value: pendingApprovals, icon: "Clock" },
        {
          name: "Total Artisan Earnings",
          value: `₹${totalArtisanEarnings.toLocaleString()}`,
          icon: "DollarSign",
        },
        { name: "Your Rating", value: "4.8", icon: "Star" },
      ];

      return {
        stats,
        artisansData,
        recentActivities,
        topArtisans,
      };
    } catch (error) {
      console.error("Error in getDashboardSummary:", error);
      throw error;
    }
  }
}

module.exports = new AmbassadorService();
