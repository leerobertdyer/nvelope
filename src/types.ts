export interface Folder {
    name: string,
    envelopes: Envelope[]
}

export interface Envelope {
    name: string,
    total: number,
    spent: number
}