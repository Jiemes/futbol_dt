const firebaseConfig = {
    apiKey: "AIzaSyCszzDuY3X0tK8X22KholaHBXPol8B2B3I",
    authDomain: "futboldt-palometas.firebaseapp.com",
    projectId: "futboldt-palometas",
    storageBucket: "futboldt-palometas.firebasestorage.app",
    messagingSenderId: "579993993408",
    appId: "1:579993993408:web:fa939d01ecb460ea32ad25",
    measurementId: "G-M7WH7VY8MW"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    try {
        firebase.analytics();
    } catch (e) {
        console.warn("Firebase Analytics no se pudo inicializar:", e);
    }
}

window.db = firebase.firestore();
window.authFirebase = firebase.auth();
