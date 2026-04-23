/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — SHARED FOOTER COMPONENT
   Standardized links, social signals, and legal
   ══════════════════════════════════════════════ */

(function() {
  const Footer = {
    getRootPath: function() {
      const path = window.location.pathname;
      if (path.includes('/resources/') || path.includes('/opportunities/') || path.includes('/archives/') || path.includes('/devhub/')) {
        return '../';
      }
      return '';
    },

    init: function() {
      const placeholder = document.getElementById('footer-placeholder');
      if (!placeholder) return;

      const root = this.getRootPath();
      placeholder.innerHTML = `
<footer>
  <div class="footer-grid">
    <!-- Col 1 -->
    <div class="foot-brand">
      <span class="foot-logo">Syntax Syndicate</span>
      <p class="foot-bio">A student engineering collective from Mumbai, India. We build real software, teach what we know, and ship things that matter.</p>
      <div class="foot-socials">
        <a href="https://github.com/syntax-syndicate" class="foot-social" title="GitHub"><svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></a>
        <a href="#" class="foot-social" title="LinkedIn"><svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
        <a href="#" class="foot-social" title="WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.3 8.38 8.38 0 0 1 3.8.9L21 3.5Z"/></svg></a>
      </div>
    </div>
    <!-- Col 2 -->
    <div>
      <span class="foot-col-title">Platform</span>
      <div class="foot-links">
        <a href="${root}index.html#resources">Resources</a>
        <a href="${root}archives/free-library.html">Archives</a>
        <a href="${root}opportunities/browse.html">Opportunities</a>
        <a href="${root}guide.html">Guide Tool</a>
        <a href="${root}devhub/feed.html">Developer's Hub</a>
      </div>
    </div>
    <!-- Col 3 -->
    <div>
      <span class="foot-col-title">Community</span>
      <div class="foot-links">
        <a href="https://whatsapp.com/channel/0029Val68sC23n3Z7mJ3f33E">WhatsApp Channel</a>
        <a href="https://github.com/syntax-syndicate">GitHub Org</a>
        <a href="${root}register.html">Become a Member</a>
      </div>
    </div>
    <!-- Col 4 -->
    <div>
      <span class="foot-col-title">Legal</span>
      <div class="foot-links">
        <a href="${root}index.html#contact">Contact</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
        <a href="#">Code of Conduct</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Syntax Syndicate. Our code, our mission.</span>
    <span>
      <a href="${root}admin.html">Admin Access</a>
      <a href="${root}login-company.html">Partner Portal</a>
    </span>
  </div>
</footer>
      `;
    }
  };

  window.Footer = Footer;
  document.addEventListener('DOMContentLoaded', () => Footer.init());
})();
