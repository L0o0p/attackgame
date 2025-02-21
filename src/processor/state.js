
const states = {
    idleState: 'idle',
    walkState: 'walk',
    attackState: 'attacking',
    hitState: 'hit',
    deathState: 'die',
}
export class State{
    constructor(initState) { 
        this.currentState =initState
    }
    switchState(n) {
        this.currentState = n
    }
// 定义多种状态，每种状态对应播放不同动画
 controlAction() {
    switch (state=this.currentState) {
        case state=states.walkState:
            this.switchAnimation(this.target, 'walk');
            break;
        case state=states.attackState:
            this.switchAnimation(this.target, 'attacking');
            break;
        case state=states.hitState:
            this.switchAnimation(this.target, 'hit');
            break;
        case state=states.deathState:
            this.switchAnimation(this.target, 'death');
            break;
        default:
            this.switchAnimation(this.target, 'idle');
    }
}
}