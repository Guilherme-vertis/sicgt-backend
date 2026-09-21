CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.app_role AS ENUM ('admin','contador','gestor','cliente');
CREATE TYPE public.user_status AS ENUM ('active','inactive');
CREATE TYPE public.task_status AS ENUM ('pending','in_progress','completed','cancelled');
CREATE TYPE public.task_priority AS ENUM ('low','medium','high','urgent');

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  status public.user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_email_unique UNIQUE(email)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.users TO authenticated;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id,role)
);
GRANT SELECT ON public.user_roles TO authenticated;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_name text NOT NULL,
  legal_name text NOT NULL,
  cnpj text NOT NULL UNIQUE CHECK(cnpj ~ '^\d{14}$'),
  phone text,
  contact_person text,
  billing_email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.clients TO authenticated;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  upload_date timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid NOT NULL REFERENCES public.users(id),
  file_url text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.documents TO authenticated;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  assigned_to uuid REFERENCES public.users(id),
  status public.task_status NOT NULL DEFAULT 'pending',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.tasks TO authenticated;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.refresh_tokens TO authenticated;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT,INSERT ON public.audit_logs TO authenticated;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX users_active_idx ON public.users(email) WHERE deleted_at IS NULL;
CREATE INDEX clients_active_idx ON public.clients(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX documents_filters_idx ON public.documents(client_id,type,uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX tasks_filters_idx ON public.tasks(status,priority,assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX refresh_tokens_active_idx ON public.refresh_tokens(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX audit_logs_resource_idx ON public.audit_logs(resource_type,resource_id,timestamp DESC);
