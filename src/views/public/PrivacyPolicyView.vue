<script setup>
// ============================================================
// PrivacyPolicyView · Política de privacidad (requerida por AdSense)
// ============================================================
const updated = '20 de agosto de 2026'
</script>

<template>
  <div class="legal">
    <div class="container legal__inner">
      <h1 class="legal__title">Política de privacidad</h1>
      <p class="legal__updated">Última actualización: {{ updated }}</p>

      <section class="legal__section">
        <h2>1. Responsable</h2>
        <p>
          Auloava (en adelante, "el Sitio") es una tienda de enlaces de afiliado.
          Puedes contactarnos a través de los canales indicados al final de este
          documento.
        </p>
      </section>

      <section class="legal__section">
        <h2>2. Enlaces de afiliado</h2>
        <p>
          El Sitio participa en programas de afiliados de terceros, incluyendo
          Amazon, AliExpress y Alibaba. Como afiliado, podemos recibir una
          comisión por las compras realizadas a través de los enlaces de este
          Sitio, sin coste adicional para ti. Los enlaces de Amazon incluyen
          nuestro identificador de afiliado (<code>tag=auloava-20</code>).
        </p>
      </section>

      <section class="legal__section">
        <h2>3. Publicidad (Google AdSense)</h2>
        <p>
          Este Sitio utiliza Google AdSense para mostrar anuncios. Google y sus
          socios pueden usar cookies y tecnologías similares (como la cookie
          de DoubleClick) para personalizar los anuncios y medir su
          efectividad en función de tu actividad de navegación.
        </p>
        <p>
          Puedes gestionar tus preferencias de anuncios o desactivar la
          publicidad personalizada en cualquier momento en
          <a href="https://www.google.com/ads/preferences" target="_blank" rel="noopener">
            Configuración de anuncios de Google
          </a>
          y en
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">
            My Ad Center
          </a>.
        </p>
      </section>

      <section class="legal__section">
        <h2>4. Consentimiento (EEE, Reino Unido y Suiza)</h2>
        <p>
          Para los usuarios del Espacio Económico Europeo, el Reino Unido y
          Suiza, obtenemos tu consentimiento antes de almacenar o acceder a
          cookies mediante una plataforma de gestión de consentimiento (CMP)
          certificada por Google. Puedes aceptar, rechazar o gestionar tus
          opciones a través del mensaje de consentimiento que se muestra al
          entrar al Sitio.
        </p>
      </section>

      <section class="legal__section">
        <h2>5. Datos que recopilamos</h2>
        <p>
          No recopilamos datos personales identificables de forma directa.
          Podemos procesar datos de uso agregados y anónimos (por ejemplo,
          páginas visitadas y clics en productos) con fines analíticos y para
          mejorar el Sitio. Las cuentas de administrador se gestionan a través
          de un proveedor de autenticación (Firebase) y no se comparten con
          anunciantes.
        </p>
      </section>

      <section class="legal__section">
        <h2>6. Tus derechos</h2>
        <p>
          Bajo el Reglamento General de Protección de Datos (RGPD) y normativas
          similares, tienes derecho a acceder, rectificar, suprimir y oponerte
          al tratamiento de tus datos. Para ejercerlos, contáctanos usando la
          información de contacto del Sitio.
        </p>
      </section>

      <section class="legal__section">
        <h2>7. Contacto</h2>
        <p>
          Si tienes dudas sobre esta política, escríbenos a través de los
          canales oficiales de Auloava.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.legal {
  background: var(--off-white);
  padding: 64px 0 80px;
  min-height: 100vh;
}
.legal__inner {
  max-width: 760px;
}
.legal__title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  color: var(--green-900);
  margin-bottom: 6px;
}
.legal__updated {
  color: var(--muted);
  font-size: 0.9rem;
  margin-bottom: 32px;
}
.legal__section {
  margin-bottom: 28px;
}
.legal__section h2 {
  font-size: 1.15rem;
  color: var(--green-800);
  margin-bottom: 10px;
}
.legal__section p {
  color: var(--muted);
  line-height: 1.7;
}
.legal__section a {
  color: var(--green-600);
  text-decoration: underline;
}
.legal__section code {
  background: var(--green-50);
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 0.85em;
}
</style>
