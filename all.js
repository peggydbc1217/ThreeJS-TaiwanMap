import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { cities } from './ref';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';



import { FontLoader } from 'three/addons/loaders/FontLoader.js';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 10)

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//讓滑鼠控制鏡頭, 帶入鏡頭跟renderer.domElement實例化它即可
// new OrbitControls(camera, renderer.domElement);
const control = new OrbitControls(camera, renderer.domElement);

// OrbitControl為了讓鏡頭面向target，它會修改camera.lookAt()。
// 你不應該直接修改camera.lookAt()，應當由OrbitControl處理。
//  OrbitControl不會在每幀渲染時自動控制，得用OrbitControl.update()更新。



//  const geometry = new THREE.BoxGeometry(1,1,1)
//  製作天球（背景） - 一個球 然後放超大
// const geometry = new THREE.SphereGeometry(100, 50, 50)// 參數帶入半徑、水平面數、垂直面數

// const material = new THREE.MeshNormalMaterial()
// const material = new THREE.MeshStandardMaterial({ color: 0xffffff }) // 帶入顏色

// 匯入材質(貼圖）
// const texture = new THREE.TextureLoader().load('https://storage.googleapis.com/umas_public_assets/michaelBay/free_star_sky_hdri_spherical_map_by_kirriaa_dbw8p0w%20(1).jpg')

// 帶入材質，設定內外面
// const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide })


// 加到畫面中
//  const cube = new THREE.Mesh(geometry, material);
//  scene.add(cube);
// const sphere = new THREE.Mesh(geometry, material);
// scene.add(sphere);

const loader = new FontLoader();
loader.load('https://storage.googleapis.com/umas_public_assets/michaelBay/day13/jf-openhuninn-1.1_Regular_cities.json', function (font) {


    // 改名成skydome

    const createSkydome = () => {
        const skydomeTexture = new THREE.TextureLoader().load('https://storage.googleapis.com/umas_public_assets/michaelBay/free_star_sky_hdri_spherical_map_by_kirriaa_dbw8p0w%20(1).jpg')
        const skydomeMaterial = new THREE.MeshBasicMaterial({ map: skydomeTexture, side: THREE.DoubleSide })
        const skydomeGeometry = new THREE.SphereGeometry(100, 50, 50)
        const skydome = new THREE.Mesh(skydomeGeometry, skydomeMaterial);
        scene.add(skydome);

        return skydome;
    }

    const skydome = createSkydome()

    //  cube.geometry.translate(5,0,0)
    //  cube.geometry.scale(2,1,1)
    //  找出北極星
    //  axesHelper, 顯示出xyz軸
    // const axesHelper = new THREE.AxesHelper(5);
    // scene.add(axesHelper);

    // arrowHelper, 一個箭頭，指向北極星, 找到座標為(-2.49, 4.74, -3.01)
    // const dir = new THREE.Vector3(-2.49, 4.74, -3.01).normalize();
    // const origin = new THREE.Vector3(0, 0, 0);
    // const length = 10;
    // const hex = 0xffff00;
    // const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
    // scene.add(arrowHelper);


    //Mesh、Group、Camera的旋轉，都是用歐拉角來儲存資訊的，就如同用向量來儲存位置、縮放資訊。
    //你不用刻意實例化一個歐拉角來運用，直接使用物件裡的旋轉資料即可應用歐拉角。

    // 把北極星的位置當作四元數的軸心，讓天球以北極星為中心旋轉。
    // 建立四元數 -  四元數在應用上的概念是，描述一個向量，再以該軸旋轉一個角度。而這個方法，就不像歐拉角那樣選定三個軸的夾角。
    // 用來描述3d旋轉的物件（除了歐拉角的另一種表達方式）

    // let quaternion = new THREE.Quaternion()
    // // 即將旋轉的弧度
    // let rotation = 0
    // // 由dir為軸心，rotation為旋轉弧度   
    // quaternion.setFromAxisAngle(dir, rotation);


    // 加入地球
    const createEarth = () => {
        const earthGeometry = new THREE.SphereGeometry(5, 600, 600)
        // 匯入材質（貼圖）
        const earthTexture = new THREE.TextureLoader().load('https://storage.googleapis.com/umas_public_assets/michaelBay/1280px-Solarsystemscope_texture_8k_earth_daymap.jpeg')

        //灰階高度貼圖   //灰階高度貼圖跟其他貼圖最大的差別是：所有錨點取樣材質圖的顏色以隆起錨點位置。
        const displacementTexture = new THREE.TextureLoader().load('https://storage.googleapis.com/umas_public_assets/michaelBay/day10/editedBump.jpg')

        //金屬貼圖, 海洋「金屬」一點，所以加入白色。我要讓陸地不金屬一點，所以使用黑色。
        const speculatMapTexture = new THREE.TextureLoader().load('https://storage.googleapis.com/umas_public_assets/michaelBay/day10/8081_earthspec2k.jpg')

        //光滑貼圖，透過這個貼圖，我讓海洋更光滑，讓陸地保持粗糙。這使得海洋會反射光現。凸顯材質的差異感。
        const roughtnessTexture = new THREE.TextureLoader().load('https://storage.googleapis.com/umas_public_assets/michaelBay/day10/8081_earthspec2kReversedLighten.png')

        // 帶入材質，設定內外面
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: earthTexture,
            side: THREE.DoubleSide,

            //加入網格
            // wireframe:true,

            // 將灰階高度貼圖貼到材質參數中
            displacementMap: displacementTexture,

            // 消除隆起, 控制錨點隆起的幅度
            displacementScale: 0.5,

            // 金屬貼圖
            metalnessMap: speculatMapTexture,
            // 由於預設金屬為0，所以必須調成1，才使得我們的貼圖可以呈現0~1的金屬範圍。黑代表0，白代表1
            metalness: 1,

            // 光滑貼圖
            roughnessMap: roughtnessTexture,
            roughness: 0.9,
        })
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        // earth.position.set(20, 0, 0)
        scene.add(earth);
        return earth;
    }

    const earth = createEarth()

    // 加入雲圖
    const createCloud = () => {
        // 雲的球比地球大一點
        const cloudGeometry = new THREE.SphereGeometry(5.3, 60, 60)
        const cloudTransparency = new THREE.TextureLoader().load('https://storage.googleapis.com/umas_public_assets/michaelBay/day10/8081_earthhiresclouds2K.jpg')
        const cloudMaterial = new THREE.MeshStandardMaterial({
            // 開啟透明功能 
            transparent: true,
            // 加上透明貼圖
            opacity: 1,
            alphaMap: cloudTransparency
        })
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        scene.add(cloud);

        return cloud;
    }

    const cloud = createCloud()

    // 加入圖釘
    const createRing = () => {
        const geo = new THREE.RingGeometry(0.1, 0.13, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(geo, mat);
        scene.add(ring);
        return ring;
    }

    const ring = createRing()




    // 新增下拉選單 可以選擇城市 自動跳到該城市
    const citySelect = document.getElementsByClassName('city-select')[0]
    // 渲染option
    citySelect.innerHTML = cities.map(city => `<option value="${city.id}">${city.name}</option>`)
    // 將LLA轉換成ECEF座標
    const llaToEcef = (lat, lon, alt, rad) => {
        let f = 0
        let ls = Math.atan((1 - f) ** 2 * Math.tan(lat))
        let x = rad * Math.cos(ls) * Math.cos(lon) + alt * Math.cos(lat) * Math.cos(lon)
        let y = rad * Math.cos(ls) * Math.sin(lon) + alt * Math.cos(lat) * Math.sin(lon)
        let z = rad * Math.sin(ls) + alt * Math.sin(lat)
        return new THREE.Vector3(x, y, z)
    }

    // 經緯度轉換成弧度, 由於弧度範圍是0~2π，但對於緯度來說範圍是90~-90，也對於經度來說是-180~180的範圍，所以必須將經緯度轉換成弧度。這就是該函式的作用。
    const lonLauToRadian = (lon, lat, rad) => llaToEcef(Math.PI * (0 - lat) / 180, Math.PI * (lon / 180), 1, rad)
    const center = new THREE.Vector3(0, 0, 0)

    // 作為lerp移動的結果參數, 這是用來讓圖釘移動到選擇的城市, ease out效果
    let lerpTarget;

    // 加上兩個變數 使鏡頭沿著赤道移動
    let moveAlongTropical = new THREE.Vector3(0, 0, 0)
    // moveAlongTropical的移動進度
    let moveProgress


    // 加入文字
    const addText = text => {
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 0.2,
            depth: 0.01,
            curveSegments: 2,
            bevelEnabled: false,
            bevelThickness: 10,
            bevelSize: 0,
            bevelOffset: 0,
            bevelSegments: 1
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)

        //移動文字, 不要擋住圖釘,  0.2是我們在建立TextGeometry時的文字寬度
        textMesh.geometry.translate(text.length * -0.15, 0.2, 0)
        scene.add(textMesh)

        return textMesh
    }


    // 初始化物件
    let text = addText('')


   //////////////// 選單加入傾聽事件，找出城市經緯度//////////////// 
    citySelect.addEventListener('change', (event) => {
        const cityId = event.target.value
        const seletedCity = cities.find(city => city.id + '' === cityId)

        // 用緯度轉座標function, 取得座標
        const cityEciPosition = lonLauToRadian(seletedCity.lon, seletedCity.lat, 4.4)


        // 指定位置給圖釘 - 並且校正圖釘角度即可- 這裡注意是x, -z, -y
        ring.position.set(cityEciPosition.x, -cityEciPosition.z, -cityEciPosition.y)
        // 圖釘永遠都看像世界中心，所以不會歪斜。
        // 不要用lookAt()控制鏡頭。這是因為OrbitControl是鏡頭方向的代理人，
        // 如果直接透過lookAt()控制鏡頭將使得控制鏡頭方向的代理人OrbitControl與lookAt()的操作衝突。
        // 然而lookAt()仍然是控制物件（鏡頭以外的物件）其角度很好的函式，我們在這裡使用它控制圖釘的角度。
        ring.lookAt(center)

        // 加上文字
        // 移除上一個城市的文字mesh
        text.removeFromParent()
        // 新增文字mesh
        text = addText(seletedCity.name)
        // 設定文字位置於圖釘上
        text.position.set(...ring.position.toArray())


        // 當用戶選城市時，更新lerp移動的結果參數
        lerpTarget = new THREE.Vector3(0, 0, 0)
            // 設定移動結果位置為圖釘位置
            .set(...ring.position.toArray())
            // 乘以三倍，使得位置位在城市正上方的外太空
            .multiplyScalar(3)

        // 這邊是直接設定鏡頭位置，跳到該城市
        // 取得城市位置正上方的外太空位置 將城市position向量放大三倍即可
        // camera.position.set(...ring.position.toArray()).multiplyScalar(3);
        // // 由OrbitControl幫我們更新鏡頭角度
        // control.update()

        // 給定moveAlongTropical於移動的起點
        moveAlongTropical.set(...camera.position.toArray())
        // pregress將由1走到0，控制稍候的變數「moveVolume」以做變化
        moveProgress = 1


    })


    // 新增太陽
    // const sunGeometry = new THREE.SphereGeometry(5, 50, 50)
    // const sunTexture = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/9/99/Map_of_the_full_sun.jpg')
    // const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture, side: THREE.DoubleSide })
    // const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    // scene.add(sun);


    // // 新增點光
    // const pointLight = new THREE.PointLight(0xffffff, 1)
    // scene.add(pointLight);
    // // 新增Helper
    // const lightHelper = new THREE.PointLightHelper(pointLight, 20, 0xffff00)
    // scene.add(lightHelper);
    // // 更新Helper
    // lightHelper.update();

    // 新增環境光
    const addAmbientLight = () => {
        const light = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(light)
    }
    // 新增點光
    const addPointLight = () => {
        const pointLight = new THREE.PointLight(0xffffff, 1)
        scene.add(pointLight);
        pointLight.position.set(10, 10, -10)
        pointLight.castShadow = true

        // // 新增Helper
        // const lightHelper = new THREE.PointLightHelper(pointLight, 20, 0xffff00)
        // scene.add(lightHelper);
        // // 更新Helper
        // lightHelper.update();
    }

    // 新增平行光
    const addDirectionalLight = () => {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
        directionalLight.position.set(0, 0, 10)
        scene.add(directionalLight);
        directionalLight.castShadow = true
        const d = 10;

        directionalLight.shadow.camera.left = - d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = - d;

        // // 新增Helper
        // const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 20, 0xffff00)
        // scene.add(lightHelper);
        // // 更新位置
        // directionalLight.target.position.set(0, 0, 0);
        // directionalLight.target.updateMatrixWorld();
        // // 更新Helper
        // lightHelper.update();
    }

    addPointLight()
    addAmbientLight()
    addDirectionalLight()



    let rotation = 0

    // 建立一個向量，以儲存鏡頭方向
    const cameraLookAt = new THREE.Vector3(0, 0, 0)

    function animate() {
        // // 不斷增加弧度
        // rotation += 0.001
        // // 更新四元數
        // quaternion.setFromAxisAngle(dir, rotation)
        // // 增加的弧度，要更新在天球上
        // sphere.rotation.setFromQuaternion(quaternion)

        rotation += 0.05

        // earth.rotation.y +=0.005
        cloud.rotation.y += 0.004
        skydome.rotation.y += 0.001

        // 讓鏡頭一直上下移動 - Pedestal Up/Down - 用設定position的方式, 直接移動鏡頭
        // camera.position.set(0,10 + Math.cos(rotation),15) // Math.cos的結果會在1~-1之間移動


        //不要修改camera的lookAt()，讓OrbitControl來處理，我們只要透過設定OrbitControl.target即可。
        //＊three.js有些物件有target（例如DirectionalLight），有些則無（如RectAreaLight）。有target就用，沒target那用lookAt()也OK的
        // 讓鏡頭上下移動- Tilt Up/Down - 用變化鏡頭所面對的方向 - 變化該向量
        // cameraLookAt.set(0, 0 + Math.cos(rotation), 0)
        // // 看向該向量
        // camera.lookAt(cameraLookAt)

        //用這方法來控制鏡頭的方向
        // control.target.set(10,0,0)
        // control.update()

        // 建立一個函式，使得鏡頭的航向可以往赤道移動
        let moveVolume = Math.pow(moveProgress * 2 - 1, 4.)

        // 用戶有選取城市才會執行下面, 不斷位移鏡頭
        if (lerpTarget) {
            // 鏡頭位置向城市上方的外太空移動
            // normalize()是為了讓向量長度為1，multiplyScalar()是為了放大向量, 讓鏡頭在移動過程都與地球保持固定距離


            // 綁定數值給moveAlongTropical  15是因為camera的起始位置z是15
            moveAlongTropical.lerp(lerpTarget, 0.05).normalize().multiplyScalar(10)
            // 現在，將camera位置綁定到moveAlongTropical上。其中由於moveVolume範圍是1~0，其減少了Y值的輸出
            camera.position.set(moveAlongTropical.x, moveAlongTropical.y * moveVolume, moveAlongTropical.z).normalize().multiplyScalar(10)


            // 使得OrbitControl不斷幫我們更新鏡頭
            control.update()
        }

        // 不斷更新progress，使得moveVolume不斷更新數值
        moveProgress *= 0.97

        // 使得文字一直看向鏡頭
        text.lookAt(...camera.position.toArray())

        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();



})

// 我們常誤用lookAt()來改變鏡頭面向，但此舉並無改變中心點target。導致用戶操作鏡頭時，OrbitControl變成預設的中心點0,0。
// 改使用  target.set, 再加上orbitControl.target 或 car.position.clone() 就能移動中心點
// 即使在用戶操作鏡頭時，也能從中心點控制。



// 使用HTML DOM元件製作文字，而非使用Mesh製作文字（Vector3.project/ Vector3.unproject）
// 在各大城市或國家加上一個圓柱。圓柱高度代表各國差異，變成一種資料視覺化。（CylinderGeometry）
// 加上飛機模型，模擬飛機或是船從A地飛到B地的畫面，以提供貨運資訊（Vector3.Lerp, Curve）