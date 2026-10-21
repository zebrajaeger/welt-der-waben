import { strict as assert } from 'node:assert';
export async function checkSpeed(page, browser, errors) {
  const speed=page.getByLabel('Tempo',{exact:true});
  const status=()=>page.locator('#status').innerText();
  const tickCount=async()=>Number((await status()).match(/^Tick (\d+)/)[1]);
  assert.equal(await speed.inputValue(),'2');
  assert.deepEqual(await speed.locator('option').allTextContents(),['0,25×','0,5×','1×','2×','4×','8×']);
  const frozen=await page.locator('#field').evaluate(c=>c.toDataURL()), label=await status();
  for(const value of ['0.25','0.5','1','2','4','8']) {
    await speed.selectOption(value);assert.equal(await status(),label);
    assert.equal(await page.locator('#field').evaluate(c=>c.toDataURL()),frozen);
  }
  await speed.focus();await speed.press('Home');assert.equal(await speed.inputValue(),'0.25');
  await speed.press('ArrowDown');assert.equal(await speed.inputValue(),'0.5');
  await speed.press('End');assert.equal(await speed.inputValue(),'8');
  const before=await tickCount();
  await page.getByRole('button',{name:'Einzelschritt',exact:true}).click();
  assert.equal(await tickCount(),before+1);
  await page.waitForTimeout(100);assert.equal(await tickCount(),before+1);
  await page.getByRole('button',{name:'Neustart',exact:true}).click();
  assert.equal(await speed.inputValue(),'8');assert.equal(await tickCount(),0);
  await speed.selectOption('0.25');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.waitForTimeout(180);
  await speed.selectOption('8');await page.waitForTimeout(100);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  assert((await tickCount())>0);
  const paused=await status(), picture=await page.locator('#field').evaluate(c=>c.toDataURL());
  await speed.selectOption('0.5');await page.waitForTimeout(180);
  assert.equal(await status(),paused);assert.equal(await page.locator('#field').evaluate(c=>c.toDataURL()),picture);
  await page.screenshot({path:'.browser-check/async-desktop.png',fullPage:true});
  await page.setViewportSize({width:360,height:740});await page.waitForTimeout(100);
  for(const selector of ['#speed','#toggle','#step','#reset']) {
    const b=await page.locator(selector).boundingBox();assert(b && b.x>=0 && b.x+b.width<=360);
  }
  assert.equal(await status(),paused);
  await page.screenshot({path:'.browser-check/async-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  const custom=await browser.newPage({ locale: 'de-DE' });custom.on('pageerror',e=>errors.push(e.message));
  await custom.route(/\/src\/config\.ts(?:\?.*)?$/,async route=>{
    const response=await route.fetch(), original=await response.text(), body=original.replace(/speedMultiplier:\s*2\b/,'speedMultiplier: 3');
    assert.notEqual(body,original);await route.fulfill({response,body});
  });
  await custom.goto(page.url());
  const customSpeed=custom.getByLabel('Tempo',{exact:true});assert.equal(await customSpeed.inputValue(),'3');
  assert.equal(await customSpeed.locator('option').count(),7);
  await customSpeed.selectOption('4');await custom.getByRole('button',{name:'Neustart',exact:true}).click();
  assert.equal(await customSpeed.inputValue(),'4');await custom.reload();assert.equal(await customSpeed.inputValue(),'3');await custom.close();
  await page.reload();assert.equal(await speed.inputValue(),'2');
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.getByRole('button',{name:'Neustart',exact:true}).click();
  console.log('Tempo, Einzeltick, Tastatur, Mobilansicht und Startkonfiguration geprüft.');
}
