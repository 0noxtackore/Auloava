<script setup>
// ============================================================
// TheFooter · Pie de página global (logo, redes y navegación)
// ============================================================
const base = import.meta.env.BASE_URL
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <RouterLink class="topbar__brand" :to="{ name: 'landing' }">
          <img class="topbar__logo-img" :src="`${base}images/logo-white.png`" alt="Auloava" />
        </RouterLink>
        <p>
          Enlaces de afiliado: al comprar a través de Auloava podemos recibir
          una comisión sin coste extra para ti.
        </p>
        <div class="footer__social">
          <a href="https://es.quora.com/profile/Auloava" target="_blank" rel="noopener" aria-label="Quora"><img :src="`${base}images/social/quora.svg`" alt="Quora" /></a>
          <a href="#" aria-label="Facebook"><img :src="`${base}images/social/facebook.svg`" alt="Facebook" /></a>
          <a href="https://pin.it/mqicV1j3f" target="_blank" rel="noopener" aria-label="Pinterest"><img :src="`${base}images/social/pinterest.svg`" alt="Pinterest" /></a>
          <a href="https://www.tiktok.com/@auloava" target="_blank" rel="noopener" aria-label="TikTok"><img :src="`${base}images/social/tiktok.svg`" alt="TikTok" /></a>
        </div>
      </div>

      <div class="footer__col">
        <h4>Marketplaces</h4>
        <ul>
          <li><RouterLink :to="{ name: 'landing', hash: '#marketplaces' }">AliExpress</RouterLink></li>
          <li><RouterLink :to="{ name: 'landing', hash: '#marketplaces' }">Amazon</RouterLink></li>
          <li><RouterLink :to="{ name: 'landing', hash: '#marketplaces' }">Alibaba</RouterLink></li>
        </ul>
      </div>

      <div class="footer__col">
        <h4>Navegación</h4>
        <ul>
          <li><RouterLink :to="{ name: 'catalog' }">Catálogo</RouterLink></li>
          <li><RouterLink :to="{ name: 'landing', hash: '#how' }">Cómo funciona</RouterLink></li>
          <li><RouterLink :to="{ name: 'landing' }">Inicio</RouterLink></li>
        </ul>
      </div>

      <div class="footer__col">
        <h4>Más</h4>
        <ul>
          <li><RouterLink :to="{ name: 'landing', hash: '#about' }">Quiénes somos</RouterLink></li>
          <li><RouterLink :to="{ name: 'landing', hash: '#how' }">Cómo funciona</RouterLink></li>
          <li><RouterLink :to="{ name: 'landing', hash: '#press' }">Prensa</RouterLink></li>
          <li><RouterLink :to="{ name: 'privacy' }">Política de privacidad</RouterLink></li>
        </ul>
      </div>
    </div>

    <div class="container footer__bottom">
      <span>© {{ new Date().getFullYear() }} Auloava. Todos los derechos reservados.</span>
      <span>Hecho con 💚 para compradores inteligentes</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--green-900);
  color: var(--green-200);
  padding: 64px 0 28px;
}

.footer__inner {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.footer__brand .topbar__logo-img {
  height: 40px;
}

.footer__brand p {
  margin-top: 14px;
  font-size: 0.88rem;
  line-height: 1.65;
  max-width: 300px;
  color: var(--green-300);
}

.footer__social {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.footer__social a {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  transition: background var(--transition);
}
.footer__social a:hover {
  background: var(--green-600);
}
.footer__social img {
  width: 18px;
  height: 18px;
  display: block;
}

.footer__col h4 {
  font-size: 0.92rem;
  color: var(--white);
  margin-bottom: 16px;
}

.footer__col ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer__col a {
  font-size: 0.88rem;
  color: var(--green-300);
  transition: color var(--transition);
}

.footer__col a:hover {
  color: var(--white);
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.82rem;
  color: var(--green-300);
  flex-wrap: wrap;
}

@media (max-width: 820px) {
  .footer__inner {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
