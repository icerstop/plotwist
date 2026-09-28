import test from 'node:test';
import assert from 'node:assert/strict';
import {frameIndexAt,stickerMotion,coverRect} from '../src/media-timeline.js';
test('GIF clock respects unequal frame delays, boundaries, speed and loops',()=>{
 const ends=[100,350,600];
 assert.equal(frameIndexAt(ends,0),0);assert.equal(frameIndexAt(ends,.1),1);assert.equal(frameIndexAt(ends,.349),1);assert.equal(frameIndexAt(ends,.35),2);assert.equal(frameIndexAt(ends,.6),0);assert.equal(frameIndexAt(ends,.175,2),2);assert.equal(frameIndexAt(ends,60.35),2);
});
test('scrubbing and replaying the same instant gives the same GIF and motion state',()=>{
 const ends=[80,200,360],time=1.25;
 const first=[frameIndexAt(ends,time),stickerMotion('float',time)];
 frameIndexAt(ends,30);stickerMotion('float',30);
 assert.deepEqual([frameIndexAt(ends,time),stickerMotion('float',time)],first);
 assert.equal(stickerMotion('enter',0).opacity,0);assert.equal(stickerMotion('enter',1).opacity,1);
});
test('background fit keeps aspect ratio for portrait and landscape media',()=>{
 assert.deepEqual(coverRect(200,100,100,200,'cover'),{x:-150,y:0,width:400,height:200});
 assert.deepEqual(coverRect(200,100,100,200,'contain'),{x:0,y:75,width:100,height:50});
});
