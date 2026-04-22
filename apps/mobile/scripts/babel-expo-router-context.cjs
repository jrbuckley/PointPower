/**
 * Ensures expo-router _ctx*.js files get string literals before Metro's
 * require.context validation. Runs first (before babel-preset-expo) so
 * monorepo + hoisted node_modules can't leave process.env.* in place.
 */
const path = require("path");

function toPosix(p) {
  return p.split(path.sep).join("/");
}

module.exports = function babelExpoRouterContext(api) {
  const { types: t } = api;

  return {
    name: "babel-expo-router-context-fix",
    visitor: {
      MemberExpression(exprPath, state) {
        const filename = state.file.opts.filename;
        if (
          !filename ||
          !filename.replace(/\\/g, "/").includes("expo-router/_ctx")
        ) {
          return;
        }

        const node = exprPath.node;
        if (!t.isMemberExpression(node.object)) return;
        const inner = node.object;
        if (!t.isIdentifier(inner.object, { name: "process" })) return;
        if (!t.isIdentifier(inner.property, { name: "env" })) return;

        let key;
        if (t.isIdentifier(node.property)) {
          key = node.property.name;
        } else if (t.isStringLiteral(node.property)) {
          key = node.property.value;
        } else {
          return;
        }

        const caller = state.file.opts.caller || {};
        const projectRoot =
          caller.projectRoot || process.env.EXPO_PROJECT_ROOT || process.cwd();
        const routerRoot = caller.routerRoot || "src/app";
        const absApp = path.resolve(projectRoot, routerRoot);

        if (key === "EXPO_ROUTER_APP_ROOT") {
          let rel = path.relative(path.dirname(filename), absApp);
          if (!rel || rel === "") rel = ".";
          exprPath.replaceWith(t.stringLiteral(toPosix(rel)));
          return;
        }

        if (key === "EXPO_ROUTER_IMPORT_MODE") {
          const asyncRoutes = String(caller.asyncRoutes) === "true";
          exprPath.replaceWith(
            t.stringLiteral(asyncRoutes ? "lazy" : "sync"),
          );
        }
      },
    },
  };
};
