-- Convert existing Expense amounts from kopecks to UAH
UPDATE "Expense" SET amount = ROUND(amount / 100.0);
