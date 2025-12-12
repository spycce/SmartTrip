import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Map,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Settings,
  Info,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if we are in a trip context
  const tripMatch = matchPath('/trips/:id/*', location.pathname);
  const tripId = tripMatch?.params.id;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
      to={to}
      end // Exact match for active state unless it's a parent route
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Map size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">SmartTrip</span>
            </div>
          </div>

          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">Menu</div>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/create" icon={PlusCircle} label="New Trip" />
            <NavItem to="/albums" icon={ImageIcon} label="My Gallery" />
            <NavItem to="/about" icon={Info} label="About Us" />

            {tripId && (
              <>
                <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">Current Trip</div>
                <NavItem to={`/trips/${tripId}`} icon={Map} label="Itinerary" />
                <NavItem to={`/trips/${tripId}/gallery`} icon={Camera} label="Photo Gallery" />
              </>
            )}

            <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">Settings</div>
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <Settings size={20} />
              <span>Preferences</span>
            </button>
          </div>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center p-3 rounded-lg bg-slate-800 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                {user?.name.charAt(0)}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full space-x-2 p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Map size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">SmartTrip</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;