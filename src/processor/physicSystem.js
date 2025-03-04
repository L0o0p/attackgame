import Rapier from '@dimforge/rapier3d-compat';
await Rapier.init();

export class PhysicsSystem {
    constructor() {
        this.Rapier = Rapier;
        this.world = new Rapier.World({ x: 0, y: -9.81, z: 0 })

        this.physicsObjects = []
        this.characterBody = null
        this.characterGroup = null
        this.groundMesh = null;
        this.visuals = []
        this.colliders = [];
        this.objectMap = new Map();
        this.init()
    }

    async init() {
    }
    createGround() {
        const position = this.physics.groundMesh.position
        const RAPIER = this.Rapier
        // 创建地面
        const geo = this.physics.groundMesh.geometry;
        if (!geo.attributes || !geo.index) return null;
        const vertices = new Float32Array(geo.attributes.position.array);
        const indices = new Uint32Array(geo.index.array); // 注意这里改用 Uint32Array
        const groundColliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
        const groundBody = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed()
                .setTranslation(position.x, position.y, position.z)
        );
        this.world.createCollider(groundColliderDesc, groundBody);
    }
    // 改写
    update() {
       
    }

}
