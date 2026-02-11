
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configurar con variables directas (ya que no podemos leer .env en node sin dotenv fácilmente si no está instalado)
// Usamos los valores que el usuario me pasó en el chat anterior
const firebaseConfig = {
    apiKey: "AIzaSyDoUHZtRvgEwhEUhZj6x4xEZvVmxliMCJo",
    authDomain: "whatsapp-leads-peru.firebaseapp.com",
    projectId: "whatsapp-leads-peru",
    storageBucket: "whatsapp-leads-peru.firebasestorage.app",
    messagingSenderId: "262135231435",
    appId: "1:262135231435:web:76effdecd25bbb85443c4e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'superadmin2@leadwidget.pe';
const password = process.argv[2] || 'Admin123!'; // Pass password as arg or use default

async function createSuperAdmin() {
    console.log(`Intentando crear/actualizar SuperAdmin: ${email}`);

    let user;
    try {
        // 1. Try to create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log('✅ Usuario creado correctamente en Authentication.');
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('⚠️ El usuario ya existe. Intentando iniciar sesión...');
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
                console.log('✅ Sesión iniciada correctamente.');
            } catch (loginError) {
                console.error('❌ Error al iniciar sesión (quizás la contraseña es diferente):', loginError.message);
                process.exit(1);
            }
        } else {
            console.error('❌ Error creando usuario:', error.message);
            process.exit(1);
        }
    }

    if (user) {
        try {
            // 2. Assign Role in Firestore
            await setDoc(doc(db, 'user_roles', user.uid), {
                role: 'superadmin',
                email: email,
                updated_at: new Date().toISOString()
            });
            console.log('✅ Rol "superadmin" asignado en Firestore (colección user_roles).');

            // 3. Create Profile if missing
            await setDoc(doc(db, 'profiles', user.uid), {
                id: user.uid,
                email: email,
                business_name: 'SuperAdmin Account',
                status: 'active',
                created_at: new Date().toISOString(),
                subscription_status: 'active'
            }, { merge: true });
            console.log('✅ Perfil de usuario creado/actualizado en Firestore.');

            console.log('\n¡ÉXITO! Ya puedes iniciar sesión en /login');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            process.exit(0);
        } catch (dbError) {
            console.error('❌ Error escribiendo en Firestore (¿Revisaste las Security Rules?):', dbError.message);
            process.exit(1);
        }
    }
}

createSuperAdmin();
