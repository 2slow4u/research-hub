import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  FlaskConical, 
  Home, 
  Search, 
  FileText, 
  Settings, 
  Shield, 
  Moon, 
  Sun, 
  LogOut,
  Briefcase,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const { user } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [location] = useLocation();
  const [workspacesExpanded, setWorkspacesExpanded] = useState(false);

  // Fetch user workspaces
  const { data: workspaces } = useQuery({
    queryKey: ['/api/workspaces'],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Workspaces', href: '/workspaces', icon: Briefcase },
    { name: 'Search & Monitor', href: '/search', icon: Search },
    { name: 'Summaries', href: '/summaries', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  // Sort workspaces alphabetically
  const sortedWorkspaces = workspaces?.sort((a: any, b: any) => 
    a.name.localeCompare(b.name)
  ) || [];

  return (
    <div className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
      {/* Logo and User Info */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">ResearchHub</h1>
        </div>
        
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <img 
            src={user?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName}${user?.lastName}`}
            alt="User profile" 
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'
              }
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {user?.email || 'No email'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          // Special handling for Workspaces item to make it expandable
          if (item.name === 'Workspaces') {
            return (
              <div key={item.name}>
                <div className="flex">
                  <Link href={item.href} className="flex-1">
                    <a className={`sidebar-nav-item ${isActive ? 'active' : ''} rounded-r-none`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </a>
                  </Link>
                  <button
                    onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
                    className="sidebar-nav-item px-2 rounded-l-none border-l border-neutral-200 dark:border-neutral-600"
                  >
                    {workspacesExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {workspacesExpanded && (
                  <div className="ml-4 mt-2 space-y-1">
                    {sortedWorkspaces.map((workspace: any) => {
                      const isWorkspaceActive = location === `/workspace/${workspace.id}`;
                      return (
                        <Link key={workspace.id} href={`/workspace/${workspace.id}`}>
                          <a className={`sidebar-nav-item text-sm ${isWorkspaceActive ? 'active' : ''}`}>
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-xs font-medium truncate">{workspace.name}</span>
                          </a>
                        </Link>
                      );
                    })}
                    {sortedWorkspaces.length === 0 && (
                      <div className="sidebar-nav-item text-xs text-neutral-500 dark:text-neutral-400">
                        No workspaces yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.name}</span>
                {item.name === 'Admin Panel' && (
                  <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full ml-auto">
                    Admin
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle and Logout */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTheme}
          className="w-full justify-start"
        >
          {effectiveTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium">Dark Mode</span>
            </>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}
