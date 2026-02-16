-- Aggiunge campo prezzo/costo alla tabella study_plans

ALTER TABLE study_plans
ADD COLUMN price DECIMAL(10,2);

COMMENT ON COLUMN study_plans.price IS 'Prezzo/costo del piano di studio in euro';
