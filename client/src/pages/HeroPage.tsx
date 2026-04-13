import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export default function HeroPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    let animId: number;

    function initThree() {
      const THREE = (window as any).THREE;
      if (!THREE || !canvasRef.current) return;

      const canvas = canvasRef.current!;
      const W = canvas.parentElement!.offsetWidth;
      const H = window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050a12);

      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
      camera.position.set(0, 0, 5);

      scene.add(new THREE.AmbientLight(0x0a2a15, 0.8));
      const l1 = new THREE.DirectionalLight(0x2ecc71, 3); l1.position.set(5, 5, 5); scene.add(l1);
      const l2 = new THREE.DirectionalLight(0x1a7a4a, 2); l2.position.set(-5, -3, 2); scene.add(l2);
      const l3 = new THREE.PointLight(0x2ecc71, 2, 20); l3.position.set(2, 3, 4); scene.add(l3);
      const l4 = new THREE.PointLight(0x0f6e3a, 3, 15); l4.position.set(-3, 2, -2); scene.add(l4);

      const mat = new THREE.MeshStandardMaterial({ color: 0x1a7a4a, metalness: 0.95, roughness: 0.08 });
      const group = new THREE.Group(); scene.add(group);
      group.add(new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.32, 200, 32, 2, 3), mat));

      const r1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.9, 0.04, 16, 120),
        new THREE.MeshStandardMaterial({ color: 0x2ecc71, metalness: 1, roughness: 0.1, transparent: true, opacity: 0.7 })
      );
      r1.rotation.x = Math.PI / 4; group.add(r1);

      const r2 = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.03, 16, 120),
        new THREE.MeshStandardMaterial({ color: 0x0f6e3a, metalness: 1, roughness: 0.1, transparent: true, opacity: 0.5 })
      );
      r2.rotation.x = -Math.PI / 5; r2.rotation.y = Math.PI / 3; group.add(r2);

      const pg = new THREE.BufferGeometry();
      const pp = new Float32Array(300 * 3);
      for (let i = 0; i < 300 * 3; i++) pp[i] = (Math.random() - 0.5) * 12;
      pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
      const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x2ecc71, size: 0.03, transparent: true, opacity: 0.5 }));
      scene.add(pts);

      let mx = 0, my = 0, t = 0;
      const onMove = (e: MouseEvent) => {
        const r = canvas.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = -((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      sectionRef.current?.addEventListener("mousemove", onMove);

      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.008;
        group.rotation.x += (my * 0.5 - group.rotation.x) * 0.05;
        group.rotation.y += (mx * 0.5 + t * 0.3 - group.rotation.y) * 0.05;
        r1.rotation.z += 0.005;
        r2.rotation.z -= 0.003;
        l3.position.x = Math.sin(t * 0.7) * 4;
        l3.position.y = Math.cos(t * 0.5) * 3;
        l4.position.x = Math.cos(t * 0.4) * 4;
        pts.rotation.y += 0.001;
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const w = canvas.parentElement!.offsetWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(animId);
        renderer.dispose();
        window.removeEventListener("resize", onResize);
        sectionRef.current?.removeEventListener("mousemove", onMove);
      };
    }

    if ((window as any).THREE) {
      initThree();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.onload = () => initThree();
      document.head.appendChild(script);
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#050a12" }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, #020d07 100%)", zIndex: 5, pointerEvents: "none" }} />

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, textAlign: "center", padding: "0 20px" }}>

        <h1 style={{ fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif", fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", textShadow: "0 2px 30px rgba(0,0,0,0.9)", marginBottom: "16px", lineHeight: 1.1, pointerEvents: "none" }}>
          Blog<span style={{ color: "#2ecc71" }}>Auto</span> Pro
        </h1>

        <p style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "clamp(13px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", marginBottom: "48px", lineHeight: 1.6, pointerEvents: "none" }}>
          AI 블로그 자동 배포 시스템
        </p>

        <button
          onClick={() => navigate("/home")}
          style={{ padding: "16px 48px", borderRadius: "50px", border: "2px solid #2ecc71", background: "rgba(46,204,113,0.15)", color: "#2ecc71", fontSize: "16px", fontWeight: 700, cursor: "pointer", letterSpacing: "1px", backdropFilter: "blur(10px)", transition: "all 0.25s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#2ecc71"; (e.currentTarget as HTMLElement).style.color = "#050a12"; (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(46,204,113,0.15)"; (e.currentTarget as HTMLElement).style.color = "#2ecc71"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        >
          방문하기 →
        </button>
      </div>
    </section>
  );
}
