module.exports = function (parentRequire, sandboxId, sandboxDependencies) {
    var topId = parentRequire.resolve(sandboxId);
    var originalModule = parentRequire.getModuleDescriptor(topId);

    while (originalModule.redirect || originalModule.mappingRedirect) {
        if (originalModule.redirect) {
            topId = originalModule.redirect;
        } else {
            parentRequire = originalModule.mappingRequire;
            topId = originalModule.mappingRedirect;
        }
        originalModule = parentRequire.getModuleDescriptor(topId);
    }

    return parentRequire.deepLoad(topId)
    .then(function () {
        // delete the exports to cause the factory to get called again
        var originalExports = originalModule.exports;
        delete originalModule.exports;

        // wrap the factory to work our magic
        var originalFactory = originalModule.factory;
        originalModule.factory = function (require, exports, module) {
            var sandboxRequire = function (id) {
                if (id in sandboxDependencies) {
                    return sandboxDependencies[id];
                }
                return require(id);
            };
            var sandboxModule = JSON.parse(JSON.stringify(module));
            var sandboxExports = sandboxModule.exports;

            return originalFactory(sandboxRequire, sandboxExports, sandboxModule) || sandboxModule.exports;
        };

        var sandboxExports = parentRequire(topId);

        // restore normality
        originalModule.exports = originalExports;
        originalModule.factory = originalFactory;

        return sandboxExports;
    });
};
