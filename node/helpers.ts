export const mergeArrays = (arr: any, obj: any) => arr && arr.map((t: any) => t.id === obj.id ? obj : t);
