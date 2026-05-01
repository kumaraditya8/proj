import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  LogOut,
  Search,
  Bell,
  ChevronLeft,
  Menu,
  Sparkles,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { UserBadge } from "@/components/AvatarStack";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api/users";
import { formatDistanceToNow } from "date-fns";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "My Tasks", icon: CheckSquare },
  { to: "/team", label: "Team", icon: Users },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        {!collapsed && <span className="font-semibold text-sidebar-foreground">Proj</span>}
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-primary",
                collapsed && "justify-center"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 py-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent",
            collapsed && "justify-center"
          )}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </div>
  );
}

function NotificationsPopover() {
  const { data = [] } = useQuery({ queryKey: ["notifications"], queryFn: usersApi.notifications });
  const unread = data.filter((n) => !n.read).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && <Badge variant="secondary">{unread} new</Badge>}
        </div>
        <div className="max-h-80 overflow-auto">
          {data.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">You're all caught up.</p>}
          {data.map((n) => (
            <div key={n.id} className={cn("px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50", !n.read && "bg-accent/40")}>
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const pageTitle = nav.find((n) => location.pathname.startsWith(n.to))?.label ?? "";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex bg-sidebar border-r border-sidebar-border transition-[width] duration-300",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center gap-2 px-3 md:px-5 sticky top-0 z-30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar">
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>

          <h1 className="text-sm font-semibold hidden sm:block">{pageTitle}</h1>

          <div className="flex-1 max-w-md mx-auto hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects, tasks…" className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background" />
            </div>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <NotificationsPopover />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors focus-ring">
                  <UserBadge name={user?.name ?? "?"} />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-medium leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize leading-tight">{user?.role}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm">{user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
