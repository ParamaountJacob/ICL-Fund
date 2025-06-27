-- CREATE ERROR TRACKING TABLES
-- Add these tables to support the advanced error tracking system

-- Error logs table for storing detailed error information
CREATE TABLE IF NOT EXISTS public.error_logs (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  context TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  session_id TEXT NOT NULL,
  user_actions JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Admin notifications table for critical error alerts
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES auth.users(id)
);

-- Performance metrics table for storing performance data
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  page_load_time NUMERIC,
  memory_usage NUMERIC,
  api_response_times JSONB,
  component_render_times JSONB,
  database_query_times JSONB,
  error_count INTEGER DEFAULT 0,
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  connection_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on error tracking tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
CREATE POLICY "Admins can view all error logs" ON public.error_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can insert their own error logs" ON public.error_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "Admins can update error logs" ON public.error_logs
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for performance_metrics
CREATE POLICY "Users can insert their own metrics" ON public.performance_metrics
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "Admins can view all metrics" ON public.performance_metrics
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON public.admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON public.performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at);

-- Functions for error tracking and admin management

-- Function: Get error statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_error_statistics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  unresolved_errors BIGINT,
  errors_by_day JSONB,
  top_error_messages JSONB,
  affected_users BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH error_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical,
      COUNT(*) FILTER (WHERE NOT resolved) as unresolved,
      COUNT(DISTINCT user_id) as users
    FROM public.error_logs 
    WHERE created_at > NOW() - INTERVAL '1 day' * days_back
  ),
  daily_errors AS (
    SELECT 
      DATE(created_at) as error_date,
      COUNT(*) as count
    FROM public.error_logs 
    WHERE created_at > NOW() - INTERVAL '1 day' * days_back
    GROUP BY DATE(created_at)
    ORDER BY error_date
  ),
  top_messages AS (
    SELECT 
      message,
      COUNT(*) as count
    FROM public.error_logs 
    WHERE created_at > NOW() - INTERVAL '1 day' * days_back
    GROUP BY message
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT 
    es.total,
    es.critical,
    es.unresolved,
    COALESCE(json_agg(json_build_object('date', de.error_date, 'count', de.count)), '[]'::jsonb) as errors_by_day,
    COALESCE(json_agg(json_build_object('message', tm.message, 'count', tm.count)), '[]'::jsonb) as top_error_messages,
    es.users
  FROM error_stats es
  CROSS JOIN daily_errors de
  CROSS JOIN top_messages tm
  GROUP BY es.total, es.critical, es.unresolved, es.users;
$$;

-- Function: Get unread admin notifications count
CREATE OR REPLACE FUNCTION public.get_unread_admin_notifications_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.admin_notifications
  WHERE NOT read
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- Function: Mark admin notification as read
CREATE OR REPLACE FUNCTION public.mark_admin_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Mark as read
  UPDATE public.admin_notifications 
  SET 
    read = true,
    read_at = NOW(),
    read_by = auth.uid()
  WHERE id = notification_id;
  
  RETURN FOUND;
END;
$$;

-- Function: Get performance insights for admin dashboard
CREATE OR REPLACE FUNCTION public.get_performance_insights(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  avg_page_load_time NUMERIC,
  avg_memory_usage NUMERIC,
  slow_api_calls JSONB,
  slow_components JSONB,
  error_prone_pages JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH perf_stats AS (
    SELECT 
      AVG(page_load_time) as avg_load_time,
      AVG(memory_usage) as avg_memory
    FROM public.performance_metrics
    WHERE created_at > NOW() - INTERVAL '1 day' * days_back
  ),
  error_pages AS (
    SELECT 
      url,
      COUNT(*) as error_count
    FROM public.error_logs
    WHERE created_at > NOW() - INTERVAL '1 day' * days_back
    GROUP BY url
    ORDER BY error_count DESC
    LIMIT 10
  )
  SELECT 
    ps.avg_load_time,
    ps.avg_memory,
    '[]'::jsonb as slow_api_calls, -- TODO: Extract from api_response_times JSONB
    '[]'::jsonb as slow_components, -- TODO: Extract from component_render_times JSONB
    COALESCE(json_agg(json_build_object('url', ep.url, 'errors', ep.error_count)), '[]'::jsonb) as error_prone_pages
  FROM perf_stats ps
  CROSS JOIN error_pages ep
  GROUP BY ps.avg_load_time, ps.avg_memory;
$$;

-- Grant permissions
GRANT ALL ON public.error_logs TO authenticated;
GRANT ALL ON public.admin_notifications TO authenticated;
GRANT ALL ON public.performance_metrics TO authenticated;

SELECT 'ERROR TRACKING TABLES AND FUNCTIONS CREATED!' as result;
