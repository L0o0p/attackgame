export const CharacterStates = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
    ATTACKWITHSWORD: 'attackwithsword',
    HIT: 'hit',
    DEATH: 'die'
};

export const stepSounds = {
    WALK : {
        soil: 'sounds/walkLightly.wav',
        water: 'sounds/walkWater.mp3',
        wood: 'sounds/walkHeavy.wav'
    },
    ATTACK :'sounds/attack.mp3',
    ATTACKWITHSWORD :'sounds/attackWithSword.mp3',
    HIT: 'sounds/hit.mp3',
    GETSWORD: 'sounds/getSword.mp3',
    HEALUP: 'sounds/healUp.mp3'
}