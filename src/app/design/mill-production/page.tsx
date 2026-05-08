type ProductionState = "Completed" | "Mixing" | "Blocked" | "Pending";

interface ProductionCard {
  id: string;
  state: ProductionState;
  label: string;
  completedTons: number;
  expectedTons: number;
}

const STATE_CONFIG: Record<ProductionState, { bg: string; text: string }> = {
  Completed: {
    bg: "bg-success-light",
    text: "text-success-dark",
  },
  Mixing: {
    bg: "bg-warning-light",
    text: "text-warning",
  },
  Blocked: {
    bg: "bg-error-light",
    text: "text-error",
  },
  Pending: {
    bg: "bg-gray-100",
    text: "text-gray-600",
  },
};

const premixCards: ProductionCard[] = [
  { id: "PM-001", state: "Completed", label: "Starter Mix", completedTons: 250, expectedTons: 250 },
  { id: "PM-002", state: "Mixing", label: "Grower Blend", completedTons: 120, expectedTons: 200 },
  { id: "PM-003", state: "Pending", label: "Finisher Mix", completedTons: 0, expectedTons: 180 },
  { id: "PM-004", state: "Blocked", label: "Layer Premix", completedTons: 45, expectedTons: 150 },
];

const excelCards: ProductionCard[] = [
  { id: "EX-001", state: "Mixing", label: "Batch #1234", completedTons: 85, expectedTons: 175 },
  { id: "EX-002", state: "Completed", label: "Batch #1235", completedTons: 200, expectedTons: 200 },
  { id: "EX-003", state: "Pending", label: "Batch #1236", completedTons: 0, expectedTons: 225 },
  { id: "EX-004", state: "Mixing", label: "Batch #1237", completedTons: 50, expectedTons: 160 },
];

const cgmCards: ProductionCard[] = [
  { id: "CG-001", state: "Completed", label: "CGM Run A", completedTons: 300, expectedTons: 300 },
  { id: "CG-002", state: "Blocked", label: "CGM Run B", completedTons: 75, expectedTons: 280 },
  { id: "CG-003", state: "Mixing", label: "CGM Run C", completedTons: 140, expectedTons: 220 },
  { id: "CG-004", state: "Pending", label: "CGM Run D", completedTons: 0, expectedTons: 190 },
];

function ProductionCardComponent({ card }: { card: ProductionCard }) {
  const config = STATE_CONFIG[card.state];

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[var(--shadow-card)]">
      <div className={`px-4 py-2 ${config.bg}`}>
        <span className={`text-xs font-bold ${config.text}`}>{card.state}</span>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-text-primary text-sm font-bold">{card.label}</span>
        <span className="text-text-secondary text-xs">
          {card.completedTons} T / {card.expectedTons} T
        </span>
      </div>
    </div>
  );
}

function ProductionColumn({
  title,
  cards,
}: {
  title: string;
  cards: ProductionCard[];
}) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="text-text-primary text-lg font-bold">{title}</h2>
      <div className="flex flex-col gap-4">
        {cards.map((card) => (
          <ProductionCardComponent key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export default function MillProductionPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-bg-page min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Mill Production</h1>
        <p className="text-text-secondary text-sm">{today}</p>
      </header>

      <div className="flex gap-6">
        <ProductionColumn title="Premix" cards={premixCards} />
        <ProductionColumn title="Excel" cards={excelCards} />
        <ProductionColumn title="CGM" cards={cgmCards} />
      </div>
    </div>
  );
}
