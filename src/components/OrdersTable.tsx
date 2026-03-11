import { CheckCircle, Package } from "lucide-react";
import StatusBadge, { STATUS_CONFIG } from "@/components/ui/StatusBadge";
import { OrderStatus } from "@/types/order";

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
    status: "Complete",
    hasAlert: true,
  },
  {
    id: "ORD-2848",
    destination: "Valley Ranch, OK",
    product: "Cattle Grower",
    tons: "18.0",
    status: "In Transit",
  },
  {
    id: "ORD-2849",
    destination: "Sunrise Poultry, AR",
    product: "Broiler Starter",
    tons: "32.0",
    status: "Producing",
  },
  {
    id: "ORD-2850",
    destination: "Pine Hill Dairy, WI",
    product: "Dairy TMR",
    tons: "45.0",
    status: "Ready",
  },
  {
    id: "ORD-2851",
    destination: "Lakeside Aqua, FL",
    product: "Tilapia Pellet",
    tons: "15.5",
    status: "Pending",
  },
];

const statusCounts = {
  all: 5,
  "Complete": 1,
  "In Transit": 1,
  "Producing": 1,
  "Ready": 1,
  "Pending": 1,
};


export default function OrdersTable() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[15px] bg-white p-[21px] shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Outgoing Orders
          </h2>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-[15px] w-[15px] text-[var(--success)]" />
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
          label="Complete"
          count={statusCounts["Complete"]}
          status="Complete"
        />
        <FilterPill
          label="Transit"
          count={statusCounts["In Transit"]}
          status="In Transit"
        />
        <FilterPill
          label="Producing"
          count={statusCounts["Producing"]}
          status="Producing"
        />
        <FilterPill
          label="Ready"
          count={statusCounts["Ready"]}
          status="Ready"
        />
        <FilterPill
          label="Pending"
          count={statusCounts["Pending"]}
          status="Pending"
        />
      </div>

      {/* Table */}
      <div className="flex w-full flex-col">
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
            <div className="flex items-center py-3">
              <div className="flex flex-1 items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)]">
                  <Package className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {order.id}
                </span>
                {order.hasAlert && (
                  <div className="h-2 w-2 rounded-full bg-[var(--error)]" />
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
      <div className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5">
        <span className="text-[11px] font-bold text-white">{label}</span>
        <div className="rounded-lg bg-white/20 px-1.5 py-0.5">
          <span className="text-[10px] font-bold text-white">{count}</span>
        </div>
      </div>
    );
  }

  const config = status ? STATUS_CONFIG[status] : null;
  if (!config) return null;

  return (
    <div
      className={`flex items-center gap-1.5 ${config.bg} rounded-xl border border-transparent px-3.5 py-1.5`}
    >
      <div className={`h-2 w-2 rounded-full ${config.dot}`} />
      <span className={`text-[11px] font-bold ${config.text}`}>{label}</span>
      <div className={`${config.countBg} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${config.text}`}>{count}</span>
      </div>
    </div>
  );
}

