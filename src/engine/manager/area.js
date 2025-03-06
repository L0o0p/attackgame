import { Box3, Vector3 } from 'three'

export class Area extends Box3 {
    constructor(mesh) {
        super()
        this.type = mesh.name.split('_')[1]
        this.copy(mesh.geometry.boundingBox)
        
        this.setFromObject(mesh) // 使用物体的世界坐标

        // 计算体积作为判定优先级（体积越小优先级越高）
        const size = this.getSize(new Vector3())
        this.volume = size.x * size.y * size.z
    }

    setPriority() {
        switch (this.type) {
            case 'wood':
                return 1
            case 'water':
                return 2
            case 'soil':
                return 3
            default:
                return 0
        }
    }

    in(position) {
        const col = this.containsPoint(position)
        if (col) return {
            type: this.type,
            volume: this.volume
        }
        return null
    }
}
