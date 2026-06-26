// src/components/Sidebar.tsx
'use client';

import React from 'react';
import { Home, Settings, BarChart2, ShoppingCart, Globe, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  userEmail?: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const router = useRouter();
  const displayEmail = userEmail || 'joshua@ogrupothebest.com.br';
  const shortName = displayEmail.split('@')[0];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sso_bypass_user');
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-[#151718] p-4 text-gray-300">
      <div>
        {/* Company Logo Container */}
        <div className="mb-8 mt-2 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 to-orange-600 p-1 shadow-md">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#151718] text-sm font-black text-orange-500">
              TB
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">O GRUPO</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-orange-500">The Best</p>
          </div>
        </div>

        {/* Navigation Options */}
        <nav className="space-y-1.5">
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#1a1c1d] hover:text-white transition-colors">
            <Home className="h-4.5 w-4.5 text-gray-500" />
            Home
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#1a1c1d] hover:text-white transition-colors">
            <Settings className="h-4.5 w-4.5 text-gray-500" />
            Administração
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#1a1c1d] hover:text-white transition-colors">
            <BarChart2 className="h-4.5 w-4.5 text-gray-500" />
            Benchmark
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg bg-[#1a1c1d] px-3 py-2.5 text-xs font-bold text-orange-500 transition-colors">
            <ShoppingCart className="h-4.5 w-4.5" />
            Pedidos
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-400 hover:bg-[#1a1c1d] hover:text-white transition-colors">
            <Globe className="h-4.5 w-4.5 text-gray-500" />
            Pedidos PY
          </a>
        </nav>
      </div>

      {/* User Information Profile Section */}
      <div className="border-t border-[#232627] pt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
              {shortName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate max-w-[120px]">{shortName}</p>
              <p className="text-[10px] text-gray-500">Master</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f2122] py-2 text-xs font-bold text-gray-400 hover:bg-[#2a2d2f] hover:text-white transition-all border border-[#2d3032]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
