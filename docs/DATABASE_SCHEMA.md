# Data model

The Node backend will own persistence and define the database technology before production models are added. Keep customer, product, plan, quotation, subscription, invoice, payment, discount, tax-rule, and audit-log relationships documented here.

Do not store passwords in application-defined model fields; use a vetted authentication provider or a suitable password hashing library.
