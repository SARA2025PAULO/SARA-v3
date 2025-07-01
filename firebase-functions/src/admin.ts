
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

// Lista de orígenes permitidos. Solo tu app web puede hacer peticiones.
const allowedOrigins = [
    'https://9000-firebase-sara20git-1749771769228.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev'
    // Si tuvieras un dominio de producción, lo añadirías aquí:
    // 'https://sara-rent.web.app' 
];

// Creamos el manejador de CORS con la configuración de orígenes.
const corsHandler = cors({
    origin: (origin, callback) => {
        // Permite peticiones sin origen (como las de Postman) y las de tu lista.
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('El acceso desde este origen no está permitido por la política de CORS.'));
        }
    }
});

export const setAdminRole = functions.https.onRequest((req, res) => {
    // 1. Usar el manejador de CORS.
    corsHandler(req, res, async () => {
        
        // 2. Solo permitir peticiones de tipo POST.
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        // 3. Extraer el email del cuerpo de la petición.
        const { email } = req.body;
        if (typeof email !== 'string' || email.length === 0) {
            res.status(400).json({ 
                error: 'El email es requerido en el cuerpo de la solicitud.' 
            });
            return;
        }

        try {
            // 4. Lógica de negocio: encontrar usuario y asignarle rol.
            const user = await admin.auth().getUserByEmail(email);
            await admin.auth().setCustomUserClaims(user.uid, { admin: true });

            // 5. Enviar respuesta de éxito.
            res.status(200).json({ 
                message: `¡Éxito! El usuario ${email} ahora es un administrador.` 
            });

        } catch (error: any) {
            // 6. Manejar errores y enviar respuesta.
            console.error('Error detallado al asignar rol de administrador:', error);
            res.status(500).json({ 
                error: `Error del servidor: ${error.message}` 
            });
        }
    });
});
