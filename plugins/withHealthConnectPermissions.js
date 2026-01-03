const { withMainActivity } = require('@expo/config-plugins');
const { addImports, appendContentsInsideDeclarationBlock } = require('@expo/config-plugins/build/android/codeMod');

const MAIN_ACTIVITY_CLASS = 'class MainActivity';
const DELEGATE_CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

const isJavaFile = (src) => {
  const packageLine = src.split('\n').find((line) => line.trim().startsWith('package '));
  return Boolean(packageLine && packageLine.trim().endsWith(';'));
};

const ensureOnCreateDelegate = (src, isJava) => {
  if (src.includes(DELEGATE_CALL)) return src;

  if (isJava && src.includes('onCreate(Bundle')) {
    return src.replace(
      /super\.onCreate\(savedInstanceState\);/,
      `super.onCreate(savedInstanceState);\n    ${DELEGATE_CALL};`
    );
  }

  if (!isJava && src.includes('override fun onCreate')) {
    return src.replace(
      /super\.onCreate\(savedInstanceState\)/,
      `super.onCreate(savedInstanceState)\n    ${DELEGATE_CALL}`
    );
  }

  const javaSnippet = `
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    ${DELEGATE_CALL};
  }
`;

  const kotlinSnippet = `
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    ${DELEGATE_CALL}
  }
`;

  return appendContentsInsideDeclarationBlock(src, MAIN_ACTIVITY_CLASS, isJava ? javaSnippet : kotlinSnippet);
};

module.exports = function withHealthConnectPermissions(config) {
  return withMainActivity(config, (config) => {
    let src = config.modResults.contents;
    const isJava = isJavaFile(src);
    src = addImports(
      src,
      ['android.os.Bundle', 'dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate'],
      isJava
    );
    src = ensureOnCreateDelegate(src, isJava);
    config.modResults.contents = src;
    return config;
  });
};
