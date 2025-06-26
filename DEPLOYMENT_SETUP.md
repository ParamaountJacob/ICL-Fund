# Supabase Edge Function Environment Variables Setup

Your SignRequest document signing is failing because the required environment variables are not configured in your Supabase Edge Functions.

## Required Environment Variables

You need to set these environment variables in your Supabase project:

### 1. Go to Supabase Dashboard
- Visit https://supabase.com/dashboard
- Select your project: `nrvaiebclnurclnetlwe`

### 2. Navigate to Edge Functions Settings
- Go to "Edge Functions" in the left sidebar
- Click on "Settings" tab
- Look for "Environment Variables" section

### 3. Add These Variables

**SIGNREQUEST_API_KEY**
- Value: Your SignRequest API key
- Description: API key from your SignRequest account

**SUBSCRIPTION_AGREEMENT_TEMPLATE_ID** 
- Value: Your SignRequest template ID for subscription agreements
- Description: Template ID from SignRequest for subscription documents

**SITE_URL**
- Value: `https://innercirclelending.com`
- Description: Your deployed site URL for redirects

**SUPABASE_URL**
- Value: `https://nrvaiebclnurclnetlwe.supabase.co`
- Description: Your Supabase project URL (should already be set)

**SUPABASE_SERVICE_ROLE_KEY**
- Value: Your Supabase service role key
- Description: Service role key for admin database operations (should already be set)

## How to Get SignRequest Values

### For SIGNREQUEST_API_KEY:
1. Log into your SignRequest account
2. Go to Account Settings > API
3. Copy your API Token

### For SUBSCRIPTION_AGREEMENT_TEMPLATE_ID:
1. In SignRequest, go to Templates
2. Find your subscription agreement template
3. Copy the template ID from the URL or template details

## After Setting Variables

1. Save the environment variables in Supabase
2. The Edge Functions will automatically restart with the new variables
3. Try the document signing process again

## Verification

You can verify the environment variables are working by checking the Edge Function logs in Supabase Dashboard > Edge Functions > Logs. You should see successful API calls to SignRequest instead of missing environment variable errors.