# Kinora — Batch 4 (Fixes round)

## ⚠️ Hay un crash que SÍ tenés que arreglar primero

El error de Pricing ("Neither apiKey nor config.authenticator provided") es porque Stripe se inicializaba al cargar el módulo aunque no hubieras configurado las env vars. Lo arreglé — ahora carga lazy (solo cuando realmente se llama al checkout).

## 🔧 Instalación

### 1. Descomprimir sobre `E:\kinora\`
Sobreescribí todo. Son 11 archivos.

### 2. Correr el seed SQL (opcional pero recomendado)
Pegá `SEED_test_data.sql` en el SQL editor de Supabase. Esto crea ~5 casting calls, ~5 eventos y 3 entrevistas publicadas — todos atribuidos al primer usuario en tu DB (vos).

Si querés borrar los datos de prueba después:
```sql
DELETE FROM casting_calls WHERE project_title LIKE '[TEST]%';
DELETE FROM events WHERE title LIKE '[TEST]%';
DELETE FROM interviews WHERE title LIKE '[TEST]%';
```

### 3. Reiniciar el dev server

---

## ✅ Lo que arreglé

| # | Cosa | Estado |
|---|------|--------|
| 1 | Back link no aparecía | ✅ Agregado en el editor de perfil; ya estaba en otras páginas |
| 2 | "My Calls" se caía | ✅ Ahora dice "My Casting" / "Mis Castings" + `whitespace-nowrap` |
| 3 | "nav.stories" raw | ✅ `messages/en.json` y `es.json` actualizados con TODAS las claves |
| 4 | State buscable | ✅ `StateSelector` con dropdown y filtro por nombre |
| 5 | Clic en fotito → perfil | ✅ Ahora va al editor (`/dashboard/profile`); además `/m/[slug]` ahora permite preview al dueño aunque sea hidden |
| 6 | Pricing crash sin Stripe | ✅ Lazy init — no rompe si no hay keys |
| 7 | Login feo | ✅ Editorial card centered, igual estilo que signup |
| 8 | Seed SQL de prueba | ✅ `SEED_test_data.sql` |
| 9 | Quitar "in Miami" | ✅ |
| 10 | Sacar "Spanish and English" / posicionamiento | ✅ Nueva subline: *"A home for the people, projects, and conversations behind independent creative work."* |
| 11 | Forgot password + español | ✅ `/forgot-password` y `/reset-password`, ambos traducidos |
| 12 | Logo logueado → home | ✅ El logo siempre va a `/` |

---

## 🆕 Flow nuevo: Forgot password

1. Usuario clickea "¿Olvidaste tu contraseña?" en `/login`
2. Va a `/forgot-password`, mete el email
3. Supabase manda email con un magic link
4. El link lleva a `/reset-password`
5. Usuario define la nueva contraseña → vuelve a login

### ⚠️ Importante: configurá la URL de redirect en Supabase
1. Andá a Supabase Dashboard → Authentication → URL Configuration
2. Agregá `http://localhost:3000/reset-password` a "Redirect URLs"
3. Cuando deployes a producción, agregá también `https://tudominio.com/reset-password`

Si no hacés esto, el link del email no va a funcionar (Supabase bloquea redirects a URLs no autorizadas).

---

## 📝 Notas

### Sobre el avatar/foto del menú
Antes apuntaba a `/m/[slug]` (perfil público), que fallaba si tu perfil estaba hidden o si el slug tenía problemas. Ahora va al **editor** (`/dashboard/profile`), que siempre funciona. Adentro del editor agregué un link "View public profile →" que te lleva a tu vista pública.

Y como bonus, hice que `/m/[tu-slug]` ahora funcione para vos aunque tu perfil esté hidden — ves un banner amarillo de "Preview — your profile is hidden" arriba.

### Sobre el seed data
Todos los castings/eventos/historias quedan atribuidos al primer usuario en la DB (vos). Es la única forma que tiene sentido sin tener que crear usuarios fake en `auth.users` (que es un quilombo desde SQL). Para visualizar la UI funciona perfecto. Si más adelante querés que parezca que hay varios miembros, te ayudo a hacer los inserts de auth.users manualmente.

### Cosas no tocadas
- Mobile (sigue sin actualizar — próxima batch si querés)
- Traducción del CONTENIDO de las páginas (solo el menú y auth pages están en ES). Es un lift grande, lo dejo para próximo round.
- Upload de imágenes para eventos/stories (sigue siendo URL pegada por ahora)
