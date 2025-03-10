# Webhook Processor for Task Manager

This serverless function automatically processes due tasks and sends webhooks. It runs every minute via Netlify's scheduled functions.

## Deployment Instructions

1. **Push your code to GitHub**
   - Make sure your repository includes the `server` directory and `netlify.toml` file

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "New site from Git"
   - Select your GitHub repository
   - In the build settings:
     - Build command: `npm run build` (or your actual build command)
     - Publish directory: `build` (or your actual build output directory)

3. **Set Environment Variables**
   - In Netlify dashboard, go to Site settings > Environment variables
   - Add the following variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (with database access)

4. **Verify Scheduled Function**
   - After deployment, go to Functions tab in Netlify dashboard
   - You should see your `process-webhooks` function listed
   - Check the function logs to ensure it's running every minute

## How It Works

The function runs every minute and:
1. Checks for pending tasks that are due
2. Marks them as completed in the database
3. Sends webhooks for tasks that have webhook URLs
4. Auto-completes tasks without webhooks

This works 24/7 regardless of whether the browser app is open or not. 