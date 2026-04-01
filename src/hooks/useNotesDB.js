import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import extractTags, { extractDate } from '../utils/tagExtraction';

export const db = new Dexie('VoiceNotesDB');
db.version(1).stores({
  notes: 'id, createdAt, topic, *tags'
});

export function useNotesDB() {
  const notes = useLiveQuery(
    () => db.notes.orderBy('createdAt').reverse().toArray()
  ) || [];

  const addNote = async (transcription, audioBlob = null) => {
    const tags = extractTags(transcription);
    const topic = tags.length > 0 ? tags[0] : 'General';
    const finalTopic = topic || 'S/ Tópico';

    // Smart Date Detection
    const detectedDate = extractDate(transcription);
    const createdAt = detectedDate || new Date().toISOString();

    const newNote = {
      id: crypto.randomUUID(),
      content: transcription,
      tags: tags.filter(t => t !== finalTopic),
      topic: finalTopic,
      createdAt,
      updatedAt: new Date().toISOString(),
      audioBlob
    };

    await db.notes.add(newNote);
    return newNote;
  };

  const deleteNote = async (id) => {
    await db.notes.delete(id);
  };

  const updateNote = async (id, updates) => {
    const note = await db.notes.get(id);
    if (!note) return;

    const newNote = { ...note, ...updates, updatedAt: new Date().toISOString() };
    
    if (updates.content !== undefined) {
      const tags = extractTags(newNote.content);
      newNote.topic = tags.length > 0 ? tags[0] : 'General';
      newNote.tags = tags.filter(t => t !== newNote.topic);
      
      // Update date if edited text has a new date mention?
      // Optional: const newDate = extractDate(updates.content);
      // if (newDate) newNote.createdAt = newDate;
    }

    await db.notes.put(newNote);
  };

  return { notes, addNote, deleteNote, updateNote };
}
