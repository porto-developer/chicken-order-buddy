import { Badge } from "@/components/ui/badge";

interface PaymentStatusBadgeProps {
  paymentMethod: string | null;
}

export function PaymentStatusBadge({ paymentMethod }: PaymentStatusBadgeProps) {
  const isPaid = !!paymentMethod;

  return (
    <Badge
      variant={isPaid ? "default" : "destructive"}
      className={
        isPaid
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-red-500 hover:bg-red-600 text-white"
      }
    >
      {isPaid ? "PAGO" : "A PAGAR"}
    </Badge>
  );
}
