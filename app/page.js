'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Copy,
  Check,
  Calendar,
  RefreshCw,
  Trash2,
  Shield,
  Code2,
  Zap,
  LogOut,
  ChevronRight,
  Lock,
  CalendarPlus,
  Info,
  Monitor
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data & Dashboard State
  const [keysData, setKeysData] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, revoked: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('keys'); // 'keys', 'tester', 'docs'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddDaysModalOpen, setIsAddDaysModalOpen] = useState(false);
  const [selectedKeyForDays, setSelectedKeyForDays] = useState(null);
  const [isNewKeySuccessModal, setIsNewKeySuccessModal] = useState(false);
  const [newlyCreatedKeyRecord, setNewlyCreatedKeyRecord] = useState(null);

  // Form State - Create Token
  const [formUsername, setFormUsername] = useState('');
  const [formAlias, setFormAlias] = useState('');
  const [formDurationDays, setFormDurationDays] = useState(30);

  // Form State - Add Days
  const [extraDaysToAdd, setExtraDaysToAdd] = useState(30);

  // Toast System
  const [toasts, setToasts] = useState([]);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Interactive Validator State
  const [testKeyValue, setTestKeyValue] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // API Integration Snippet Language
  const [selectedLanguage, setSelectedLanguage] = useState('csharp');

  useEffect(() => {
    const session = localStorage.getItem('admin_token');
    if (session) {
      setIsAuthenticated(true);
      fetchKeys();
    }
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        showToast('Login Admin berhasil!', 'success');
        fetchKeys();
      } else {
        setLoginError(data.message || 'Password salah');
      }
    } catch (err) {
      setLoginError('Gagal terhubung ke server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    showToast('Logout berhasil', 'info');
  };

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/token');
      const result = await res.json();
      if (result.success) {
        setKeysData(result.data);
        const dataList = result.data || [];
        setStats({
          total: dataList.length,
          active: dataList.filter((k) => k.status === 'active').length,
          expired: dataList.filter((k) => k.status === 'expired').length,
          revoked: dataList.filter((k) => k.status === 'revoked').length
        });
      }
    } catch (err) {
      showToast('Gagal memuat data Token', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKeySubmit = async (e) => {
    e.preventDefault();
    if (!formUsername.trim()) {
      showToast('Nama User wajib diisi!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formUsername,
          alias: formAlias,
          durationDays: formDurationDays
        })
      });
      const result = await res.json();
      if (result.success) {
        setIsCreateModalOpen(false);
        setNewlyCreatedKeyRecord(result);
        setIsNewKeySuccessModal(true);
        setFormUsername('');
        setFormAlias('');
        setFormDurationDays(30);
        fetchKeys();

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Gagal membuat Token Baru', 'error');
    }
  };

  const handleAddDaysSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKeyForDays) return;

    try {
      const res = await fetch('/api/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: selectedKeyForDays.token || selectedKeyForDays.key,
          action: 'add_days',
          days: extraDaysToAdd
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'success');
        setIsAddDaysModalOpen(false);
        fetchKeys();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Gagal menambah hari masa aktif', 'error');
    }
  };

  const handleToggleStatus = async (keyId, currentStatus) => {
    const newStatus = currentStatus === 'revoked' ? 'active' : 'revoked';
    try {
      const res = await fetch('/api/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: keyId,
          action: 'toggle_status',
          status: newStatus
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'info');
        fetchKeys();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Gagal merubah status token', 'error');
    }
  };

  const handleRegenerateKey = async (keyId) => {
    if (!confirm('Apakah Anda yakin ingin meng-generate ulang String Token ini? Token lama tidak akan berlaku lagi di file .EXE.')) {
      return;
    }
    try {
      const res = await fetch('/api/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: keyId,
          action: 'regenerate'
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast('String Token baru berhasil dihasilkan!', 'success');
        fetchKeys();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Gagal merenerate token', 'error');
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Hapus Token ini secara permanen? Aplikasi .EXE yang menggunakan token ini tidak akan bisa login lagi.')) {
      return;
    }
    try {
      const res = await fetch(`/api/token?token=${keyId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        showToast('Token telah terhapus', 'success');
        fetchKeys();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Gagal menghapus token', 'error');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    showToast('Token tersalin ke Clipboard!', 'success');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const runApiTest = async () => {
    if (!testKeyValue.trim()) {
      showToast('Masukkan Token yang akan diuji', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch(`/api/token?token=${encodeURIComponent(testKeyValue.trim())}`);
      const data = await res.json();
      setTestResult({ status: res.status, data });
    } catch (err) {
      setTestResult({ status: 500, data: { status: 'FAILED', message: 'Server error / disconnected' } });
    } finally {
      setIsTesting(false);
    }
  };

  // Filter keys
  const filteredKeys = keysData.filter((item) => {
    const itemKey = item.token || item.key || '';
    const matchesSearch =
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alias.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="brand-icon" style={{ width: '56px', height: '56px', margin: '0 auto 16px auto', borderRadius: '16px' }}>
              <Shield size={28} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Panel Login</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              Masukan Password / PIN Admin untuk mengelola Token Aplikasi .EXE
            </p>
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#FDA4AF',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Password Admin</label>
              <input
                type="password"
                className="form-control"
                placeholder="Masukkan Password Admin..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
              <div className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <Info size={12} /> Password bawaan default: <code style={{ color: '#A5B4FC' }}>admin123</code>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '12px' }}>
              Masuk Dashboard <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Main View
  return (
    <div className="app-container">
      {/* Toast Overlay */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle2 size={18} color="var(--accent-emerald)" />}
            {t.type === 'error' && <AlertTriangle size={18} color="var(--accent-rose)" />}
            {t.type === 'info' && <Info size={18} color="var(--accent-cyan)" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Navbar */}
      <nav className="navbar glass-panel">
        <div className="brand">
          <div className="brand-icon">
            <Monitor size={22} />
          </div>
          <div>
            <div className="brand-title">
              <span>TokenVault (.EXE App)</span>
              <span className="brand-badge">Vercel API</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Server License & Token Verification System untuk File .EXE
            </div>
          </div>
        </div>

        <div>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            <span>Buat User & Token Baru</span>
          </button>

          <button className="btn btn-secondary btn-icon-only" title="Logout" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Token User</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-icon-wrapper icon-purple">
            <Key size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Token Aktif (.EXE)</div>
            <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{stats.active}</div>
          </div>
          <div className="stat-icon-wrapper icon-emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Masa Aktif Expired</div>
            <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{stats.expired}</div>
          </div>
          <div className="stat-icon-wrapper icon-amber">
            <Clock size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <div className="stat-label">Dicabut / Revoked</div>
            <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>{stats.revoked}</div>
          </div>
          <div className="stat-icon-wrapper icon-rose">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="tab-bar-wrapper">
        <div className="tab-bar">
          <button
            className={`tab-button ${activeTab === 'keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('keys')}
          >
            <Users size={16} />
            <span>Daftar User & Token ({filteredKeys.length})</span>
          </button>

          <button
            className={`tab-button ${activeTab === 'tester' ? 'active' : ''}`}
            onClick={() => setActiveTab('tester')}
          >
            <Zap size={16} />
            <span>Uji Token (.EXE Tester)</span>
          </button>

          <button
            className={`tab-button ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            <Code2 size={16} />
            <span>Integrasi API File .EXE</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER & TOKEN LIST */}
      {activeTab === 'keys' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="toolbar">
            <div className="search-box">
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari nama user, token, atau alias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <button
                className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Semua ({keysData.length})
              </button>
              <button
                className={`filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Aktif ({stats.active})
              </button>
              <button
                className={`filter-pill ${statusFilter === 'expired' ? 'active' : ''}`}
                onClick={() => setStatusFilter('expired')}
              >
                Expired ({stats.expired})
              </button>
              <button
                className={`filter-pill ${statusFilter === 'revoked' ? 'active' : ''}`}
                onClick={() => setStatusFilter('revoked')}
              >
                Revoked ({stats.revoked})
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={fetchKeys}
                title="Refresh Data"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User / Pemilik</th>
                  <th>TOKEN</th>
                  <th>Status</th>
                  <th>Sisa Masa Aktif</th>
                  <th>Tanggal Expired (Day Expired)</th>
                  <th>Total Request</th>
                  <th style={{ textAlign: 'right' }}>Aksi / Perpanjang</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Memuat data Token...
                    </td>
                  </tr>
                ) : filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Tidak ditemukan Token yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((item) => {
                    const itemToken = item.token || item.key || '';
                    const isRev = item.status === 'revoked';

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{item.username.substring(0, 2)}</div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.username}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.alias}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="key-code-box">
                            <span>{itemToken.substring(0, 14)}...{itemToken.substring(itemToken.length - 4)}</span>
                            <button
                              className="btn btn-secondary btn-icon-only btn-sm"
                              onClick={() => copyToClipboard(itemToken, item.id)}
                              title="Copy Full Token"
                            >
                              {copiedKeyId === item.id ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>

                        <td>
                          <span className={`status-badge ${
                            item.status === 'active'
                              ? 'badge-active'
                              : item.status === 'expired'
                              ? 'badge-expired'
                              : 'badge-revoked'
                          }`}>
                            <span className="badge-dot" />
                            {item.status}
                          </span>
                        </td>

                        <td>
                          <div className={`days-pill ${
                            item.daysRemaining <= 0
                              ? 'expired'
                              : item.daysRemaining <= 5
                              ? 'warning'
                              : ''
                          }`}>
                            <Clock size={15} />
                            <span>{item.daysRemaining} Hari</span>
                          </div>
                        </td>

                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(item.expiresAt || item.dayExpired).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {item.totalRequests || 0} req
                        </td>

                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              className="btn btn-amber btn-sm"
                              onClick={() => {
                                setSelectedKeyForDays(item);
                                setExtraDaysToAdd(30);
                                setIsAddDaysModalOpen(true);
                              }}
                              title="Tambah Hari / Perpanjang Masa Aktif"
                            >
                              <CalendarPlus size={15} />
                              <span>+ Hari</span>
                            </button>

                            <button
                              className="btn btn-secondary btn-sm btn-icon-only"
                              onClick={() => handleRegenerateKey(itemToken)}
                              title="Generate String Token Baru"
                            >
                              <RefreshCw size={14} />
                            </button>

                            <button
                              className={`btn btn-sm btn-icon-only ${isRev ? 'btn-emerald' : 'btn-secondary'}`}
                              onClick={() => handleToggleStatus(itemToken, item.status)}
                              title={isRev ? 'Aktifkan Kembali Token' : 'Cabut (Revoke) Token'}
                            >
                              {isRev ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                            </button>

                            <button
                              className="btn btn-danger btn-sm btn-icon-only"
                              onClick={() => handleDeleteKey(itemToken)}
                              title="Hapus Token Permanen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-cards-list">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Memuat data Token...
              </div>
            ) : filteredKeys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Tidak ditemukan Token.
              </div>
            ) : (
              filteredKeys.map((item) => {
                const itemToken = item.token || item.key || '';
                const isRev = item.status === 'revoked';

                return (
                  <div key={item.id} className="mobile-key-card">
                    <div className="mobile-card-header">
                      <div className="user-cell">
                        <div className="user-avatar">{item.username.substring(0, 2)}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {item.username}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {item.alias}
                          </div>
                        </div>
                      </div>

                      <span className={`status-badge ${
                        item.status === 'active'
                          ? 'badge-active'
                          : item.status === 'expired'
                          ? 'badge-expired'
                          : 'badge-revoked'
                      }`}>
                        <span className="badge-dot" />
                        {item.status}
                      </span>
                    </div>

                    <div className="key-code-box">
                      <span>{itemToken.substring(0, 16)}...</span>
                      <button
                        className="btn btn-secondary btn-icon-only btn-sm"
                        onClick={() => copyToClipboard(itemToken, item.id)}
                      >
                        {copiedKeyId === item.id ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="mobile-card-details">
                      <div>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Sisa Hari</span>
                        <span className={`days-pill ${item.daysRemaining <= 0 ? 'expired' : item.daysRemaining <= 5 ? 'warning' : ''}`}>
                          <Clock size={13} /> {item.daysRemaining} Hari
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Expired Date</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(item.expiresAt || item.dayExpired).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <button
                        className="btn btn-amber btn-sm"
                        onClick={() => {
                          setSelectedKeyForDays(item);
                          setExtraDaysToAdd(30);
                          setIsAddDaysModalOpen(true);
                        }}
                      >
                        <CalendarPlus size={14} />
                        <span>+ Hari</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm btn-icon-only"
                        onClick={() => handleRegenerateKey(itemToken)}
                        title="Regenerate Token"
                      >
                        <RefreshCw size={14} />
                      </button>

                      <button
                        className={`btn btn-sm btn-icon-only ${isRev ? 'btn-emerald' : 'btn-secondary'}`}
                        onClick={() => handleToggleStatus(itemToken, item.status)}
                        title={isRev ? 'Aktifkan' : 'Revoke'}
                      >
                        {isRev ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                      </button>

                      <button
                        className="btn btn-danger btn-sm btn-icon-only"
                        onClick={() => handleDeleteKey(itemToken)}
                        title="Hapus Token"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE TOKEN TESTER */}
      {activeTab === 'tester' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap color="var(--accent-cyan)" size={20} />
              Uji Token Aplikasi .EXE (`/api/token?token=...`)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px' }}>
              Simulasi pengetesan Token langsung seperti yang akan dilakukan oleh file program `.EXE` Anda.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Masukkan String TOKEN (contoh: sk_live_...)"
              value={testKeyValue}
              onChange={(e) => setTestKeyValue(e.target.value)}
              style={{ fontFamily: 'var(--font-code)' }}
            />
            <button className="btn btn-primary" onClick={runApiTest} disabled={isTesting}>
              {isTesting ? 'Menguji Token .EXE...' : 'Test Validasi Token (.EXE API)'}
            </button>
          </div>

          {keysData.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Pilih dari daftar token sampel:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {keysData.slice(0, 4).map((k) => (
                  <button
                    key={k.id}
                    className="btn btn-secondary btn-sm"
                    onClick={() => setTestKeyValue(k.token || k.key)}
                  >
                    {k.username} ({k.status})
                  </button>
                ))}
              </div>
            </div>
          )}

          {testResult && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Status HTTP Response:</span>
                <span style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: testResult.status === 200 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}>
                  {testResult.status} {testResult.status === 200 ? 'SUCCESS (Token Active)' : 'FAILED'}
                </span>
              </div>
              <pre className="code-block">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTEGRATION CODE SNIPPETS FOR .EXE */}
      {activeTab === 'docs' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Code2 color="var(--accent-primary)" size={20} />
              Panduan Integrasi Token ke Aplikasi / File .EXE
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px' }}>
              Endpoint API terpusat untuk aplikasi file <code>.EXE</code> (C#, C++, Python, cURL, PHP).
            </p>
          </div>

          <div className="tab-bar-wrapper">
            <div className="tab-bar">
              <button
                className={`tab-button ${selectedLanguage === 'csharp' ? 'active' : ''}`}
                onClick={() => setSelectedLanguage('csharp')}
              >
                C# (.NET / WinForms / WPF)
              </button>
              <button
                className={`tab-button ${selectedLanguage === 'python' ? 'active' : ''}`}
                onClick={() => setSelectedLanguage('python')}
              >
                Python (.EXE / PyInstaller)
              </button>
              <button
                className={`tab-button ${selectedLanguage === 'curl' ? 'active' : ''}`}
                onClick={() => setSelectedLanguage('curl')}
              >
                cURL / HTTP Request
              </button>
              <button
                className={`tab-button ${selectedLanguage === 'javascript' ? 'active' : ''}`}
                onClick={() => setSelectedLanguage('javascript')}
              >
                Node.js / JS
              </button>
            </div>
          </div>

          {selectedLanguage === 'csharp' && (
            <pre className="code-block">
{`// 🖥️ INTEGRASI FILE .EXE MENGGUNAKAN C# (.NET / WinForms / Console App)
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

public class TokenVerifier
{
    private static readonly HttpClient client = new HttpClient();

    // 1. VALIDATE TOKEN SAAT PROGRAM .EXE DIBUKA
    public static async Task<bool> ValidateTokenInExe(string userToken)
    {
        string url = "https://domain-anda.vercel.app/api/token?token=" + userToken;
        HttpResponseMessage response = await client.GetAsync(url);
        string jsonResult = await response.Content.ReadAsStringAsync();
        
        JObject json = JObject.Parse(jsonResult);

        if ((bool)json["success"])
        {
            string user = (string)json["user"];
            int daysLeft = (int)json["daysRemaining"];
            string exp = (string)json["dayExpired"];
            
            Console.WriteLine($"✅ LOGIN SUCCESS! User: {user}, Sisa: {daysLeft} Hari, Expired: {exp}");
            return true;
        }
        else
        {
            Console.WriteLine($"❌ LOGIN GAGAL: {json["message"]}");
            return false;
        }
    }
}`}
            </pre>
          )}

          {selectedLanguage === 'python' && (
            <pre className="code-block">
{`# 🖥️ INTEGRASI FILE .EXE MENGGUNAKAN PYTHON (Di-compile dengan PyInstaller / Nuitka)
import requests

# 1. CREATE USER BARU + TOKEN + DAY EXPIRED
def create_new_user(username, duration_days=30):
    url = "https://domain-anda.vercel.app/api/token"
    payload = {
        "username": username,
        "durationDays": duration_days
    }
    res = requests.post(url, json=payload).json()
    print("User Created:", res["user"], "Token:", res["token"], "Expired:", res["dayExpired"])
    return res["token"]

# 2. VALIDATE TOKEN DI APLIKASI .EXE
def check_exe_token(token_string):
    url = f"https://domain-anda.vercel.app/api/token?token={token_string}"
    res = requests.get(url).json()

    if res.get("success"):
        print(f"✅ SUCCESS! User: {res['user']} | Sisa Hari: {res['daysRemaining']} Hari")
        return True
    else:
        print(f"❌ GAGAL: {res.get('message')}")
        return False`}
            </pre>
          )}

          {selectedLanguage === 'curl' && (
            <pre className="code-block">
{`# 🖥️ ENDPOINT DEDIKASI UNTUK INTEGRASI .EXE

# 1. CREATE USER + TOKEN + DAY EXPIRED:
curl -X POST "https://domain-anda.vercel.app/api/token" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "budi_user", "durationDays": 30}'

# 2. TAMBAHAN DAY (+30 HARI):
curl -X PUT "https://domain-anda.vercel.app/api/token" \\
  -H "Content-Type: application/json" \\
  -d '{"token": "sk_live_...", "action": "add_days", "days": 30}'

# 3. VALIDASI TOKEN SAAT .EXE DIBUKA:
curl -X GET "https://domain-anda.vercel.app/api/token?token=sk_live_..."`}
            </pre>
          )}

          {selectedLanguage === 'javascript' && (
            <pre className="code-block">
{`// 🖥️ INTEGRASI API TOKEN (JAVASCRIPT / ELECTRON .EXE)

// Create User + Token
const createToken = async (username, days = 30) => {
  const res = await fetch("https://domain-anda.vercel.app/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, durationDays: days })
  });
  return await res.json();
};

// Validate Token in .exe
const validateToken = async (token) => {
  const res = await fetch(\`https://domain-anda.vercel.app/api/token?token=\${token}\`);
  return await res.json();
};`}
            </pre>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE USER & TOKEN */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--accent-primary)" />
                Buat User & TOKEN Baru (.EXE)
              </div>
              <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateKeySubmit}>
              <div className="form-group">
                <label className="form-label">Nama User / Pengguna *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: andi_firmansyah"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi / Note (Opsional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: Program EXE Client VVIP"
                  value={formAlias}
                  onChange={(e) => setFormAlias(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Durasi Masa Aktif (Hari / Day Expired)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="3650"
                  value={formDurationDays}
                  onChange={(e) => setFormDurationDays(e.target.value)}
                  required
                />
                <div className="quick-days-selector">
                  {[7, 30, 60, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`quick-day-btn ${Number(formDurationDays) === d ? 'selected' : ''}`}
                      onClick={() => setFormDurationDays(d)}
                    >
                      {d} Hari
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate TOKEN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAHIN DAY (EXTEND EXPIRATION DAYS) */}
      {isAddDaysModalOpen && selectedKeyForDays && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarPlus size={18} color="var(--accent-amber)" />
                Tambahin Hari Masa Aktif (Perpanjang Token)
              </div>
              <button className="close-btn" onClick={() => setIsAddDaysModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddDaysSubmit}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>User / Token:</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{selectedKeyForDays.username}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  Sisa saat ini: <strong>{selectedKeyForDays.daysRemaining} Hari</strong> (Status: {selectedKeyForDays.status})
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Jumlah Hari Tambahan (+Hari)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="3650"
                  value={extraDaysToAdd}
                  onChange={(e) => setExtraDaysToAdd(e.target.value)}
                  required
                />
                <div className="quick-days-selector">
                  {[7, 15, 30, 60, 90, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`quick-day-btn ${Number(extraDaysToAdd) === d ? 'selected' : ''}`}
                      onClick={() => setExtraDaysToAdd(d)}
                    >
                      +{d} Hari
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddDaysModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-amber">
                  Tambah +{extraDaysToAdd} Hari
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUCCESS NEW TOKEN GENERATED */}
      {isNewKeySuccessModal && newlyCreatedKeyRecord && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div className="brand-icon" style={{ width: '52px', height: '52px', margin: '0 auto 12px auto', background: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={28} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>TOKEN Berhasil Dibuat!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px' }}>
                Salin dan berikan TOKEN ini untuk di-input pada aplikasi .EXE user <strong>{newlyCreatedKeyRecord.user}</strong>
              </p>
            </div>

            <div style={{
              background: '#05070D',
              border: '1px dashed var(--accent-emerald)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.9rem', color: '#6EE7B7', wordBreak: 'break-all', marginBottom: '10px' }}>
                {newlyCreatedKeyRecord.token}
              </div>

              <button
                className="btn btn-emerald btn-sm"
                onClick={() => copyToClipboard(newlyCreatedKeyRecord.token, 'newly_created')}
              >
                <Copy size={15} /> Salin TOKEN
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '18px' }}>
              Masa Aktif: <strong>{newlyCreatedKeyRecord.daysRemaining} Hari</strong>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setIsNewKeySuccessModal(false)}
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
