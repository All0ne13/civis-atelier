import test from'node:test';
import assert from'node:assert/strict';
import vm from'node:vm';
import{publicGlobals}from'../server/storefront.mjs';

test('public catalogue embedding cannot terminate a script tag and preserves plain text',()=>{
 const data={CATALOGUE:[{name:'</script><script>globalThis.injected=true</script>',description:'Українська Ґґ Її Єє — "quoted" & <b>plain text</b>\nnew line'}]};
 const source=publicGlobals(data);assert.equal(/<\/script/i.test(source),false);
 const context={window:{}};vm.runInNewContext(source,context);
 assert.equal(context.injected,undefined);assert.deepEqual(JSON.parse(JSON.stringify(context.window)),data);
});
