import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Play,
  PlusCircle,
  MessageCircle,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Bell,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo.');
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/create-post', icon: PlusCircle, label: 'Publicar' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const userInitials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        {location.pathname === '/' && !user ? (
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#7c3aed] rounded-lg p-1.5">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg text-[#7c3aed] hidden sm:block">MemeTube</span>
          </div>
        ) : (
          <Link to={user ? '/feed' : '/'} className="flex items-center gap-2 shrink-0">
            <div className="bg-[#7c3aed] rounded-lg p-1.5">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg text-[#7c3aed] hidden sm:block">MemeTube</span>
          </Link>
        )}

        {/* Search */}
        {user && (
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar vídeos, usuários..."
                className="pl-9 h-9 bg-muted border-0"
              />
            </div>
          </form>
        )}

        {/* Desktop Nav */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant={isActive(to) ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              </Link>
            ))}

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-56 ${theme === 'dark' ? 'dark' : ''}`}>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{profile?.display_name || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">@{profile?.username || 'user'}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/profile/${profile?.username}`)}>
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/edit-profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Editar Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/connections')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Conexões
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button variant="gradient" size="sm">Cadastrar</Button>
            </Link>
          </div>
        )}

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          {user ? (
            <div className="p-4 space-y-2">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="pl-9 bg-muted border-0"
                  />
                </div>
              </form>
              {/* User info */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                </div>
              </div>
              {navLinks.map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant={isActive(to) ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              <Link to={`/profile/${profile?.username}`} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-red-500"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Entrar</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button variant="gradient" className="w-full">Cadastrar</Button>
              </Link>
              <Button variant="ghost" className="w-full gap-2" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
