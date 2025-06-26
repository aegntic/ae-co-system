import React, { useEffect, useRef } from 'react';

interface NeuralBackgroundProps {
  scrollProgress?: number;
  mousePosition?: { x: number; y: number };
}

export const NeuralBackground: React.FC<NeuralBackgroundProps> = ({ 
  scrollProgress = 0, 
  mousePosition = { x: 0, y: 0 } 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformsRef = useRef<any>(null);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    tX: 0,
    tY: 0,
  });
  const animationIdRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const devicePixelRatio = Math.min(window.devicePixelRatio, 2);

    // Vertex shader source
    const vsSource = `
      precision mediump float;
      
      varying vec2 vUv;
      attribute vec2 a_position;
      
      void main() {
        vUv = .5 * (a_position + 1.);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader source
    const fsSource = `
      precision mediump float;
      
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      uniform float u_scroll_progress;
      
      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }
      
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.);
        vec2 res = vec2(0.);
        float scale = 8.;
        
        for (int j = 0; j < 15; j++) {
          uv = rotate(uv, 1.);
          sine_acc = rotate(sine_acc, 1.);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (.5 + .5 * cos(layer)) / scale;
          scale *= (1.2);
        }
        return res.x + res.y;
      }
      
      void main() {
        vec2 uv = .5 * vUv;
        uv.x *= u_ratio;
        
        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0., 1.);
        p = .5 * pow(1. - p, 2.);
        
        float t = .001 * u_time;
        vec3 color = vec3(0.);
        
        float noise = neuro_shape(uv, t, p);
        
        noise = 1.2 * pow(noise, 3.);
        noise += pow(noise, 10.);
        noise = max(.0, noise - .5);
        noise *= (1. - length(vUv - .5));
        
        // Golden/amber color palette to match 4site.pro branding
        color = vec3(1.0, 0.8, 0.2); // Base golden color
        color += vec3(0.8, 0.6, 0.0) * sin(3.0 * u_scroll_progress + 1.5); // Amber variation
        
        // Reduce intensity for subtle background effect
        color = color * noise * 0.3;
        
        gl_FragColor = vec4(color, noise * 0.5);
      }
    `;

    const initShader = () => {
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      
      if (!gl) {
        console.warn("WebGL is not supported by your browser.");
        return null;
      }

      function createShader(gl: WebGLRenderingContext, sourceCode: string, type: number) {
        const shader = gl.createShader(type);
        if (!shader) return null;
        
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }

        return shader;
      }

      const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
      const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) return null;

      function createShaderProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        const program = gl.createProgram();
        if (!program) return null;
        
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
          return null;
        }

        return program;
      }

      const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
      if (!shaderProgram) return null;

      function getUniforms(program: WebGLProgram) {
        const uniforms: any = {};
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          const uniformInfo = gl.getActiveUniform(program, i);
          if (uniformInfo) {
            uniforms[uniformInfo.name] = gl.getUniformLocation(program, uniformInfo.name);
          }
        }
        return uniforms;
      }

      uniformsRef.current = getUniforms(shaderProgram);

      const vertices = new Float32Array([-1., -1., 1., -1., -1., 1., 1., 1.]);

      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      gl.useProgram(shaderProgram);

      const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
      gl.enableVertexAttribArray(positionLocation);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      return gl;
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      
      if (glRef.current && uniformsRef.current) {
        glRef.current.uniform1f(uniformsRef.current.u_ratio, canvas.width / canvas.height);
        glRef.current.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const render = () => {
      if (!glRef.current || !uniformsRef.current) return;

      const currentTime = performance.now();
      const pointer = pointerRef.current;

      pointer.x += (pointer.tX - pointer.x) * .2;
      pointer.y += (pointer.tY - pointer.y) * .2;

      glRef.current.uniform1f(uniformsRef.current.u_time, currentTime);
      glRef.current.uniform2f(
        uniformsRef.current.u_pointer_position, 
        pointer.x / window.innerWidth, 
        1 - pointer.y / window.innerHeight
      );
      glRef.current.uniform1f(uniformsRef.current.u_scroll_progress, scrollProgress);

      glRef.current.drawArrays(glRef.current.TRIANGLE_STRIP, 0, 4);
      animationIdRef.current = requestAnimationFrame(render);
    };

    // Initialize
    glRef.current = initShader();
    if (glRef.current) {
      resizeCanvas();
      render();

      const handleResize = () => resizeCanvas();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
      };
    }
  }, [scrollProgress]);

  // Update mouse position
  useEffect(() => {
    const pointer = pointerRef.current;
    pointer.tX = mousePosition.x;
    pointer.tY = mousePosition.y;
  }, [mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-40"
      style={{ zIndex: 1 }}
    />
  );
};