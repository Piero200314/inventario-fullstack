import { useEffect, useRef, useState } from 'react';

// Decorative only. No network access, third-party packages or inventory state.
export default function GalaxyBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [paused, setPaused] = useState(() => {
    try { return localStorage.getItem('nexo:motion-v2') === 'paused'; }
    catch { return false; }
  });
  useEffect(() => {
    document.documentElement.dataset.nexoMotion = paused ? 'paused' : 'full';
    try { localStorage.setItem('nexo:motion-v2', paused ? 'paused' : 'full'); } catch { /* private storage */ }
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const motion = animationRef.current = { width:0, height:0, stars:[], frame:0, last:0, phase:0, prior:null };
    const lifecycle = new AbortController();
    const theme = () => document.documentElement.dataset.theme === 'light';
    const active = () => !paused && !document.hidden;
    function draw() {
      ctx.clearRect(0, 0, motion.width, motion.height);
      const light = theme();
      for (const star of motion.stars) {
        const x = ((star.x + Math.sin(motion.phase * .25 + star.p) * 15) % motion.width + motion.width) % motion.width;
        const y = ((star.y + motion.phase * star.speed) % motion.height + motion.height) % motion.height;
        const alpha = star.alpha * (.73 + .27 * Math.sin(motion.phase * .55 + star.p));
        ctx.beginPath();
        ctx.fillStyle = light ? `rgba(66,70,128,${alpha * .65})` : `rgba(${star.warm ? '255,162,181' : '210,225,255'},${alpha})`;
        ctx.arc(x, y, star.radius, 0, Math.PI * 2); ctx.fill();
        if (star.radius > 1.3) {
          ctx.strokeStyle = light ? 'rgba(90,80,145,.15)' : `rgba(221,222,255,${alpha * .27})`;
          ctx.lineWidth = .6; ctx.beginPath();
          ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
        }
      }
    }
    function resize() {
      motion.width = window.innerWidth; motion.height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(motion.width * dpr); canvas.height = Math.round(motion.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let seed = 4183;
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const count = motion.width < 760 ? 65 : 155;
      motion.stars = Array.from({length: count}, () => ({x:random()*motion.width,y:random()*motion.height,radius:.35+random()*1.2,alpha:.22+random()*.55,p:random()*Math.PI*2,speed:4+random()*7,warm:random()>.74}));
      draw();
    }
    function tick(now) {
      motion.frame = 0;
      if (lifecycle.signal.aborted || !active()) { motion.prior = null; return; }
      if (now - motion.last >= 33) {
        if (motion.prior !== null) motion.phase += Math.min((now - motion.prior) / 1000, .1);
        motion.prior = now; motion.last = now; draw();
      }
      motion.frame = requestAnimationFrame(tick);
    }
    function reconcile() {
      if (motion.frame) cancelAnimationFrame(motion.frame);
      motion.frame = 0; motion.prior = null; draw();
      if (active() && !lifecycle.signal.aborted) motion.frame = requestAnimationFrame(tick);
    }
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', reconcile);
    resize(); reconcile();
    return () => { lifecycle.abort(); cancelAnimationFrame(motion.frame); observer.disconnect(); window.removeEventListener('resize',resize); document.removeEventListener('visibilitychange',reconcile); };
  }, [paused]);

  return <>
    <div className={`nexo-galaxy ${paused ? 'is-paused' : ''}`} aria-hidden="true">
      <div className="galaxy-nebula nebula-red" />
      <div className="galaxy-nebula nebula-violet" />
      <div className="galaxy-spiral"><i/><i/><i/></div>
      <canvas ref={canvasRef} className="galaxy-stars" />
      <div className="galaxy-orbits">
        <div className="galaxy-orbit orbit-one"><div className="orbit-rotation"><i className="galaxy-planet planet-red" /></div></div>
        <div className="galaxy-orbit orbit-two"><div className="orbit-rotation"><i className="galaxy-planet planet-blue" /></div></div>
        <div className="galaxy-orbit orbit-three"><div className="orbit-rotation"><i className="galaxy-planet planet-rock" /></div></div>
      </div>
      <div className="galaxy-distant-planet"><i/></div>
      <div className="galaxy-meteor meteor-one" /><div className="galaxy-meteor meteor-two" /><div className="galaxy-vignette" />
    </div>
    <button className="galaxy-control" type="button" aria-pressed={paused} aria-label={paused ? 'Activar animación' : 'Pausar animación'} onClick={() => setPaused(v=>!v)} title="Controlar el movimiento del fondo">
      <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span><span>{paused ? 'Activar animación' : 'Pausar animación'}</span>
    </button>
  </>;
}
