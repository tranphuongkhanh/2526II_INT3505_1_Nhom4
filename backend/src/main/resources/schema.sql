-- Drop auto-generated Hibernate CHECK constraints so enums can evolve freely.
-- Hibernate will not regenerate them because the columns use columnDefinition = "varchar(255)".
ALTER TABLE IF EXISTS rental_contracts
    DROP CONSTRAINT IF EXISTS rental_contracts_status_check;

ALTER TABLE IF EXISTS notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE IF EXISTS utility_bills
    DROP CONSTRAINT IF EXISTS utility_bills_status_check;
