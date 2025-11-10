export function generateId() {
    const newId = Date.now().toString(12) + Math.random().toString(12).slice(2, 12);
    return newId;
}   