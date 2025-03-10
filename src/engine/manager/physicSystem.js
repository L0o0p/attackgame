
export class PhysicsSystem {
    constructor(
        Rapier,
        colliders,
        physicsObjects,
        objectMap,
    ) {
        this.Rapier = Rapier;
        this.world = new Rapier.World({ x: 0.0, y: -9.81, z: 0.0 });
        this.colliders = colliders
        this.physicsObjects = physicsObjects
        this.objectMap = objectMap
        this.characterBody = null
    }

    createPlayer(mesh) {
        const characterRadius = 0.5;
        const characterHeight = 0.1;
        const characterDesc = this.Rapier.RigidBodyDesc.dynamic()
            .setTranslation(0, 5, 0)
            .setLinearDamping(1)  // 添加阻尼减少滑动
            .setAngularDamping(1)
            .lockRotations() // 锁定旋转;
        this.characterBody = this.world.createRigidBody(characterDesc);
        const characterCollider = this.Rapier.ColliderDesc.capsule(characterHeight / 2, characterRadius);
        this.world.createCollider(characterCollider, this.characterBody);
        this.physicsObjects.push({ body: this.characterBody, mesh:mesh });
    }

    createGround(mesh,) {
        const RAPIER = this.Rapier
        const position = mesh.position
        // 创建地面
        const geo = mesh.geometry;
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

    setPhyiscsForSceneObjects() {
        const RAPIER = this.Rapier

        this.colliders.forEach(item => {
            const position = item.position
            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(
                    position.x,
                    position.y,
                    position.z
                );
            const rigidBody = this.world.createRigidBody(bodyDesc);
            const geo = item.geometry;
            if (!geo.attributes || !geo.index) return null;
            const vertices = new Float32Array(geo.attributes.position.array);
            const indices = new Uint32Array(geo.index.array); // 注意这里改用 Uint32Array
            const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
            this.world.createCollider(colliderDesc, rigidBody);
            this.physicsObjects.push({ body: rigidBody, mesh: this.objectMap.get(item.name) });
        });
    }

    // 改写
    update() {
        // 物理世界步进
        this.world.step();
        // 更新所有物体的位置和旋转
        for (const obj of this.physicsObjects) {
            const position = obj.body.translation();
            const rotation = obj.body.rotation();
            if (obj.mesh)
                obj.mesh.position.set(position.x, position.y, position.z);
            // obj.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

}
