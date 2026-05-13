// Phase 31 placeholder. Real tables (production_orders, order_events,
// import_batches, users) defined in Phase 32 per DATA-02..05.
//
// `export {}` keeps this a valid TS module under isolatedModules without
// declaring any pgTable. drizzle-kit generate produces zero migrations
// in this state, which is the expected end-of-phase 31 outcome (D-09).

export {};
