# Frontend - Nuevo Diseño Spirala

## Enfoque

El frontend se copia de BeWonderMeFE como base y se aplica el nuevo diseño encima. No es un rewrite - es un reskin + feature flags para ocultar lo que no se usa.

## Diseño (desde spirala.pen)

### Paleta de colores
- **Primario/Dorado**: ~#B8963E (botones, acentos, headers con gradient)
- **Fondo**: Blanco (#FFFFFF) y crema suave
- **Texto**: Negro/gris oscuro
- **Headers con gradient**: Degradado dorado → transparente sobre fotos de naturaleza
- **Footer**: Fondo crema claro, logo "spirala" en minúscula

### Tipografía
- Títulos: Serif elegante (tipo Playfair Display o similar)
- Cuerpo: Sans-serif limpia
- Peso: Títulos bold, cuerpo regular

### Páginas a implementar

#### 1. Landing Page (`/`)
- Hero: foto de naturaleza con overlay dorado + texto principal
- Sección "Czym jest Spirala" (Qué es Spirala)
- Sección "Skupiaj" (Enfócate)
- Sección "Powody na sesje" (Razones para sesiones)
- Sección testimonios con fotos
- CTA "Zarezerwuj sesję" (Reserva tu sesión)
- Newsletter signup
- Footer con logo, redes sociales, links

#### 2. O Mnie - Sobre Mí (`/o-mnie`)
- Hero: "Poznaj moją historię"
- Foto de la coach + bio
- "Czym się zajmuję" - qué hace
- "Jak patrzę na człowieka" - filosofía
- Credenciales y certificaciones
- CTA de reserva

#### 3. Jak Pracuję - Cómo Trabajo (`/jak-pracuje`)
- Hero con foto de naturaleza
- Secciones con fotos: sesiones individuales, proceso
- "Czego możesz się spodziewać" - qué esperar
- FAQ o proceso paso a paso
- CTA de reserva

#### 4. Usługi - Servicios (`/uslugi`)
- Hero: bosque con luz
- "Razem możemy więcej" - descripción general
- Cards: "Sesja 1 na 1" y "Pakiet 8 Sesji" con precios
- Calendario de reserva inline
- Sección "Gotowa na pierwszy krok" (¿Lista para el primer paso?)

#### 5. Blog (`/blog`)
- Hero: foto de cuaderno con título "Refleksje, narzędzia, inspiracje"
- Artículo destacado
- Grid de artículos
- Newsletter signup al final
- Footer

#### 6. Kontakt (`/kontakt`)
- Sección oferta: "Chcesz taką stronę dla siebie?" (2000 PLN)
- Proceso de creación de web
- Formulario de contacto: nombre, email, teléfono, mensaje
- Info de contacto: redes sociales

#### 7. Potwierdzenie Zakupu (`/payment-success`)
- "Dziękujemy za zakup pakietu!"
- Resumen de compra (servicio, cantidad, precio)
- "Co dalej?" - próximos pasos
- 3 cards: primera sesión, reservar, dudas
- CTA motivacional

#### 8-9. Rezerwacja - Booking flow (`/rezerwacja`)
- Paso 1: Calendario mensual con días disponibles/no disponibles
- Paso 2: Selección de hora (mañana/tarde), confirmar

### Navegación

```
Logo (spirala)  |  O Mnie  |  Jak Pracuję  |  Usługi  |  Blog  |  [Zarezerwuj sesję] (botón dorado)
```

### Mobile (375px)
- Hamburger menu
- Mismas secciones en layout vertical
- Cards apiladas
- Imágenes full-width

## Componentes UI a crear/adaptar

### Nuevos (específicos de Spirala)
- `SectionHero` - header con foto + overlay dorado + texto
- `ServiceCard` - card de servicio con precio y CTA
- `BookingCalendar` - calendario mensual
- `TimeSlotPicker` - selector de horarios
- `TestimonialCard` - testimonios
- `BlogCard` - card de artículo
- `NewsletterSignup` - formulario de newsletter
- `ContactForm` - formulario de contacto
- `PurchaseConfirmation` - resumen post-compra

### Reutilizados de BeWonderMe (con reskin)
- `Button` (shadcn - cambiar colores)
- `Input` / `Form` components
- `Dialog` / `Sheet`
- `Toast` (sonner)
- `Carousel` (embla)
- Todo el sistema de formularios (React Hook Form + Zod)

## Estructura de archivos propuesta

```
src/
├── components/
│   ├── ui/              # shadcn/ui (copiados de BeWonderMe, recolored)
│   ├── layout/          # Navbar, Footer, SectionHero
│   ├── booking/         # BookingCalendar, TimeSlotPicker
│   ├── blog/            # BlogCard, BlogGrid
│   ├── services/        # ServiceCard
│   └── shared/          # NewsletterSignup, ContactForm, TestimonialCard
├── pages/
│   ├── Landing.tsx
│   ├── AboutMe.tsx
│   ├── HowIWork.tsx
│   ├── Services.tsx
│   ├── Blog.tsx
│   ├── BlogPost.tsx
│   ├── Contact.tsx
│   ├── Booking.tsx
│   ├── PaymentSuccess.tsx
│   ├── Login.tsx         # Mantener (adaptado)
│   ├── Register.tsx      # Mantener (adaptado)
│   ├── admin/            # Mantener (simplificado con feature flags)
│   ├── coach/            # Mantener (oculto con feature flags)
│   └── ...               # Resto se mantiene oculto
├── hooks/
├── stores/
├── clients/
├── config/
│   └── features.ts       # Feature flags config
├── locales/
│   ├── pl/               # Polaco (principal)
│   └── en/               # Inglés (secundario)
├── styles/
│   └── spirala-theme.css # Variables CSS del tema Spirala
└── ...
```

## Tailwind Theme

```javascript
// tailwind.config.js - tema Spirala
{
  theme: {
    extend: {
      colors: {
        spirala: {
          gold: '#B8963E',
          'gold-light': '#D4B96A',
          'gold-dark': '#8A6F2E',
          cream: '#F9F6F0',
          'cream-dark': '#EDE8DC',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
```
