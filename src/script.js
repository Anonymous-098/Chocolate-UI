import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import './style.css';
import {Text,preloadFont} from 'troika-three-text';
import gsap from 'gsap';
import { MathUtils } from 'three';

const radians = (x) =>{
    return (x*Math.PI)/180;
}

const distance = (x1,x2,y1,y2) =>{
    return Math.sqrt( Math.pow((x1-x2),2) + Math.pow((y1-y2),2) );
}

const map = (a,b,c,d,t) =>{
    return ((t-a)/(b-a))*(d-c)+c;
}

preloadFont(
    {
        font: '/itc-serif-gothic-lt-heavy.ttf', 
        characters: 'abcdefghijklmnopqrstuvwxyz'
    }
)

const textureLoader = new THREE.TextureLoader();
const sprinkle1 = '/sprinkle1.png';

const scene = new THREE.Scene();

const sizes = {
    width:window.innerWidth,
    height:window.innerHeight
}
window.addEventListener("resize",(e)=>{
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width/sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth,window.innerHeight);
})

const mouse = new THREE.Vector2();
window.addEventListener("mousemove",(e)=>{
    mouse.x = (e.clientX/sizes.width)*2-1;
    mouse.y = 1-(e.clientY/sizes.height)*2;
})

//CAMERA
const camera = new THREE.PerspectiveCamera(40,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.set(0,0,20);
scene.add(camera); 

//CANVAS
const canvas = document.querySelector(".webgl");

//CONTROLS
// const controls = new OrbitControls(camera,canvas);
// controls.enableDamping = true;

//RENDERER
const renderer = new THREE.WebGL1Renderer({
    canvas:canvas
});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//LIGHTS
const ambientLight = new THREE.AmbientLight('#D8BCAC',1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight('#8C5D2C',0.3);
scene.add(pointLight);
pointLight.position.set(-20,0,10);

const pointLight1 = new THREE.PointLight('#AA8B74',0.3);
scene.add(pointLight1);
pointLight1.position.set(20,0,10);

const spotLight = new THREE.SpotLight('#80471C',0.5,110);
spotLight.position.set(0,0,40);
spotLight.castShadow = true;

spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.focus = 0.7;
scene.add(spotLight);

const material = new THREE.MeshPhysicalMaterial({
    metalness:0.7,
    roughness:0.5,
    clearcoat:0.8,
    reflectivity:0.5,
});

const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(100,100),
    new THREE.MeshStandardMaterial({color:'#F8E5DF'})
)
plane.receiveShadow = true;
scene.add(plane);

const myText = new Text();

myText.text = 'CHOCOLATEs';
myText.font = '/fonts/itc-serif-gothic-lt-heavy.ttf';
myText.fontSize = 3;
myText.color = '#EF3024';
// myText.color = '#2C1503';

myText.position.set(-8.75,3,0.1);

scene.add(myText);

myText.sync(() => {
    const geometries = [];

const torusGeo = new THREE.TorusBufferGeometry(0.2,0.06,10,32);
const coneGeo = new THREE.ConeBufferGeometry(0.2,0.4,32);
const cylinderGeo = new THREE.CylinderBufferGeometry(0.2,0.2,0.2,32);

geometries.push( { geometry: torusGeo,rotation: new THREE.Vector3(0,0,0) } );
geometries.push( { geometry: coneGeo,rotation: new THREE.Vector3(-Math.PI/2,0,0) } );
geometries.push( { geometry: cylinderGeo,rotation: new THREE.Vector3(-Math.PI/2,0,0) } );

const getRandomGeometry = () =>{
    return geometries[Math.floor(Math.random() * Math.floor(geometries.length))];
}

const shapes = [];

const group = new THREE.Group();
const cols = 13;
const rows = 6;
const gutterSize = 0.5;

const meshes = new Array(rows);
for(var i=0;i<rows;i++)
{
    meshes[i] = new Array(cols);
    for(var j=0;j<cols;j++)
    {
        const getGeometry = getRandomGeometry();
        const geometry = getGeometry.geometry;
        const rotation = getGeometry.rotation;
        const shape = new THREE.Mesh(
            geometry,
            material
        );
        shape.castShadow = true;

        shape.initialRotation = {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
        };

        group.add(shape);
        shape.position.set(j+j*gutterSize,i+i*gutterSize,1);
        shape.rotation.set(rotation.x,rotation.y,rotation.z);
        meshes[i][j] = shape;
    }
}

const centerX = ((cols - 1) + ((cols - 1) * gutterSize)) * .5;
const centerY = ((rows - 1) + ((rows - 1) * gutterSize)) * .5;
group.position.set(-centerX,-centerY,0);

scene.add(group);

const raycaster = new THREE.Raycaster();

const radius = 2;

const clock = new THREE.Clock();
var tick = function(){

    raycaster.setFromCamera(mouse,camera);

    const point = raycaster.intersectObject(plane);

    if(point.length)
    {
        for(var i=0;i<rows;i++)
        {
            for(var j=0;j<cols;j++)
            {
                const mesh = meshes[i][j];
                const mouseDistance = distance(point[0].point.x,mesh.position.x+group.position.x,point[0].point.y,mesh.position.y+group.position.y);
                const z = map(2, 4, 4, 0,mouseDistance)
                gsap.to(mesh.position,{
                    z:z<1?1:z,
                    duration:0.2
                })

                const scaleFactor = mesh.position.z/2.2;
                const scale = scaleFactor<1?1:scaleFactor;

                gsap.to(mesh.scale,{
                    x:scale,
                    y:scale,
                    z:scale
                })

                gsap.to(mesh.rotation,{
                    x:map(1,-1,mesh.initialRotation.x,radians(45),mesh.position.z),
                    y:map(1,-1,mesh.initialRotation.y,radians(90),mesh.position.z),
                    z:map(1,-1,mesh.initialRotation.z,radians(60),mesh.position.z),
                })
            }
        }
    }

    renderer.render(scene,camera);
    window.requestAnimationFrame(tick);
}

tick();
})