import { z } from 'zod';

export type Decls = Record<string, string>;
/** Style rule for one class. Values reference tokens via v(). */
export interface Rule {
  cls: string;
  base: Decls;
  hover?: Decls;
  focus?: Decls;
  disabled?: Decls;
}
/** Framework-agnostic structure. `cls` are semantic class names (rules are looked up by them). */
export interface Node {
  tag: string;
  cls?: string[];
  attrs?: Record<string, string | true>;
  children?: (Node | string)[];
}

export type Control =
  | { kind: 'select'; options: string[] }
  | { kind: 'boolean' }
  | { kind: 'text' }
  | { kind: 'textarea' };

export interface PropMeta {
  name: string;
  type: string;
  default: string | boolean;
  description: string;
  control: Control;
}

export type Props = Record<string, string | boolean>;

export interface ComponentDef {
  id: string;
  name: string;
  description: string;
  tags: string[];
  status: 'stable' | 'beta';
  usage: string;
  composition?: string;
  props: PropMeta[];
  rules: Rule[];
  render(props: Props): Node;
}

export function defaultsOf(props: PropMeta[]): Props {
  return Object.fromEntries(props.map((p) => [p.name, p.default]));
}

export function schemaOf(props: PropMeta[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const p of props) {
    if (p.control.kind === 'select') {
      shape[p.name] = z.enum(p.control.options as [string, ...string[]]).default(p.default as string);
    } else if (p.control.kind === 'boolean') {
      shape[p.name] = z.boolean().default(p.default as boolean);
    } else {
      shape[p.name] = z.string().default(p.default as string);
    }
  }
  return z.object(shape).strict();
}

export function parseProps(def: ComponentDef, input: unknown = {}): Props {
  return schemaOf(def.props).parse(input) as Props;
}
