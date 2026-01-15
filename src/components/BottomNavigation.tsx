import { ClipboardList, Package, FolderOpen, BarChart3, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/", icon: ClipboardList, label: "Pedidos" },
  { path: "/products", icon: Package, label: "Produtos" },
  { path: "/reports", icon: BarChart3, label: "Gráficos" },
  { path: "/categories", icon: FolderOpen, label: "Categorias" },
  { path: "/settings", icon: Settings, label: "Mais" },
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
          <Icon />
          <span className="text-[10px] font-medium leading-tight">{label}</span>
        </button>
      ))}
    </nav>
  );
}
