@@ .. @@
 -- Create function to get user's active application
 CREATE OR REPLACE FUNCTION get_user_active_application(p_user_id uuid DEFAULT NULL)
 RETURNS TABLE (
+  id uuid,
   status text,
   investment_amount numeric,
   annual_percentage numeric,
@@ .. @@
   END IF;
 
   RETURN QUERY
-  WITH app_steps AS (
+  WITH app_steps AS (
     SELECT 
       os.application_id,
       jsonb_object_agg(os.step_name, jsonb_build_object(
@@ .. @@
     GROUP BY os.application_id
   )
   SELECT 
+    ia.id,
     ia.status,
     ia.investment_amount,
     ia.annual_percentage,