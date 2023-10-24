import * as THREE from '../libs/build/three.module.js';

const FBOPingPong = (width, height) => {

	const _fbos = [];

	const init = () => {
		const rtt =	new THREE.WebGLRenderTarget( width, height, {
            wrapS: THREE.RepeaWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        })

        const rtt2 =	new THREE.WebGLRenderTarget( width, height, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        })

		_fbos.push(rtt,rtt2);
	};

	const read = () => {
		return _fbos[0];
	}

	const write = () => {
		return _fbos[1];
	}

	const readTexture = () => {
		return _fbos[0].texture;
	}

	const writeTexture = () => {
		return _fbos[1].texture;
	}

	const swap = () => {
		const tmp = _fbos[1];
		_fbos[1] = _fbos[0];
		_fbos[0] = tmp;
	}

	init();

	const base = {
		read,
		write,
		readTexture,
		writeTexture,
		swap,
	};

	return base;
};

export {FBOPingPong};