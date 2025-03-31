// filepath: e:\Dev\CACOO\Collect Actions Contextually On Odoo\src\injectedScript.js

(function waitForOdoo() {
  if (typeof odoo === 'undefined') {
    console.warn('Waiting for Odoo object to load...');
    setTimeout(waitForOdoo, 500); // Retry every 500ms
    return;
  }

  console.log('Odoo object is available. Starting interception.');

  // Intercept all methods in the Odoo namespace
  interceptOdooMethods();
})();

function interceptOdooMethods() {
  for (const modelName in odoo) {
    const model = odoo[modelName];

    if (typeof model === 'object' && model !== null) {
      for (const methodName in model) {
        if (typeof model[methodName] === 'function') {
          const originalMethod = model[methodName];

          model[methodName] = function (...args) {
            let extractedModelName = modelName;

            // Try to extract the model name from the arguments
            if (args.length > 0 && typeof args[0] === 'object' && args[0].model) {
              extractedModelName = args[0].model;
            } else if (this && this.model) {
              extractedModelName = this.model; // Extract from the `this` context
            }

            console.log('Intercepted method call:', {
              methodName: methodName,
              modelName: extractedModelName,
              parameters: args,
            });

            // Send the method details to the content script
            window.postMessage({
              type: 'METHOD_CALL',
              payload: {
                methodName: methodName,
                modelName: extractedModelName,
                parameters: args,
              },
            }, '*');

            return originalMethod.apply(this, args);
          };
        }
      }
    }
  }
}