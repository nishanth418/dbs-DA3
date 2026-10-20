import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import CommandPalette from './components/CommandPalette';
import { api } from './services/api';

// Intro & Auth Pages
import IntroPage from './pages/IntroPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';

// Management & Analytics Pages
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import HostelsPage from './pages/HostelsPage';
import RoomsPage from './pages/RoomsPage';
import RoomTypesPage from './pages/RoomTypesPage';
import WardensPage from './pages/WardensPage';
import MessPage from './pages/MessPage';
import MealsPage from './pages/MealsPage';
import StaffPage from './pages/StaffPage';
import SuppliersPage from './pages/SuppliersPage';
import InventoryPage from './pages/InventoryPage';
import ProcurementPage from './pages/ProcurementPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import SqlQueryPage from './pages/SqlQueryPage';
import DatabaseTableView from './pages/DatabaseTableView';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';

export default function App() {
  // Navigation & View Hierarchy ('intro' | 'login' | 'app')
  const [currentView, setCurrentView] = useState('intro');

  // Current Logged-in User Session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_auth_user') || sessionStorage.getItem('nexus_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Active module tab
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Toast Notifications
  const [toasts, setToasts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthInfo, setHealthInfo] = useState(null);

  // Theme Management ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('nexus_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  // Sync theme with DOM and localStorage
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('nexus_theme', theme);
    } catch (e) {
      // ignore storage error
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  // System Health Monitoring
  useEffect(() => {
    checkHealth();
  }, []);

  async function checkHealth() {
    try {
      const res = await api.getHealth();
      setHealthInfo(res);
    } catch (err) {
      console.warn('Backend connection warning:', err.message);
    }
  }

  function showToast(message, type = 'info') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    checkHealth();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Database connection and metrics synced', 'info');
    }, 400);
  }

  // Auth Handlers
  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setCurrentView('app');
  }

  function handleLogout() {
    try {
      localStorage.removeItem('nexus_auth_user');
      sessionStorage.removeItem('nexus_auth_user');
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    setCurrentView('login');
    showToast('Securely signed out of Hostel Management', 'info');
  }

  function handleReplayIntro() {
    setCurrentView('intro');
  }

  function handleIntroComplete() {
    setCurrentView('login');
  }

  // Render 3D Cinematic Intro
  if (currentView === 'intro') {
    return <IntroPage onComplete={handleIntroComplete} />;
  }

  // Render Login Gateway
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        healthInfo={healthInfo}
        onBackToIntro={() => setCurrentView('intro')}
      />
    );
  }

  // Render Main Enterprise Application Shell
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        healthInfo={healthInfo}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div
        className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          transition: 'margin-left var(--transition-normal)'
        }}
      >
        <Navbar
          activeTab={activeTab}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          healthInfo={healthInfo}
          onOpenSearch={() => setCommandPaletteOpen(true)}
          currentTheme={theme}
          onToggleTheme={toggleTheme}
          onReplayIntro={handleReplayIntro}
          currentUser={currentUser}
        />

        <main className="page-content" key={refreshKey}>
          {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
          {activeTab === 'students' && <StudentsPage showToast={showToast} />}
          {activeTab === 'hostels' && <HostelsPage showToast={showToast} />}
          {activeTab === 'rooms' && <RoomsPage showToast={showToast} />}
          {activeTab === 'room-types' && <RoomTypesPage showToast={showToast} />}
          {activeTab === 'wardens' && <WardensPage showToast={showToast} />}
          {activeTab === 'mess' && <MessPage showToast={showToast} />}
          {activeTab === 'meals' && <MealsPage showToast={showToast} />}
          {activeTab === 'staff' && <StaffPage showToast={showToast} />}
          {activeTab === 'suppliers' && <SuppliersPage showToast={showToast} />}
          {activeTab === 'inventory' && <InventoryPage showToast={showToast} />}
          {activeTab === 'procurement' && <ProcurementPage showToast={showToast} />}
          {activeTab === 'payments' && <PaymentsPage showToast={showToast} />}
          {activeTab === 'reports' && <ReportsPage showToast={showToast} />}
          {activeTab === 'sql-query' && <SqlQueryPage showToast={showToast} />}
          {activeTab === 'settings' && (
            <SettingsPage
              currentTheme={theme}
              onToggleTheme={toggleTheme}
              onReplayIntro={handleReplayIntro}
              healthInfo={healthInfo}
              onRefreshHealth={checkHealth}
              showToast={showToast}
            />
          )}
          {activeTab === 'privacy' && <PrivacyPolicyPage onNavigate={setActiveTab} />}
          {activeTab === 'terms' && <TermsPage onNavigate={setActiveTab} />}
          {activeTab.startsWith('table_') && (
            <DatabaseTableView
              tableName={activeTab.replace('table_', '')}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Quick Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelect={(tabId) => setActiveTab(tabId)}
      />

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
