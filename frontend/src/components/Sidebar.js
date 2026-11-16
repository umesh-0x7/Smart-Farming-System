import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Sprout, CloudSun, Activity, Search, Bell, Users, LogOut, Leaf, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/crop', label: 'Crop Prediction', icon: Sprout },
  { path: '/weather', label: 'Weather', icon: CloudSun },
  { path: '/sensors', label: 'Sensor Data', icon: Activity },
  { path: '/disease', label: 'Disease Detection', icon: Search },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

const adminItems = [
  { path: '/users', label: 'User Management', icon: Users },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const items = user?.role === 'admin' ? [...navItems, ...adminItems] : navItems;

  const nav = (
    <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen transform transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#1B4332] flex items-center justify-center">
            <Leaf className="text-white" size={18} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1E293B]" style={{ fontFamily: 'Manrope' }}>SmartFarm</h2>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#94A3B8]">Agriculture Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#94A3B8] font-medium px-3 pt-3 pb-2">Navigation</p>
        {items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-200 ${active
                ? 'bg-[#1B4332]/8 text-[#1B4332] font-semibold border-l-[3px] border-[#1B4332] -ml-[3px] pl-[15px]'
                : 'text-[#475569] hover:bg-[#F3F2EE] hover:text-[#1E293B]'
              }`}
            >
              <Icon size={17} strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#52796F] flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1E293B] truncate">{user?.name}</p>
            <p className="text-[10px] text-[#94A3B8] capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <Button
          data-testid="logout-btn"
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-[#475569] hover:text-[#E07A5F] hover:bg-[#E07A5F]/10"
        >
          <LogOut size={15} className="mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <button
        data-testid="sidebar-mobile-toggle"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md border border-[#E2E8F0] shadow-sm"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && <div className="lg:hidden fixed inset-0 bg-black/20 z-30" onClick={() => setOpen(false)} />}
      {nav}
    </>
  );
}
