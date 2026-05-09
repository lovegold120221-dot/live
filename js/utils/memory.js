// js/utils/memory.js

// Static memory storage using localStorage
const STORAGE_KEY = 'app_memories';

/**
 * Get stored memories from localStorage
 * @returns {Array} - Array of stored memory entries
 */
function getStoredMemories() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get stored memories:', error);
    return [];
  }
}

/**
 * Save memories to localStorage
 * @param {Array} memories - Array of memory entries to save
 */
function saveStoredMemories(memories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (error) {
    console.error('Failed to save memories:', error);
  }
}

/**
 * Search stored memories based on a query and user ID.
 * @param {string} query - The search query (e.g. the current user message).
 * @param {string} [userId='default'] - The user identifier.
 * @returns {Promise<Array>} - A promise that resolves to an array of memory entries.
 */
async function searchMemory(query, userId = 'default') {
  try {
    const memories = getStoredMemories();
    const userMemories = memories.filter(m => m.userId === userId);
    
    // Simple text-based search
    const queryLower = query.toLowerCase();
    const relevantMemories = userMemories.filter(memory => {
      const searchContent = memory.query.toLowerCase() + ' ' + memory.messages.map(m => m.content).join(' ').toLowerCase();
      return searchContent.includes(queryLower);
    });
    
    // Sort by relevance (more matches = higher relevance)
    relevantMemories.sort((a, b) => {
      const aMatches = (a.query.toLowerCase() + ' ' + a.messages.map(m => m.content).join(' ').toLowerCase())
        .split(queryLower).length - 1;
      const bMatches = (b.query.toLowerCase() + ' ' + b.messages.map(m => m.content).join(' ').toLowerCase())
        .split(queryLower).length - 1;
      return bMatches - aMatches;
    });
    
    return relevantMemories.slice(0, 5); // Return top 5 most relevant
  } catch (error) {
    console.error('Memory search failed:', error);
    return [];
  }
}

/**
 * Save new conversation messages to the memory storage.
 * @param {string} userId - The user identifier.
 * @param {Array} messages - Array of message objects (e.g. [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]).
 * @returns {Promise<Object>} - A promise that resolves to the result of the memory add operation.
 */
async function addMemory(userId, messages) {
  try {
    const memories = getStoredMemories();
    const newMemory = {
      id: Date.now().toString(),
      userId,
      messages,
      query: messages.find(m => m.role === 'user')?.content || '',
      timestamp: new Date().toISOString()
    };
    
    memories.push(newMemory);
    
    // Keep only last 100 memories per user to prevent storage bloat
    const userMemories = memories.filter(m => m.userId === userId);
    if (userMemories.length > 100) {
      const toRemove = userMemories.slice(0, userMemories.length - 100);
      toRemove.forEach(memory => {
        const index = memories.findIndex(m => m.id === memory.id);
        if (index > -1) memories.splice(index, 1);
      });
    }
    
    saveStoredMemories(memories);
    return { success: true, id: newMemory.id };
  } catch (error) {
    console.error('Memory add failed:', error);
    return { success: false, error: error.message };
  }
}

export { searchMemory, addMemory };