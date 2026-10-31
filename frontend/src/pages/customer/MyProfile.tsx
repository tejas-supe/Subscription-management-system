import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle,
  Shield,
  FileText,
  KeyRound
} from 'lucide-react';
import { portalService } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await portalService.getDashboard();
      if (res.data.success && res.data.customer) {
        const c = res.data.customer;
        setCustomer(c);
        setPhone(c.phone || '');
        setLine1(c.billingAddress?.line1 || '');
        setLine2(c.billingAddress?.line2 || '');
        setCity(c.billingAddress?.city || '');
        setState(c.billingAddress?.state || '');
        setPostalCode(c.billingAddress?.postalCode || '');
        setCountry(c.billingAddress?.country || 'India');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await portalService.updateProfile({
        phone,
        billingAddress: {
          line1,
          line2,
          city,
          state,
          postalCode,
          country
        }
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Billing details updated successfully');
        setCustomer(res.data.customer);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading organization account settings..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-deepForest/10 text-deepForest text-xs font-semibold mb-2">
          <User className="w-3.5 h-3.5" />
          Account & Legal Identity
        </div>
        <h1 className="text-2xl font-bold text-obsidian tracking-tight font-heading">
          Organization Profile & Billing Details
        </h1>
        <p className="text-sm text-slateGrey mt-0.5">
          Maintain your organization's GSTIN, registered billing address, and account contact points.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Info Card */}
        <div className="bg-white rounded-xl border border-borderGrey/70 p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-obsidian flex items-center gap-2 border-b border-borderGrey/60 pb-3">
            <Building className="w-4 h-4 text-deepForest" />
            Corporate Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                Company / Organization Legal Name
              </label>
              <input
                type="text"
                disabled
                value={customer?.name || ''}
                className="w-full px-3 py-2 text-xs bg-warmIvory/60 border border-borderGrey rounded-lg text-obsidian font-semibold cursor-not-allowed"
              />
              <p className="text-[10px] text-slateGrey mt-1">
                Legal entity name tied to your master subscription agreement.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                GSTIN / Tax Identification
              </label>
              <input
                type="text"
                disabled
                value={customer?.taxId || 'UNREGISTERED'}
                className="w-full px-3 py-2 text-xs bg-warmIvory/60 border border-borderGrey rounded-lg font-mono text-obsidian font-semibold cursor-not-allowed"
              />
              <p className="text-[10px] text-slateGrey mt-1">
                Used for B2B GST e-invoicing compliance under Indian GST Rules.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                Primary Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateGrey" />
                <input
                  type="email"
                  disabled
                  value={customer?.email || user?.email || ''}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-warmIvory/60 border border-borderGrey rounded-lg text-obsidian font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateGrey" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-borderGrey rounded-lg text-obsidian focus:ring-1 focus:ring-deepForest focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Registered Billing Address Card */}
        <div className="bg-white rounded-xl border border-borderGrey/70 p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-obsidian flex items-center gap-2 border-b border-borderGrey/60 pb-3">
            <MapPin className="w-4 h-4 text-deepForest" />
            Registered Billing Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="Suite / Floor / Building name"
                className="w-full px-3 py-2 text-xs bg-white border border-borderGrey rounded-lg text-obsidian focus:ring-1 focus:ring-deepForest focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                placeholder="Locality / Landmark"
                className="w-full px-3 py-2 text-xs bg-white border border-borderGrey rounded-lg text-obsidian focus:ring-1 focus:ring-deepForest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai, Bengaluru, Delhi, etc."
                className="w-full px-3 py-2 text-xs bg-white border border-borderGrey rounded-lg text-obsidian focus:ring-1 focus:ring-deepForest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                State / Province
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra, Karnataka, etc."
                className="w-full px-3 py-2 text-xs bg-white border border-borderGrey rounded-lg text-obsidian focus:ring-1 focus:ring-deepForest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                PIN / Postal Code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="400051"
                className="w-full px-3 py-2 text-xs bg-white border border-borderGrey rounded-lg text-obsidian font-mono focus:ring-1 focus:ring-deepForest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slateGrey uppercase tracking-wider mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className="w-full px-3 py-2 text-xs bg-white border border-borderGrey rounded-lg text-obsidian focus:ring-1 focus:ring-deepForest focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security & Access Info */}
        <div className="bg-white rounded-xl border border-borderGrey/70 p-6 shadow-card space-y-3">
          <h2 className="text-base font-bold text-obsidian flex items-center gap-2 border-b border-borderGrey/60 pb-3">
            <Shield className="w-4 h-4 text-deepForest" />
            Security & Authentication
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
            <div>
              <p className="font-semibold text-obsidian">Current Access Persona: {user?.role || 'CUSTOMER'}</p>
              <p className="text-slateGrey">Authenticated via encrypted JWT session token.</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Enterprise MFA Protected</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="primary"
            type="submit"
            loading={saving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
