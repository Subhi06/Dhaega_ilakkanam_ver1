// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push, get, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase Configuration - REPLACE WITH YOUR OWN CONFIG
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

// Global Variables
let currentUser = {
    name: '',
    age: 0,
    isAdmin: false,
    userId: ''
};

// Initialize default questions
async function initializeDefaultQuestions() {
    const questionsRef = ref(database, 'questions');
    const snapshot = await get(questionsRef);
    
    if (!snapshot.exists()) {
        const defaultQuestions = [
            {
                question: "உடலின் அமைப்பு",
                optionA: "மெலிந்த உடல்",
                optionB: "சராசரியான உடல்வாகு",
                optionC: "கனத்த பருமனான உடல்"
            },
            {
                question: "உயரம்",
                optionA: "அதிக உயரம்",
                optionB: "நடுத்தர உயரம்",
                optionC: "குள்ளம்"
            },
            {
                question: "உடல் வலிமை",
                optionA: "மிகக்குறைவு",
                optionB: "மிதமாக",
                optionC: "அதிகமாக"
            },
            {
                question: "தோலின் நிறம்",
                optionA: "கருமை",
                optionB: "மஞ்சள் (சிவப்பு)",
                optionC: "வெளுத்த தோல்"
            }
        ];

        for (const q of defaultQuestions) {
            const newQuestionRef = push(ref(database, 'questions'));
            await set(newQuestionRef, q);
        }
        console.log('Default questions initialized');
    }
}

// Initialize default questions on load
initializeDefaultQuestions();

// Check if user is logged in on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.isAdmin) {
            showPage('adminPage');
            loadAdminData();
        } else {
            showPage('quizPage');
            document.getElementById('userName').textContent = `வணக்கம், ${currentUser.name} (வயது: ${currentUser.age})`;
            loadQuestions();
        }
    } else {
        showPage('loginPage');
    }
});

// Login User
window.loginUser = (event) => {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const age = parseInt(document.getElementById('age').value);
    
    if (!username || !age) {
        alert('தயவுசெய்து பெயர் மற்றும் வயதை உள்ளிடவும்');
        return;
    }
    
    // Generate unique user ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Check if username is "admin"
    if (username.toLowerCase() === 'admin') {
        currentUser = {
            name: username,
            age: age,
            isAdmin: true,
            userId: userId
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPage('adminPage');
        loadAdminData();
    } else {
        currentUser = {
            name: username,
            age: age,
            isAdmin: false,
            userId: userId
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPage('quizPage');
        document.getElementById('userName').textContent = `வணக்கம், ${currentUser.name} (வயது: ${currentUser.age})`;
        loadQuestions();
    }
    
    // Clear form
    document.getElementById('username').value = '';
    document.getElementById('age').value = '';
};

// Show Page Function
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Logout
window.logout = () => {
    localStorage.removeItem('currentUser');
    currentUser = {
        name: '',
        age: 0,
        isAdmin: false,
        userId: ''
    };
    showPage('loginPage');
};

// Load Questions for Quiz
async function loadQuestions() {
    const questionsRef = ref(database, 'questions');
    const snapshot = await get(questionsRef);
    
    if (snapshot.exists()) {
        const questions = snapshot.val();
        const container = document.getElementById('questionsContainer');
        container.innerHTML = '';

        Object.entries(questions).forEach(([id, q], index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.innerHTML = `
                <h3>${index + 1}. ${q.question}</h3>
                <label class="option">
                    <input type="radio" name="q${id}" value="A" onchange="selectOption(this)">
                    ${q.optionA}
                </label>
                <label class="option">
                    <input type="radio" name="q${id}" value="B" onchange="selectOption(this)">
                    ${q.optionB}
                </label>
                <label class="option">
                    <input type="radio" name="q${id}" value="C" onchange="selectOption(this)">
                    ${q.optionC}
                </label>
            `;
            container.appendChild(questionCard);
        });
    } else {
        document.getElementById('questionsContainer').innerHTML = '<p>கேள்விகள் இல்லை. Admin பேனலில் கேள்விகள் சேர்க்கவும்.</p>';
    }
}

// Select Option
window.selectOption = (radio) => {
    const options = radio.closest('.question-card').querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    radio.closest('.option').classList.add('selected');
};

// Submit Quiz
window.submitQuiz = async () => {
    const radios = document.querySelectorAll('#questionsContainer input[type="radio"]:checked');
    
    const questionsRef = ref(database, 'questions');
    const snapshot = await get(questionsRef);
    const totalQuestions = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    
    if (radios.length !== totalQuestions) {
        alert('தயவுசெய்து அனைத்து கேள்விகளுக்கும் பதிலளிக்கவும்');
        return;
    }

    let scoreA = 0, scoreB = 0, scoreC = 0;

    radios.forEach(radio => {
        if (radio.value === 'A') scoreA++;
        else if (radio.value === 'B') scoreB++;
        else if (radio.value === 'C') scoreC++;
    });

    // Save result to database
    const resultRef = ref(database, `results/${currentUser.userId}`);
    await set(resultRef, {
        name: currentUser.name,
        age: currentUser.age,
        scoreA,
        scoreB,
        scoreC,
        timestamp: Date.now(),
        date: new Date().toLocaleString('ta-IN')
    });

    // Display results
    document.getElementById('scoreA').textContent = scoreA;
    document.getElementById('scoreB').textContent = scoreB;
    document.getElementById('scoreC').textContent = scoreC;

    let dominant = '';
    let dominantScore = Math.max(scoreA, scoreB, scoreC);
    
    if (scoreA === dominantScore) {
        dominant = 'வாதம் (Vata)';
    } else if (scoreB === dominantScore) {
        dominant = 'பித்தம் (Pitta)';
    } else {
        dominant = 'கபம் (Kapha)';
    }

    document.getElementById('dominantType').textContent = `உங்கள் உடல் வகை: ${dominant}`;
    showPage('resultsPage');
};

// Retake Quiz
window.retakeQuiz = () => {
    showPage('quizPage');
    loadQuestions();
};

// Admin Functions
window.addQuestion = async () => {
    const questionText = document.getElementById('questionText').value.trim();
    const optionA = document.getElementById('optionA').value.trim();
    const optionB = document.getElementById('optionB').value.trim();
    const optionC = document.getElementById('optionC').value.trim();

    if (!questionText || !optionA || !optionB || !optionC) {
        alert('Please fill all fields');
        return;
    }

    const newQuestionRef = push(ref(database, 'questions'));
    await set(newQuestionRef, {
        question: questionText,
        optionA,
        optionB,
        optionC,
        createdAt: Date.now()
    });

    // Clear form
    document.getElementById('questionText').value = '';
    document.getElementById('optionA').value = '';
    document.getElementById('optionB').value = '';
    document.getElementById('optionC').value = '';

    alert('Question added successfully!');
    loadAdminData();
};

window.deleteQuestion = async (questionId) => {
    if (confirm('Are you sure you want to delete this question?')) {
        const questionRef = ref(database, `questions/${questionId}`);
        await remove(questionRef);
        alert('Question deleted successfully!');
        loadAdminData();
    }
};

async function loadAdminData() {
    // Load questions
    const questionsRef = ref(database, 'questions');
    const questionsSnapshot = await get(questionsRef);
    
    const adminQuestionsList = document.getElementById('adminQuestionsList');
    adminQuestionsList.innerHTML = '';

    if (questionsSnapshot.exists()) {
        const questions = questionsSnapshot.val();
        Object.entries(questions).forEach(([id, q], index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.innerHTML = `
                <div class="question-item-text">
                    <strong>${index + 1}. ${q.question}</strong>
                    <small>A: ${q.optionA}</small>
                    <small>B: ${q.optionB}</small>
                    <small>C: ${q.optionC}</small>
                </div>
                <button class="btn-delete" onclick="deleteQuestion('${id}')">Delete</button>
            `;
            adminQuestionsList.appendChild(questionItem);
        });
    } else {
        adminQuestionsList.innerHTML = '<p>No questions available</p>';
    }

    // Load user results
    const resultsRef = ref(database, 'results');
    const resultsSnapshot = await get(resultsRef);
    
    const userResultsList = document.getElementById('userResultsList');
    userResultsList.innerHTML = '';

    if (resultsSnapshot.exists()) {
        const results = resultsSnapshot.val();
        Object.entries(results).forEach(([userId, result]) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            let dominant = '';
            let dominantScore = Math.max(result.scoreA, result.scoreB, result.scoreC);
            
            if (result.scoreA === dominantScore) {
                dominant = 'வாதம் (Vata)';
            } else if (result.scoreB === dominantScore) {
                dominant = 'பித்தம் (Pitta)';
            } else {
                dominant = 'கபம் (Kapha)';
            }

            resultItem.innerHTML = `
                <h4>${result.name} (Age: ${result.age})</h4>
                <p>Dominant Type: ${dominant}</p>
                <div class="result-scores">
                    <span>வாதம்: ${result.scoreA}</span>
                    <span>பித்தம்: ${result.scoreB}</span>
                    <span>கபம்: ${result.scoreC}</span>
                </div>
                <p><small>Date: ${result.date || new Date(result.timestamp).toLocaleString('ta-IN')}</small></p>
            `;
            userResultsList.appendChild(resultItem);
        });
    } else {
        userResultsList.innerHTML = '<p>No results available yet</p>';
    }
}

console.log('Ayurveda Quiz System Initialized');