import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AuthGuard from './AuthGuard';

const Layout: React.FC = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Layout;
