import { OrderStatus } from "@/types/database";

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "bg-warning/20 text-warning-foreground border border-warning/30",
  },
  picked_up: {
    label: "Retirado",
    className: "bg-info/20 text-info border border-info/30",
  },
  completed: {
    label: "Concluído",
    className: "bg-success/20 text-success border border-success/30",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-destructive/20 text-destructive border border-destructive/30",
  },
};

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
