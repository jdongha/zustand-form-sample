import type { DataKey } from '@/types/form';

export type FocusableElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/**
 * key 기반 DOM ref registry.
 * 폼/화면 단위로 인스턴스를 만들어 사용한다.
 */
export class RefManager<K = string, E extends HTMLElement = HTMLElement> {
  private readonly map = new Map<K, E>();

  register = (key: K) => (node: E | null) => {
    if (node) {
      this.map.set(key, node);
      return;
    }

    this.map.delete(key);
  };

  get = (key: K): E | undefined => {
    return this.map.get(key);
  };

  focus = (key: K, options?: FocusOptions): boolean => {
    const element = this.map.get(key);
    if (!element || !element.isConnected) return false;

    element.focus(options);
    return true;
  };

  scrollIntoView = (key: K, options?: ScrollIntoViewOptions): boolean => {
    const element = this.map.get(key);
    if (!element || !element.isConnected) return false;

    element.scrollIntoView(options);
    return true;
  };

  clear = () => {
    this.map.clear();
  };
}

export type FieldRefManager = RefManager<DataKey, FocusableElement>;

export function createFieldRefManager(): FieldRefManager {
  return new RefManager<DataKey, FocusableElement>();
}
