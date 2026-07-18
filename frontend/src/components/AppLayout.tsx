import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 overflow-x-hidden relative">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 md:ml-72 min-w-0 overflow-x-hidden h-screen overflow-y-auto bg-gray-100 dark:bg-gray-900">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-2 md:p-4 overflow-x-hidden bg-gray-100 dark:bg-gray-900 min-h-screen">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

