import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


function main() {

	const canvas = document.querySelector( '#c' );
	const renderer = new THREE.WebGLRenderer( {
		canvas,
		logarithmicDepthBuffer: true,
		antialias: true
	} );
	const fov = 45;
	const aspect = 2; // the canvas default
	const near = 0.00001;
	const far = 100;
	const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
	camera.position.set( 10, 6, 10 );

	class MinMaxGUIHelper {

		constructor( obj, minProp, maxProp, minDif ) {

			this.obj = obj;
			this.minProp = minProp;
			this.maxProp = maxProp;
			this.minDif = minDif;

		}
		get min() {

			return this.obj[ this.minProp ];

		}
		set min( v ) {

			this.obj[ this.minProp ] = v;
			this.obj[ this.maxProp ] = Math.max( this.obj[ this.maxProp ], v + this.minDif );

		}
		get max() {

			return this.obj[ this.maxProp ];

		}
		set max( v ) {

			this.obj[ this.maxProp ] = v;
			this.min = this.min; // this will call the min setter

		}

	}

	function updateCamera() {

		camera.updateProjectionMatrix();

	}

	const gui = new GUI();
	gui.add( camera, 'fov', 1, 180 ).onChange( updateCamera );
	const minMaxGUIHelper = new MinMaxGUIHelper( camera, 'near', 'far', 0.1 );
	gui.add( minMaxGUIHelper, 'min', 0.00001, 50, 0.00001 ).name( 'near' ).onChange( updateCamera );
	gui.add( minMaxGUIHelper, 'max', 0.1, 50, 0.1 ).name( 'far' ).onChange( updateCamera );


	const controls = new OrbitControls( camera, canvas );
	controls.target.set( 0, 5, 0 );
	controls.update();

	const scene = new THREE.Scene();
	scene.background = new THREE.Color( 'black' );

	// {

	// 	const planeSize = 4000;

	// 	const loader = new THREE.TextureLoader();
	// 	const texture = loader.load( 'https://threejs.org/manual/examples/resources/images/checker.png' );
	// 	texture.colorSpace = THREE.SRGBColorSpace;
	// 	texture.wrapS = THREE.RepeatWrapping;
	// 	texture.wrapT = THREE.RepeatWrapping;
	// 	texture.magFilter = THREE.NearestFilter;
	// 	const repeats = planeSize / 200;
	// 	texture.repeat.set( repeats, repeats );

	// 	const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
	// 	const planeMat = new THREE.MeshPhongMaterial( {
	// 		map: texture,
	// 		side: THREE.DoubleSide,
	// 	} );
	// 	const mesh = new THREE.Mesh( planeGeo, planeMat );
	// 	mesh.rotation.x = Math.PI * - .5;
	// 	scene.add( mesh );

	// }


	function frameArea( sizeToFitOnScreen, boxSize, boxCenter, camera ) {

		const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
		const halfFovY = THREE.MathUtils.degToRad( camera.fov * .5 );
		const distance = halfSizeToFitOnScreen / Math.tan( halfFovY );
		// compute a unit vector that points in the direction the camera is now
		// in the xz plane from the center of the box
		const direction = ( new THREE.Vector3() )
			.subVectors( camera.position, boxCenter )
			.multiply( new THREE.Vector3( 1, 0, 1 ) )
			.normalize();

		// move the camera to a position distance units way from the center
		// in whatever direction the camera was from the center already
		camera.position.copy( direction.multiplyScalar( distance ).add( boxCenter ) );

		// pick some near and far values for the frustum that
		// will contain the box.
		camera.near = boxSize / 100;
		camera.far = boxSize * 100;

		camera.updateProjectionMatrix();

		// point the camera to look at the center of the box
		camera.lookAt( boxCenter.x, boxCenter.y, boxCenter.z );

	}

	{

		const mtlLoader = new MTLLoader();
		mtlLoader.load( 'materials.mtl', ( mtl ) => {

			mtl.preload();
			const objLoader = new OBJLoader();
			objLoader.setMaterials( mtl );
			objLoader.load( 'model.obj', ( root ) => {
				root.position.set(0,0.11,0)
				scene.add( root );

				// compute the box that contains all the stuff
				// from root and below
				const box = new THREE.Box3().setFromObject( root );

				const boxSize = box.getSize( new THREE.Vector3() ).length();
				const boxCenter = box.getCenter( new THREE.Vector3() );

				// set the camera to frame the box
				frameArea( boxSize * 1.2, boxSize, boxCenter, camera );

				// update the Trackball controls to handle the new size
				controls.maxDistance = boxSize * 10;
				controls.target.copy( boxCenter );
				controls.update();

			} );

		} );

	}

	{

		const loader = new THREE.TextureLoader();
		const texture = loader.load(
			'back.jpeg',
			() => {

				texture.mapping = THREE.EquirectangularReflectionMapping;
				texture.colorSpace = THREE.SRGBColorSpace;
				scene.background = texture;

			} );

	}

	{
		const sphereRadius = 1;
		const sphereWidthDivisions = 32;
		const sphereHeightDivisions = 16;
		const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
		const sphereMat = new THREE.MeshPhongMaterial({color: '#8d5107'});
		const mesh = new THREE.Mesh(sphereGeo, sphereMat);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.set(0, 3, 0);
		scene.add(mesh);
	}

	{
		const coneGeom = new THREE.ConeGeometry(
			1, 1, 12
		);
		const coneMat = new THREE.MeshPhongMaterial({color: 'green'});
		const root = new THREE.Object3D();
		const cone = new THREE.Mesh(coneGeom, coneMat);
		cone.position.y = 2
		root.add(cone);

		root.position.set(0, 0, 0);
		scene.add(root);

	}
	const geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
	const material = new THREE.MeshPhongMaterial( { color: 0x44aa88 } ); // greenish blue

	const cube = new THREE.Mesh( geometry, material );
	cube.position.y = 1
	scene.add( cube );

	const boxGeom = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );

	function makeCube( color, x , y, z) {

		const material = new THREE.MeshPhongMaterial( { color } );

		const cube = new THREE.Mesh( boxGeom, material );
		scene.add( cube );

		cube.position.x = x;
		cube.position.y = y
		cube.position.z = z

		return cube;

	}

	// Make plate
	function toDegrees (angle) {
		return angle * (180 / Math.PI);
	  }
	for (let R = 0.1; R < 0.4; R += 0.1) {
		for (let i = 0; i < 360; i++) {
			makeCube(0xffffff, Math.cos(i)*R,-0.1,Math.sin(i)*R)
		}
	}

	{

		const skyColor = 0xB1E1FF; // light blue
		const groundColor = 0xB97A20; // brownish orange
		const intensity = 0.1;
		const light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
		scene.add( light );

	}

	{

		const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.DirectionalLight( color, intensity );
		light.position.set( 5, 10, 2 );
		scene.add( light );
		scene.add( light.target );

	}
	class ColorGUIHelper {

		constructor( object, prop ) {

			this.object = object;
			this.prop = prop;

		}
		get value() {

			return `#${this.object[ this.prop ].getHexString()}`;

		}
		set value( hexString ) {

			this.object[ this.prop ].set( hexString );

		}

	}

	class DegRadHelper {

		constructor( obj, prop ) {

			this.obj = obj;
			this.prop = prop;

		}
		get value() {

			return THREE.MathUtils.radToDeg( this.obj[ this.prop ] );

		}
		set value( v ) {

			this.obj[ this.prop ] = THREE.MathUtils.degToRad( v );

		}

	}

	function makeXYZGUI( gui, vector3, name, onChangeFn ) {

		const folder = gui.addFolder( name );
		folder.add( vector3, 'x', - 10, 10 ).onChange( onChangeFn );
		folder.add( vector3, 'y', 0, 10 ).onChange( onChangeFn );
		folder.add( vector3, 'z', - 10, 10 ).onChange( onChangeFn );
		folder.open();

	}

	{

		const color = 0xFFFFFF;
		const intensity = 84;
		const light = new THREE.SpotLight( color, intensity );
		light.position.set( 2.38, 3.12, 0.66 );
		light.target.position.set( -1.06, 0, 0.9 );
		scene.add( light );
		scene.add( light.target );

		const helper = new THREE.SpotLightHelper( light );
		scene.add( helper );

		function updateLight() {

			light.target.updateMatrixWorld();
			helper.update();

		}

		updateLight();

		const gui = new GUI();
		gui.addColor( new ColorGUIHelper( light, 'color' ), 'value' ).name( 'color' );
		gui.add( light, 'intensity', 0, 250, 1 );
		gui.add( light, 'distance', 0, 40 ).onChange( updateLight );
		gui.add( new DegRadHelper( light, 'angle' ), 'value', 0, 90 ).name( 'angle' ).onChange( updateLight );
		gui.add( light, 'penumbra', 0, 1, 0.01 );

		makeXYZGUI( gui, light.position, 'position', updateLight );
		makeXYZGUI( gui, light.target.position, 'target', updateLight );

	}

	function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

	function render(time) {

		if ( resizeRendererToDisplaySize( renderer ) ) {

			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}
		time *= 0.001; // convert time to seconds

		cube.rotation.x = time;
		cube.rotation.y = time;

		renderer.render( scene, camera );

		requestAnimationFrame( render );

	}

	requestAnimationFrame( render );

}

main();
