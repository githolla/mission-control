import { useEffect, useRef } from 'react'

/**
 * Live procedural planet rendered in raw WebGL (no libraries).
 * Sphere-in-fragment-shader: fbm terrain, ocean specular, drifting clouds,
 * atmospheric rim scattering, soft terminator and night-side city lights.
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
uniform vec2 u_center;    // sphere center in 0..1 of res

// --- hash / noise ---------------------------------------------------------
float hash(vec3 p){ p = fract(p*0.3183099 + vec3(0.1,0.2,0.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<6;i++){ v += a*noise(p); p = p*2.02 + 0.31; a *= 0.5; }
  return v;
}
mat3 rotY(float t){ float c=cos(t), s=sin(t); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float t){ float c=cos(t), s=sin(t); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }

void main(){
  float m = min(u_res.x, u_res.y);
  vec2 uv = (gl_FragCoord.xy - u_center*u_res) / (m*u_radius);
  float r2 = dot(uv,uv);
  vec3 L = normalize(u_light);
  vec3 V = vec3(0.,0.,1.);

  // Atmosphere glow outside the limb
  if (r2 > 1.0) {
    float d = sqrt(r2) - 1.0;
    float glow = exp(-d*9.0) * 0.55;
    // brighter on the lit side
    vec3 n = normalize(vec3(uv, 0.0));
    float lit = clamp(dot(n, L)*0.5+0.5, 0.0, 1.0);
    vec3 col = vec3(0.30,0.55,1.0) * glow * (0.35 + 0.65*lit);
    gl_FragColor = vec4(col, glow*(0.35+0.65*lit));
    return;
  }

  float z = sqrt(1.0 - r2);
  vec3 n = vec3(uv, z);                 // surface normal (view space)
  mat3 R = rotX(0.38) * rotY(u_time*0.045);
  vec3 p = R * n;                       // texture-space point

  // Terrain
  float h = fbm(p*2.6);
  float lat = abs(p.y);
  float land = smoothstep(0.50, 0.53, h);
  float ice = smoothstep(0.78, 0.9, lat + 0.06*fbm(p*8.0));
  vec3 ocean = mix(vec3(0.03,0.13,0.34), vec3(0.09,0.34,0.70), smoothstep(0.33,0.5,h));
  vec3 landCol = mix(vec3(0.12,0.20,0.10), vec3(0.36,0.32,0.20), smoothstep(0.53,0.68,h));
  landCol = mix(landCol, vec3(0.55,0.50,0.38), smoothstep(0.70,0.85,h));
  vec3 base = mix(ocean, landCol, land);
  base = mix(base, vec3(0.85,0.9,0.95), ice);

  // Clouds (drift slightly faster)
  vec3 pc = rotX(0.38) * rotY(u_time*0.06) * n;
  float cl = fbm(pc*3.4 + vec3(0.0, u_time*0.01, 0.0));
  float clouds = smoothstep(0.55, 0.72, cl);

  // Lighting
  float ndl = dot(n, L);
  float diff = clamp(ndl, 0.0, 1.0);
  float terminator = smoothstep(-0.12, 0.25, ndl);
  vec3 H = normalize(L + V);
  float spec = pow(clamp(dot(n,H),0.0,1.0), 60.0) * (1.0-land) * (1.0-clouds) * 0.9;

  vec3 col = base * (0.09 + 0.91*diff);
  col += vec3(0.9,0.95,1.0) * spec * terminator;
  col = mix(col, vec3(0.95,0.97,1.0) * (0.10 + 0.9*diff), clouds*0.85);

  // Night-side city lights on land
  float night = 1.0 - smoothstep(-0.05, 0.12, ndl);
  float cityNoise = noise(p*90.0) * noise(p*35.0);
  float city = smoothstep(0.42, 0.7, cityNoise) * land * (1.0-clouds*0.7) * (1.0-ice);
  col += vec3(1.0,0.78,0.45) * city * night * 0.9;

  // Atmospheric rim scattering (blue, stronger toward the limb, lit side)
  float rim = pow(1.0 - max(dot(n,V),0.0), 2.2);
  col += vec3(0.35,0.6,1.0) * rim * (0.25 + 0.75*clamp(ndl*0.5+0.5,0.0,1.0)) * 0.9;

  // Subtle vignette toward the limb edge for depth
  col *= 1.0 - 0.15*rim;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function Planet({
  className = '',
  light = [-0.55, 0.35, 0.75] as [number, number, number],
  radius = 0.47,
  center = [0.5, 0.5] as [number, number],
  speed = 1,
}: {
  className?: string
  light?: [number, number, number]
  radius?: number
  center?: [number, number]
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

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let raf = 0
    const start = performance.now()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
    }

    const frame = () => {
      resize()
      const t = ((performance.now() - start) / 1000) * speed
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, t)
      gl.uniform3f(uLight, light[0], light[1], light[2])
      gl.uniform1f(uRadius, radius)
      gl.uniform2f(uCenter, center[0], center[1])
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [light, radius, center, speed])

  return <canvas ref={ref} className={className} aria-hidden />
}
