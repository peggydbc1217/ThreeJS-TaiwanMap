import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js'
import { SVGLoader } from 'https://unpkg.com/three@latest/examples/jsm/loaders/SVGLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export async function loadSvgAndCreateMeshes(svgPath, isCountySelected, scene) {

    let svgData = null;
    const loadPathsFromSvg = async () => await new SVGLoader().loadAsync(svgPath, svgData => {
        // console.log(svgData);
    });;

    svgData = await loadPathsFromSvg();

    const paths = svgData.paths;
    // shapePath是什麼？
    // shapePath 是一種能夠儲存多個shape的Path。
    // 能透過.toShape() 或是 SVGLoader.createShapes() 來轉成Shape。


    const group = new THREE.Group();

    // 將Path轉成3D Mesh
    paths.forEach((path, i) => {
        //#1f3d4c
        const color = path.color;

        const material = new THREE.MeshStandardMaterial({
            color,
            side: THREE.DoubleSide,
        });
        const shapes = SVGLoader.createShapes(path);

        // 透過SVGLoader.createShapes()->產生出shape(geometry)
        shapes.forEach((shape) => {
            //實例化Shape 成為Mesh，加到場景中
            const geometry = new THREE.ExtrudeGeometry (shape, {
                // depth: -10,
                // bevelEnabled: true,
                steps: 1,
                // bevelSegments: 1
            });
            const mesh = new THREE.Mesh(geometry, material);

            // Add the cityName to the userData property of the mesh
            mesh.userData.areaName = path.userData.node.id;


            if (isCountySelected) {
                //如果有選擇county, 把每個區都加上邊緣線
                const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                const lineSegments = new THREE.LineSegments(edgesGeometry, lineMaterial);

                //防止hover時，邊緣線被選取
                lineSegments.raycast = function () { };

                mesh.add(lineSegments);
            }
            group.add(mesh);
        })
    })

    if (!isCountySelected) {

    }


    // Three.js的(0,0)原點為左下，而SVG的(0,0)原點為左上，導致在SVGLoader在匯入時，會顛倒。
    // 只要用.rotateX(Math.PI)把整個畫面旋轉即可。又或者將Perspectiveamera.up設置成-1 ，使得鏡頭方向上下顛倒。
    group.rotateY(Math.PI);
    group.rotateZ(Math.PI);
    // const box = new THREE.Box3().setFromObject(group);
    // const center = box.getCenter(new THREE.Vector3());
    // group.position.sub(center);
    scene.add(group);

    return group;
}



//由於我們把模型用group.rotateX(Math.PI)翻到了背面，雖然這麼做使得台灣是面向鏡頭的，但實際上extrude是往背面長出來的。
//所以要把depth設成負值，才能讓extrude是往正面長出來
// depth: -dataRaw.rate,
// depth: -10,
// 取消bevel、steps設成1 -> 效能考量, 簡化路徑
// steps: 1,
// bevelEnabled: true,