import {z, ZodSchema} from "zod";

export function parseJSON(object: string) {
    try {
        return JSON.parse(object);
    } catch (error) {
        console.error('Error parsing JSON:\n' + object);
        throw error;
    }
}

export function parseZod<T extends ZodSchema>(schema: T, data: unknown): z.infer<T> {
    try {
        return schema.parse(data);
    } catch (error) {
        console.error('Error parsing Zod:\n', data);
        throw error;
    }
}

export function parseZodFromJSON<T extends ZodSchema>(schema: T, data: string): z.infer<T> {
    return parseZod(schema, parseJSON(data));
}