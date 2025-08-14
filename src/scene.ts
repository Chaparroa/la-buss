
import Phaser from 'phaser'
type Point={x:number,y:number}
const TILE=24
export class GameScene extends Phaser.Scene{
  gridW!:number;gridH!:number;gridOffsetX!:number;gridOffsetY!:number
  bus:Point[]=[];dir:Point={x:1,y:0};pendingDir:Point|null=null
  moveTimer=0;movesPerSec=6;maxMPS=15
  passenger!:Point;busStop:Point|null=null
  score=0;best=0;paused=false
  sfxPickup?:Phaser.Sound.BaseSound;sfxBusstop?:Phaser.Sound.BaseSound;music?:Phaser.Sound.BaseSound
  constructor(){super('Game')}
  preload(){
    this.load.image('bus_head','/assets/bus_head.png');this.load.image('bus_mid','/assets/bus_mid.png');this.load.image('bus_tail','/assets/bus_tail.png')
    this.load.image('p1','/assets/p_student.png');this.load.image('p2','/assets/p_worker.png');this.load.image('p3','/assets/p_elder.png')
    this.load.image('stop','/assets/bus_stop.png')
    this.load.audio('pickup','/assets/pickup.mp3');this.load.audio('busstop','/assets/busstop.mp3');this.load.audio('music','/assets/music.mp3')
  }
  create(){
    const w=this.scale.width,h=this.scale.height
    this.gridW=Math.floor(w/TILE);this.gridH=Math.floor((h-48)/TILE)
    this.gridOffsetX=Math.floor((w-this.gridW*TILE)/2);this.gridOffsetY=48+Math.floor((h-48-this.gridH*TILE)/2)
    this.add.rectangle(0,0,w,48,0x111111).setOrigin(0)
    this.input.on('pointerup',this.onSwipeEnd,this)
    const mute=document.getElementById('mute') as HTMLButtonElement
    const pause=document.getElementById('pause') as HTMLButtonElement
    pause.onclick=()=>{this.paused=!this.paused;pause.textContent=this.paused?'▶️':'⏸'}
    mute.onclick=()=>{this.sound.mute=!this.sound.mute;mute.textContent=this.sound.mute?'🔇':'🔊'}
    this.sfxPickup=this.sound.add('pickup');this.sfxBusstop=this.sound.add('busstop');this.music=this.sound.add('music',{loop:true,volume:0.4});this.music.play()
    this.best=Number(localStorage.getItem('labusss_best')||0);this.newGame()
  }
  newGame(){
    this.score=0;this.movesPerSec=6;this.dir={x:1,y:0};this.pendingDir=null;this.bus=[]
    const cx=Math.floor(this.gridW/2),cy=Math.floor(this.gridH/2)
    this.bus.push({x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy})
    this.spawnPassenger();this.busStop=null;this.updateScore()
  }
  updateScore(){const s=document.getElementById('score')!;s.textContent=`${this.score}  (best ${this.best})`}
  onSwipeEnd(p:Phaser.Input.Pointer){const dx=p.upX-p.downX,dy=p.upY-p.downY;if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(Math.abs(dx)>Math.abs(dy))this.queueDir({x:dx>0?1:-1,y:0});else this.queueDir({x:0,y:dy>0?1:-1})}
  queueDir(d:Point){if(this.bus.length>1&&d.x===-this.dir.x&&d.y===-this.dir.y)return;this.pendingDir=d}
  wrap(p:Point){return {x:(p.x+this.gridW)%this.gridW,y:(p.y+this.gridH)%this.gridH}}
  update(_t:number,dt:number){
    if(this.paused)return;this.moveTimer+=dt;const ms=1000/this.movesPerSec
    if(this.moveTimer>=ms){this.moveTimer-=ms;if(this.pendingDir){this.dir=this.pendingDir;this.pendingDir=null}this.step()}
    this.children.removeAll();this.add.rectangle(0,0,this.scale.width,48,0x111111).setOrigin(0)
    for(let i=0;i<this.bus.length;i++){const p=this.bus[i];const k=i===0?'bus_head':(i===this.bus.length-1?'bus_tail':'bus_mid')
      this.add.image(this.gridOffsetX+p.x*TILE+12,this.gridOffsetY+p.y*TILE+12,k)}
    this.add.image(this.gridOffsetX+this.passenger.x*TILE+12,this.gridOffsetY+this.passenger.y*TILE+12,['p1','p2','p3'][this.score%3])
    if(this.busStop){this.add.image(this.gridOffsetX+this.busStop.x*TILE+12,this.gridOffsetY+this.busStop.y*TILE+12,'stop')}
  }
  step(){
    if(!this.busStop&&this.score>=2&&(this.score%8===0)){this.busStop=this.randomEmptyCell();this.time.delayedCall(6000,()=>this.busStop=null)}
    const head=this.bus[0];const next=this.wrap({x:head.x+this.dir.x,y:head.y+this.dir.y})
    if(this.occupies(next.x,next.y)){this.gameOver();return}
    this.bus.unshift(next)
    if(this.busStop&&next.x===this.busStop.x&&next.y===this.busStop.y){for(let i=0;i<3&&this.bus.length>3;i++){this.bus.pop()}this.busStop=null;this.sfxBusstop?.play();this.cameras.main.shake(60,0.002)}
    if(next.x===this.passenger.x&&next.y===this.passenger.y){const mid=Math.max(1,Math.floor(this.bus.length/2));this.bus.splice(mid,0,{...this.bus[mid]});this.score+=1;this.sfxPickup?.play();if(this.score%5===0){this.movesPerSec=Math.min(this.maxMPS,this.movesPerSec+1)}this.spawnPassenger();if(window.navigator.vibrate)window.navigator.vibrate(10);this.cameras.main.shake(40,0.0015)}else{this.bus.pop()}
    this.updateScore()
  }
  occupies(x:number,y:number){return this.bus.some(p=>p.x===x&&p.y===y)}
  spawnPassenger(){this.passenger=this.randomEmptyCell(true)}
  randomEmptyCell(away=false){while(true){const x=Math.floor(Math.random()*this.gridW),y=Math.floor(Math.random()*this.gridH);const occ=this.occupies(x,y),head=this.bus[0];const clear=!away||(Math.abs(x-head.x)+Math.abs(y-head.y)>=2);if(!occ&&clear)return {x,y}}}
  gameOver(){this.best=Math.max(this.best,this.score);localStorage.setItem('labusss_best',String(this.best));this.scene.pause();const w=this.scale.width,h=this.scale.height;const bg=this.add.rectangle(w/2,h/2,w*0.8,h*0.5,0x000000,0.8).setInteractive();const title=this.add.text(w/2,h/2-60,'Game Over',{color:'#fff',fontSize:'28px'}).setOrigin(0.5);const st=this.add.text(w/2,h/2-10,`Score ${this.score}\nBest ${this.best}`,{color:'#fff',fontSize:'18px',align:'center'}).setOrigin(0.5);const btn=this.add.text(w/2,h/2+60,'Tap to Restart',{color:'#F27A00',fontSize:'20px'}).setOrigin(0.5).setInteractive();const restart=()=>{bg.destroy();title.destroy();st.destroy();btn.destroy();this.scene.resume();this.newGame()};bg.on('pointerup',restart);btn.on('pointerup',restart)}
}
