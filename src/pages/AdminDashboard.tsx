import React from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import AdminVideoList from "@/components/AdminVideoList";
import CommentModeration from "@/components/CommentModeration";
import VideoUpload from "@/components/VideoUpload";

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header provided by Layout */}

      <HeroBanner
        title="Tableau de bord"
        subtitle="Gérez les vidéos, les publications et modérez les commentaires"
        showBackButton={true}
        backgroundImage="/images/bapteme.png"
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <VideoUpload />
              <AdminVideoList />
            </div>
            <CommentModeration />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
