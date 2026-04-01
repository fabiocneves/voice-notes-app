import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import extractTags, { extractDate } from '../utils/tagExtraction';
import { auth, db as firestore } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export const db = new Dexie('VoiceNotesDB');
db.version(1).stores({
  notes: 'id, createdAt, topic, *tags'
});

export function useNotesDB() {
  const notes = useLiveQuery(
    () => db.notes.orderBy('createdAt').reverse().toArray()
  ) || [];

  // Firestore Sync Listener
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const q = query(collection(firestore, `users/${user.uid}/notes`), orderBy('createdAt', 'desc'));
        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            const data = change.doc.data();
            if (change.type === "added" || change.type === "modified") {
              await db.notes.put({ ...data, id: change.doc.id });
            }
            if (change.type === "removed") {
              await db.notes.delete(change.doc.id);
            }
          });
        });
        return () => unsubscribeFirestore();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const addNote = async (transcription, audioBlob = null) => {
    const tags = extractTags(transcription);
    const topic = tags.length > 0 ? tags[0] : 'General';
    const finalTopic = topic || 'S/ Tópico';

    const detectedDate = extractDate(transcription);
    const createdAt = detectedDate || new Date().toISOString();

    const noteId = crypto.randomUUID();
    const newNote = {
      id: noteId,
      content: transcription,
      tags: tags.filter(t => t !== finalTopic),
      topic: finalTopic,
      createdAt,
      updatedAt: new Date().toISOString(),
      // audioBlob cannot be stored directly in Firestore easily without Storage, 
      // so we keep it local for now or skip it for cloud sync
      audioBlob 
    };

    // Save locally
    await db.notes.add(newNote);

    // Save to Cloud if logged in
    if (auth.currentUser) {
      const { audioBlob: _, ...cloudNote } = newNote; // remove blob for firestore
      await setDoc(doc(firestore, `users/${auth.currentUser.uid}/notes`, noteId), cloudNote);
    }

    return newNote;
  };

  const deleteNote = async (id) => {
    // Delete locally
    await db.notes.delete(id);

    // Delete from Cloud
    if (auth.currentUser) {
      await deleteDoc(doc(firestore, `users/${auth.currentUser.uid}/notes`, id));
    }
  };

  const updateNote = async (id, updates) => {
    const note = await db.notes.get(id);
    if (!note) return;

    const newNote = { ...note, ...updates, updatedAt: new Date().toISOString() };
    
    if (updates.content !== undefined) {
      const tags = extractTags(newNote.content);
      newNote.topic = tags.length > 0 ? tags[0] : 'General';
      newNote.tags = tags.filter(t => t !== newNote.topic);
      const newDate = extractDate(newNote.content);
      if (newDate) newNote.createdAt = newDate;
    }

    // Save locally
    await db.notes.put(newNote);

    // Update in Cloud
    if (auth.currentUser) {
      const { audioBlob: _, ...cloudNote } = newNote;
      await setDoc(doc(firestore, `users/${auth.currentUser.uid}/notes`, id), cloudNote);
    }
  };

  return { notes, addNote, deleteNote, updateNote };
}
