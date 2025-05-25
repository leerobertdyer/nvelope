export interface Folder {
    id: string,
    name: string,
    envelopes: Envelope[]
}

export interface Envelope {
    id: string,
    name: string,
    total: number,
    spent: number
}