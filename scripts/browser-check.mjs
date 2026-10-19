import { strict as assert } from 'node:assert';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { checkSpeed } from './check-speed.mjs';
import { checkPredation } from './check-predation.mjs';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.setDefaultTimeout(15000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('.browser-check',{recursive:true});
try {
  await page.goto(process.argv[4]??'http://localhost:5173');
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.getByRole('button',{name:'Neustart',exact:true}).click();
  assert.match(await page.locator('#status').innerText(),/^Tick 0 · 0.00 s · 10 Grasfresser · 10 Karnivoren/);
  await checkSpeed(page,browser,errors);
  await checkPredation(page,browser,errors);
  const metrics=await page.evaluate(async()=>{
    const {defaultConfig}=await import('/src/config.ts');
    const {initialize,tick,assertWorld}=await import('/src/simulation.ts');
    const {sampleAnimation}=await import('/src/animation.ts');
    const {Playback}=await import('/src/playback.ts');
    const {render,layout}=await import('/src/render.ts');
    let seed=17;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    let state=initialize(defaultConfig,random), maxPopulation=state.animals.length, frames=0;
    const canvas=document.querySelector('#field'),ctx=canvas.getContext('2d'),field=layout(defaultConfig,canvas.clientWidth,canvas.clientHeight);
    const start=performance.now();let totalRenderMs=0,maxRenderMs=0;
    for(let i=0;i<36000;i++) {
      state=tick(state,defaultConfig,random);assertWorld(state,defaultConfig);
      maxPopulation=Math.max(maxPopulation,state.animals.length);
      if(i%30===0) {
        const before=performance.now(), frame=sampleAnimation(state);
        render(ctx,frame.state,defaultConfig,field,frame.shapes);
        const duration=performance.now()-before;totalRenderMs+=duration;maxRenderMs=Math.max(maxRenderMs,duration);frames++;
      }
      if(i%600===0)await new Promise(requestAnimationFrame);
    }
    const elapsedMs=performance.now()-start;
    const fast=new Playback(initialize(defaultConfig,()=>0.37),{...defaultConfig,speedMultiplier:8},()=>0.37);
    fast.tick(0);let maxFrameMs=0;
    for(let i=1;i<=120;i++) {
      const before=performance.now();fast.tick(i*1000/60);const frame=fast.frame;
      render(ctx,frame.state,defaultConfig,field,frame.shapes);maxFrameMs=Math.max(maxFrameMs,performance.now()-before);
    }
    if(fast.state.tick!==960)throw new Error('8× clock mismatch');
    return {ticks:state.tick,frames,maxPopulation,elapsedMs,meanRenderMs:totalRenderMs/frames,maxRenderMs,maxFrameAt8xMs:maxFrameMs};
  });
  console.log(JSON.stringify({browserLongRun:metrics}));
  await writeFile('.browser-check/async-metrics.json',JSON.stringify(metrics,null,2));
  // CSS refresh plus a JS hot replacement check that one click still performs exactly one tick.
  const stylePath=new URL('../src/style.css',import.meta.url), style=await readFile(stylePath,'utf8');
  try {
    await writeFile(stylePath,style+'\nbody { outline: 3px solid rgb(1, 2, 3); }\n');
    await page.waitForFunction(()=>getComputedStyle(document.body).outlineColor==='rgb(1, 2, 3)');
    await page.waitForTimeout(250);
  } finally {
    await writeFile(stylePath,style);
    await page.waitForFunction(()=>getComputedStyle(document.body).outlineColor!=='rgb(1, 2, 3)');
  }
  const mainPath=new URL('../src/main.ts',import.meta.url), main=await readFile(mainPath,'utf8');
  try {
    await page.getByLabel('Tempo',{exact:true}).selectOption('8');
    await writeFile(mainPath,main+'\n// Browser verification: hot replacement.\n');
    await page.waitForFunction(()=>document.querySelector('#speed').value==='2');
    await page.getByRole('button',{name:'Pause',exact:true}).click();
    await page.getByRole('button',{name:'Neustart',exact:true}).click();
    await page.getByRole('button',{name:'Einzelschritt',exact:true}).click();
    assert.match(await page.locator('#status').innerText(),/^Tick 1 /);
    assert.equal(await page.locator('#speed option').count(),6);
  } finally {
    await writeFile(mainPath,main);await page.waitForTimeout(500);
  }
  assert.deepEqual(errors,[]);
  console.log('Browser checks passed: async actions, partial food, one-tick stepping, tempo, pause, resize, keyboard/mobile, 36,000 ticks and HMR cleanup.');
} finally {await browser.close();}
