import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js'
import { SVGLoader } from 'https://unpkg.com/three@latest/examples/jsm/loaders/SVGLoader.js';
import { TextGeometry } from 'https://unpkg.com/three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'https://unpkg.com/three/examples/jsm/loaders/FontLoader.js';
import { loadSvgAndCreateMeshes } from './helper.js'


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(1100, 0, 1500)
const helper = new THREE.CameraHelper(camera);
scene.add(helper);



//定義全域變數, 用來存放hover, click時的操作
// Get a reference to the tooltip element
const tooltip = document.getElementById('tooltip');
let hoverIntersectedGroup;
let hoverIntersectedGroupColor;
let selectedCity;
let selectedCityColor;
let selectedArea;
let selectedAreaColor;

//lerp, used to animate the camera
let targetPosition;
let startPosition;
let progress = 0;
let targetRotation;
let startRotation;
let progressRotation = 0;

// 在camera, renderer宣後之後加上這行
const control = new OrbitControls(camera, renderer.domElement);

// Limit vertical rotation
// control.minPolarAngle = Math.PI / 6; // 30 degrees in radians
// control.maxPolarAngle = Math.PI * 5 / 6; // 150 degrees in radians

// Disable panning
control.enablePan = false;

// Set the target to the center of the scene
control.target.set(0, 0, 0);

// Required to make the changes take effect
control.update();


//  axesHelper, 顯示出xyz軸 
const dir = new THREE.Vector3(1, 2, 0);
dir.normalize();
const origin = new THREE.Vector3(0, 0, 0);
const length = 50;
const axesHelper = new THREE.ArrowHelper(dir, origin, length);
scene.add(axesHelper);

// 新增環境光
const addAmbientLight = () => {
    const light = new THREE.AmbientLight(0xffffff, 1)
    scene.add(light)
}

// 新增平行光
const addDirectionalLight = () => {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 0, 20)
    scene.add(directionalLight);
    directionalLight.castShadow = true
    const d = 10;

    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;

    // 新增Helper
    const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 0, 0xffff00)
    scene.add(lightHelper);
    // 更新位置
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.target.updateMatrixWorld();
    // 更新Helper
    lightHelper.update();
}

let isCountySelected = false;

const loader = new FontLoader();
loader.load('https://storage.googleapis.com/umas_public_assets/michaelBay/day13/jf-openhuninn-1.1_Regular_cities.json', function (font) {

    //定義SVGLoader()，使用函式.load() 或.loadAsync()匯入模型檔。
    // 善用loadAsync()，使得異步程式碼更加簡潔
    // const loadPathsFromSvg = async () => await new SVGLoader().loadAsync('https://storage.googleapis.com/umas_public_assets/michaelBay/day17/taiwan.svg', svgData => {
    //     console.log(svgData);
    // });

    // 加入文字
    const addText = text => {

        const textGeometry = new TextGeometry(text, {
            // font: font,
            size: 50,
            depth: 10,
            curveSegments: 2,
            bevelEnabled: false,
            bevelThickness: 10,
            bevelSize: 0,
            bevelOffset: 0,
            bevelSegments: 1
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)

        //移動文字, 不要擋住圖釘,  0.2是我們在建立TextGeometry時的文字寬度
        // textMesh.geometry.translate(text.length * -0.15, 20, 0)
        scene.add(textMesh)

        return textMesh
    }



    // const loadPathsFromSvg = async () => await new SVGLoader().loadAsync('./Taiwan_referendum_16_mapp.sv', svgData => {
    //     // console.log(svgData);
    // });


    let cities = ['Keelung', 'Taipei', 'NewTaipei', 'Taoyuan', 'Hsinchu_County', 'Hsinchu', 'Miaoli_County', 'Taichung', 'Changhua_County', 'Nantou_County', 'Yunlin_County', 'Chiayi_County', 'Chiayi', 'Tainan', 'Kaohsiung', 'Pingtung_County', 'Yilan_County', 'Hualien_County', 'Taitung_County', 'Penghu_County', 'Kinmen_County', 'Lienchiang_County']


    let allChildren = [];

    // Usage:
    (async () => {
        // const taipei = await loadSvgAndCreateMeshes('./Taiwan_referendum_16_map.svg', isCountySelected, scene)

        for (let city of cities) {
            let cityMeshes = await loadSvgAndCreateMeshes(`./resource/${city}.svg`, isCountySelected, scene);
            allChildren.push(...cityMeshes.children);
        }
    })();

    addAmbientLight()
    addDirectionalLight()


    // Step 1: Create a Raycaster and a Vector2
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Step 2: Add a mousemove event listener
    window.addEventListener('mousemove', (event) => {
        event.preventDefault();

        // 用NDC(Normalized Device Coordinates)來表示滑鼠的位置
        // (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }, false);


    // 初始化物件
    let text = addText('')

    let INTERSECTED;

    function hover() {
        // updates the raycaster to start from the camera and pass through the mouse's current position in normalized device coordinates.
        raycaster.setFromCamera(mouse, camera);

        // calculate objects intersecting the picking ray
        // This line calculates the objects that intersect with the ray. It returns an array of all the objects in group. children that the ray intersects with.
        // The true argument means that the function will check all descendants of the group, not just direct children. The returned array is sorted by distance, with the closest intersection first.
        // Each item in the array is an object that includes the intersected object and additional details about the intersection.

        //第一個參數要接收an array of objects, 不能放group而已
        const intersects = raycaster.intersectObjects(allChildren, true);

        // intersects是一個陣列，裡面包含了所有與raycaster相交的物件。
        // intersects[0].object 就是與raycaster相交的第一個物件。

        //     intersects[0] = {
        //     distance: 35.5,
        //     point: new THREE.Vector3(10, 20, 30),
        //     face: new THREE.Face3(0, 1, 2),
        //     object: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0x00ff00}))
        // }


        //把上一個hoverIntersectedGroup裡面所有的物件顏色改回原本的顏色
        if (hoverIntersectedGroup) {
            hoverIntersectedGroup.traverse((area) => {
                if (area instanceof THREE.Mesh && !selectedArea) {
                    area.material.color.setHex(hoverIntersectedGroupColor);
                }
            });
            hoverIntersectedGroup = null;
        }


        // If there's an intersection
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;

            //更新新的hoverIntersectedGroup
            allChildren.forEach(area => {
                if (area === intersectedObject) {
                    hoverIntersectedGroup = area.parent;
                    //紀錄當前hoverIntersectedGroup的顏色, 用在滑鼠移開時改回原本的顏色
                    hoverIntersectedGroupColor = hoverIntersectedGroup.children[0].material.color.getHex();
                }
            });


            if (!isCountySelected) {
                //show整個城市顏色
                showCityColor()

            } else {
                // 已經onclick了某個城市

                //如果有onclick某個鄉鎮, 就不要有任何hover動作
                if (selectedArea) {
                    return;
                }

                if (hoverIntersectedGroup === selectedCity) {
                    // hover到已經click的城市上, 秀出當前hover的鄉鎮名稱

                    // 把上一個intersected object的顏色改回原本的顏色
                    if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

                    // Store the new intersected object 
                    INTERSECTED = intersects[0].object;

                    // Store the original color of the intersected object
                    INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

                    // Change the color of the intersected object to red
                    INTERSECTED.material.color.setHex(0xff0000);

                    // Show the tooltip and set its content to the city name
                    tooltip.style.display = 'block';
                    tooltip.textContent = INTERSECTED.userData.areaName;
                    //convert from normalized device coordinates to pixel coordinates
                    tooltip.style.left = `${(mouse.x * 0.5 + 0.5) * window.innerWidth}px`;
                    tooltip.style.top = `${-(mouse.y * 0.5 - 0.5) * window.innerHeight}px`;

                    // 更新視角
                    // control.update()

                } else {
                    // 如果hover到不是click的城市上
                    // show整個城市的顏色
                    showCityColor()
                    tooltip.style.display = 'none';
                }
            }

        } else {
            //滑鼠移到空白處
            if (selectedArea) {
                return;
            }
            if (isCountySelected) {
                // 選擇了縣市, 但是滑鼠移開了
                if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
                tooltip.style.display = 'none';
                INTERSECTED = null;
            }
        }
    }


    renderer.domElement.addEventListener('mousedown', onClick, false);

    function onClick(event) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(allChildren, true);

        if (intersects.length > 0) {
            if (selectedArea) return;
            resetCity(selectedCity);

            //如果還沒選擇縣市, 或是已經選縣市了但是hover到不同的縣市, show縣市的顏色
            if (!isCountySelected || hoverIntersectedGroup !== selectedCity) {
                handleShowCity();
            } else {
                //已經選擇縣市, 且hover到同一個縣市, show鄉鎮的顏色
                let intersectedObject = intersects[0].object;
                handleShowArea(intersectedObject);
            }
        } else {
            //沒有選到任何縣市
            resetCity(selectedCity)
            isCountySelected = false;
            selectedCity = null;
            selectedCityColor = null;
            selectedArea = null;
            tooltip.style.display = 'none';
            resetCameraView();
        }
    }


    function animate() {
        requestAnimationFrame(animate);

        hover();
        // text.lookAt(...camera.position.toArray())
        // console.log(`Camera position: x = ${camera.position.x.toFixed(2)}, y = ${camera.position.y.toFixed(2)}, z = ${camera.position.z.toFixed(2)}`);

        if (progress < 1 && targetPosition && startPosition) {
            progress += 0.03; // speed of the animation
            camera.position.lerpVectors(startPosition, targetPosition, progress);
        }

        if (progressRotation < 1 && targetRotation && startRotation) {
            progressRotation += 0.03; // speed of the rotation animation
            camera.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * progressRotation;
        }

        renderer.render(scene, camera);
    }

    animate();

})


/////////////Helper/////////////////////////////////////////
function handleShowCity() {
    hoverIntersectedGroup.traverse((area) => {
        if (area instanceof THREE.Mesh) {
            // Set the color of the area
            let color = hoverIntersectedGroupColor ? hoverIntersectedGroupColor : 0xffffff;
            area.material.color.setHex(color);

            // Create edges for the mesh
            const edgesGeometry = new THREE.EdgesGeometry(area.geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

            const lineSegments = new THREE.LineSegments(edgesGeometry, lineMaterial);
            lineSegments.raycast = function () { };
            // Keep a reference to the LineSegments
            area.userData.edges = lineSegments;

            //讓選擇的城市看起來更立體
            let shape = area.geometry.parameters.shapes;
            let extrudeSettings = {
                depth: -10, // updated depth of the extrusion
                bevelEnabled: true,
                bevelThickness: 0.5,
                ...area.geometry.parameters.options
            };
            let newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            // Replace the old geometry
            area.geometry.dispose(); // Dispose of the old geometry
            area.geometry = newGeometry; // Assign the new geometry
        }
    });

    selectedCity = hoverIntersectedGroup;
    selectedCityColor = hoverIntersectedGroupColor;
    isCountySelected = true;
    setCameraViewTo(selectedCity);
}

function handleShowArea(intersectedObject) {
    //已經選擇縣市, 且hover到同一個縣市, show鄉鎮的顏色
    selectedCity.traverse(area => {
        if (area !== intersectedObject) {
            removeEdgesFromArea(area);
        } else {
            selectedArea = area;
            showArea(area);
        }
    });
}


function resetCameraView() {
    progress = 0;
    targetPosition = new THREE.Vector3(1100, 0, 1500);
    startPosition = camera.position.clone();

    progressRotation = 0;
    targetRotation = new THREE.Euler(0, 0, 0, 'XYZ');
    startRotation = camera.rotation.clone();
}

function showCityColor() {
    hoverIntersectedGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.material.color.setHex(0xff0000);
        }
    });
}

function removeEdgesFromArea(area) {
    area.remove(area.userData.edges);
}

function showArea(area) {
    area.material.color.setHex(0xffff00);
    area.userData.edges.material.color.setHex(0x000000);

    //讓選擇的城市看起來更立體
    let shape = area.geometry.parameters.shapes;
    let extrudeSettings = {
        depth: -10, // updated depth of the extrusion
        bevelEnabled: true,
        bevelThickness: 0.5,
        ...area.geometry.parameters.options
    };
    let newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Replace the old geometry
    area.geometry.dispose(); // Dispose of the old geometry
    area.geometry = newGeometry; // Assign the new geometry


    setCameraViewTo(area);
}

function resetCity(city) {
    if (city) {
        //把上一個selectedCity裡面所有的物件顏色改回原本的顏色
        city.traverse((area) => {
            if (area instanceof THREE.Mesh) {
                // Reset the color
                area.material.color.setHex(selectedCityColor);
                //remove the edges 
                area.remove(area.userData.edges);

                //把城市的立體感拿掉
                let shape = area.geometry.parameters.shapes;
                let extrudeSettings = {};
                let newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                // Replace the old geometry
                area.geometry.dispose(); // Dispose of the old geometry
                area.geometry = newGeometry; // Assign the new 
            }
        }
        );
    }
}

function setCameraViewTo(target) {
    //計算城市的中心點, 並把camera移動到中心點
    // Create a Box3 and set it to include all objects in the group
    let box = new THREE.Box3().setFromObject(target);

    // Compute the size of the bounding box
    let size = new THREE.Vector3();
    box.getSize(size);

    let tiltAngle = Math.PI / 180; // 30 degrees tilt

    // Calculate the diagonal of the bounding box
    let diagonal = new THREE.Vector3().subVectors(box.max, box.min).length();

    let distance = diagonal / (2 * Math.tan((camera.fov / 2) * (Math.PI / 180))) * (1 / 0.8);

    // Adjust the camera position to account for the tilt
    let zAdjustment = distance * Math.cos(tiltAngle);
    let yAdjustment = distance * Math.sin(tiltAngle);

    // Get the center point
    let center = new THREE.Vector3();
    box.getCenter(center);

    // tansition for the camera animation
    progress = 0;
    targetPosition = new THREE.Vector3(center.x, center.y - yAdjustment, center.z + zAdjustment);
    startPosition = camera.position.clone();

    // rotation for the camera animation
    progressRotation = 0;
    targetRotation = new THREE.Euler(tiltAngle, 0, 0, 'XYZ'); // 30 degrees tilt
    startRotation = camera.rotation.clone();
}