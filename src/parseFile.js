import * as T from '@babel/types';
import isVarName from 'is-var-name';
import * as SUI from '../node_modules/semantic-ui-react/dist/commonjs/lib/SUI';

export type PropType = {
  [string]: {
    type: parameterType,
    required: boolean,
    description: string,
    defaultValue: {
      value: string,
      computed: true,
    },
  },
};
export type ReactDocGen = {
  displayName: string,
  props: PropType,
  methods: [any],
};

export type parameterType = {
  name: string,
  value: [parameterType],
};

export const parseJsonFile = (json: ReactDocGen) => {
  return generateExportClassDeclaration(json);
};

const generateExportClassDeclaration = (json: ReactDocGen) => {
  if (!json.props) {
    json.props = {};
  }
  return T.declareExportDeclaration(
    T.declareClass(
      T.identifier(json.displayName),
      null,
      [
        T.interfaceExtends(
          T.identifier('React$Component'),
          T.typeParameterInstantiation([
            T.objectTypeAnnotation(
              [
                ...generateReactComponentDeafultObjectTypeAnnotation(),
                ...generatePropsObjectTypeAnnotation(json.props),
                // ...generateMethodsTypeAnnotation(json.methods),
              ],
            ),
          ]),
        ),
      ],
      T.objectTypeAnnotation([]),
    ),
  );
};

const generateMethodsTypeAnnotation = (methods: [any]) => {
  return methods.map(method =>
    T.objectTypeProperty(
      T.identifier(method.name),
      T.functionTypeAnnotation(
        null,
        [
          ...method.params.map(param =>
            T.functionTypeParam(T.identifier(param.name), resolveTypes(param)),
          ),
        ],

        null,
        resolvePrimitiveTypes(method.returns),
      ),
    ),
  );
};

const generateIdentifier = (paramName: string) => {
  let maker = T.identifier;
  if (!isVarName(paramName)) {
    maker = T.stringLiteral;
  }

  return maker(paramName);
};
const generatePropsObjectTypeAnnotation = (props: PropType) => {
  return Object.keys(props).map(propsMember =>
    Object.assign(
      T.objectTypeProperty(generateIdentifier(propsMember), resolveTypes(props[propsMember].type)),
      { optional: !props[propsMember].required },
    ),
  );
};

const resolvePrimitiveTypes = (type: string | { value: any }) => {
  switch (type) {
    case 'bool':
      return T.booleanTypeAnnotation();
    case 'number':
      return T.numberTypeAnnotation();
    case 'node':
      return T.genericTypeAnnotation(T.identifier('React$Node'));
    case 'string':
      return T.stringTypeAnnotation();
    case 'func':
      return T.functionTypeAnnotation(null, [], null, T.anyTypeAnnotation());
    // case 'object':
    //   return T.objectTypeAnnotation([]);
    default:
      return T.anyTypeAnnotation();
  }
};
const resolveTypes = (type: parameterType) => {
  switch (type.name) {
    case 'union':
      return T.unionTypeAnnotation(type.value.map(value => resolveTypes(value)));
    case 'enum':
      switch (typeof type.value) {
        case 'object':
          return T.unionTypeAnnotation(
            type.value.map(value => {
              let { isStatement, statementValues } = resolveStatement(value.value);
              if (!isStatement) return T.stringLiteralTypeAnnotation(value.value.replace(/'/g, ''));
              return arrayToEnum(statementValues);
            }),
          );
        case 'string':
          if (type.computed) {
            const result = resolveStatement(type.value);
            if (result.isStatement) {
              let temp = result.statementValues.map(value => typeFromValue(value));

              return T.unionTypeAnnotation(temp);
            }
          }
        default:
          return resolvePrimitiveTypes(type);
      }
    default:
      return resolvePrimitiveTypes(type.name);
  }
};
const typeFromValue = (value: any) => {
  let result;

  try {
    if (typeof value === 'string') {
      result = T.stringLiteralTypeAnnotation(value);
    } else if (typeof value === 'number') {
      // result = Object.assign(T.numberLiteralTypeAnnotation(value),{type:'numberLiteralTypeAnnotation'})
      result = T.numberLiteralTypeAnnotation(value);
    }
  } catch (err) {
    result = T.anyTypeAnnotation();
  }
  return result;
};
const arrayToEnum = (array: []) => {
  const d = T.unionTypeAnnotation(array.map(value => typeFromValue(value)));
  return d;
};
const resolveStatement = (statement: string) => {
  const result = { isStatement: true, statementValues: null };
  try {
    if (typeof statement !== 'string' || !statement.includes('SUI')) {
      result.isStatement = false;
    }
    let ev = eval(statement.replace('...', ''));
    result.statementValues = ev;
  } catch (err) {
    result.isStatement = false;
  }

  return result;
};
const generateReactComponentDeafultObjectTypeAnnotation = () => {
  return [T.objectTypeProperty(T.identifier('basename?'), T.stringTypeAnnotation())];
};
