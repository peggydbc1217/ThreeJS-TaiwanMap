import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js'
import { SVGLoader } from 'https://unpkg.com/three@latest/examples/jsm/loaders/SVGLoader.js';
import { TextGeometry } from 'https://unpkg.com/three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'https://unpkg.com/three/examples/jsm/loaders/FontLoader.js';
import { loadSvgAndCreateMeshes } from './helper.js'
import Stats from 'stats.js'
import schoolData from './schools.js';

//fps
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

//svg來源
//https://commons.wikimedia.org/wiki/File:Taiwan_referendum_16_map.svg

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000)
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(1100, -1000, 1500)
// const helper = new THREE.CameraHelper(camera);
// scene.add(helper);


//定義全域變數, 用來存放hover, click時的操作
// Get a reference to the tooltip element
const tooltip = document.getElementById('tooltip');
let hoverIntersectedGroup;
let hoverIntersectedGroupColor;
let selectedCity;
let selectedCityColor;
let hoveredArea;
let selectedArea;
let selectedAreaColor = '0xffff00';

//tool
let mouse = new THREE.Vector2();

//lerp, used to animate the camera
let targetPosition;
let startPosition;
let progress = 0;
let targetRotation;
let startRotation;
let progressRotation = 0;

//oigin
let svgCenterLatLng = [24.005198, 120.652659]
let svgCenterThree = [720.0, -828.20]

//distance:5.237 km

//草屯虎山國小 new location
let newloactionLatLng = [23.9641328, 120.6778911]
// let newLocationThree = [737.30, -853.20]

let cities = ['Keelung', 'Taipei', 'NewTaipei', 'Taoyuan', 'Hsinchu_County', 'Hsinchu', 'Miaoli_County', 'Taichung', 'Changhua_County', 'Nantou_County', 'Yunlin_County', 'Chiayi_County', 'Chiayi', 'Tainan', 'Kaohsiung', 'Pingtung_County', 'Yilan_County', 'Hualien_County', 'Taitung_County', 'Penghu_County', 'Kinmen_County', 'Lienchiang_County']

//用來定義hover物件
let allChildren = [];




runThreeHelper()
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


    // Usage:
    (async () => {
        // const taipei = await loadSvgAndCreateMeshes('./Taiwan_referendum_16_map.svg', isCountySelected, scene)

        // Create an array of promises
        let promises = cities.map(city => loadSvgAndCreateMeshes(`./resource/${city}.svg`, isCountySelected, scene));

        // Wait for all promises to resolve
        let cityMeshesArray = await Promise.all(promises);


        // Add all the meshes to allChildren
        for (let cityMeshes of cityMeshesArray) {
            allChildren.push(...cityMeshes.children);
        }

        // // 放出helper axis 
        // // Create a bounding box
        // let boundingBox = new THREE.Box3();
        // // For each mesh in allChildren, expand the bounding box to include the mesh
        // for (let child of allChildren) {
        //     boundingBox.expandByObject(child);
        // }
        // // The center of the bounding box is the center of the SVG files
        // let svgCenter = boundingBox.getCenter(new THREE.Vector3());
        // addHelperAxis(svgCenter)

    })();





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

    //有選擇的鄉鎮, hover道別的鄉鎮--> 移開後不會刪除顏色

    function hover() {

        raycaster.setFromCamera(mouse, camera);
        //第一個參數要接收an array of objects, 不能放group而已
        const intersects = raycaster.intersectObjects(allChildren, true);

        // If there's an intersection
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;

            if (isCountySelected) {

                if (selectedArea) {

                    //hover同城市的鄉鎮
                    if (intersectedObject.parent === selectedCity) {

                        //hover的鄉鎮是已經選擇的鄉鎮
                        if (intersectedObject === selectedArea) {
                            resetHoverEffect(selectedArea);
                            return;
                        } else {
                            //上一個hover的鄉鎮是已經選擇的鄉鎮
                            if (hoveredArea === selectedArea) {
                                handleHoverArea(intersectedObject)
                            } else {
                                resetHoverEffect(selectedArea);
                                handleHoverArea(intersectedObject);
                            }
                        }

                    } else {
                        //上一個hover的元素是已經選擇的鄉鎮
                        if (hoveredArea === selectedArea) {
                            handleHoverCity(intersectedObject);
                        } else {
                            resetHoverEffect(selectedArea);
                            handleHoverCity(intersectedObject);
                        }

                    }
                } else {
                    //hover同城市的鄉鎮
                    if (intersectedObject.parent === selectedCity) {
                        resetHoverEffect();
                        handleHoverArea(intersectedObject)
                    } else {
                        resetHoverEffect();
                        handleHoverCity(intersectedObject);
                    }
                }

            } else {
                //沒選擇城市
                resetHoverEffect();
                handleHoverCity(intersectedObject);
            }
        } else {
            //滑鼠在空白處
            resetHoverEffect(selectedArea);
        }
    }


    renderer.domElement.addEventListener('mousedown', onClick, false);

    function onClick(event) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(allChildren, true);

        if (intersects.length > 0) {

            const intersectedObject = intersects[0].object;

            if (intersectedObject && intersectedObject.userData.siteName) {
                handleClickSite(intersectedObject);
                return;
            }

            //如果還沒選擇城市, 或是已經選城市了但是又選不同的城市, show城市的特效
            if (!isCountySelected || intersectedObject.parent !== selectedCity) {
                resetCityEffect();
                handleClickCity(intersectedObject);
            } else {

                //已經選擇城市, 且選擇到同一個城市內的鄉鎮, show鄉鎮的顏色
                if (intersectedObject.parent === selectedCity) {
                    handleClickArea(intersectedObject);
                } else {
                    resetCityEffect();
                    handleClickCity(intersectedObject);
                }
            }
        } else {
            //沒有選到任何城市
            resetCityEffect();
            isCountySelected = false;
            selectedCity = null;
            selectedCityColor = null;
            selectedArea = null;
            tooltip.style.display = 'none';
            resetCameraView();
        }
    }

    //把案場加上地圖
    schoolData.forEach(school => {
        const { lat, lng, name } = school;
        createTraingle(latLngToCustom(lat, lng), name);
    });


    function animate() {
        stats.begin()
        requestAnimationFrame(animate);

        // hover();
        // text.lookAt(...camera.position.toArray())
        // console.log(`Camera position: x = ${camera.position.x.toFixed(2)}, y = ${camera.position.y.toFixed(2)}, z = ${camera.position.z.toFixed(2)}`);

        if (progress < 1 && targetPosition && startPosition) {
            progress += 0.04; // speed of the animation, 
            // 這裡不要設成不能整除1的數字
            // 不然會有一點點的誤差, 造成最後的位置不是targetPosition
            // JS的浮點數運算有時候會有誤差

            camera.position.lerpVectors(startPosition, targetPosition, progress);
        }


        if (progressRotation < 1 && targetRotation && startRotation) {
            progressRotation += 0.04; // speed of the rotation animation
            // 這裡不要設成不能整除1的數字
            // 不然會有一點點的誤差, 造成最後的位置不是targetPosition
            // JS的浮點數運算有時候會有誤差

            camera.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * progressRotation;
        }


        // control.update();

        renderer.render(scene, camera);
        stats.end()
    }

    animate();

})



//////////////////////////////////////Helper/////////////////////////////////////////
function handleClickCity(intersectedObject) {

    selectedCity = null;
    selectedCityColor = null;
    selectedArea = null;

    allChildren.forEach(area => {
        if (area === intersectedObject) {
            selectedCity = area.parent;
            selectedCityColor = area.currentHex;
        }
    });

    selectedCity.traverse((area) => {
        if (area instanceof THREE.Mesh) {
            // Set the color of the area
            area.currentHex = area.material.color.getHex();

            // Create edges for the mesh
            // const edgesGeometry = new THREE.EdgesGeometry(area.geometry);
            // const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

            // const lineSegments = new THREE.LineSegments(edgesGeometry, lineMaterial);
            // lineSegments.raycast = function () { };
            // // Keep a reference to the LineSegments
            // area.userData.edges = lineSegments;

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

    isCountySelected = true;
    setCameraViewTo(selectedCity);
}

function handleClickArea(intersectedObj) {

    //reset上個選擇的鄉鎮的顏色
    if (selectedArea) {
        // console.log('last selected area = ', selectedArea.userData.areaName);
        selectedArea.material.color.setHex(selectedAreaColor);
    }

    //已經選擇城市, 且選同個城市內的鄉鎮, show鄉鎮的顏色
    selectedCity.traverse((area) => {
        //three group的第一個元素是他自己, 所以要過濾掉
        if (area instanceof THREE.Group) {
            return;
        }

        if (area.userData.areaName === intersectedObj.userData.areaName) {
            showArea(area);
        }
    });
}

let rectangles = [];

function handleClickSite(intersectedObj) {

    // Remove previous rectangles
    for (let i = 0; i < rectangles.length; i++) {
        scene.remove(rectangles[i]);
    }
    // Clear the array
    rectangles = [];


    let material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    let offset = 10;
    let sizeOfintersectedObj = 1;
    let width = 0.1;
    let height = 17;

    // create 4 rectangles around the intersected object
    for (let i = 0; i < 4; i++) {

        let geometry = new THREE.PlaneGeometry(width, height);
        let rectangle = new THREE.Mesh(geometry, material);
        rectangle.position.copy(intersectedObj.position);
        

        switch (i) {
            case 0: // Top
                rectangle.position.y += offset;

                break;
            case 1: // Bottom
                rectangle.position.y -= offset - 1;
                break;
            case 2: // Left
                rectangle.rotateZ(Math.PI / 2);
                rectangle.position.y += sizeOfintersectedObj/2;
                rectangle.position.x -= offset;
                break;
            case 3: // Right
                rectangle.rotateZ(Math.PI / 2);
                rectangle.position.y += sizeOfintersectedObj/2;
                rectangle.position.x += offset;
                break;
        }

        rectangles.push(rectangle);

        scene.add(rectangle);
    }

    setCameraViewTo(intersectedObj);
    
}

function showArea(area) {
    // console.log('selected area =', area.userData.areaName);

    selectedArea = area;
    selectedAreaColor = area.currentHex;
    area.material.color.setHex(0x0000ff);

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


function resetCityEffect() {

    if (selectedCity) {
        //把上一個selectedCity裡面所有的鄉鎮特效清除
        selectedCity.traverse((area) => {
            if (area instanceof THREE.Mesh) {
                // Reset the color
                area.material.color.setHex(area.currentHex);

                // remove the edges 
                // area.remove(area.userData.edges);

                //城市的立體感拿掉
                let shape = area.geometry.parameters.shapes;
                let extrudeSettings = {
                    // depth: 0, // updated depth of the extrusion
                    // ...area.geometry.parameters.options
                };
                let newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

                // Replace the old geometry
                area.geometry.dispose(); // Dispose of the old geometry
                area.geometry = newGeometry; // Assign the new 
            }
        }
        );
    }

    if (selectedArea) {
        selectedArea.material.color.setHex(selectedAreaColor);
    }
}


function resetCameraView() {
    progress = 0;
    targetPosition = new THREE.Vector3(1100, 0, 1500);
    startPosition = camera.position.clone();

    progressRotation = 0;
    targetRotation = new THREE.Euler(0, 0, 0, 'XYZ');
    startRotation = camera.rotation.clone();
}

function handleHoverCity(intersectedObject) {
    updateHoverUnit(intersectedObject);
    hoverIntersectedGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.material.color.setHex(0xff0000);
        }
    });
}

function resetHoverEffect(selectedArea) {

    //整個city的鄉鎮改回原本的顏色
    if (hoverIntersectedGroup) {
        hoverIntersectedGroup.traverse((area) => {
            if (area instanceof THREE.Mesh && area !== selectedArea) {
                console.log(area);
                area.material.color.setHex(hoverIntersectedGroupColor);
            }
        });

        hoverIntersectedGroup = null;
    }

    //某個鄉鎮改回原本的顏色    
    if (hoveredArea && hoveredArea !== selectedArea) {
        hoveredArea.material.color.setHex(hoveredArea.currentHex);
        hoveredArea = null;
    }
}



function handleHoverSite(intersectedObject) {
    let orgColor = intersectedObject.material.color;
    intersectedObject.userData.color = orgColor;
    intersectedObject.material.color.setHex(0xff0000);
    console.log('perform hover action');
}




function updateHoverUnit(intersectedObject) {
    if (intersectedObject) {
        //更新hoverIntersectedGroup, hoveredArea
        allChildren.forEach(area => {
            if (area === intersectedObject) {

                hoverIntersectedGroup = area.parent;
                hoveredArea = intersectedObject;

                //紀錄當前hoverIntersectedGroup的顏色, 用在滑鼠移開時改回原本的顏色
                hoverIntersectedGroupColor = hoverIntersectedGroup.children[0].material.color.getHex();


                // 儲存原本的鄉鎮顏色, 用在之後改變回去 
                hoveredArea.currentHex = hoveredArea.material.color.getHex();
            }
        });
    }
}

function removeEdgesFromArea(area) {
    area.remove(area.userData.edges);
}


function handleHoverArea(intersectedObject) {

    updateHoverUnit(intersectedObject);

    // 更新鄉鎮的顏色成紅色
    hoveredArea.material.color.setHex(0xff0000);

    // Show the tooltip
    tooltip.style.display = 'block';
    tooltip.textContent = hoveredArea.userData.areaName;
    //convert from normalized device coordinates to pixel coordinates
    tooltip.style.left = `${(mouse.x * 0.5 + 0.5) * window.innerWidth}px`;
    tooltip.style.top = `${-(mouse.y * 0.5 - 0.5) * window.innerHeight}px`;

    // 更新視角
    // control.update()
}




function setCameraViewTo(target) {
    //計算城市的中心點, 並把camera移動到中心點
    // Create a Box3 and set it to include all objects in the group
    let box = new THREE.Box3().setFromObject(target);

    // Compute the size of the bounding box
    let size = new THREE.Vector3();
    box.getSize(size);

    let tiltAngle = Math.PI / 90; // 30 degrees tilt

    // Calculate the diagonal of the bounding box
    let diagonal = new THREE.Vector3().subVectors(box.max, box.min).length();
    let distance = diagonal / (2 * Math.tan((camera.fov / 2) * (Math.PI / 180))) * (1 / 0.85);

    // Adjust the camera position to account for the tilt
    let minZAdjustment = 38;
    let zAdjustment = Math.max(distance * Math.cos(tiltAngle), minZAdjustment);
    let yAdjustment = distance * Math.sin(tiltAngle);

    // Get the center point
    let center = new THREE.Vector3();
    box.getCenter(center);

    // box helper 
    // let helper = new THREE.Box3Helper(box, 0xffff00);
    // scene.add(helper);

    // tansition for the camera animation
    progress = 0;
    targetPosition = new THREE.Vector3(center.x, center.y + yAdjustment, center.z + zAdjustment);
    startPosition = camera.position.clone();

    // rotation for the camera animation
    progressRotation = 0;
    targetRotation = new THREE.Euler(tiltAngle, 0, 0, 'XYZ'); // 30 degrees tilt
    startRotation = camera.rotation.clone();
}


function runThreeHelper() {

    // // 在camera, renderer宣後之後加上這行
    // const control = new OrbitControls(camera, renderer.domElement);

    // document.getElementById('resetButton').addEventListener('click', function () {
    //     resetCameraView();
    //     control.target.set(0, 0, 0);
    //     control.update();

    // });

    // // control.enablePan = false;

    // // control.enableKeys = true;
    // // control.keys = {
    // //     LEFT: THREE.MOUSE.PAN,
    // //     // UP: 38, // up arrow
    // //     // RIGHT: 39, // right arrow
    // //     // BOTTOM: 40 // down arrow
    // // }

    // control.listenToKeyEvents(window);
    // // Set the target to the center of the scene
    // control.target.set(0, 0, 0);

    // // Required to make the changes take effect
    // control.update();

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

    addAmbientLight()
    addDirectionalLight()
}

function addHelperAxis(svgCenter) {
    //  axesHelper, 顯示出xyz軸 
    const xDir = new THREE.Vector3(1, 0, 0);
    const yDir = new THREE.Vector3(0, 1, 0);
    const zDir = new THREE.Vector3(0, 0, 1);
    xDir.normalize();
    yDir.normalize();
    zDir.normalize();
    // const origin = new THREE.Vector3(0, 0, 0);
    const origin = svgCenter;
    const length = 500;
    const axesHelperX = new THREE.ArrowHelper(xDir, origin, length, 0xffff00);
    const axesHelperY = new THREE.ArrowHelper(yDir, origin, length, 0xffffff);
    const axesHelperZ = new THREE.ArrowHelper(zDir, origin, length, 0x00ffff);

    scene.add(axesHelperX);
    scene.add(axesHelperY);
    scene.add(axesHelperZ);
}



// Convert a latitude/longitude point to custom coordinate system
function latLngToCustom(newLat, newLon) {
    //svg的中心點
    let lat1 = 24.005198;
    let lon1 = 120.652659;
    let x1 = 720.0;
    let y1 = -828.20;

    //隨便用map找一個地方
    let lat2 = 24.312676;
    let lon2 = 121.770973;
    let x2 = 1315;
    let y2 = -650;

    // Calculate the scale factors
    let xScale = (x2 - x1) / (lon2 - lon1);
    let yScale = (y2 - y1) / (lat2 - lat1);

    // Calculate the offsets
    let xOffset = x1 - lon1 * xScale - 1;
    //this -1 magic value is obtained from the real svg display and manual adjustment

    let yOffset = y1 - lat1 * yScale + 2.5;
    //this 2.5 magic value is from obtained the real svg display and manual adjustment

    // Convert the new latitude/longitude to the custom coordinate system
    let newX = newLon * xScale + xOffset;
    let newY = newLat * yScale + yOffset;


    return new THREE.Vector3(newX, newY, 10);
}

function createTraingle(vector3, siteName) {
    // Create a new shape
    let shape = new THREE.Shape();

    // Move to the first point of the triangle
    shape.moveTo(0, 0);

    // Draw lines to the other two points
    shape.lineTo(1.2, 0);
    shape.lineTo(0, 1.2);

    // Close the shape
    shape.closePath();

    // Create a geometry from the shape
    let geometry = new THREE.ShapeGeometry(shape);

    // Create a material
    let material = new THREE.MeshBasicMaterial({ color: 0xFFA500 });

    // Create a mesh from the geometry and material
    let triangle = new THREE.Mesh(geometry, material);

    //儲存名稱
    triangle.userData.siteName = siteName;

    // Set the position of the triangle
    triangle.position.set(vector3.x, vector3.y, vector3.z);

    // Set the rotation of the triangle
    let rotation = new THREE.Vector3(0, 0, Math.PI / 4);
    triangle.rotation.set(rotation.x, rotation.y, rotation.z);

    allChildren.push(triangle);

    // Add the triangle to the scene
    scene.add(triangle);

}


