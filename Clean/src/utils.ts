import { Task } from './types';

export function getUniqueWebhooks(tasks: Task[]): { url: string; title: string }[] {
  return Array.from(
    new Map(
      tasks.filter(task => task.webhook_url).map(task => [
        task.webhook_url,
        { url: task.webhook_url!, title: task.webhook_title || task.webhook_url! }
      ])
    )
    .values()
  );
}