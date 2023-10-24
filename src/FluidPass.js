import * as THREE from '../libs/build/three.module.js';
import { TWEEN } from '../libs/examples/jsm/libs/tween.module.min.js';

import {
	basic,
	advect,
	clear,
	divergence,
	gradientSubstract,
	jacobi,
	normal,
	post,
	splat,
} from './shaders/fluid.js';

import { FBOPingPong } from './FBOPingPong.js';

const FluidPass = (renderer, _options) => {
	
	const _seedTime = Math.random() * 0xFF;
	const baseStrength = 0.017;

	const options = {
		TEXTURE_DOWNSAMPLE: 2,
		DENSITY_DISSIPATION: 0.99,
		VELOCITY_DISSIPATION: 0.995,
		PRESSURE_DISSIPATION: 0.98,
		PRESSURE_ITERATIONS: 10,
		SPLAT_RADIUS: 0.001,
		NUM_CIRCLES: 10
	};

	Object.assign(options, _options);

	const vertexShader = `
		varying vec2 vTextureCoord;

		void main() {
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

			vTextureCoord = uv;
		}
	`;

	const liquidTexture = new THREE.TextureLoader().load('./textures/liquid.jpg');
	const gradientTexture = new THREE.TextureLoader().load('./textures/gradient.jpg');
	const overlayTexture = new THREE.TextureLoader().load('./textures/overlay.jpg');
	liquidTexture.minFilter = liquidTexture.magFilter = THREE.LinearFilter;
	liquidTexture.wrapS = THREE.MirroredRepeatWrapping;
	liquidTexture.wrapT = THREE.MirroredRepeatWrapping;

	gradientTexture.minFilter = gradientTexture.magFilter = THREE.LinearFilter;
	gradientTexture.wrapS = THREE.MirroredRepeatWrapping;
	gradientTexture.wrapT = THREE.MirroredRepeatWrapping;

	const advectMaterial = new THREE.ShaderMaterial({
		uniforms: {
			timestep: { type: 'f', value: 0.007},
			dissipation: { type: 'f', value: 0.0},
			texelSize: { type: 'v2', value: new THREE.Vector2() },    // 1 / grid scale 
			velocity: { type: 't', value: null},  // input velocity
			x: { type: 't', value: null},
		},
		vertexShader,
		fragmentShader: advect,
		depthTest: false,
		depthWrite: false,
		transparent: false,
		blending: THREE.NormalBlending,
	});

	const clearMaterial = new THREE.ShaderMaterial({
		uniforms: {
			pressure: { type: 't', value: null},
			dissipation: { type: 'f', value: options.PRESSURE_DISSIPATION },
		},	
		vertexShader,
		fragmentShader: clear,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const divergenceMaterial = new THREE.ShaderMaterial({
		uniforms: {
			texelSize: { type: 'v2', value: new THREE.Vector2() },    // 1 / grid scale 
			velocity: { type: 't', value: null},  // input velocity
		},
		vertexShader,
		fragmentShader: divergence,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const gradientMaterial = new THREE.ShaderMaterial({
		uniforms: {
			texelSize: { type: 'v2', value: new THREE.Vector2() },    // 1 / grid scale 
			velocity: { type: 't', value: null},  // input velocity
			pressure: { type: 't', value: null},  // input velocity
		},
		vertexShader,
		fragmentShader: gradientSubstract,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const jacobiMaterial = new THREE.ShaderMaterial({
		uniforms: {
			texelSize: { type: 'v2', value: new THREE.Vector2() },    // 1 / grid scale 
			divergence: { type: 't', value: null},  // input velocity
			pressure: { type: 't', value: null},  // input velocity
		},
		vertexShader,
		fragmentShader: jacobi,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const normalMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uTexture: { type: 't', value: null},  // input velocity
		},
		vertexShader,
		fragmentShader: normal,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const postMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uFade: { type: 'f', value: 0},
			uRatio: { type: 'f', value: 0},
			uOpening: { type: 'f', value: 0},
			uDimension: { type: 'v2', value: new THREE.Vector2() },    // 1 / grid scale 
			uHit: { type: 'v2', value: new THREE.Vector2() },    // 1 / grid scale 
			textureGradient: { type: 't', value: null},  // input velocity
			textureNormal: { type: 't', value: null},
			textureOverlay: { type: 't', value: null},
		},
		vertexShader,
		fragmentShader: post,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const splatMaterial = new THREE.ShaderMaterial({
		uniforms: {
			radius: { type: 'f', value: 0},
			uTime: { type: 'f', value: 0},
			uIsVelocity: { type: 'f', value: 0},
			aspectRatio: { type: 'f', value: window.innerWidth / window.innerHeight},
			point: { type: 'v2', value: new THREE.Vector2() },    // 1 / grid scale 
			color: { type: 'v2', value: new THREE.Vector3(1,1,1) },    // 1 / grid scale 
			uTarget: { type: 't', value: null},  // input velocity
			uTexture: { type: 't', value: null},
		},
		vertexShader,
		fragmentShader: splat,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const basicMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uBaseStrength: { type: 'f', value: baseStrength},
			uTime: { type: 'f', value: 0},
			uTexture: { type: 't', value: null},  // input velocity
			uTarget: { type: 't', value: null},
		},
		vertexShader,
		fragmentShader: basic,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NormalBlending,
		transparent: false,
	});

	const params = {
		fade: 0,
		opening: 1,
	};

	const w = window.innerWidth/2;
	const h = window.innerHeight/2;

	const fboCamera = new THREE.OrthographicCamera(-w, w, h, -h, -100, 100);
	fboCamera.position.z = 1;

	const fboScene = new THREE.Scene();
	const fboMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(w * 2, h * 2), splatMaterial);

	fboScene.add(fboMesh);

	let velocityRTT;
	let pressureRTT;
	let densityRTT;

	let divergenceRTT;
	let normalRTT;

	let radius = options.SPLAT_RADIUS;

	
	let started = false;

	const _texelSize = (() => {
		const {innerWidth, innerHeight} = window;

		return new THREE.Vector2(
			1/(innerWidth >> options.TEXTURE_DOWNSAMPLE),
			1/(innerHeight >> options.TEXTURE_DOWNSAMPLE)
		);
	})();

	const init = () => {
		const sizes = _texelSize;

		const width = innerWidth >> options.TEXTURE_DOWNSAMPLE;
		const height = innerHeight >> options.TEXTURE_DOWNSAMPLE;

		console.log('INIT', width, height);

		//_texelSize.set(width, height);

		velocityRTT = FBOPingPong(width, height);
        pressureRTT = FBOPingPong(width, height);
        densityRTT = FBOPingPong(width, height);
        
        divergenceRTT = new THREE.WebGLRenderTarget( width, height, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        });

        normalRTT = new THREE.WebGLRenderTarget( width, height, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        });
        
	};

	const advectPass = (target, textureX, dissipation) => {
		
		fboMesh.material = advectMaterial;
		//console.log(target);
		fboMesh.material.uniforms.texelSize.value.copy(_texelSize);
		fboMesh.material.uniforms.dissipation.value = dissipation;
		fboMesh.material.uniforms.velocity.value = velocityRTT.readTexture();
		fboMesh.material.uniforms.x.value = textureX;

		renderer.setRenderTarget(target);
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);
	}

	const createSplat = (x, y, dx, dy, radius) => {

		radius = radius || options.SPLAT_RADIUS;
		
		fboMesh.material = splatMaterial;

		fboMesh.material.uniforms.radius.value = radius;
		fboMesh.material.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
		fboMesh.material.uniforms.point.value.set(x / window.innerWidth, 1 - y / window.innerHeight);
		
		const speed = 1;

		fboMesh.material.uniforms.color.value.set(dx * speed, -dy * speed, 1);
		fboMesh.material.uniforms.uIsVelocity.value = 1.0;
		fboMesh.material.uniforms.uTarget.value = velocityRTT.readTexture();
		fboMesh.material.uniforms.uTexture.value = liquidTexture;

		renderer.setRenderTarget(velocityRTT.write());
		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);
		
		velocityRTT.swap();

		// let g = 0.0075;
		let g = 0.01;
		
		fboMesh.material.uniforms.color.value.set(g, g, g);
		fboMesh.material.uniforms.uIsVelocity.value = 0.0;
		fboMesh.material.uniforms.uTarget.value = densityRTT.readTexture();

		renderer.setRenderTarget(densityRTT.write());
		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);

		densityRTT.swap();

	}

	const redraw = (delta) => {
		const g = 0.01
		
		fboMesh.material = basicMaterial;
		fboMesh.material.uniforms.uTarget.value = densityRTT.readTexture();
		fboMesh.material.uniforms.uTexture.value = liquidTexture;
		fboMesh.material.uniforms.uTime.value = delta + _seedTime;
		fboMesh.material.uniforms.uBaseStrength.value = baseStrength;

		renderer.setRenderTarget(densityRTT.write());
		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);

		densityRTT.swap();
	};

	const update = (prevMouse, mouse, isMouseDown, delta) => {
		renderer.clearColor(0x000000, 1);

		fboMesh.material = splatMaterial;
		fboMesh.material.uniforms.uTime.value += delta;

		redraw(delta);

		const { x, y } = mouse;

		const dx = (x - prevMouse.x) / 10.0;
		const dy = (y - prevMouse.y) / 10.0;
		
		//console.log(x,y,dx,dy);

		if(isMouseDown){
			createSplat(x, y, dx, dy, options.SPLAT_RADIUS);
		}

		advectPass(
			velocityRTT.write(), 
			velocityRTT.readTexture(), 
			options.VELOCITY_DISSIPATION
		);

		velocityRTT.swap();

		advectPass(
			densityRTT.write(), 
			densityRTT.readTexture(), 
			options.DENSITY_DISSIPATION
		);

		densityRTT.swap();

		//	divergence
		fboMesh.material = divergenceMaterial;
		fboMesh.material.uniforms.texelSize.value.copy(_texelSize);
		fboMesh.material.uniforms.velocity.value = velocityRTT.readTexture();
		
		renderer.setRenderTarget(divergenceRTT);
		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);

		//	clear
		fboMesh.material = clearMaterial
		fboMesh.material.uniforms.pressure.value = pressureRTT.readTexture();

		renderer.setRenderTarget(pressureRTT.write());
		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);

		pressureRTT.swap();

		//	jacobi
		for(let i=0; i<options.PRESSURE_ITERATIONS; i++) {

			fboMesh.material = jacobiMaterial;
			fboMesh.material.uniforms.texelSize.value.copy(_texelSize);
			fboMesh.material.uniforms.pressure.value = pressureRTT.readTexture();
			fboMesh.material.uniforms.divergence.value = divergenceRTT.texture;

			renderer.setRenderTarget(pressureRTT.write());
			//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
			renderer.clearColor(0x000000, 1);
			renderer.render(fboScene, fboCamera);
			renderer.setRenderTarget(null);
			//	swapping texture
			pressureRTT.swap();
		}

		//	gradient substract
		
		fboMesh.material = gradientMaterial;
		fboMesh.material.uniforms.texelSize.value.copy(_texelSize);
		fboMesh.material.uniforms.pressure.value = pressureRTT.readTexture();
		fboMesh.material.uniforms.velocity.value = velocityRTT.readTexture();
		
		renderer.setRenderTarget(velocityRTT.write());
		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);
		
		velocityRTT.swap();

		fboMesh.material = normalMaterial;
		fboMesh.material.uniforms.uTexture.value = velocityRTT.readTexture();

		renderer.setRenderTarget(normalRTT);
		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);
		renderer.render(fboScene, fboCamera);
		renderer.setRenderTarget(null);

		/*fboMesh.material = postMaterial
		fboMesh.material.uniforms.uHit.value.copy(mouse);
		fboMesh.material.uniforms.uFade.value = params.fade;
		//fboMesh.material.uniforms.uTime.value += delta;
		fboMesh.material.uniforms.uRatio.value = window.innerWidth / window.innerHeight;
		fboMesh.material.uniforms.uOpening.value = params.opening;
		fboMesh.material.uniforms.uDimension.value.set(window.innerWidth, window.innerHeight);

		fboMesh.material.uniforms.textureNormal.value = normalRTT.texture;
		fboMesh.material.uniforms.textureGradient.value = gradientTexture;
		fboMesh.material.uniforms.textureOverlay.value = overlayTexture;

		//renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
		renderer.clearColor(0x000000, 1);*/
		//renderer.render(fboScene, fboCamera);
		
	};

	const base = {
		update,
		init,
	};

	Object.defineProperty(base, 'velocityTexture', {
		get: () => velocityRTT.readTexture(),
	});

	Object.defineProperty(base, 'pressureTexture', {
		get: () => pressureRTT.readTexture(),
	});

	Object.defineProperty(base, 'densityTexture', {
		get: () => densityRTT.readTexture(),
	});	

	Object.defineProperty(base, 'divergenceTexture', {
		get: () => divergenceRTT.texture,
	});	

	Object.defineProperty(base, 'normalTexture', {
		get: () => normalRTT.texture,
	});	

	Object.defineProperty(base, 'alltextures', {
		get: () =>  {
			return {
				velocityTexture: velocityRTT.readTexture(),
				pressureTexture: pressureRTT.readTexture(),
				densityTexture: densityRTT.readTexture(),
				divergenceTexture: divergence.texture,
			}
		}
	})



	return base;
};

export { FluidPass };
