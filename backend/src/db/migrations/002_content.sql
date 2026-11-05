-- Admin paneldan boshqariladigan kontent: loyihalar, vakansiyalar, statistika.
CREATE TABLE IF NOT EXISTS content_items (
  kind text NOT NULL CHECK (kind IN ('case','vacancy')),
  id text NOT NULL,
  data jsonb NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, id)
);

CREATE TABLE IF NOT EXISTS content_settings (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
