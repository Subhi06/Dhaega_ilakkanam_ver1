// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Your Firebase configuration
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

// Save quiz response with complete details
export async function saveQuizResponse(answers, scores) {
    try {
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const age = localStorage.getItem('age');
        
        // Import questions to get full details
        const { questions } = await import('./quiz.js');
        
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
        
        // Create detailed answers object with question number as key (sorted)
        const detailedAnswers = {};
        
        // Sort by question index to ensure proper order
        const sortedIndices = Object.keys(answers).sort((a, b) => parseInt(a) - parseInt(b));
        
        sortedIndices.forEach(questionIndex => {
            const question = questions[questionIndex];
            const selectedValue = answers[questionIndex];
            const selectedOption = question.options.find(opt => opt.value === selectedValue);
            
            const questionNum = `question${parseInt(questionIndex) + 1}`;
            detailedAnswers[questionNum] = {
                questionNumber: parseInt(questionIndex) + 1,
                question: question.question,
                answer: selectedValue,
                answerText: selectedOption ? selectedOption.text : ''
            };
        });
        
        // Create comprehensive response object
        const responseData = {
            // User Information
            userInfo: {
                username: username,
                age: parseInt(age),
                userId: userId,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('ta-IN'),
                time: new Date().toLocaleTimeString('ta-IN')
            },
            
            // Quiz Results
            results: {
                bodyType: bodyType,
                scores: {
                    A_வாதம்: scores.A,
                    B_பித்தம்: scores.B,
                    C_கபம்: scores.C
                },
                totalQuestions: questions.length,
                percentages: {
                    A_வாதம்: ((scores.A / questions.length) * 100).toFixed(1) + '%',
                    B_பித்தம்: ((scores.B / questions.length) * 100).toFixed(1) + '%',
                    C_கபம்: ((scores.C / questions.length) * 100).toFixed(1) + '%'
                }
            },
            
            // Detailed Question-wise Answers
            detailedAnswers: detailedAnswers,
            
            // Additional metadata
            metadata: {
                quizVersion: '1.0',
                language: 'Tamil',
                completionStatus: 'completed'
            }
        };
        
        // Save to Firebase under responses
        const responseRef = ref(database, 'responses/' + userId);
        await set(responseRef, responseData);
        
        // Also save to a timestamped collection for historical tracking
        const historyRef = ref(database, 'responseHistory/' + userId + '/' + Date.now());
        await set(historyRef, responseData);
        
        console.log('Complete quiz response saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving quiz response:', error);
        throw error;
    }
}

// Get user's latest response
export async function getUserResponse(userId) {
    try {
        const responseRef = ref(database, 'responses/' + userId);
        const snapshot = await get(responseRef);
        
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting user response:', error);
        throw error;
    }
}

// Get all user's historical responses
export async function getUserHistory(userId) {
    try {
        const historyRef = ref(database, 'responseHistory/' + userId);
        const snapshot = await get(historyRef);
        
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting user history:', error);
        throw error;
    }
}

// Get all responses (for admin panel)
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

// Get statistics
export async function getStatistics() {
    try {
        const responsesRef = ref(database, 'responses');
        const snapshot = await get(responsesRef);
        
        if (snapshot.exists()) {
            const allResponses = snapshot.val();
            const stats = {
                totalUsers: 0,
                bodyTypeDistribution: {
                    வாத_தேகி: 0,
                    பித்த_தேகி: 0,
                    கப_தேகி: 0
                },
                averageScores: {
                    A: 0,
                    B: 0,
                    C: 0
                }
            };
            
            let totalA = 0, totalB = 0, totalC = 0;
            
            Object.values(allResponses).forEach(response => {
                stats.totalUsers++;
                
                // Count body types
                const bodyType = response.results.bodyType;
                if (bodyType === 'வாத தேகி') stats.bodyTypeDistribution.வாத_தேகி++;
                else if (bodyType === 'பித்த தேகி') stats.bodyTypeDistribution.பித்த_தேகி++;
                else if (bodyType === 'கப தேகி') stats.bodyTypeDistribution.கப_தேகி++;
                
                // Sum scores
                totalA += response.results.scores.A_வாதம்;
                totalB += response.results.scores.B_பித்தம்;
                totalC += response.results.scores.C_கபம்;
            });
            
            // Calculate averages
            if (stats.totalUsers > 0) {
                stats.averageScores.A = (totalA / stats.totalUsers).toFixed(2);
                stats.averageScores.B = (totalB / stats.totalUsers).toFixed(2);
                stats.averageScores.C = (totalC / stats.totalUsers).toFixed(2);
            }
            
            return stats;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting statistics:', error);
        throw error;
    }
}