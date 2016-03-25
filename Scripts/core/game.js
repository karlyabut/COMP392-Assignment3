/// <reference path="_reference.ts"/>
// MAIN GAME FILE
// THREEJS Aliases
var Scene = Physijs.Scene;
var Renderer = THREE.WebGLRenderer;
var PerspectiveCamera = THREE.PerspectiveCamera;
var BoxGeometry = THREE.BoxGeometry;
var CubeGeometry = THREE.CubeGeometry;
var PlaneGeometry = THREE.PlaneGeometry;
var SphereGeometry = THREE.SphereGeometry;
var Geometry = THREE.Geometry;
var AxisHelper = THREE.AxisHelper;
var LambertMaterial = THREE.MeshLambertMaterial;
var MeshBasicMaterial = THREE.MeshBasicMaterial;
var LineBasicMaterial = THREE.LineBasicMaterial;
var PhongMaterial = THREE.MeshPhongMaterial;
var Material = THREE.Material;
var Texture = THREE.Texture;
var Line = THREE.Line;
var Mesh = THREE.Mesh;
var Object3D = THREE.Object3D;
var SpotLight = THREE.SpotLight;
var PointLight = THREE.PointLight;
var AmbientLight = THREE.AmbientLight;
var Control = objects.Control;
var GUI = dat.GUI;
var Color = THREE.Color;
var Vector3 = THREE.Vector3;
var Face3 = THREE.Face3;
var Point = objects.Point;
var CScreen = config.Screen;
var Clock = THREE.Clock;
//Custom Game Objects
var gameObject = objects.gameObject;
// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";
// setup an IIFE structure (Immediately Invoked Function Expression)
var game = (function () {
    // declare game objects
    var havePointerLock;
    var element;
    var scene = new Scene(); // Instantiate Scene Object
    var renderer;
    var camera;
    var control;
    var gui;
    var stats;
    var blocker;
    var instructions;
    var spotLight;
    var groundGeometry;
    var groundPhysicsMaterial;
    var groundMaterial;
    var ground;
    var groundTexture;
    var groundTextureNormal;
    var clock;
    var playerGeometry;
    var playerMaterial;
    var player;
    var sphereGeometry;
    var sphereMaterial;
    var sphere;
    var keyboardControls;
    var mouseControls;
    var isGrounded;
    var velocity = new Vector3(0, 0, 0);
    var prevTime = 0;
    var directionLineMaterial;
    var directionLineGeometry;
    var directionLine;
    //walls and obstacles
    var wallGeometry;
    var wallMaterial;
    var wallLeft;
    var wallRight;
    var obstacle;
    // assets: lives, score, canvas, and stage
    var assets;
    var manifest = [
        { id: "music", src: "../../Assets/audio/music.mp3" },
        { id: "land", src: "../../Assets/audio/Land.wav" },
        { id: "hit", src: "../../Assets/audio/hit.mp3" },
        { id: "gameover", src: "../../Assets/audio/gameover.mp3" },
    ];
    var canvas;
    var stage;
    var scoreLabel;
    var livesLabel;
    var score = 0;
    var lives = 5;
    function preload() {
        assets = new createjs.LoadQueue();
        assets.installPlugin(createjs.Sound);
        assets.on("complete", init, this);
        assets.loadManifest(manifest);
    }
    function setupCanvas() {
        canvas = document.getElementById("canvas");
        canvas.setAttribute("width", config.Screen.WIDTH.toString());
        canvas.setAttribute("height", (config.Screen.HEIGHT * 0.1).toString());
        canvas.style.backgroundColor = "#000000";
        stage = new createjs.Stage(canvas);
    }
    function setupScoreboard() {
        // score = 0;
        // lives = 5;
        livesLabel = new createjs.Text("LIVES: " + lives, "40px Consolas", "#ffffff");
        livesLabel.x = config.Screen.WIDTH * 0.1;
        livesLabel.y = (config.Screen.HEIGHT * 0.1) * 0.3;
        stage.addChild(livesLabel);
        console.log("added lives label to stage");
        //add score label
        scoreLabel = new createjs.Text("SCORE " + score, "40px Consolas", "#ffffff");
        scoreLabel.x = config.Screen.WIDTH * 0.8;
        scoreLabel.y = (config.Screen.HEIGHT * 0.1) * 0.3;
        stage.addChild(scoreLabel);
        console.log("added score label");
    }
    function init() {
        // Create to HTMLElements
        blocker = document.getElementById("blocker");
        instructions = document.getElementById("instructions");
        //set up canvas
        setupCanvas();
        //set up scoreboard
        setupScoreboard();
        //background sound
        //createjs.Sound.play("music");
        //check to see if pointerlock is supported
        havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
        // Instantiate Game Controls
        keyboardControls = new objects.KeyboardControls();
        mouseControls = new objects.MouseControls();
        // Check to see if we have pointerLock
        if (havePointerLock) {
            element = document.body;
            instructions.addEventListener('click', function () {
                // Ask the user for pointer lock
                console.log("Requesting PointerLock");
                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;
                element.requestPointerLock();
            });
            document.addEventListener('pointerlockchange', pointerLockChange);
            document.addEventListener('mozpointerlockchange', pointerLockChange);
            document.addEventListener('webkitpointerlockchange', pointerLockChange);
            document.addEventListener('pointerlockerror', pointerLockError);
            document.addEventListener('mozpointerlockerror', pointerLockError);
            document.addEventListener('webkitpointerlockerror', pointerLockError);
        }
        // Scene changes for Physijs
        scene.name = "Main";
        scene.fog = new THREE.Fog(0xffffff, 0, 750);
        scene.setGravity(new THREE.Vector3(0, -10, 0));
        scene.addEventListener('update', function () {
            scene.simulate(undefined, 2);
        });
        // setup a THREE.JS Clock object
        clock = new Clock();
        setupRenderer(); // setup the default renderer
        setupCamera(); // setup the camera
        // Spot Light
        spotLight = new SpotLight(0xffffff);
        spotLight.position.set(20, 150, 100);
        spotLight.castShadow = true;
        spotLight.intensity = 2;
        spotLight.lookAt(new Vector3(0, 0, 0));
        spotLight.shadowCameraNear = 2;
        spotLight.shadowCameraFar = 200;
        spotLight.shadowCameraLeft = -5;
        spotLight.shadowCameraRight = 5;
        spotLight.shadowCameraTop = 5;
        spotLight.shadowCameraBottom = -5;
        spotLight.shadowMapWidth = 2048;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowDarkness = 0.5;
        spotLight.name = "Spot Light";
        scene.add(spotLight);
        console.log("Added spotLight to scene");
        // Ground Object
        groundTexture = new THREE.TextureLoader().load('../../Assets/images/GravelCobble.jpg');
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(8, 8);
        groundTextureNormal = new THREE.TextureLoader().load('../../Assets/images/GravelCobbleNormal.png');
        groundTextureNormal.wrapS = THREE.RepeatWrapping;
        groundTextureNormal.wrapT = THREE.RepeatWrapping;
        groundTextureNormal.repeat.set(8, 8);
        groundMaterial = new PhongMaterial();
        groundMaterial.map = groundTexture;
        groundMaterial.bumpMap = groundTextureNormal;
        groundMaterial.bumpScale = 0.2;
        groundGeometry = new BoxGeometry(20, 1, 500);
        groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
        ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
        ground.receiveShadow = true;
        ground.name = "Ground";
        scene.add(ground);
        console.log("Added Burnt Ground to scene");
        //walls
        wallGeometry = new BoxGeometry(1, 1, 500);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        wallLeft = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        wallLeft.position.set(-10, 1, 0);
        wallLeft.receiveShadow = true;
        wallLeft.name = "LeftWall";
        scene.add(wallLeft);
        console.log("Added left wall");
        wallGeometry = new BoxGeometry(1, 1, 500);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        wallRight = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        wallRight.position.set(10, 1, 0);
        wallRight.receiveShadow = true;
        wallRight.name = "RightWall";
        scene.add(wallRight);
        console.log("Added left wall");
        //obstacle
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(0, 1, -10);
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(-4.5, 1, -20);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(4.5, 1, -35);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(-4.5, 1, -50);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(4.5, 1, -65);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(20, 10, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(0, 1, -80);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(-4.5, 1, -95);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(4.5, 1, -120);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(-4.5, 1, -145);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(20, 10, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(0, 1, -165);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(20, 15, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(0, 1, -175);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(20, 20, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(0, 1, -185);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(10, 1, 1);
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(4.5, 1, -200);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        wallGeometry = new BoxGeometry(20, 100, 1); //end for now
        wallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xe75d14 }), 0.4, 0);
        obstacle = new Physijs.ConvexMesh(wallGeometry, wallMaterial, 0);
        obstacle.position.set(0, 1, -185);
        obstacle.receiveShadow = true;
        obstacle.name = "Obstacle";
        scene.add(obstacle);
        console.log("Added obstacle wall");
        // Player Object
        playerGeometry = new BoxGeometry(2, 2, 2);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        player = new Physijs.SphereMesh(playerGeometry, playerMaterial, 1);
        player.position.set(0, 30, 10);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        scene.add(player);
        console.log("Added Player to Scene");
        // Collision Check
        player.addEventListener('collision', function (eventObject) {
            //console.log(event);
            if (eventObject.name === "Ground") {
                //console.log("player hit the ground");
                isGrounded = true;
                createjs.Sound.play("land");
            }
            if (eventObject.name === "Obstacle") {
                //console.log("player hit obstacle");
                createjs.Sound.play("hit");
                //scene.remove(eventObject);
                if (lives > 0) {
                    lives -= 1;
                }
                if (lives == 0) {
                    createjs.Sound.play("gameover");
                }
            }
        });
        // Add DirectionLine
        directionLineMaterial = new LineBasicMaterial({ color: 0xffff00 });
        directionLineGeometry = new Geometry();
        directionLineGeometry.vertices.push(new Vector3(0, 0, 0)); // line origin
        directionLineGeometry.vertices.push(new Vector3(0, 0, -50)); // end of the line
        directionLine = new Line(directionLineGeometry, directionLineMaterial);
        player.add(directionLine);
        console.log("Added DirectionLine to the Player");
        // create parent-child relationship with camera and player
        player.add(camera);
        camera.position.set(0, 1, 0);
        // Sphere Object
        sphereGeometry = new SphereGeometry(2, 32, 32);
        sphereMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        sphere = new Physijs.SphereMesh(sphereGeometry, sphereMaterial, 1);
        sphere.position.set(0, 60, 5);
        sphere.receiveShadow = true;
        sphere.castShadow = true;
        sphere.name = "Sphere";
        //scene.add(sphere);
        //console.log("Added Sphere to Scene");
        // add controls
        gui = new GUI();
        control = new Control();
        addControl(control);
        // Add framerate stats
        addStatsObject();
        console.log("Added Stats to scene...");
        document.body.appendChild(renderer.domElement);
        gameLoop(); // render the scene	
        scene.simulate();
        window.addEventListener('resize', onWindowResize, false);
    }
    //PointerLockChange Event Handler
    function pointerLockChange(event) {
        if (document.pointerLockElement === element) {
            // enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        }
        else {
            // disable our mouse and keyboard controls
            keyboardControls.enabled = false;
            mouseControls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
            console.log("PointerLock disabled");
        }
    }
    //PointerLockError Event Handler
    function pointerLockError(event) {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }
    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        livesLabel.x = config.Screen.WIDTH * 0.1;
        livesLabel.y = (config.Screen.HEIGHT * 0.1) * 0.3;
        scoreLabel.x = config.Screen.WIDTH * 0.8;
        scoreLabel.y = (config.Screen.HEIGHT * 0.1) * 0.3;
        canvas.style.width = '100%';
        stage.update();
    }
    function addControl(controlObject) {
        /* ENTER CODE for the GUI CONTROL HERE */
    }
    // Add Frame Rate Stats to the Scene
    function addStatsObject() {
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
    }
    // Setup main game loop
    function gameLoop() {
        stats.update();
        checkControls();
        stage.update();
        livesLabel.text = "LivFUCK: " + lives;
        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);
        // render the scene
        renderer.render(scene, camera);
    }
    // Check Controls Function
    function checkControls() {
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            var time = performance.now();
            var delta = (time - prevTime) / 1000;
            if (isGrounded) {
                var direction = new Vector3(0, 0, 0);
                if (keyboardControls.moveForward) {
                    velocity.z -= 400.0 * delta;
                }
                if (keyboardControls.moveLeft) {
                    velocity.x -= 400.0 * delta;
                }
                if (keyboardControls.moveBackward) {
                    velocity.z += 400.0 * delta;
                }
                if (keyboardControls.moveRight) {
                    velocity.x += 400.0 * delta;
                }
                if (keyboardControls.jump) {
                    velocity.y += 4000.0 * delta;
                    if (player.position.y > 4) {
                        isGrounded = false;
                    }
                }
                player.setDamping(0.7, 0.1);
                // Changing player's rotation
                player.setAngularVelocity(new Vector3(0, mouseControls.yaw, 0));
                direction.addVectors(direction, velocity);
                direction.applyQuaternion(player.quaternion);
                if (Math.abs(player.getLinearVelocity().x) < 20 && Math.abs(player.getLinearVelocity().y) < 10) {
                    player.applyCentralForce(direction);
                }
                cameraLook();
            } // isGrounded ends
            //reset Pitch and Yaw
            mouseControls.pitch = 0;
            mouseControls.yaw = 0;
            prevTime = time;
        } // Controls Enabled ends
        else {
            player.setAngularVelocity(new Vector3(0, 0, 0));
        }
    }
    // Camera Look function
    function cameraLook() {
        var zenith = THREE.Math.degToRad(90);
        var nadir = THREE.Math.degToRad(-90);
        var cameraPitch = camera.rotation.x + mouseControls.pitch;
        // Constrain the Camera Pitch
        camera.rotation.x = THREE.Math.clamp(cameraPitch, nadir, zenith);
    }
    // Setup default renderer
    function setupRenderer() {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
        console.log("Finished setting up Renderer...");
    }
    // Setup main camera for the scene
    function setupCamera() {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
        //camera.position.set(0, 10, 30);
        //camera.lookAt(new Vector3(0, 0, 0));
        console.log("Finished setting up Camera...");
    }
    window.onload = preload;
    return {
        scene: scene
    };
})();
//# sourceMappingURL=game.js.map