import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { GlobalSearchModal } from './GlobalSearchModal';

export const Layout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleQuickCreate = (type: 'customer' | 'quotation' | 'subscription' | 'payment') => {
    switch (type) {
      case 'customer':
        navigate('/customers?action=new');
        break;
      case 'quotation':
        navigate('/quotations?action=new');
        break;
      case 'subscription':
        navigate('/subscriptions?action=new');
        break;
      case 'payment':
        navigate('/payments?action=new');
        break;
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory text-obsidian font-sans antialiased selection:bg-chartreuse selection:text-obsidian">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickCreate={handleQuickCreate}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};
