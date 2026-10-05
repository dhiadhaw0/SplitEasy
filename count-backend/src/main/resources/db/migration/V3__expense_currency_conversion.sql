-- Lets an expense be entered in a currency different from its group's currency: the original
-- amount/currency and the exchange rate used are kept alongside the already-converted `amount`
-- (which stays in the group's currency, exactly as before, so every balance/settlement/stats
-- computation elsewhere keeps working unchanged).
ALTER TABLE expenses ADD COLUMN original_currency VARCHAR(3) NULL;
ALTER TABLE expenses ADD COLUMN original_amount DECIMAL(12, 2) NULL;
ALTER TABLE expenses ADD COLUMN exchange_rate DECIMAL(14, 6) NULL;
