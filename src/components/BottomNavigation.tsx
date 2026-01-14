import { ClipboardList, Package, FolderOpen, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/", icon: ClipboardList, label: "Pedidos" },
  { path: "/products", icon: Package, label: "Produtos" },
  { path: "/categories", icon: FolderOpen, label: "Categorias" },
  { path: "/settings", icon: Settings, label: "Config" },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`nav-item ${location.pathname === path ? "active" : ""}`}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
