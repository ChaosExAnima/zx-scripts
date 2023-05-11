declare function spinner<T>(callback: () => T): Promise<T>;
declare function spinner<T>(title: string, callback: () => T): Promise<T>;
