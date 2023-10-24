const rotate = `
	vec2 rotate(vec2 v, float a) {
		float s = sin(a);
		float c = cos(a);
		mat2 m = mat2(c, s, -s, c);
		return m * v;
	}

	mat4 rotationMatrix(vec3 axis, float angle) {
	    axis = normalize(axis);
	    float s = sin(angle);
	    float c = cos(angle);
	    float oc = 1.0 - c;
	    
	    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
	                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
	                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
	                0.0,                                0.0,                                0.0,                                1.0);
	}

	vec3 rotate(vec3 v, vec3 axis, float angle) {
		mat4 m = rotationMatrix(axis, angle);
		return (m * vec4(v, 1.0)).xyz;
	}

`
const align = `

	vec3 align(vec3 pos, vec3 dir) {
	    vec3 initDir = vec3(1.0, 0.0, 0.0);
	    vec3 axis = cross(dir, initDir);
	    float angle = acos(dot(dir, initDir));
	    return rotate(pos, axis, angle);
	}

`;

const curl = `
	vec3 mod289(vec3 x) {	return x - floor(x * (1.0 / 289.0)) * 289.0;	}

	vec4 mod289(vec4 x) {	return x - floor(x * (1.0 / 289.0)) * 289.0;	}

	vec4 permute(vec4 x) {	return mod289(((x*34.0)+1.0)*x);	}

	vec4 taylorInvSqrt(vec4 r) {	return 1.79284291400159 - 0.85373472095314 * r;}

	float snoise(vec3 v) { 
	  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

	  vec3 i  = floor(v + dot(v, C.yyy) );
	  vec3 x0 =   v - i + dot(i, C.xxx) ;

	  vec3 g = step(x0.yzx, x0.xyz);
	  vec3 l = 1.0 - g;
	  vec3 i1 = min( g.xyz, l.zxy );
	  vec3 i2 = max( g.xyz, l.zxy );

	  vec3 x1 = x0 - i1 + C.xxx;
	  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
	  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

	  i = mod289(i); 
	  vec4 p = permute( permute( permute( 
	             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
	           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
	           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

	  float n_ = 0.142857142857; // 1.0/7.0
	  vec3  ns = n_ * D.wyz - D.xzx;

	  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

	  vec4 x_ = floor(j * ns.z);
	  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

	  vec4 x = x_ *ns.x + ns.yyyy;
	  vec4 y = y_ *ns.x + ns.yyyy;
	  vec4 h = 1.0 - abs(x) - abs(y);

	  vec4 b0 = vec4( x.xy, y.xy );
	  vec4 b1 = vec4( x.zw, y.zw );

	  vec4 s0 = floor(b0)*2.0 + 1.0;
	  vec4 s1 = floor(b1)*2.0 + 1.0;
	  vec4 sh = -step(h, vec4(0.0));

	  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

	  vec3 p0 = vec3(a0.xy,h.x);
	  vec3 p1 = vec3(a0.zw,h.y);
	  vec3 p2 = vec3(a1.xy,h.z);
	  vec3 p3 = vec3(a1.zw,h.w);

	  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	  p0 *= norm.x;
	  p1 *= norm.y;
	  p2 *= norm.z;
	  p3 *= norm.w;

	  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	  m = m * m;
	  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
	                                dot(p2,x2), dot(p3,x3) ) );
	}

	vec3 snoiseVec3( vec3 x ){

	  float s  = snoise(vec3( x ));
	  float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
	  float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
	  vec3 c = vec3( s , s1 , s2 );
	  return c;

	}

	vec3 curlNoise( vec3 p ){
	  
	  const float e = .1;
	  vec3 dx = vec3( e   , 0.0 , 0.0 );
	  vec3 dy = vec3( 0.0 , e   , 0.0 );
	  vec3 dz = vec3( 0.0 , 0.0 , e   );

	  vec3 p_x0 = snoiseVec3( p - dx );
	  vec3 p_x1 = snoiseVec3( p + dx );
	  vec3 p_y0 = snoiseVec3( p - dy );
	  vec3 p_y1 = snoiseVec3( p + dy );
	  vec3 p_z0 = snoiseVec3( p - dz );
	  vec3 p_z1 = snoiseVec3( p + dz );

	  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
	  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
	  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

	  const float divisor = 1.0 / ( 2.0 * e );
	  return normalize( vec3( x , y , z ) * divisor );

	}
`;

const basic = `
	precision highp float;
	precision mediump sampler2D;

	varying vec2 vTextureCoord;

	uniform sampler2D uTarget;
	uniform sampler2D uTexture;
	uniform float uTime;
	uniform float uBaseStrength;


	vec4 permute(vec4 x) {  return mod(((x*34.0)+1.0)*x, 289.0);    }
	vec4 taylorInvSqrt(vec4 r) {    return 1.79284291400159 - 0.85373472095314 * r; }

	float snoise(vec3 v){
	    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
	    
	    vec3 i  = floor(v + dot(v, C.yyy) );
	    vec3 x0 = v - i + dot(i, C.xxx) ;
	    
	    vec3 g = step(x0.yzx, x0.xyz);
	    vec3 l = 1.0 - g;
	    vec3 i1 = min( g.xyz, l.zxy );
	    vec3 i2 = max( g.xyz, l.zxy );
	    
	    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
	    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
	    vec3 x3 = x0 - 1. + 3.0 * C.xxx;
	    
	    i = mod(i, 289.0 );
	    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
	    
	    float n_ = 1.0/7.0;
	    vec3  ns = n_ * D.wyz - D.xzx;
	    
	    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
	    
	    vec4 x_ = floor(j * ns.z);
	    vec4 y_ = floor(j - 7.0 * x_ );
	    
	    vec4 x = x_ *ns.x + ns.yyyy;
	    vec4 y = y_ *ns.x + ns.yyyy;
	    vec4 h = 1.0 - abs(x) - abs(y);
	    
	    vec4 b0 = vec4( x.xy, y.xy );
	    vec4 b1 = vec4( x.zw, y.zw );
	    
	    vec4 s0 = floor(b0)*2.0 + 1.0;
	    vec4 s1 = floor(b1)*2.0 + 1.0;
	    vec4 sh = -step(h, vec4(0.0));
	    
	    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
	    
	    vec3 p0 = vec3(a0.xy,h.x);
	    vec3 p1 = vec3(a0.zw,h.y);
	    vec3 p2 = vec3(a1.xy,h.z);
	    vec3 p3 = vec3(a1.zw,h.w);
	    
	    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	    p0 *= norm.x;
	    p1 *= norm.y;
	    p2 *= norm.z;
	    p3 *= norm.w;
	    
	    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	    m = m * m;
	    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
	}

	float snoise(float x, float y, float z){
	    return snoise(vec3(x, y, z));
	}

	void main () {
		float scale  = .1;
		// float noise  = snoise(vec3(vTextureCoord * scale, uTime * 0.02));
		float nx  = snoise(vec3(vTextureCoord * scale, uTime * 0.02));
		float ny  = snoise(vec3(uTime * 0.02, vTextureCoord * scale));

		// vec2 uv      = vec2(vTextureCoord * 0.5 + noise);
		vec2 uv      = vTextureCoord + vec2(nx, ny) * 0.01;

		// vec2 uv      = vec2(sin(uTime * 0.03) * .5 + .5, noise);
		vec3 splat   = texture2D(uTexture, uv).rgb;
		
		vec3 base    = texture2D(uTarget, vTextureCoord).xyz;
		gl_FragColor = vec4(splat, 1.0);
	}
`;

const advect = `
	precision highp float;
	precision mediump sampler2D;

	varying vec2 vTextureCoord;
	uniform float timestep;
	uniform float dissipation;
	uniform vec2 texelSize;      // 1 / grid scale 
	uniform sampler2D velocity;  // input velocity
	uniform sampler2D x;         // quantity to advect

	void main() {
		vec2 tSize = texelSize;
		vec2 pos = vTextureCoord - timestep * tSize * texture2D(velocity, vTextureCoord).xy;

		gl_FragColor = dissipation * texture2D(x, pos);
	}
`;

const clear = `
	precision highp float;
	precision mediump sampler2D;

	varying vec2 vTextureCoord;
	
	uniform sampler2D pressure;
	uniform float dissipation;

	void main() {
	    gl_FragColor = dissipation * texture2D(pressure, vTextureCoord);
	}
`;

const divergence = `
	precision highp float;
	precision mediump sampler2D;

	varying vec2 vTextureCoord;        // grid coordinates
	uniform vec2 texelSize;
	uniform sampler2D velocity; // vector field

	vec2 sampleVelocity(in vec2 uv) {
	    vec2 mult = vec2(1.0, 1.0);
	    if (uv.x < 0.0 || uv.x > 1.0) { mult.x = -1.0; }
	    if (uv.y < 0.0 || uv.y > 1.0) { mult.y = -1.0; }
	    return mult * texture2D(velocity, clamp(uv, 0.0, 1.0)).xy;
	}

	void main() {
	  float L = sampleVelocity(vTextureCoord - vec2(texelSize.x, 0.0)).x;
	  float R = sampleVelocity(vTextureCoord + vec2(texelSize.x, 0.0)).x;
	  float T = sampleVelocity(vTextureCoord + vec2(0.0, texelSize.y)).y;
	  float B = sampleVelocity(vTextureCoord - vec2(0.0, texelSize.y)).y;
	  float div = 0.5 * (R - L + T - B);
	  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
	}
`;

const gradientSubstract = `
	precision highp float;
	precision mediump sampler2D;

	varying vec2 vTextureCoord;
	uniform vec2 texelSize;
	uniform sampler2D pressure;
	uniform sampler2D velocity;

	void main() {
	  float pL = texture2D(pressure, vTextureCoord - vec2(texelSize.x, 0.0)).x;
	  float pR = texture2D(pressure, vTextureCoord + vec2(texelSize.x, 0.0)).x;
	  float pB = texture2D(pressure, vTextureCoord - vec2(0.0, texelSize.y)).x;
	  float pT = texture2D(pressure, vTextureCoord + vec2(0.0, texelSize.y)).x;
	  vec2 v = texture2D(velocity, vTextureCoord).xy;
	  gl_FragColor = vec4(v - vec2(pR - pL, pT - pB), 0.0, 1.0);
	}
`;

const jacobi = `
	precision highp float;
	precision mediump sampler2D;

	varying vec2 vTextureCoord; // grid coordinates    
	uniform vec2 texelSize;
	uniform sampler2D pressure;
	uniform sampler2D divergence;

	void main() {
	  // left, right, bottom, and top pressure samples
	  float L = texture2D(pressure, vTextureCoord - vec2(texelSize.x, 0.0)).x;
	  float R = texture2D(pressure, vTextureCoord + vec2(texelSize.x, 0.0)).x;
	  float B = texture2D(pressure, vTextureCoord - vec2(0.0, texelSize.y)).x;
	  float T = texture2D(pressure, vTextureCoord + vec2(0.0, texelSize.y)).x;

	  // divergence sample, from center
	  float bC = texture2D(divergence, vTextureCoord).x;
	  
	  // evaluate Jacobi iteration
	  gl_FragColor = vec4(0.25 * (L + R + B + T - bC), 0, 0, 1);
	}
`;

const normal = `
	// copy.frag

	//#define SHADER_NAME SIMPLE_TEXTURE

	precision highp float;
	varying vec2 vTextureCoord;
	uniform sampler2D uTexture;

	const vec2 size = vec2(0.05, 0.0);
	const vec3 off = vec3(-1.0, 0.0, 1.0) * 0.01;

	float luma(vec3 color) {
	  return dot(color, vec3(0.299, 0.587, 0.114));
	}

	float getHeight(vec2 uv) {
		vec3 color = texture2D(uTexture, uv).rgb;
		float br = luma(color);
		return br;
	}

	void main(void) {
	    float s11      = getHeight(vTextureCoord);
		
		float s01      = getHeight(vTextureCoord + off.xy);
		float s21      = getHeight(vTextureCoord + off.zy);
		float s10      = getHeight(vTextureCoord + off.yx);
		float s12      = getHeight(vTextureCoord + off.yz);
		
		vec3 va        = normalize(vec3(size.xy,s21-s01));
		vec3 vb        = normalize(vec3(size.yx,s12-s10));
		vec3 n         = cross(va, vb).rbg;


		gl_FragColor = vec4(n, 1.0);
	}
`;

const post = `
	// copy.frag

	////#define SHADER_NAME SIMPLE_TEXTURE

	precision highp float;
	varying vec2 vTextureCoord;
	uniform sampler2D textureNormal;
	uniform sampler2D textureGradient;
	uniform sampler2D textureOverlay;
	uniform float uFade;
	uniform float uRatio;
	uniform vec2 uHit;
	uniform vec2 uDimension;
	uniform float uOpening;

	float diffuse(vec3 N, vec3 L) {
		return max(dot(N, normalize(L)), 0.0);
	}


	vec3 diffuse(vec3 N, vec3 L, vec3 C) {
		return diffuse(N, L) * C;
	}


	float blendOverlay(float base, float blend) {
		return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
	}

	vec3 blendOverlay(vec3 base, vec3 blend) {
		return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
	}

	vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
		return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
	}

	const vec3 LIGHT = vec3(1.0, .8, .6);

	void main(void) {
		vec3 colorNormal = texture2D(textureNormal, vTextureCoord).rgb;
		vec3 N = normalize(colorNormal);

		float d = diffuse(N, LIGHT);
		d = pow(d-0.05, 3.0);

		vec2 uv = vec2(d, .5);
		vec3 color = texture2D(textureGradient, uv).rgb;

		uv = gl_FragCoord.xy / uDimension;
		vec3 colorOverlay = texture2D(textureOverlay, uv).rgb;

		// color = blendOverlay(color, colorOverlay, .6);
		color = blendOverlay(color, colorOverlay, .4);

    	gl_FragColor = vec4(color, 1.0);
	}
`;

const splat = `
	precision highp float;
	precision mediump sampler2D;

	varying vec2 vTextureCoord;

	uniform sampler2D uTarget;
	uniform sampler2D uTexture;
	uniform float aspectRatio;
	uniform vec3 color;
	uniform vec2 point;
	uniform float radius;
	uniform float uTime;
	uniform float uIsVelocity;


	vec4 permute(vec4 x) {  return mod(((x*34.0)+1.0)*x, 289.0);    }
	vec4 taylorInvSqrt(vec4 r) {    return 1.79284291400159 - 0.85373472095314 * r; }

	float snoise(vec3 v){
	    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
	    
	    vec3 i  = floor(v + dot(v, C.yyy) );
	    vec3 x0 = v - i + dot(i, C.xxx) ;
	    
	    vec3 g = step(x0.yzx, x0.xyz);
	    vec3 l = 1.0 - g;
	    vec3 i1 = min( g.xyz, l.zxy );
	    vec3 i2 = max( g.xyz, l.zxy );
	    
	    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
	    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
	    vec3 x3 = x0 - 1. + 3.0 * C.xxx;
	    
	    i = mod(i, 289.0 );
	    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
	    
	    float n_ = 1.0/7.0;
	    vec3  ns = n_ * D.wyz - D.xzx;
	    
	    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
	    
	    vec4 x_ = floor(j * ns.z);
	    vec4 y_ = floor(j - 7.0 * x_ );
	    
	    vec4 x = x_ *ns.x + ns.yyyy;
	    vec4 y = y_ *ns.x + ns.yyyy;
	    vec4 h = 1.0 - abs(x) - abs(y);
	    
	    vec4 b0 = vec4( x.xy, y.xy );
	    vec4 b1 = vec4( x.zw, y.zw );
	    
	    vec4 s0 = floor(b0)*2.0 + 1.0;
	    vec4 s1 = floor(b1)*2.0 + 1.0;
	    vec4 sh = -step(h, vec4(0.0));
	    
	    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
	    
	    vec3 p0 = vec3(a0.xy,h.x);
	    vec3 p1 = vec3(a0.zw,h.y);
	    vec3 p2 = vec3(a1.xy,h.z);
	    vec3 p3 = vec3(a1.zw,h.w);
	    
	    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	    p0 *= norm.x;
	    p1 *= norm.y;
	    p2 *= norm.z;
	    p3 *= norm.w;
	    
	    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	    m = m * m;
	    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
	}

	float snoise(float x, float y, float z){
	    return snoise(vec3(x, y, z));
	}

	void main () {
	    vec2 p          = vTextureCoord - point.xy;
	    p.x             *= aspectRatio;
	    
	    float t         = uTime * 0.1;
	    vec2 uv         = vTextureCoord;
	    uv.x            = uv.x - uTime * 0.01;
	    uv.y            = uv.y + sin(uTime * 0.04883974) * 0.1;
	    uv              *= 1.2789145;
	    vec3 colorMap   = texture2D(uTexture, uv).rgb;
	    colorMap        = mix(colorMap, vec3(1.0), uIsVelocity);
	    
	    
	    float percent   = exp(-dot(p, p) / radius);
	    percent         = smoothstep(0.0, 0.2, percent);
	    
	    
	    float force     = length(color.xy);
	    vec2 dir       = normalize(p);
	    vec3 colorVel   = vec3(dir * force, 1.0);
	    colorVel        = mix(color, colorVel, .5);
	    vec3 colorFinal = mix(color, colorVel, uIsVelocity);
	    vec3 splat      = percent * colorFinal * colorMap;
	    
	    vec3 base       = texture2D(uTarget, vTextureCoord).xyz;
	    gl_FragColor    = vec4(base + splat, 1.0);
	}
`;

const splat2 = `

	precision highp float;
	varying vec2 vTextureCoord;

	uniform sampler2D uTexture;

	uniform vec2 uCenter;
	uniform vec2 uDir;
	uniform float uTime;
	uniform float uRadius;
	uniform float uStrength;
	uniform float uIsVelocity;

	vec2 rotate(vec2 v, float a) {
		float s = sin(a);
		float c = cos(a);
		mat2 m = mat2(c, -s, s, c);
		return m * v;
	}

	${curl}

	#define PI 3.141592653

	void main(void) {
		vec2 center  = uCenter;

		float r = 0.15 + sin(cos(uTime	) * 4.489538925) * 0.0;
		vec2 v       = vec2(r, 0.0);
		v            = rotate(v, uTime);
		
		vec3 noise = curlNoise(vec3(vTextureCoord * 2.0, uTime));

		vec2 dir = uDir;
	  	
		dir *= uStrength;
		float d      = distance(vTextureCoord, center);
		d            = smoothstep(uRadius, 0.0, d);	
		
		vec3 color   = uIsVelocity > 0.5 ? vec3(dir, 0.0) : vec3(uStrength);

		if(uIsVelocity > .5) {
			color += noise * 0.5;
		} else {
			color += noise.rrr * uStrength;
		}

		color        *= d;	
		vec3 base    = texture2D(uTexture	, vTextureCoord).xyz;
		
		gl_FragColor = vec4(color + base, 1.0);
	}
`;

export {
	rotate,
	align,
	curl,
	basic,
	advect,
	clear,
	divergence,
	gradientSubstract,
	jacobi,
	normal,
	post,
	splat,
	splat2,
}