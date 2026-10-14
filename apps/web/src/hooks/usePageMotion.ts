import { useEffect, useState } from 'react';
export function usePageMotion() {
  const [activeSection, setActiveSection] = useState('inicio');
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) return;
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            reveal.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    if (!reduced.matches)
      nodes.forEach((node) => {
        if (node.getBoundingClientRect().top > window.innerHeight)
          node.classList.add('reveal-pending');
        reveal.observe(node);
      });
    const showAll = () => {
      if (reduced.matches) nodes.forEach((node) => node.classList.add('is-revealed'));
    };
    reduced.addEventListener('change', showAll);
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    document
      .querySelectorAll<HTMLElement>('[data-nav-section]')
      .forEach((node) => sectionObserver.observe(node));
    return () => {
      reveal.disconnect();
      sectionObserver.disconnect();
      reduced.removeEventListener('change', showAll);
      nodes.forEach((node) => node.classList.remove('reveal-pending', 'is-revealed'));
    };
  }, []);
  return activeSection;
}
