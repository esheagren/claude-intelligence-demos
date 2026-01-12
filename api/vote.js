import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, action } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const currentVotes = await redis.hget('votes', projectId) || 0;

    let newVotes;
    if (action === 'upvote') {
      newVotes = currentVotes + 1;
    } else if (action === 'downvote') {
      newVotes = Math.max(0, currentVotes - 1);
    } else {
      return res.status(400).json({ error: 'action must be "upvote" or "downvote"' });
    }

    await redis.hset('votes', { [projectId]: newVotes });

    return res.status(200).json({ projectId, votes: newVotes });
  } catch (error) {
    console.error('Error updating vote:', error);
    return res.status(500).json({ error: 'Failed to update vote' });
  }
}
