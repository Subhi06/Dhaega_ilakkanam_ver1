// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Your Firebase configuration
// REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDK8HtD3cRxGpFSERD2pc1tF907h1zvmYs",
  authDomain: "diagnosio-64657.firebaseapp.com",
  projectId: "diagnosio-64657",
  storageBucket: "diagnosio-64657.firebasestorage.app",
  messagingSenderId: "182463804824",
  appId: "1:182463804824:web:d42f6575aca092e2dca7ed"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Save user data
export async function saveUserData(username, age) {
    try {
        const userId = localStorage.getItem('userId');
        const userRef = ref(database, 'users/' + userId);
        
        await set(userRef, {
            username: username,
            age: age,
            timestamp: new Date().toISOString()
        });
        
        console.log('User data saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        throw error;
    }
}

// Save quiz response
export async function saveQuizResponse(answers, scores) {
    try {
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const age = localStorage.getItem('age');
        
        // Determine body type
        let bodyType = '';
        const maxScore = Math.max(scores.A, scores.B, scores.C);
        
        if (scores.A === maxScore) {
            bodyType = 'வாத தேகி';
        } else if (scores.B === maxScore) {
            bodyType = 'பித்த தேகி';
        } else {
            bodyType = 'கப தேகி';
        }
        
        const responseRef = ref(database, 'responses/' + userId);
        
        await set(responseRef, {
            username: username,
            age: age,
            answers: answers,
            scores: scores,
            bodyType: bodyType,
            timestamp: new Date().toISOString()
        });
        
        console.log('Quiz response saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving quiz response:', error);
        throw error;
    }
}

// Optional: Function to get all responses (for admin panel)
export async function getAllResponses() {
    try {
        const responsesRef = ref(database, 'responses');
        const snapshot = await get(responsesRef);
        
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting responses:', error);
        throw error;
    }
}