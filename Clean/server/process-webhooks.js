const { createClient } = require('@supabase/supabase-js');
// Use node-fetch for Node.js environment
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Webhook processing function that runs on a schedule
exports.handler = async function(event, context) {
  console.log('Webhook processor running...');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    // Get all due tasks that need webhooks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false)
      .is('webhook_url', 'not.null')
      .lte('due_date', new Date().toISOString());
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    
    console.log(`Found ${tasks.length} tasks to process`);
    let processed = 0;
    
    for (const task of tasks) {
      try {
        // Check if task should be processed (not already sent webhook)
        if (task.webhook_sent) {
          console.log(`Task ${task.id} already sent webhook, skipping`);
          continue;
        }
        
        // Double check with latest database state
        const { data: latestTask, error: fetchError } = await supabase
          .from('tasks')
          .select('completed, webhook_sent')
          .eq('id', task.id)
          .single();
          
        if (fetchError || !latestTask || latestTask.webhook_sent) {
          console.log(`Task ${task.id} no longer needs processing, skipping`);
          continue;
        }

        // First mark as completed in database
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            completed: true, 
            webhook_sent: true 
          })
          .eq('id', task.id);
          
        if (updateError) {
          console.error(`Error updating task ${task.id}:`, updateError);
          continue;
        }
          
        // Then send the webhook
        console.log(`Sending webhook for task ${task.id}: ${task.title}`);
        
        try {
          await fetch(task.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'task_completed',
              task: {
                id: task.id,
                title: task.title,
                description: task.description,
                due_date: task.due_date
              },
              meta: {
                sent_at: new Date().toISOString(),
                webhook_id: `${task.id}_${Date.now()}`
              }
            })
          });
          
          console.log(`Successfully sent webhook for task ${task.id}`);
          processed++;
        } catch (fetchError) {
          console.error(`Failed to send webhook for task ${task.id}:`, fetchError);
          // Don't revert the webhook_sent flag - we'll consider it sent even if the HTTP request failed
          // This prevents endless retries for invalid webhook URLs
        }
      } catch (taskError) {
        console.error(`Failed to process task ${task.id}:`, taskError);
      }
    }
    
    // Also auto-complete tasks without webhooks
    const { data: tasksToComplete, error: autoCompleteError } = await supabase
      .from('tasks')
      .select('id')
      .eq('completed', false)
      .is('webhook_url', 'null')
      .lte('due_date', new Date().toISOString());
      
    if (!autoCompleteError && tasksToComplete && tasksToComplete.length > 0) {
      for (const task of tasksToComplete) {
        await supabase
          .from('tasks')
          .update({ completed: true })
          .eq('id', task.id);
      }
      console.log(`Auto-completed ${tasksToComplete.length} tasks`);
    }
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        message: `Processed ${processed} webhooks`,
        tasks_processed: processed 
      }) 
    };
  } catch (error) {
    console.error('Failed to process webhooks:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}; 