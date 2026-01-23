// src/firebase/whiteboard-services.js
import { db } from '../../data/firebase-config';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'whiteboardSessions';

/**
 * Ensures a whiteboard document exists for the session.
 * Uses setDoc with merge to safely create or do nothing.
 * Assumes you are passing the user IDs (cb_id or Firebase Auth UID)
 */
export const initializeWhiteboard = async (sessionId, tutorId, studentId) => {
    const docRef = doc(db, COLLECTION_NAME, sessionId);
    try {
        await setDoc(docRef, {
            createdAt: serverTimestamp(),
            tutorId: tutorId,   // For secure rules
            studentId: studentId // For secure rules
        }, { merge: true });
    } catch (e) {
        console.error("Error ensuring whiteboard doc exists:", e);
    }
};

/**
 * Listens for real-time changes to a whiteboard session.
 * @param {string} sessionId - The booking._id
 * @param {string} tutorId - The tutor's ID (for initialization)
 * @param {string} studentId - The student's ID (for initialization)
 * @param {function} callback - Function to call with new data
 * @returns {function} - The unsubscribe function
 */
export const listenToWhiteboard = (sessionId, tutorId, studentId, callback) => {
    const docRef = doc(db, COLLECTION_NAME, sessionId);

    // Ensure the document exists before listening
    initializeWhiteboard(sessionId, tutorId, studentId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            console.log('Whiteboard document not found, re-initializing...');
            initializeWhiteboard(sessionId, tutorId, studentId);
        }
    }, (error) => {
        console.error("Firestore listener error:", error);
    });

    return unsubscribe;
};

/**
 * Updates the 'elements' field of the whiteboard document.
 * Stores the elements array as a JSON string.
 */
export const updateWhiteboardElements = async (sessionId, elements, userId) => {
    if (!sessionId || !elements || !userId) {
        console.error("Error: Attempted to update whiteboard with undefined critical data.", { sessionId, elements, userId });
        return;
    }

    const docRef = doc(db, COLLECTION_NAME, sessionId);
    
    // Convert the entire elements array to a string
    // This avoids both 'undefined' and 'nested array' errors
    const dataToSet = {
        elements: JSON.stringify(elements),
        lastUpdatedBy: userId,
        lastUpdated: serverTimestamp()
    };

    try {
        await setDoc(docRef, dataToSet, { merge: true });
    } catch (e) {
        console.error("Error updating whiteboard elements:", e, dataToSet);
    }
};

/**
 * Adds a new file to the 'files' array in the document.
 * This still sanitizes the file object, as it's stored as an object.
 */
export const addWhiteboardFile = async (sessionId, fileData, userId) => {
    if (!sessionId || !fileData || !userId) {
        console.error("Error: Attempted to add file with undefined critical data.", { sessionId, fileData, userId });
        return;
    }

    const docRef = doc(db, COLLECTION_NAME, sessionId);
    try {
        // Sanitize the fileData object to remove 'undefined'
        const sanitizedFileData = JSON.parse(JSON.stringify(fileData));

        await updateDoc(docRef, {
            files: arrayUnion(sanitizedFileData), // Use sanitized data
            lastUpdatedBy: userId,
            lastUpdated: serverTimestamp()
        });
    } catch (e) {
        console.error("Error adding whiteboard file:", e, fileData);
    }
};