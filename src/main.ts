import Phaser from 'phaser'
import { GameScene } from './scene'
const config: Phaser.Types.Core.GameConfig={type:Phaser.CANVAS,parent:'app',backgroundColor:'#1E90FF',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:360,height:640},fps:{target:60,forceSetTimeOut:true},scene:[GameScene]}; new Phaser.Game(config)
