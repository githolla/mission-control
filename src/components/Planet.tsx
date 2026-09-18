import { useEffect, useRef } from 'react'

/**
 * Live procedural planet rendered in raw WebGL (no libraries).
 * Sphere-in-fragment-shader: domain-warped continents with ridged mountains,
 * bump-mapped relief, shallow-water coastlines, climate-banded land colour,
 * two-layer clouds that cast shadows, a tight sun glint, a warm twilight band
 * on the terminator, night-side city lights and a scattering atmosphere.
 */
const VERT = `
attribute vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_light;
uniform float u_radius;   // sphere radius as fraction of min(res)
uniform vec2 u_center;    // sphere center in 0..1 of res (may lie outside the canvas)
uniform float u_tilt;     // axial tilt toward the viewer, radians

// --- hash / noise ---------------------------------------------------------
float hash(vec3 p){
  p = fract(p*vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y)*p.z);
}
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x);
  f = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm7(vec3 p){ float v=0., a=0.5; for(int i=0;i<7;i++){ v+=a*noise(p); p=p*2.03+0.17; a*=0.5; } return v; }
float fbm5(vec3 p){ float v=0., a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+0.17; a*=0.5; } return v; }
float fbm4(vec3 p){ float v=0., a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+0.17; a*=0.5; } return v; }
float ridge(vec3 p){
  float v=0., a=0.5;
  for(int i=0;i<4;i++){ float n = 1.0-abs(2.0*noise(p)-1.0); v += a*n*n; p = p*2.1+0.3; a *= 0.5; }
  return v;
}
mat3 rotY(float t){ float c=cos(t), s=sin(t); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float t){ float c=cos(t), s=sin(t); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }

// continents: domain-warped fbm, 0..1
float continents(vec3 p){
  vec3 q = p*1.55;
  vec3 w = vec3(fbm4(q+vec3(1.7,9.2,3.1)), fbm4(q+vec3(8.3,2.8,5.2)), fbm4(q+vec3(4.1,6.6,0.7)));
  return fbm7(q + 1.6*(w-0.5));
}
// mountain relief, used for bump mapping
float relief(vec3 p){ return ridge(p*6.0); }

// cloud cover at texture-space p, 0..1
float cloudAt(vec3 p, float t){
  float c1 = fbm5(p*2.6 + vec3(t*0.012, 0.0, 0.0));
  float c2 = fbm4(p*7.5 + vec3(0.0, t*0.02, 0.0));
  float c = c1*0.72 + c2*0.28 + 0.06*sin(p.y*9.0);   // banded like real weather systems
  return smoothstep(0.50, 0.64, c);
}

void main(){
  float m = min(u_res.x, u_res.y);
  vec2 uv = (gl_FragCoord.xy - u_center*u_res) / (m*u_radius);
  float px = 1.0 / (m*u_radius);          // one pixel in sphere units
  float r = length(uv);
  vec3 L = normalize(u_light);
  vec3 V = vec3(0.,0.,1.);

  // --- atmosphere outside the limb (always computed, blended at the edge) ---
  float d = max(r - 1.0, 0.0);
  vec3 n0 = normalize(vec3(uv, 0.0));
  float litRim = clamp(dot(n0, L)*0.5+0.5, 0.0, 1.0);
  float glow = exp(-d*7.0)*0.42 + exp(-d*70.0)*0.55;
  float twiRim = exp(-pow((dot(n0,L)+0.03)/0.14, 2.0));
  vec3 atmCol = mix(vec3(0.32,0.60,1.0), vec3(1.0,0.55,0.30), twiRim*0.35);
  float atmA = glow*(0.18 + 0.82*litRim);
  vec3 atm = atmCol * atmA;

  if (r > 1.0 + 2.0*px) { gl_FragColor = vec4(atm, atmA); return; }

  // --- surface -------------------------------------------------------------
  float rr = min(r, 1.0);
  vec2 uvs = uv * (rr / max(r, 1e-5));
  float z = sqrt(max(1.0 - dot(uvs,uvs), 0.0));
  vec3 n = vec3(uvs, z);                       // geometric normal (view space)
  float spin = u_time*0.035;
  mat3 R = rotX(u_tilt) * rotY(spin);
  mat3 Ri = rotY(-spin) * rotX(-u_tilt);
  vec3 p = R * n;                              // texture-space point

  float c = continents(p);
  float land = smoothstep(0.470, 0.482, c);
  float lat = abs(p.y);

  // relief + bump-mapped normal
  vec3 t1 = normalize(cross(p, vec3(0.0, 1.0, 0.0)) + 1e-4);
  vec3 t2 = cross(p, t1);
  float e = 0.006;
  float h0 = relief(p), h1 = relief(p + t1*e), h2 = relief(p + t2*e);
  vec3 grad = (t1*(h1-h0) + t2*(h2-h0)) / e;
  float elev = h0 * smoothstep(0.48, 0.60, c) * (1.0 - 0.6*smoothstep(0.6, 0.85, lat));   // mountains rise inland, flatten toward the poles
  vec3 np = normalize(p - grad * 0.038 * land * smoothstep(0.48, 0.56, c) * (1.0 - smoothstep(0.65, 0.85, lat)));
  vec3 nb = normalize(Ri * np);                                  // bumped normal, view space

  // ocean: deep -> shelf -> turquoise coast
  vec3 deep = vec3(0.010, 0.055, 0.19);
  vec3 shelf = vec3(0.03, 0.22, 0.42);
  vec3 ocean = mix(deep, shelf, smoothstep(0.42, 0.47, c));
  ocean = mix(ocean, vec3(0.10, 0.42, 0.52), smoothstep(0.463, 0.470, c));

  // land: climate bands by latitude + moisture, then elevation
  float moist = fbm4(p*4.0 + 7.0);
  vec3 forest = vec3(0.07, 0.15, 0.05);
  vec3 grass = vec3(0.23, 0.28, 0.11);
  vec3 desert = vec3(0.58, 0.47, 0.29);
  vec3 tundra = vec3(0.46, 0.44, 0.36);
  vec3 rock = vec3(0.38, 0.34, 0.29);
  float dry = smoothstep(0.55, 0.30, moist) * smoothstep(0.62, 0.30, abs(lat-0.36)) ;
  vec3 lowland = mix(mix(forest, grass, smoothstep(0.35, 0.65, moist+0.2*lat)), desert, dry);
  lowland = mix(lowland, tundra, smoothstep(0.62, 0.80, lat));
  vec3 landCol = mix(lowland, rock, smoothstep(0.25, 0.55, elev));
  float snowLine = 0.64 - 0.35*lat;
  float snow = smoothstep(snowLine, snowLine+0.12, elev);
  landCol = mix(landCol, vec3(0.90, 0.92, 0.95), snow);
  vec3 beach = vec3(0.60, 0.55, 0.42);
  landCol = mix(beach, landCol, smoothstep(0.482, 0.498, c));

  vec3 base = mix(ocean, landCol, land);
  float ice = smoothstep(0.74, 0.84, lat + 0.04*(moist-0.5));
  base = mix(base, vec3(0.86, 0.91, 0.96), ice);

  // clouds + their shadow on the surface
  vec3 pc = rotX(u_tilt) * rotY(u_time*0.048) * n;
  float clouds = cloudAt(pc, u_time);
  vec3 Ltex = rotX(u_tilt) * rotY(u_time*0.048) * L;
  float shadow = cloudAt(pc + Ltex*0.03, u_time) * (1.0 - smoothstep(0.65, 0.85, lat));

  // lighting
  float ndl = dot(n, L);
  float diff = clamp(dot(nb, L), 0.0, 1.0);
  float diffG = clamp(ndl, 0.0, 1.0);
  float terminator = smoothstep(-0.10, 0.20, ndl);
  vec3 sun = vec3(1.0, 0.96, 0.90);

  vec3 col = base * sun * (0.035 + 0.965*diff) * (1.0 - 0.45*shadow*diffG);

  // ocean glint: tight core + broad fresnel sheen
  vec3 H = normalize(L + V);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  float glint = pow(clamp(dot(n,H),0.0,1.0), 260.0)*1.6 + pow(clamp(dot(n,H),0.0,1.0), 24.0)*0.10;
  col += sun * glint * (1.0-land) * (1.0-ice) * (1.0-clouds) * terminator;
  col += vec3(0.5,0.7,1.0) * fres * 0.08 * (1.0-land) * diffG;

  // clouds: sun-lit tops, soft self-shadow
  float cloudLight = 0.06 + 0.94*diffG;
  vec3 cloudCol = vec3(0.97, 0.98, 1.0) * cloudLight;
  col = mix(col, cloudCol, clouds*0.92);

  // night-side city lights, clustered along coasts and lowlands
  float night = 1.0 - smoothstep(-0.04, 0.10, ndl);
  float cityNoise = noise(p*140.0) * noise(p*48.0) * (0.6 + 0.4*noise(p*18.0));
  float coastal = smoothstep(0.482, 0.50, c) * smoothstep(0.60, 0.50, c) * 0.7 + 0.3;
  float city = smoothstep(0.30, 0.62, cityNoise) * land * coastal * (1.0-clouds*0.8) * (1.0-ice) * (1.0-snow);
  col += vec3(1.0, 0.80, 0.50) * city * night * 1.1;

  // twilight band along the terminator
  float twi = exp(-pow((ndl - 0.02)/0.07, 2.0));
  col += vec3(1.0, 0.45, 0.18) * twi * 0.045 * (1.0-clouds*0.5);

  // atmospheric scattering toward the limb (blue, warm at the terminator)
  float rim = pow(1.0 - max(dot(n,V),0.0), 2.6);
  vec3 rimCol = mix(vec3(0.35, 0.62, 1.0), vec3(1.0, 0.5, 0.25), twi*0.3);
  col += rimCol * rim * (0.20 + 0.80*clamp(ndl*0.5+0.5,0.0,1.0)) * 0.95;
  col += vec3(0.30, 0.55, 1.0) * pow(rim, 0.6) * 0.06 * diffG;   // haze over the lit disc

  // filmic curve + gamma-ish lift for punchier contrast
  col = 1.0 - exp(-col*1.75);
  col = pow(col, vec3(0.94));

  // anti-aliased limb, blended into the atmosphere
  float edge = 1.0 - smoothstep(1.0 - 1.5*px, 1.0 + 1.0*px, r);
  vec3 outCol = mix(atm, col, edge);
  float outA = mix(atmA, 1.0, edge);
  gl_FragColor = vec4(outCol, outA);
}
`

export default function Planet({
  className = '',
  light = [-0.55, 0.35, 0.75] as [number, number, number],
  radius = 0.47,
  center = [0.5, 0.5] as [number, number],
  tilt = 0.36,
  speed = 1,
}: {
  className?: string
  light?: [number, number, number]
  radius?: number
  center?: [number, number]
  tilt?: number
  speed?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aLoc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(aLoc)
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uLight = gl.getUniformLocation(prog, 'u_light')
    const uRadius = gl.getUniformLocation(prog, 'u_radius')
    const uCenter = gl.getUniformLocation(prog, 'u_center')
    const uTilt = gl.getUniformLocation(prog, 'u_tilt')

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.SCISSOR_TEST)

    let raf = 0
    const start = performance.now()
    // Render at full device resolution for crisp coastlines; very large canvases
    // (the hero backdrop) drop to 1.5x to keep the shader comfortable on iGPUs.
    const dpr = Math.min(window.devicePixelRatio || 1, canvas.clientWidth > 2000 ? 1 : canvas.clientWidth > 1000 ? 1.5 : 2)

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
    }

    // Only shade the part of the canvas that can actually be seen: the canvas is
    // often much larger than the viewport or its overflow-hidden parent.
    const clip = () => {
      const rc = canvas.getBoundingClientRect()
      const rp = canvas.parentElement?.getBoundingClientRect()
      let x0 = Math.max(0, -rc.left, rp ? rp.left - rc.left : 0)
      let x1 = Math.min(rc.width, window.innerWidth - rc.left, rp ? rp.right - rc.left : rc.width)
      let y0 = Math.max(0, -rc.top, rp ? rp.top - rc.top : 0)
      let y1 = Math.min(rc.height, window.innerHeight - rc.top, rp ? rp.bottom - rc.top : rc.height)
      if (x1 <= x0 || y1 <= y0) return false
      const sx = canvas.width / Math.max(rc.width, 1)
      const sy = canvas.height / Math.max(rc.height, 1)
      // GL origin is bottom-left
      gl.scissor(Math.floor(x0 * sx), Math.floor((rc.height - y1) * sy), Math.ceil((x1 - x0) * sx), Math.ceil((y1 - y0) * sy))
      return true
    }

    const frame = () => {
      resize()
      if (clip()) {
        const t = ((performance.now() - start) / 1000) * speed
        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.uniform1f(uTime, t)
        gl.uniform3f(uLight, light[0], light[1], light[2])
        gl.uniform1f(uRadius, radius)
        gl.uniform2f(uCenter, center[0], center[1])
        gl.uniform1f(uTilt, tilt)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [light, radius, center, tilt, speed])

  return <canvas ref={ref} className={className} aria-hidden />
}
