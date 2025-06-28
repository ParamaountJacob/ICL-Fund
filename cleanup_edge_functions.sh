# Edge Functions Cleanup Commands
# Run these in your terminal with Supabase CLI

# Delete investment and admin workflow functions
supabase functions delete approve-document
supabase functions delete check-document-status
supabase functions delete exchange-plaid-token
supabase functions delete check-api-keys
supabase functions delete send-admin-notification
supabase functions delete delete-investment
supabase functions delete delete-consultation
supabase functions delete delete-user
supabase functions delete log-error

# Keep these essential functions:
# - send-email (for contact form)
# - send-contact-email (for contact form)

echo "✅ Edge functions cleanup complete"
echo "Remaining functions should be:"
echo "- send-email"
echo "- send-contact-email"
