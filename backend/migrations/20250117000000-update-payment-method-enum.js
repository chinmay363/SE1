'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // PostgreSQL doesn't support ALTER TYPE ... ADD VALUE in a transaction
    // So we need to do this using raw SQL
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        -- First, check if the enum type exists
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transactions_payment_method') THEN
          -- Drop and recreate the enum type
          -- This requires a multi-step process:
          -- 1. Add a temporary column
          -- 2. Copy data
          -- 3. Drop old column
          -- 4. Rename new column

          -- Add temporary column with new enum values
          ALTER TABLE transactions ADD COLUMN payment_method_new VARCHAR(20);

          -- Copy and transform existing data
          UPDATE transactions
          SET payment_method_new = CASE
            WHEN payment_method = 'card' THEN 'credit_card'
            WHEN payment_method = 'digital_wallet' THEN 'mobile_wallet'
            WHEN payment_method = 'mobile' THEN 'mobile_wallet'
            WHEN payment_method = 'cash' THEN 'cash'
            ELSE 'credit_card'
          END;

          -- Drop old column
          ALTER TABLE transactions DROP COLUMN payment_method;

          -- Drop old enum type
          DROP TYPE enum_transactions_payment_method;

          -- Create new enum type
          CREATE TYPE enum_transactions_payment_method AS ENUM ('credit_card', 'debit_card', 'cash', 'mobile_wallet', 'upi');

          -- Rename and convert temporary column
          ALTER TABLE transactions
            RENAME COLUMN payment_method_new TO payment_method;

          ALTER TABLE transactions
            ALTER COLUMN payment_method TYPE enum_transactions_payment_method
            USING payment_method::enum_transactions_payment_method;
        END IF;
      END
      $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to old enum values
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transactions_payment_method') THEN
          -- Add temporary column
          ALTER TABLE transactions ADD COLUMN payment_method_new VARCHAR(20);

          -- Copy and transform data back
          UPDATE transactions
          SET payment_method_new = CASE
            WHEN payment_method = 'credit_card' THEN 'card'
            WHEN payment_method = 'debit_card' THEN 'card'
            WHEN payment_method = 'mobile_wallet' THEN 'digital_wallet'
            WHEN payment_method = 'upi' THEN 'mobile'
            WHEN payment_method = 'cash' THEN 'cash'
            ELSE 'card'
          END;

          -- Drop new column
          ALTER TABLE transactions DROP COLUMN payment_method;

          -- Drop new enum type
          DROP TYPE enum_transactions_payment_method;

          -- Create old enum type
          CREATE TYPE enum_transactions_payment_method AS ENUM ('cash', 'card', 'digital_wallet', 'mobile');

          -- Rename and convert temporary column
          ALTER TABLE transactions
            RENAME COLUMN payment_method_new TO payment_method;

          ALTER TABLE transactions
            ALTER COLUMN payment_method TYPE enum_transactions_payment_method
            USING payment_method::enum_transactions_payment_method;
        END IF;
      END
      $$;
    `);
  }
};
