import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Archive, CheckCircle, ExternalLink, Tag } from 'lucide-react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { SearchBar } from '../../components/common/SearchBar';
import { getStatusColor } from '../../utils/formatters';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'Financial Cloud',
    features: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.list({ category: categoryFilter !== 'All' ? categoryFilter : undefined });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const featureList = formData.features.split('\n').map(f => f.trim()).filter(Boolean);

    try {
      if (editingProduct) {
        await productService.update(editingProduct._id, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          category: formData.category,
          features: featureList
        });
      } else {
        await productService.create({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          category: formData.category,
          features: featureList
        });
      }
      setModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      await productService.delete(id);
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'Financial Cloud',
      features: ''
    });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      code: p.code,
      description: p.description,
      category: p.category,
      features: p.features ? p.features.join('\n') : ''
    });
    setModalOpen(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Manage commercial software services, SKU codes, and feature entitlements.
          </p>
        </div>

        <Button
          onClick={openCreate}
          variant="primary"
          icon={<Plus className="h-4 w-4 text-chartreuse" />}
        >
          Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products by name, code or category..."
          className="flex-1 w-full"
        />

        <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs shrink-0">
          {(['All', 'Financial Cloud', 'Analytics AI', 'Compliance', 'Payments'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                categoryFilter === cat
                  ? 'bg-obsidian text-chartreuse shadow-xs'
                  : 'text-slategrey hover:text-obsidian'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader rows={5} />
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey shadow-subtle">
          No products found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const colors = getStatusColor(p.status);
            return (
              <div
                key={p._id}
                className="rounded-2xl border border-bordergrey bg-white p-5 shadow-subtle flex flex-col justify-between hover:shadow-card hover:border-forest/30 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-ivory text-forest border border-bordergrey">
                        {p.code}
                      </span>
                      <h3 className="text-base font-bold text-obsidian mt-2">{p.name}</h3>
                      <span className="text-[11px] font-semibold text-slategrey">{p.category}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {p.status}
                    </span>
                  </div>

                  <p className="text-xs text-slategrey mt-3 line-clamp-2">
                    {p.description || 'Enterprise software subscription product.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-bordergrey space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slategrey">Key Features</p>
                    <ul className="text-xs space-y-1">
                      {p.features?.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-obsidian">
                          <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-bordergrey flex items-center justify-between">
                  <div className="text-[11px] text-slategrey">
                    <span className="font-bold text-obsidian tabular-nums">{p.plansCount || 0}</span> plans •{' '}
                    <span className="font-bold text-forest tabular-nums">{p.activeSubscribersCount || 0}</span> subscribers
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1 rounded text-slategrey hover:text-obsidian hover:bg-ivory"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(p._id)}
                      className="p-1 rounded text-slategrey hover:text-rose-600 hover:bg-rose-50"
                      title="Archive Product"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Configure enterprise SaaS product and SKU code."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Brightloop Core Billing"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Product SKU Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="PROD-CORE"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest bg-white"
              >
                <option value="Financial Cloud">Financial Cloud</option>
                <option value="Analytics AI">Analytics AI</option>
                <option value="Compliance">Compliance</option>
                <option value="Payments">Payments</option>
                <option value="Customer Experience">Customer Experience</option>
                <option value="Developer Tools">Developer Tools</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Short Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Unified recurring subscription engine"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">
              Features (One per line)
            </label>
            <textarea
              rows={4}
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="Automated Invoicing&#10;GST Engine&#10;Subscription Lifecycle&#10;Multi-tenant isolation"
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
