import { CheckCircle, Package } from "lucide-react";

type OrderStatus = "shipped" | "loading" | "mixing" | "pending";

interface Order {
  id: string;
  destination: string;
  product: string;
  tons: string;
  status: OrderStatus;
  hasAlert?: boolean;
}

const orders: Order[] = [
  {
    id: "ORD-2847",
    destination: "Greenfield Farms, TX",
    product: "Layer Mash",
    tons: "24.5",
    status: "shipped",
    hasAlert: true,
  },
  {
    id: "ORD-2848",
    destination: "Valley Ranch, OK",
    product: "Cattle Grower",
    tons: "18.0",
    status: "loading",
  },
  {
    id: "ORD-2849",
    destination: "Sunrise Poultry, AR",
    product: "Broiler Starter",
    tons: "32.0",
    status: "mixing",
  },
  {
    id: "ORD-2850",
    destination: "Pine Hill Dairy, WI",
    product: "Dairy TMR",
    tons: "45.0",
    status: "shipped",
  },
  {
    id: "ORD-2851",
    destination: "Lakeside Aqua, FL",
    product: "Tilapia Pellet",
    tons: "15.5",
    status: "pending",
  },
];

const statusCounts = {
  all: 5,
  shipped: 2,
  loading: 1,
  mixing: 1,
  pending: 1,
};

const statusConfig: Record<
  OrderStatus,
  { bg: string; text: string; dot: string; countBg: string; label: string }
> = {
  shipped: {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[#2f855a22]",
    label: "Shipped",
  },
  loading: {
    bg: "bg-[var(--info-light)]",
    text: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
    countBg: "bg-[#2b6cb022]",
    label: "Loading",
  },
  mixing: {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[#975a1622]",
    label: "Mixing",
  },
  pending: {
    bg: "bg-[var(--error-light)]",
    text: "text-[var(--error-dark)]",
    dot: "bg-[var(--error-dark)]",
    countBg: "bg-[#c5303022]",
    label: "Pending",
  },
};

export default function OrdersTable() {
  return (
    <div className="flex-1 bg-white rounded-[15px] p-[21px] flex flex-col gap-4 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Outgoing Orders
          </h2>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-[15px] h-[15px] text-[var(--success)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              18 dispatched this week
            </span>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2.5">
        <FilterPill label="All" count={statusCounts.all} active />
        <FilterPill
          label="Shipped"
          count={statusCounts.shipped}
          status="shipped"
        />
        <FilterPill
          label="Loading"
          count={statusCounts.loading}
          status="loading"
        />
        <FilterPill
          label="Mixing"
          count={statusCounts.mixing}
          status="mixing"
        />
        <FilterPill
          label="Pending"
          count={statusCounts.pending}
          status="pending"
        />
      </div>

      {/* Table */}
      <div className="flex flex-col w-full">
        {/* Table Header */}
        <div className="flex py-2.5">
          <div className="flex-1 text-[10px] font-bold text-[var(--text-secondary)]">
            ORDER
          </div>
          <div className="flex-1 text-[10px] font-bold text-[var(--text-secondary)]">
            DESTINATION
          </div>
          <div className="flex-1 text-[10px] font-bold text-[var(--text-secondary)]">
            PRODUCT
          </div>
          <div className="flex-1 text-[10px] font-bold text-[var(--text-secondary)]">
            TONS
          </div>
          <div className="flex-1 text-[10px] font-bold text-[var(--text-secondary)]">
            STATUS
          </div>
        </div>

        <div className="h-px bg-[var(--divider)]" />

        {/* Table Rows */}
        {orders.map((order, index) => (
          <div key={order.id}>
            <div className="flex py-3 items-center">
              <div className="flex-1 flex items-center gap-2">
                <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
                  <Package className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {order.id}
                </span>
                {order.hasAlert && (
                  <div className="w-2 h-2 bg-[var(--error)] rounded-full" />
                )}
              </div>
              <div className="flex-1 text-xs text-[var(--text-primary)]">
                {order.destination}
              </div>
              <div className="flex-1 text-xs text-[var(--text-primary)]">
                {order.product}
              </div>
              <div className="flex-1 text-xs font-bold text-[var(--text-primary)]">
                {order.tons}
              </div>
              <div className="flex-1">
                <StatusBadge status={order.status} />
              </div>
            </div>
            {index < orders.length - 1 && (
              <div className="h-px bg-[var(--divider)]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  count,
  status,
  active = false,
}: {
  label: string;
  count: number;
  status?: OrderStatus;
  active?: boolean;
}) {
  if (active) {
    return (
      <div className="flex items-center gap-1.5 bg-[var(--primary)] rounded-xl px-3.5 py-1.5">
        <span className="text-[11px] font-bold text-white">{label}</span>
        <div className="bg-white/20 rounded-lg px-1.5 py-0.5">
          <span className="text-[10px] font-bold text-white">{count}</span>
        </div>
      </div>
    );
  }

  const config = status ? statusConfig[status] : null;
  if (!config) return null;

  return (
    <div
      className={`flex items-center gap-1.5 ${config.bg} rounded-xl px-3.5 py-1.5 border border-transparent`}
    >
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`text-[11px] font-bold ${config.text}`}>{label}</span>
      <div className={`${config.countBg} rounded-lg px-1.5 flex items-center`}>
        <span className={`text-[10px] font-bold ${config.text}`}>{count}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-1 ${config.bg} rounded-lg px-2.5 py-1`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[10px] font-bold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
