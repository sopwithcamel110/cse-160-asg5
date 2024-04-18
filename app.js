import * as THREE from 'three';
document.onload = main;

function main(){
    let canvas = document.getElementById("paint_canvas");
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});

    const fov = 75;
    const aspect = 2;  // Default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.z = 2;

    const scene = new THREE.Scene();

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const material = new THREE.MeshPhongMaterial({color: 0x44aa88});
    
    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
    
    const loader = new THREE.TextureLoader();
    const texture = loader.load( 'pic.jpg' );
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const cubes = [
    makeInstance(scene, geometry, texture,  0),
    makeInstance(scene, geometry, texture, -2),
    makeInstance(scene, geometry, texture,  2),
    ];
    
    let render = (time) => {
    time *= 0.001;  //  Convert ms to s

    cubes.forEach((cube, ndx) => {
        const speed = 1 + ndx * .1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
    });
    renderer.render(scene, camera);
     
    requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function makeInstance(scene, geometry, texture, x) {
    const material = new THREE.MeshPhongMaterial(
    {
        map: texture
    });
     
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
     
    cube.position.x = x;
     
    return cube;
}

main();