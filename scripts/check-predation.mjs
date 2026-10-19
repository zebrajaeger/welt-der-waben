import { strict as assert } from 'node:assert';

export async function checkPredation(page,browser,errors) {
  const demo=await browser.newPage({viewport:{width:1200,height:1000}});
  demo.on('pageerror',e=>errors.push(e.message));
  await demo.goto(new URL('/scripts/grass-division-demo.html',page.url()).href);
  await demo.getByRole('button',{name:'Übertragung',exact:true}).click();
  const short=await demo.locator('[data-case="short"] .details').innerText();
  const long=await demo.locator('[data-case="long"] .details').innerText();
  const partial=await demo.locator('[data-case="partial"] .details').innerText();
  assert.match(short,/Nachziehen/);assert.match(long,/saugt/);assert.match(partial,/Rückzug/);assert.match(partial,/G1:/);
  assert.match(await demo.locator('[data-case="division"] .details').innerText(),/G100:/);
  await demo.screenshot({path:'.browser-check/local-actions-tick32.png',fullPage:true});
  await demo.getByRole('button',{name:'Kontakt',exact:true}).click();
  await demo.screenshot({path:'.browser-check/local-actions-contact.png',fullPage:true});
  await demo.getByRole('button',{name:'Später',exact:true}).click();
  await demo.screenshot({path:'.browser-check/local-actions-tick60.png',fullPage:true});
  await demo.setViewportSize({width:360,height:740});
  await demo.screenshot({path:'.browser-check/local-actions-mobile.png',fullPage:true});
  await demo.getByRole('button',{name:'Abspielen',exact:true}).click();
  await demo.waitForTimeout(180);await demo.getByRole('button',{name:'Pause',exact:true}).click();
  const label=await demo.locator('#position').innerText();
  await demo.waitForTimeout(100);assert.equal(await demo.locator('#position').innerText(),label);
  await demo.close();

  const checks=await page.evaluate(async()=>{
    const {defaultConfig}=await import('/src/config.ts');
    const {tick,assertWorld}=await import('/src/simulation.ts');
    const {Playback}=await import('/src/playback.ts');
    const {sampleAnimation}=await import('/src/animation.ts');
    const cfg={...defaultConfig,width:3,height:1,herbivore:{...defaultConfig.herbivore,initialCount:0},carnivore:{...defaultConfig.carnivore,initialCount:0}};
    const initial={tick:0,nextId:100,reservations:{},released:{},grass:[0,8,0],animals:[{id:1,column:0,row:0,species:'herbivore',energy:5,angle:-Math.PI/2,readyAt:0}]};
    let state=initial;for(let i=0;i<30;i++)state=tick(state,cfg,()=>0);
    if(state.animals[0].action?.phase!=='transfer')throw new Error('Fixture not transferring');
    let checked=0;
    for(const speedMultiplier of [0.25,8]) {
      const playback=new Playback(state,{...cfg,speedMultiplier},()=>0);
      playback.tick(0);playback.toggle(0);
      const frozen=JSON.stringify(playback.state), shapes=JSON.stringify([...playback.frame.shapes]);
      playback.setSpeedMultiplier(speedMultiplier===8?0.25:8,100);playback.tick(10000);
      if(JSON.stringify(playback.state)!==frozen || JSON.stringify([...playback.frame.shapes])!==shapes)throw new Error('Paused transfer jumped');
      playback.toggle(10000);playback.setSpeedMultiplier(speedMultiplier,10000);
      if(JSON.stringify(playback.state)!==frozen)throw new Error('Tempo changed current tick');
      playback.tick(10000+1000/60/speedMultiplier);
      if(playback.state.tick!==state.tick+1)throw new Error('One tick advance incorrect');
      assertWorld(playback.state,cfg);checked++;
    }
    const host=document.createElement('div');host.id='resize-transfer';host.style.width='100%';
    const canvas=document.createElement('canvas');host.append(canvas);document.body.append(host);
    host.fixture={state,config:cfg,frame:sampleAnimation(state)};
    return {checked,remainingGrass:state.grass[1],energy:state.animals[0].energy};
  });
  assert.equal(checks.checked,2);assert(checks.remainingGrass>0 && checks.remainingGrass<8);
  const before=await page.locator('#resize-transfer').evaluate(async host=>{
    const {render,layout}=await import('/src/render.ts');const {state,config,frame}=host.fixture;
    const canvas=host.querySelector('canvas'),field=layout(config,host.clientWidth,200);
    canvas.width=Math.ceil(field.width);canvas.height=Math.ceil(field.height);render(canvas.getContext('2d'),state,config,field,frame.shapes);
    return JSON.stringify([...frame.shapes]);
  });
  await page.setViewportSize({width:360,height:740});
  const after=await page.locator('#resize-transfer').evaluate(async host=>{
    const {render,layout}=await import('/src/render.ts');const {state,config,frame}=host.fixture;
    const canvas=host.querySelector('canvas'),field=layout(config,host.clientWidth,200);
    canvas.width=Math.ceil(field.width);canvas.height=Math.ceil(field.height);render(canvas.getContext('2d'),state,config,field,frame.shapes);
    return JSON.stringify([...frame.shapes]);
  });
  assert.equal(after,before);await page.setViewportSize({width:1440,height:1000});
  await page.locator('#resize-transfer').evaluate(host=>host.remove());
  console.log(JSON.stringify({localTransferChecks:checks}));
}
