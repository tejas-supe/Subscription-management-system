import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Modal } from '../common/Modal';
import { SearchBar } from '../common/SearchBar';
import { customerService } from '../../services/customerService';
import { subscriptionService } from '../../services/subscriptionService';
import { invoiceService } from '../../services/invoiceService';
import { formatINR } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const DashboardLayout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ customers: any[]; invoices: any[] }>({ customers: [], invoices: [] });
  const navigate = useNavigate();

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults({ customers: [], invoices: [] });
      return;
    }
    try {
      const res = await customerService.list({ search: val });
      if (res.data.success) {
        setSearchResults({
          customers: res.data.customers.slice(0, 5),
          invoices: []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory text-obsidian font-sans antialiased selection:bg-chartreuse selection:text-obsidian">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenSearch={() => setSearchOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      <Modal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Global Search"
        subtitle="Quickly jump to any customer, subscription, invoice or setting."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search across customers, companies, invoices..."
          />

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.customers.map((c) => (
              <div
                key={c._id}
                onClick={() => {
                  setSearchOpen(false);
                  navigate(`/admin/customers?id=${c._id}`);
                }}
                className="flex items-center justify-between p-3 rounded-lg border border-bordergrey hover:bg-ivory cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-obsidian">{c.name}</p>
                  <p className="text-[11px] text-slategrey">{c.company} • {c.customerNumber}</p>
                </div>
                <span className="text-xs font-bold text-forest">{formatINR(c.totalRevenueInPaise)}</span>
              </div>
            ))}
            {searchQuery && searchResults.customers.length === 0 && (
              <p className="py-6 text-center text-xs text-slategrey">No matching records found.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
