# Configuración de Secrets y Environments

## 📋 Estructura

El proyecto usa Angular Environments para gestionar la configuración por ambiente:

```
src/environments/
├── environment.ts          ← Desarrollo (checked in git ✓)
├── environment.prod.ts     ← Producción (.gitignored ✗)
└── environment.example.ts  ← Template de ejemplo
```

---

## 🔒 Secrets Sensibles

### Variables de Desarrollo (environment.ts)
```typescript
apiBaseUrl: 'http://localhost:8181'  // Local backend
recaptchaSiteKey: '6Lcw15Es...'      // Dev reCAPTCHA
firebase: { apiKey: 'AIzaSy...' }    // Firebase dev
```

### Variables de Producción (environment.prod.ts)
**⚠️ NO INCLUIR EN GIT** - Configurar en:
- CI/CD Pipeline (GitHub Actions/GitLab CI)
- Environment Variables del servidor
- Bóveda de Secrets (AWS SecretsManager, Azure KeyVault, etc.)

---

## 🚀 Deployment - Cómo Configurar Secrets

### Opción 1: GitHub Actions (Recomendado)

Crear archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Create environment.prod.ts
        run: |
          cat > src/environments/environment.prod.ts << 'EOF'
          export const environment = {
            production: true,
            apiBaseUrl: '${{ secrets.PROD_API_BASE_URL }}',
            recaptchaSiteKey: '${{ secrets.PROD_RECAPTCHA_SITE_KEY }}',
            firebase: {
              apiKey: '${{ secrets.PROD_FIREBASE_API_KEY }}',
              authDomain: '${{ secrets.PROD_FIREBASE_AUTH_DOMAIN }}',
              projectId: '${{ secrets.PROD_FIREBASE_PROJECT_ID }}',
              storageBucket: '${{ secrets.PROD_FIREBASE_STORAGE_BUCKET }}',
              messagingSenderId: '${{ secrets.PROD_FIREBASE_MESSAGING_SENDER_ID }}',
              appId: '${{ secrets.PROD_FIREBASE_APP_ID }}',
            },
            oauth: {
              firebaseCallbackUrl: '${{ secrets.PROD_FIREBASE_CALLBACK_URL }}',
              developmentUrl: '${{ secrets.PROD_DEV_URL }}',
            },
          };
          EOF
      
      - name: Install dependencies
        run: npm install --legacy-peer-deps
      
      - name: Build
        run: npm run build -- --configuration production
      
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: 'angular-frontend-c0bb4'
```

### Opción 2: Configuración en Vercel

1. Ve a **Project Settings → Environment Variables**
2. Agrega cada secret:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - etc.

### Opción 3: Azure Static Web Apps

1. Ir a **Settings → Configuration**
2. Crear archivo `staticwebapp.config.json`:

```json
{
  "env": {
    "PROD_API_BASE_URL": "https://api.tudominio.com",
    "PROD_RECAPTCHA_SITE_KEY": "valor_secreto",
    "PROD_FIREBASE_API_KEY": "valor_secreto"
  }
}
```

---

## 🔐 Rotación de Secrets (Si fueron expuestos)

**Importante**: Si los secrets fueron expuestos en GitHub:

### Google reCAPTCHA
1. Ve a [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Regenera las claves
3. Actualiza en `environments/environment.prod.ts`

### Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Regenera la API Key
4. Actualiza en `environments/environment.prod.ts`

### OAuth Credentials
1. GitHub: Settings → Developer settings → OAuth Apps → Regenerar Secret
2. Google: Google Cloud Console → APIs & Services → Credentials → Regenerar
3. Microsoft: Azure Portal → App registrations → Certificates & secrets → Nuevo

---

## ✅ Checklist de Seguridad

- [ ] `environment.prod.ts` agregado a `.gitignore`
- [ ] `environment.example.ts` incluido como template
- [ ] `environment.ts` tiene solo valores de desarrollo (sin secrets)
- [ ] `angular.json` tiene `fileReplacements` configurados
- [ ] CI/CD pipeline puede crear `environment.prod.ts` desde secrets
- [ ] Build de producción usa `--configuration production`
- [ ] Secrets rotados después de exposición en GitHub
- [ ] Revisar GitHub Security → Secret Scanning para confirmar que no hay más alerts

---

## 📱 Build Commands

```bash
# Desarrollo (usa environment.ts)
ng serve

# Build de desarrollo
ng build

# Build de producción (usa environment.prod.ts)
ng build --configuration production

# Build con variaciones
ng build -c production
```

---

## 🔍 Verificación en GitHub

Después de hacer commit:

1. Ve a **Settings → Security → Secret scanning**
2. Verifica que no aparezcan nuevos secrets
3. Si aparecen alerts, agrega `src/environments/environment.prod.ts` a `.gitignore`
4. Haz `git rm --cached src/environments/environment.prod.ts`
5. Revierte el commit anterior si fue necesario con `git reset --hard`

---

**Nunca dejes secrets en control de versiones. La regla de oro: secretos en variables de entorno, código en Git.**
