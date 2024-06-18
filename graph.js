import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// 假設圖表拿到這筆資料
const data = [
	{ rate: 14.2, name: '動力控制IC' },
	{ rate: 32.5, name: '電源管理IC' },
	{ rate: 9.6, name: '智慧型功率IC' },
	{ rate: 18.7, name: '二極體Diode' },
	{ rate: 21.6, name: '功率電晶體Power Transistor' },
	{ rate: 3.4, name: '閘流體Thyristor' },
]

// 我準備了簡單的色票，作為圓餅圖顯示用的顏色
const colorSet = [
	0x729ECB,
	0xA9ECD5,
	0xA881CB,
	0xF3A39E,
	0xFFD2A1,
	0xBBB5AE,
	0xE659AB,
	0x88D9E2,
	0xA77968,
]

const scene = new THREE.Scene();

// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const loader = new FontLoader();
loader.load('https://storage.googleapis.com/umas_public_assets/michaelBay/day13/jf-openhuninn-1.1_Regular_cities.json', function (font) {

	// 目前使用PerspectiveCamera，它是有透視（即有消失點）的鏡頭，它使畫面扭曲。
	// 為了避免扭曲，我們使用無透視的OrthographicCamera鏡頭。
	// 如果今天要比較比例大小，那麼使用OrthographicCamera來比較差異就方便許多。
	const windowRatio = window.innerWidth / window.innerHeight
	const camera = new THREE.OrthographicCamera(-windowRatio * 10, windowRatio * 10, 10, -10, 0.1, 1000)
	camera.position.set(0, 3, 15)

	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// 在camera, renderer宣後之後加上這行
	new OrbitControls(camera, renderer.domElement);

	// 把背景改成白色
	scene.background = new THREE.Color(0x000000)


	const createPie = (startAngle, endAngle, color, depth, textContent, rate) => {
		// 實作弧形
		const curve = new THREE.EllipseCurve(
			0, 0, // 橢圓形的原點
			5, 5, // X軸的邊長、Y軸的邊長
			startAngle, endAngle, // 起始的角度、結束的角度（90度）
			false,// 是否以順時鐘旋轉
			0//旋轉橢圓
		)
		// 轉成二維座標點  50，它就會將線段點出50個點
		const curvePoints = curve.getPoints(50)

		//建立一個形狀
		const shape = new THREE.Shape(curvePoints)

		// 從當前的.currentPoint劃線到原點
		shape.lineTo(0, 0)
		// 將整個線段的頭尾相連
		shape.closePath()

		// 平面圖用的
		// const shapeGeometry = new THREE.ShapeGeometry(shape)

		// 線段本身並沒有Mesh。所以我們要建立Geometry。
		// 做出3D的圓餅圖，那麼是用ExtrudeGeometry最為合適。
		const shapeGeometry = new THREE.ExtrudeGeometry(shape, {
			depth: depth * 2, // 隆起高度
			steps: 1, // 在隆起的3D物件中間要切幾刀線

			// bevel 是用來解決邊緣的問題，讓邊緣更加平滑
			bevelEnabled: false, // 倒角（隆起向外擴展）
			bevelThickness: 0.2, // extrude方向如果是向上，那這參數調整倒角向上增厚的程度
			bevelSize: 0.2, // extrude方向如果是向上，那這參數調整左右向外擴張的程度
			bevelOffset: 0, // 製作倒角之前的位移
			bevelSegments: 6 // 倒角的細緻度
		})


		// 調整bevel後 圓餅會重疊, 這邊調整使他不重疊
		const middleAngle = (startAngle + endAngle) / 2
		const x = Math.cos(middleAngle)
		const y = Math.sin(middleAngle)
		shapeGeometry.translate(x * 0.2, y * 0.2, 0)


		//每個餅都加入文字
		const addText = (text, color) => {
			const textGeometry = new TextGeometry(text, {
				font: font,
				size: 0.5,
				depth: 0.01, //文字厚度
				curveSegments: 2, // 文字中曲線解析度
				bevelEnabled: false, // 是否用bevel
			});
			const textMaterial = new THREE.MeshBasicMaterial({ color: color })
			const textMesh = new THREE.Mesh(textGeometry, textMaterial)
			scene.add(textMesh)
			return textMesh
		}
		
		console.log(textContent, rate);
		
		const text = addText(`${textContent}: ${rate}%`, color)

		// 由於圓餅圖半徑為5，所以設比它高一點，8
		const textDistance = 8
		text.geometry.translate(x * textDistance, y * textDistance, 0)
		// 修正文字置左時的偏移
		text.geometry.translate(x-([...textContent].length)*0.2,y,0)


		// MeshBasicMaterial是最基本的材質，不會有陰影
		// 用MeshStandardMaterial才可以有陰影, MeshStandardMaterial為常見的材質輸出結果。由此可以獲得GLTF格式的最大相容性。
		const shapeMaterial = new THREE.MeshStandardMaterial({ color: color, wireframe: false })
		const mesh = new THREE.Mesh(shapeGeometry, shapeMaterial)
		scene.add(mesh)
		return { pieMesh: mesh, pieText: text }
	}

	const dataToPie = (data) => {
		// 我用sum來記憶上一個餅的結束位置，使得每個餅都從上一個結束弧度位置開始繪製。
		let sum = 0

		//幫餅排序, 讓他看起來是高到低 不會高高低低
		data = data.sort((a, b) => b.rate - a.rate)

		const pieTexts = []
		let pieMeshes = []

		data.forEach((datium, i) => {
			// 將百分比轉換成0~2PI的弧度 -> 套公式
			const radian = datium.rate / 100 * (Math.PI * 2)

			const { pieMesh, pieText } = createPie(sum, radian + sum, colorSet[i], radian, datium.name, datium.rate)

			pieTexts.push(pieText)
			pieMeshes.push(pieMesh)
			sum += radian
		})
		return { pieMeshes, pieTexts }
	}

	dataToPie(data)

	const { pieMeshes, pieTexts } = dataToPie(data)


	// 新增環境光
	const addAmbientLight = () => {
		const light = new THREE.AmbientLight(0xffffff, 0.6)
		scene.add(light)
	}

	// 新增點光
	const addPointLight = () => {
		const pointLight = new THREE.PointLight(0xffffff, 0.2)
		scene.add(pointLight);
		pointLight.position.set(3, 3, 3)
		pointLight.castShadow = true
		// 新增Helper
		const lightHelper = new THREE.PointLightHelper(pointLight, 20, 0xffff00)
		// scene.add(lightHelper);
		// 更新Helper
		lightHelper.update();
	}

	// 新增平行光
	const addDirectionalLight = () => {
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
		directionalLight.position.set(20, 20, 20)
		scene.add(directionalLight);
		directionalLight.castShadow = true
		const d = 10;

		directionalLight.shadow.camera.left = - d;
		directionalLight.shadow.camera.right = d;
		directionalLight.shadow.camera.top = d;
		directionalLight.shadow.camera.bottom = - d;

		// 新增Helper
		const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 20, 0xffff00)
		// scene.add(lightHelper);
		// 更新位置
		directionalLight.target.position.set(0, 0, 0);
		directionalLight.target.updateMatrixWorld();
		// 更新Helper
		lightHelper.update();
	}

	addAmbientLight()
	addDirectionalLight()
	addPointLight()





	function animate() {

		// 使3D文字「幾乎」看向鏡頭，同時仍被方向影響，以增加視覺豐富度
		pieTexts.forEach(text => {
			text.lookAt(...new THREE.Vector3(0, 0, 1).lerp(camera.position, 0.05).toArray())
		})

		requestAnimationFrame(animate);
		renderer.render(scene, camera);
	}
	animate();

})


// 我們之所以可以在畫面中看到一個物件，
// 是因為我們在渲染一個物件時，給定three.js一個Geometry以及一個Material來得到一個Mesh。
// 那為什麼three.js可以透過這兩個東西去渲染物件？那是因為在底層的WebGL由vertexShader以及fragmentShader所組成。
// 前者透過Geometry抓到錨點在螢幕上的位置，後者得到前者的錨點位置再指定每一個像素的顏色。

// 四個Geometry 的差異如下：

// ShapeGeometry ：產生一個具有面的形狀
// ExtrudeGeometry：產生一個具有體積的物體
// BufferGeometry：由用戶代入錨點位置而不指定任何作用。所以它有可能是三角面位置資訊，也可能是三角面Normal資訊，有可能是其他資訊。
// TubeGeometry：沿著線段產生一條「水管」